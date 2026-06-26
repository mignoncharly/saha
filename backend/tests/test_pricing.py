import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.pricing.models import PriceRule
from apps.services.models import ServiceType

User = get_user_model()


class PricingTests(APITestCase):
    def setUp(self):
        self.service = ServiceType.objects.create(name="Voiture")
        PriceRule.objects.create(
            service_type=self.service, label="Berline", price_amount=500, currency="EUR", unit="voiture"
        )
        PriceRule.objects.create(
            service_type=self.service, label="SUV", price_amount=700, currency="EUR", unit="voiture"
        )
        PriceRule.objects.create(
            service_type=self.service, label="Inactif", price_amount=100, active=False
        )

    def test_public_price_list_excludes_inactive(self):
        response = self.client.get(reverse("price-list"))
        self.assertEqual(response.status_code, 200)
        labels = [item["label"] for item in response.data]
        self.assertIn("Berline", labels)
        self.assertNotIn("Inactif", labels)

    def test_estimate_uses_cheapest_rule_and_quantity(self):
        url = reverse("price-estimate")
        response = self.client.get(url, {"service_type_id": self.service.id, "quantity": 3})
        self.assertEqual(response.status_code, 200)
        # cheapest active rule is 500 EUR -> 500 * 3
        self.assertEqual(response.data["estimated_price"], 1500.0)
        self.assertEqual(response.data["currency"], "EUR")

    def test_estimate_requires_service_type(self):
        response = self.client.get(reverse("price-estimate"))
        self.assertEqual(response.status_code, 400)

    def test_estimate_no_rule_returns_null(self):
        empty_service = ServiceType.objects.create(name="Vide")
        response = self.client.get(
            reverse("price-estimate"), {"service_type_id": empty_service.id}
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["estimated_price"])


class PricingValidityWindowTests(APITestCase):
    def setUp(self):
        self.service = ServiceType.objects.create(name="Voiture")
        self.today = timezone.localdate()

    def test_public_list_excludes_future_and_expired_rules(self):
        PriceRule.objects.create(service_type=self.service, label="Courant", price_amount=500)
        PriceRule.objects.create(
            service_type=self.service, label="Futur", price_amount=400,
            valid_from=self.today + datetime.timedelta(days=5),
        )
        PriceRule.objects.create(
            service_type=self.service, label="Expire", price_amount=300,
            valid_until=self.today - datetime.timedelta(days=1),
        )
        response = self.client.get(reverse("price-list"))
        labels = [item["label"] for item in response.data]
        self.assertIn("Courant", labels)
        self.assertNotIn("Futur", labels)
        self.assertNotIn("Expire", labels)

    def test_estimate_ignores_out_of_window_cheaper_rule(self):
        PriceRule.objects.create(service_type=self.service, label="Courant", price_amount=500)
        PriceRule.objects.create(
            service_type=self.service, label="ExpireMoinsCher", price_amount=100,
            valid_until=self.today - datetime.timedelta(days=1),
        )
        response = self.client.get(
            reverse("price-estimate"),
            {"service_type_id": self.service.id, "quantity": 1},
        )
        # The cheaper rule is expired, so the estimate must fall back to the active one.
        self.assertEqual(response.data["estimated_price"], 500.0)


class AdminPricingLifecycleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.service = ServiceType.objects.create(name="Voiture")
        self.rule = PriceRule.objects.create(
            service_type=self.service, label="Berline", price_amount=500
        )
        self.client.force_authenticate(self.admin)

    def test_admin_list_exposes_lifecycle_fields(self):
        response = self.client.get(reverse("admin-price-list"))
        self.assertEqual(response.status_code, 200)
        for field in ("active", "valid_from", "valid_until"):
            self.assertIn(field, response.data[0])

    def test_admin_can_deactivate_and_it_drops_from_public_list(self):
        url = reverse("admin-price-detail", kwargs={"pk": self.rule.pk})
        response = self.client.patch(url, {"active": False}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.rule.refresh_from_db()
        self.assertFalse(self.rule.active)
        self.client.force_authenticate(None)
        public = self.client.get(reverse("price-list"))
        self.assertNotIn("Berline", [item["label"] for item in public.data])

    def test_admin_can_set_validity_window(self):
        url = reverse("admin-price-detail", kwargs={"pk": self.rule.pk})
        response = self.client.patch(
            url, {"valid_from": "2026-01-01", "valid_until": "2026-12-31"}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.content)
        self.rule.refresh_from_db()
        self.assertEqual(str(self.rule.valid_from), "2026-01-01")
        self.assertEqual(str(self.rule.valid_until), "2026-12-31")
