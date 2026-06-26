from datetime import timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from pywebpush import WebPushException
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.notifications.models import NotificationLog, PushSubscription
from apps.notifications.webpush import send_web_push, PUSH_GONE, PUSH_OK, PUSH_FAILED

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


class PushLifecycleTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset push-subscription throttle between tests
        self.payload = {
            "endpoint": "https://push.example.com/dev1",
            "p256dh": "p1", "auth": "a1", "region": "Douala",
        }

    def test_resubscribe_upserts_and_reactivates(self):
        r1 = self.client.post(reverse("push-subscribe"), self.payload, format="json")
        self.assertEqual(r1.status_code, 201, r1.content)
        # Device later deactivated, then re-subscribes with new keys/language.
        PushSubscription.objects.filter(endpoint=self.payload["endpoint"]).update(active=False)
        updated = {**self.payload, "p256dh": "p2", "auth": "a2", "language": "de"}
        r2 = self.client.post(reverse("push-subscribe"), updated, format="json")
        self.assertEqual(r2.status_code, 200, r2.content)  # updated, not created
        subs = PushSubscription.objects.filter(endpoint=self.payload["endpoint"])
        self.assertEqual(subs.count(), 1)
        sub = subs.get()
        self.assertTrue(sub.active)
        self.assertEqual(sub.p256dh, "p2")
        self.assertEqual(sub.language, "de")

    def test_anonymous_resubscribe_keeps_existing_customer_link(self):
        customer = Customer.objects.create(full_name="C", phone="+33600000111")
        PushSubscription.objects.create(
            customer=customer, endpoint=self.payload["endpoint"], p256dh="p", auth="a",
        )
        # Anonymous re-subscribe must not unlink the customer.
        self.client.post(reverse("push-subscribe"), self.payload, format="json")
        sub = PushSubscription.objects.get(endpoint=self.payload["endpoint"])
        self.assertEqual(sub.customer, customer)

    def test_unsubscribe_deactivates_device(self):
        self.client.post(reverse("push-subscribe"), self.payload, format="json")
        r = self.client.post(
            reverse("push-unsubscribe"), {"endpoint": self.payload["endpoint"]}, format="json"
        )
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.data["deactivated"], 1)
        self.assertFalse(PushSubscription.objects.get(endpoint=self.payload["endpoint"]).active)


class WebPushResultTests(APITestCase):
    def _raise(self, status_code):
        class _Resp:
            pass
        resp = _Resp()
        resp.status_code = status_code
        return WebPushException("boom", response=resp)

    @mock.patch("apps.notifications.webpush.webpush")
    def test_gone_on_410(self, mock_webpush):
        mock_webpush.side_effect = self._raise(410)
        self.assertEqual(send_web_push({"endpoint": "e", "p256dh": "p", "auth": "a"}, "{}"), PUSH_GONE)

    @mock.patch("apps.notifications.webpush.webpush")
    def test_failed_on_500(self, mock_webpush):
        mock_webpush.side_effect = self._raise(500)
        self.assertEqual(send_web_push({"endpoint": "e", "p256dh": "p", "auth": "a"}, "{}"), PUSH_FAILED)

    @mock.patch("apps.notifications.webpush.webpush", return_value=None)
    def test_ok(self, _mock_webpush):
        self.assertEqual(send_web_push({"endpoint": "e", "p256dh": "p", "auth": "a"}, "{}"), PUSH_OK)


class GoneSubscriptionDeactivationTests(APITestCase):
    @mock.patch("apps.notifications.tasks.send_web_push", return_value=PUSH_GONE)
    def test_status_change_deactivates_gone_subscription(self, _mock_send):
        from apps.logistics.models import TransportRequest
        from apps.notifications.tasks import send_status_change_notification
        customer = Customer.objects.create(full_name="C", phone="+33600000222")
        sub = PushSubscription.objects.create(
            customer=customer, endpoint="https://push.example.com/gone",
            p256dh="p", auth="a", active=True,
        )
        req = TransportRequest.objects.create(
            reference_code="STL-2026-000900", customer=customer,
            pickup_city="P", pickup_address="a", status="new",
        )
        send_status_change_notification(req.id)
        sub.refresh_from_db()
        self.assertFalse(sub.active)


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


class AdminOpsDashboardTests(APITestCase):
    def test_dashboard_requires_staff(self):
        user = User.objects.create_user(
            email="customer@example.com", password="StrongPass123!", role="customer"
        )
        self.client.force_authenticate(user)

        response = self.client.get(reverse("admin-dashboard"))

        self.assertIn(response.status_code, (401, 403))

    def test_dashboard_includes_notification_failure_summary(self):
        admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.client.force_authenticate(admin)
        recent = NotificationLog.objects.create(
            title="Recent failure",
            body="Body",
            target_type="all",
            sent_count=2,
            failed_count=3,
        )
        old = NotificationLog.objects.create(
            title="Old failure",
            body="Body",
            target_type="region",
            target_region="Douala",
            sent_count=1,
            failed_count=4,
        )
        NotificationLog.objects.filter(id=old.id).update(
            created_at=timezone.now() - timedelta(days=45)
        )
        NotificationLog.objects.create(
            title="Successful", body="Body", target_type="all", sent_count=5, failed_count=0
        )
        PushSubscription.objects.create(
            endpoint="https://push.example.com/inactive", p256dh="p", auth="a", active=False
        )
        PushSubscription.objects.create(
            endpoint="https://push.example.com/active", p256dh="p", auth="a", active=True
        )

        response = self.client.get(reverse("admin-dashboard"))

        self.assertEqual(response.status_code, 200, response.content)
        ops = response.data["ops"]
        self.assertEqual(ops["failed_notification_logs_30d"], 1)
        self.assertEqual(ops["failed_notifications_30d"], 3)
        self.assertEqual(ops["inactive_push_subscriptions"], 1)
        titles = [item["title"] for item in ops["recent_failed_notifications"]]
        self.assertIn(recent.title, titles)
        self.assertIn(old.title, titles)
        self.assertNotIn("Successful", titles)
