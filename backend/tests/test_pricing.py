from django.urls import reverse
from rest_framework.test import APITestCase

from apps.pricing.models import PriceRule
from apps.services.models import ServiceType


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
