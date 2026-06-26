from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from apps.customers.matching import normalize_phone, resolve_customer
from apps.customers.models import Customer
from apps.destinations.models import DestinationCity
from apps.logistics.models import TransportRequest
from apps.services.models import ServiceType

User = get_user_model()


class NormalizePhoneTests(TestCase):
    def test_strips_formatting(self):
        self.assertEqual(normalize_phone("+33 6 12 34 56 78"), "+33612345678")
        self.assertEqual(normalize_phone("+33-6-12-34-56-78"), "+33612345678")

    def test_double_zero_becomes_plus(self):
        self.assertEqual(normalize_phone("0033612345678"), "+33612345678")

    def test_national_kept_as_is(self):
        self.assertEqual(normalize_phone("(030) 1234-5678"), "03012345678")

    def test_empty_passthrough(self):
        self.assertEqual(normalize_phone(""), "")
        self.assertIsNone(normalize_phone(None))


class ResolveCustomerTests(TestCase):
    def test_creates_with_normalized_phone(self):
        c = resolve_customer(
            user=None, full_name="Jean", phone="+33 6 12 34 56 78",
            whatsapp_number="", email="j@x.com", language="fr",
        )
        self.assertEqual(c.phone, "+33612345678")
        self.assertEqual(Customer.objects.count(), 1)

    def test_formatting_variant_matches_existing_no_duplicate(self):
        Customer.objects.create(full_name="Jean", phone="+33612345678", email="j@x.com")
        c = resolve_customer(
            user=None, full_name="Impostor", phone="+33 6 12 34 56 78",
            whatsapp_number="", email="evil@x.com", language="fr",
        )
        self.assertEqual(Customer.objects.count(), 1)
        # Anonymous submission must NOT overwrite an existing identity.
        self.assertEqual(c.full_name, "Jean")
        self.assertEqual(c.email, "j@x.com")

    def test_anonymous_fills_only_blank_fields(self):
        Customer.objects.create(full_name="Jean", phone="+33612345678", email=None)
        c = resolve_customer(
            user=None, full_name="Jean", phone="+33612345678",
            whatsapp_number="", email="new@x.com", language="fr",
        )
        self.assertEqual(c.email, "new@x.com")  # was blank -> filled

    def test_authenticated_uses_own_profile_over_phone_match(self):
        user = User.objects.create_user(
            email="u@x.com", password="StrongPass123!", role="customer"
        )
        own = Customer.objects.create(user=user, full_name="Owner", phone="+33600000000")
        # Another customer already holds the submitted phone.
        Customer.objects.create(full_name="Someone", phone="+33611111111")
        c = resolve_customer(
            user=user, full_name="Owner Updated", phone="+33 6 11 11 11 11",
            whatsapp_number="", email="u@x.com", language="fr",
        )
        self.assertEqual(c.pk, own.pk)               # used own profile, not phone match
        self.assertEqual(c.full_name, "Owner Updated")  # owner can update own identity
        self.assertEqual(c.phone, "+33611111111")


class RequestCustomerDedupeTests(APITestCase):
    def setUp(self):
        cache.clear()  # reset public-submit throttle
        self.service = ServiceType.objects.create(name="Colis")
        self.destination = DestinationCity.objects.create(name="Douala")
        self.url = reverse("transport-request-create")

    def _payload(self, phone, name="Jean Dupont"):
        return {
            "consent": "true", "full_name": name, "phone": phone, "email": "j@x.com",
            "service_type": self.service.id, "pickup_city": "Paris",
            "pickup_address": "1 rue", "destination_city": self.destination.id, "quantity": 1,
        }

    def test_formatting_variants_do_not_duplicate_customer(self):
        r1 = self.client.post(self.url, self._payload("+33612345678"), format="multipart")
        self.assertEqual(r1.status_code, 201, r1.content)
        r2 = self.client.post(
            self.url, self._payload("+33 6 12 34 56 78", name="Impostor"), format="multipart"
        )
        self.assertEqual(r2.status_code, 201, r2.content)
        self.assertEqual(Customer.objects.count(), 1)
        # The anonymous second submit must not rename the customer.
        self.assertEqual(Customer.objects.get().full_name, "Jean Dupont")
        self.assertEqual(TransportRequest.objects.count(), 2)
