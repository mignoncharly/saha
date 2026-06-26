from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.logistics.models import TransportRequest

User = get_user_model()


class CustomerRequestDetailTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="owner@example.com", password="StrongPass123!", role="customer"
        )
        self.customer = Customer.objects.create(
            user=self.user, full_name="Owner", phone="+33600000000"
        )
        self.req = TransportRequest.objects.create(
            reference_code="STL-2026-000500", customer=self.customer,
            pickup_city="Paris", pickup_address="42 rue Privée",
            internal_notes="admin only", estimated_price="120.00", status="confirmed",
        )
        self.url = reverse(
            "customer-request-detail", kwargs={"reference_code": self.req.reference_code}
        )

    def test_owner_sees_full_detail_without_internal_notes(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["pickup_address"], "42 rue Privée")
        self.assertEqual(response.data["estimated_price"], "120.00")
        self.assertIn("photos", response.data)
        self.assertNotIn("internal_notes", response.data)

    def test_anonymous_is_unauthorized(self):
        response = self.client.get(self.url)
        self.assertIn(response.status_code, (401, 403))

    def test_non_owner_gets_404(self):
        other = User.objects.create_user(
            email="other@example.com", password="StrongPass123!", role="customer"
        )
        Customer.objects.create(user=other, full_name="Other", phone="+33611111111")
        self.client.force_authenticate(other)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)
