from unittest import mock

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.notifications.models import NotificationLog, PushSubscription

User = get_user_model()


class PushSubscriptionTests(APITestCase):
    def test_anonymous_subscription(self):
        payload = {
            "endpoint": "https://push.example.com/anon",
            "p256dh": "key-p256dh",
            "auth": "key-auth",
            "region": "Douala",
        }
        response = self.client.post(reverse("push-subscribe"), payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        sub = PushSubscription.objects.get(endpoint="https://push.example.com/anon")
        self.assertIsNone(sub.customer)

    def test_authenticated_subscription_links_customer(self):
        user = User.objects.create_user(
            email="cust@example.com", password="StrongPass123!", role="customer"
        )
        customer = Customer.objects.create(user=user, full_name="Client", phone="+33600000000")
        self.client.force_authenticate(user)
        payload = {
            "endpoint": "https://push.example.com/cust",
            "p256dh": "key-p256dh",
            "auth": "key-auth",
        }
        response = self.client.post(reverse("push-subscribe"), payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        sub = PushSubscription.objects.get(endpoint="https://push.example.com/cust")
        self.assertEqual(sub.customer, customer)


class BroadcastTests(APITestCase):
    def test_broadcast_requires_staff(self):
        response = self.client.post(
            reverse("admin-broadcast"), {"title": "Hi", "body": "Test"}, format="json"
        )
        self.assertIn(response.status_code, (401, 403))

    @mock.patch("apps.notifications.views.send_broadcast_notification.delay")
    def test_broadcast_creates_log_and_dispatches(self, mocked_delay):
        admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.client.force_authenticate(admin)
        response = self.client.post(
            reverse("admin-broadcast"),
            {"title": "Annonce", "body": "Nouveau chargement", "target_type": "all"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(NotificationLog.objects.count(), 1)
        mocked_delay.assert_called_once()
