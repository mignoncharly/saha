from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.logistics.models import TransportRequest, RequestComment

User = get_user_model()


class RequestCommentTests(APITestCase):
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
            reference_code="STL-2026-000800", customer=self.customer,
            pickup_city="P", pickup_address="a",
        )
        RequestComment.objects.create(request=self.req, body="public hi", is_internal=False)
        RequestComment.objects.create(request=self.req, body="secret", is_internal=True)
        self.owner_url = reverse("customer-request-comments", kwargs={"reference_code": self.req.reference_code})
        self.admin_url = reverse("admin-request-comments", kwargs={"pk": self.req.pk})

    def test_owner_sees_only_public(self):
        self.client.force_authenticate(self.user)
        r = self.client.get(self.owner_url)
        self.assertEqual(r.status_code, 200)
        bodies = [c["body"] for c in r.data]
        self.assertIn("public hi", bodies)
        self.assertNotIn("secret", bodies)

    def test_owner_post_is_forced_non_internal(self):
        self.client.force_authenticate(self.user)
        r = self.client.post(self.owner_url, {"body": "merci", "is_internal": True}, format="json")
        self.assertEqual(r.status_code, 201, r.content)
        c = RequestComment.objects.get(body="merci")
        self.assertFalse(c.is_internal)
        self.assertEqual(c.author, self.user)

    def test_non_owner_gets_404(self):
        other = User.objects.create_user(
            email="other@example.com", password="StrongPass123!", role="customer"
        )
        Customer.objects.create(user=other, full_name="O", phone="+33611111111")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(self.owner_url).status_code, 404)

    def test_admin_sees_all_and_posts_internal(self):
        self.client.force_authenticate(self.admin)
        r = self.client.get(self.admin_url)
        self.assertEqual(len(r.data), 2)
        r2 = self.client.post(self.admin_url, {"body": "note interne", "is_internal": True}, format="json")
        self.assertEqual(r2.status_code, 201, r2.content)
        self.assertTrue(RequestComment.objects.get(body="note interne").is_internal)
