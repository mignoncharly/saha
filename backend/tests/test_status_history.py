from unittest import mock

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.logistics.models import TransportRequest, RequestStatusEvent

User = get_user_model()


class StatusHistoryTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.user = User.objects.create_user(
            email="owner@example.com", password="StrongPass123!", role="customer"
        )
        self.customer = Customer.objects.create(
            user=self.user, full_name="Owner", phone="+33600000000"
        )
        self.req = TransportRequest.objects.create(
            reference_code="STL-2026-000600", customer=self.customer,
            pickup_city="P", pickup_address="a", status="new",
        )

    @mock.patch("apps.logistics.views.send_status_change_notification.delay")
    def test_status_change_records_event_and_is_in_detail(self, _m):
        self.client.force_authenticate(self.admin)
        url = reverse("admin-request-status-update", kwargs={"pk": self.req.pk})
        r = self.client.patch(url, {"status": "contacted"}, format="json")
        self.assertEqual(r.status_code, 200, r.content)
        ev = RequestStatusEvent.objects.get()
        self.assertEqual((ev.from_status, ev.to_status, ev.actor), ("new", "contacted", self.admin))
        self.assertEqual(len(r.data["status_events"]), 1)

    @mock.patch("apps.logistics.admin_views.send_status_change_notification.delay")
    def test_bulk_change_records_events(self, _m):
        self.client.force_authenticate(self.admin)
        r = self.client.post(
            reverse("admin-request-bulk-status"),
            {"ids": [self.req.id], "status": "contacted"}, format="json",
        )
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(
            RequestStatusEvent.objects.filter(request=self.req, to_status="contacted").count(), 1
        )

    @mock.patch("apps.logistics.views.send_status_change_notification.delay")
    def test_owner_can_read_history(self, _m):
        self.client.force_authenticate(self.admin)
        self.client.patch(
            reverse("admin-request-status-update", kwargs={"pk": self.req.pk}),
            {"status": "contacted"}, format="json",
        )
        self.client.force_authenticate(self.user)
        r = self.client.get(
            reverse("customer-request-history", kwargs={"reference_code": self.req.reference_code})
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]["to_status"], "contacted")

    def test_non_owner_history_is_empty(self):
        other = User.objects.create_user(
            email="other@example.com", password="StrongPass123!", role="customer"
        )
        Customer.objects.create(user=other, full_name="Other", phone="+33611111111")
        RequestStatusEvent.objects.create(request=self.req, from_status="new", to_status="contacted")
        self.client.force_authenticate(other)
        r = self.client.get(
            reverse("customer-request-history", kwargs={"reference_code": self.req.reference_code})
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 0)
