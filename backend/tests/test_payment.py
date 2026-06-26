from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.logistics.models import TransportRequest

User = get_user_model()


class PaymentFieldsTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.customer = Customer.objects.create(full_name="C", phone="+33600000000")
        self.req = TransportRequest.objects.create(
            reference_code="STL-2026-000700", customer=self.customer,
            pickup_city="P", pickup_address="a",
        )
        self.client.force_authenticate(self.admin)
        self.url = reverse("admin-request-detail", kwargs={"pk": self.req.pk})

    def test_defaults_exposed(self):
        r = self.client.get(self.url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["payment_status"], "unpaid")
        self.assertEqual(r.data["amount_paid"], "0.00")

    def test_admin_can_set_payment(self):
        r = self.client.patch(
            self.url,
            {"payment_status": "partial", "amount_paid": "50.00", "payment_note": "acompte"},
            format="json",
        )
        self.assertEqual(r.status_code, 200, r.content)
        self.req.refresh_from_db()
        self.assertEqual(self.req.payment_status, "partial")
        self.assertEqual(str(self.req.amount_paid), "50.00")
        self.assertEqual(self.req.payment_note, "acompte")
