from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.audit.models import AuditLog
from apps.customers.models import Customer
from apps.destinations.models import DestinationCity
from apps.logistics.models import TransportRequest
from apps.pricing.models import PriceRule
from apps.services.models import ServiceType

User = get_user_model()


class AuditActorTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.customer = Customer.objects.create(full_name="C", phone="+33600000000")
        self.req = TransportRequest.objects.create(
            reference_code="STL-2026-000050", customer=self.customer,
            pickup_city="Lyon", pickup_address="a", status="new",
        )
        AuditLog.objects.all().delete()  # drop the logs produced by setUp

    @staticmethod
    def _latest(entity_type, action):
        return (AuditLog.objects
                .filter(entity_type=entity_type, action=action)
                .order_by("-id").first())

    @mock.patch("apps.logistics.views.send_status_change_notification.delay")
    def test_status_change_records_actor_and_before_after(self, _mock_delay):
        self.client.force_authenticate(self.admin)
        url = reverse("admin-request-status-update", kwargs={"pk": self.req.pk})
        response = self.client.patch(url, {"status": "contacted"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        log = self._latest("TransportRequest", "updated")
        self.assertIsNotNone(log)
        self.assertEqual(log.actor, self.admin)
        self.assertEqual(log.metadata.get("status_from"), "new")
        self.assertEqual(log.metadata.get("status_to"), "contacted")

    def test_public_request_creation_has_no_actor(self):
        service = ServiceType.objects.create(name="Colis")
        dest = DestinationCity.objects.create(name="Douala")
        payload = {
            "consent": "true", "full_name": "Jean", "phone": "+33611112222",
            "email": "j@x.com", "service_type": service.id, "pickup_city": "Paris",
            "pickup_address": "1 rue", "destination_city": dest.id, "quantity": 1,
        }
        response = self.client.post(reverse("transport-request-create"), payload, format="multipart")
        self.assertEqual(response.status_code, 201, response.content)
        log = self._latest("TransportRequest", "created")
        self.assertIsNotNone(log)
        self.assertIsNone(log.actor)

    def test_price_deactivate_records_active_diff_and_actor(self):
        service = ServiceType.objects.create(name="Colis")
        rule = PriceRule.objects.create(service_type=service, label="X", price_amount=10)
        AuditLog.objects.all().delete()
        self.client.force_authenticate(self.admin)
        url = reverse("admin-price-detail", kwargs={"pk": rule.pk})
        response = self.client.patch(url, {"active": False}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        log = self._latest("PriceRule", "updated")
        self.assertIsNotNone(log)
        self.assertEqual(log.actor, self.admin)
        self.assertEqual(log.metadata.get("active_from"), True)
        self.assertEqual(log.metadata.get("active_to"), False)
