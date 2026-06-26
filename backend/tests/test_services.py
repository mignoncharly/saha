from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.services.models import ServiceType

User = get_user_model()


class PublicServiceListTests(APITestCase):
    def test_public_list_excludes_inactive_and_orders_by_sort_order(self):
        ServiceType.objects.create(name="Colis", active=True, sort_order=2)
        ServiceType.objects.create(name="Voiture", active=True, sort_order=1)
        ServiceType.objects.create(name="Caché", active=False, sort_order=3)
        response = self.client.get(reverse("service-list"))
        self.assertEqual(response.status_code, 200)
        names = [s["name"] for s in response.data]
        self.assertEqual(names, ["Voiture", "Colis"])
        self.assertNotIn("Caché", names)


class AdminServiceCrudTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.client.force_authenticate(self.admin)
        self.list_url = reverse("admin-service-list")

    def test_admin_list_exposes_active_and_sort_order(self):
        ServiceType.objects.create(name="Colis")
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        item = response.data[0]
        self.assertIn("active", item)
        self.assertIn("sort_order", item)

    def test_admin_can_create_with_lifecycle_fields(self):
        response = self.client.post(
            self.list_url,
            {"name": "Fûts", "description": "Tonneaux", "icon": "barrel",
             "active": True, "sort_order": 5},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        service = ServiceType.objects.get(name="Fûts")
        self.assertEqual(service.sort_order, 5)
        self.assertEqual(service.icon, "barrel")

    def test_admin_deactivate_drops_from_public_list(self):
        service = ServiceType.objects.create(name="Colis", active=True)
        url = reverse("admin-service-detail", kwargs={"pk": service.pk})
        response = self.client.patch(url, {"active": False}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        service.refresh_from_db()
        self.assertFalse(service.active)
        self.client.force_authenticate(None)
        public = self.client.get(reverse("service-list"))
        self.assertNotIn("Colis", [s["name"] for s in public.data])

    def test_admin_can_delete_service(self):
        service = ServiceType.objects.create(name="Temporaire")
        url = reverse("admin-service-detail", kwargs={"pk": service.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(ServiceType.objects.filter(pk=service.pk).exists())
