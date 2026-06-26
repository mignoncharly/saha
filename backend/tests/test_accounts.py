from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.cache import cache
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()


def reset_payload(user, new_password):
    return {
        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
        "token": PasswordResetTokenGenerator().make_token(user),
        "new_password": new_password,
    }


class PasswordResetConfirmTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="user@example.com", password="OldPass123!xyz")
        self.url = reverse("api-password-reset-confirm")

    def test_weak_password_rejected_with_field_errors(self):
        response = self.client.post(self.url, reset_payload(self.user, "123"), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("new_password", response.data)
        # Password must be unchanged.
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPass123!xyz"))

    def test_strong_password_resets_and_invalidates_tokens(self):
        Token.objects.create(user=self.user)
        response = self.client.post(self.url, reset_payload(self.user, "S0me-Str0ng-Pass!"), format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("S0me-Str0ng-Pass!"))
        # The reset must log out existing sessions.
        self.assertFalse(Token.objects.filter(user=self.user).exists())


class PasswordResetRequestTests(APITestCase):
    def setUp(self):
        cache.clear()
        # Stored with mixed case to exercise the case-insensitive lookup.
        self.user = User.objects.create_user(email="User@Example.com", password="OldPass123!xyz")
        self.url = reverse("api-password-reset")

    @patch("apps.accounts.views.send_password_reset_email.delay")
    def test_lookup_is_case_insensitive(self, mock_send):
        response = self.client.post(self.url, {"email": "user@example.com"}, format="json")
        self.assertEqual(response.status_code, 200)
        mock_send.assert_called_once()
        self.assertEqual(mock_send.call_args.args[0], self.user.id)

    @patch("apps.accounts.views.send_password_reset_email.delay")
    def test_unknown_email_returns_generic_response_without_sending(self, mock_send):
        response = self.client.post(self.url, {"email": "nobody@example.com"}, format="json")
        self.assertEqual(response.status_code, 200)
        mock_send.assert_not_called()


class AuthThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_password_reset_request_is_throttled(self):
        url = reverse("api-password-reset")
        statuses = [
            self.client.post(url, {"email": "x@example.com"}, format="json").status_code
            for _ in range(7)
        ]
        # password_reset scope is 5/minute, so the burst must hit 429.
        self.assertIn(429, statuses)
