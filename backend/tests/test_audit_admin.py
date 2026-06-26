from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.audit.models import AuditLog

User = get_user_model()


class AdminAuditLogTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        AuditLog.objects.create(actor=self.admin, action="updated", entity_type="PriceRule", entity_id="1")
        AuditLog.objects.create(actor=None, action="created", entity_type="ServiceType", entity_id="2")
        self.url = reverse("admin-audit-list")

    def test_requires_admin(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, (401, 403))

    def test_admin_lists_rows_with_actor_email(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 2)
        emails = [row["actor_email"] for row in response.data["results"]]
        self.assertIn("admin@example.com", emails)

    def test_filter_by_entity_type(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get(self.url, {"entity_type": "PriceRule"})
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["entity_type"], "PriceRule")
