from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.schedules.models import LoadingDate, PickupRegion, PickupSchedule

User = get_user_model()


class ScheduleTests(APITestCase):
    def setUp(self):
        self.region = PickupRegion.objects.create(
            name="Rhin-Neckar", cities="Mannheim, Heidelberg"
        )
        PickupSchedule.objects.create(
            region=self.region, start_date=date(2026, 7, 1), active=True
        )
        PickupSchedule.objects.create(
            region=self.region, start_date=date(2026, 8, 1), active=False
        )
        today = timezone.localdate()
        # Nearest upcoming active loading.
        LoadingDate.objects.create(
            date=today + timedelta(days=21), title="Chargement Juillet", active=True
        )
        # A later upcoming loading and an inactive one — neither should come first.
        LoadingDate.objects.create(date=today + timedelta(days=60), active=False)
        # A past loading must be excluded from the public endpoint.
        LoadingDate.objects.create(
            date=today - timedelta(days=5), title="Chargement passé", active=True
        )

    def test_pickup_schedule_list_excludes_inactive(self):
        response = self.client.get(reverse("pickup-schedule-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        item = response.data[0]
        # cities fall back to the region's cities when not overridden
        self.assertEqual(item["cities"], "Mannheim, Heidelberg")
        self.assertEqual(item["region_name"], "Rhin-Neckar")

    def test_loading_date_list_excludes_inactive(self):
        response = self.client.get(reverse("loading-date-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Chargement Juillet")


class AdminPickupScheduleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.client.force_authenticate(self.admin)
        self.list_url = reverse("admin-pickup-schedule-list")

    def test_create_resolves_region_by_name(self):
        response = self.client.post(
            self.list_url,
            {"region_name": "Bavière", "cities": "Munich", "start_date": "2026-09-01"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertTrue(PickupRegion.objects.filter(name="Bavière").exists())
        schedule = PickupSchedule.objects.get()
        self.assertEqual(schedule.region.name, "Bavière")
        self.assertTrue(schedule.active)
        # And it surfaces on the public list.
        self.client.force_authenticate(None)
        public = self.client.get(reverse("pickup-schedule-list"))
        self.assertEqual([s["region_name"] for s in public.data], ["Bavière"])

    def test_create_requires_region_name(self):
        response = self.client.post(
            self.list_url, {"start_date": "2026-09-01"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("region_name", response.data)

    def test_admin_list_exposes_active_and_region_name(self):
        region = PickupRegion.objects.create(name="Hesse", cities="Frankfurt")
        PickupSchedule.objects.create(region=region, start_date=date(2026, 7, 1))
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        item = response.data[0]
        self.assertEqual(item["region_name"], "Hesse")
        self.assertIn("active", item)

    def test_deactivate_drops_from_public_list(self):
        region = PickupRegion.objects.create(name="Hesse", cities="Frankfurt")
        schedule = PickupSchedule.objects.create(region=region, start_date=date(2026, 7, 1))
        url = reverse("admin-pickup-schedule-detail", kwargs={"pk": schedule.pk})
        response = self.client.patch(url, {"active": False}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        schedule.refresh_from_db()
        self.assertFalse(schedule.active)
        self.client.force_authenticate(None)
        public = self.client.get(reverse("pickup-schedule-list"))
        self.assertEqual(len(public.data), 0)

    def _csv_file(self, content):
        return SimpleUploadedFile(
            "pickup.csv", content.encode("utf-8"), content_type="text/csv"
        )

    def test_import_preview_returns_summary_without_writing(self):
        region = PickupRegion.objects.create(name="Hesse", cities="Frankfurt")
        schedule = PickupSchedule.objects.create(
            region=region,
            cities="Frankfurt",
            start_date=date(2026, 7, 1),
            notes="Original",
            active=True,
        )
        csv_content = (
            "region_name,cities,start_date,end_date,notes,active\n"
            "Hesse,Frankfurt,2026-07-01,,Updated,0\n"
            "Bavière,Munich,2026-09-01,2026-09-03,Nouveau,1\n"
            ",Ville,2026-10-01,,Invalide,1\n"
        )

        response = self.client.post(
            f"{reverse('admin-schedule-import')}?dry_run=1",
            {"file": self._csv_file(csv_content)},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(len(response.data["to_create"]), 1)
        self.assertEqual(len(response.data["to_update"]), 1)
        self.assertEqual(len(response.data["errors"]), 1)
        self.assertEqual(response.data["to_update"][0]["row"], 2)
        self.assertEqual(response.data["to_create"][0]["region_name"], "Bavière")
        self.assertEqual(PickupSchedule.objects.count(), 1)
        self.assertFalse(PickupRegion.objects.filter(name="Bavière").exists())
        schedule.refresh_from_db()
        self.assertEqual(schedule.notes, "Original")
        self.assertTrue(schedule.active)

    def test_import_apply_creates_and_updates(self):
        region = PickupRegion.objects.create(name="Hesse", cities="Frankfurt")
        PickupSchedule.objects.create(
            region=region, start_date=date(2026, 7, 1), notes="Original"
        )
        csv_content = (
            "region_name,cities,start_date,end_date,notes,active\n"
            "Hesse,Frankfurt am Main,2026-07-01,,Updated,0\n"
            "Bavière,Munich,2026-09-01,2026-09-03,Nouveau,1\n"
        )

        response = self.client.post(
            reverse("admin-schedule-import"),
            {"file": self._csv_file(csv_content)},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["updated"], 1)
        updated = PickupSchedule.objects.get(region=region, start_date=date(2026, 7, 1))
        self.assertEqual(updated.notes, "Updated")
        self.assertFalse(updated.active)
        created = PickupSchedule.objects.get(region__name="Bavière")
        self.assertEqual(created.cities, "Munich")
        self.assertEqual(created.end_date, date(2026, 9, 3))


class AdminLoadingDateTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.client.force_authenticate(self.admin)
        self.loading = LoadingDate.objects.create(
            date=timezone.localdate() + timedelta(days=10), title="Chargement", active=True
        )

    def test_admin_list_exposes_active(self):
        response = self.client.get(reverse("admin-loading-date-list"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("active", response.data[0])

    def test_deactivate_drops_from_public_list(self):
        url = reverse("admin-loading-date-detail", kwargs={"pk": self.loading.pk})
        response = self.client.patch(url, {"active": False}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.loading.refresh_from_db()
        self.assertFalse(self.loading.active)
        self.client.force_authenticate(None)
        public = self.client.get(reverse("loading-date-list"))
        self.assertEqual(len(public.data), 0)
