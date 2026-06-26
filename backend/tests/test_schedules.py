from datetime import date, timedelta

from django.contrib.auth import get_user_model
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
