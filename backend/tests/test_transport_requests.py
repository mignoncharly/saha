import io

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase

from apps.customers.models import Customer
from apps.destinations.models import DestinationCity
from apps.logistics.models import TransportRequest, TransportRequestPhoto
from apps.services.models import ServiceType

User = get_user_model()


def make_image(name="photo.jpg"):
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="JPEG")
    buffer.seek(0)
    buffer.name = name
    return buffer


class PublicTransportRequestTests(APITestCase):
    def setUp(self):
        # Reset throttle counters so the per-IP anonymous rate limit does not
        # leak across test methods.
        cache.clear()
        self.service = ServiceType.objects.create(name="Colis")
        self.destination = DestinationCity.objects.create(name="Douala")
        self.url = reverse("transport-request-create")

    def base_payload(self, **overrides):
        payload = {
            "consent": "true",
            "full_name": "Jean Dupont",
            "phone": "+33600000000",
            "email": "jean@example.com",
            "service_type": self.service.id,
            "pickup_city": "Paris",
            "pickup_address": "1 rue de Rivoli",
            "destination_city": self.destination.id,
            "quantity": 2,
        }
        payload.update(overrides)
        return payload

    def test_create_request_creates_customer_and_reference(self):
        response = self.client.post(self.url, self.base_payload(), format="multipart")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIn("reference_code", response.data)
        self.assertTrue(response.data["reference_code"].startswith("STL-"))
        self.assertEqual(TransportRequest.objects.count(), 1)
        self.assertEqual(Customer.objects.count(), 1)
        request_obj = TransportRequest.objects.first()
        self.assertEqual(request_obj.customer.full_name, "Jean Dupont")
        self.assertEqual(request_obj.status, "new")

    def test_consent_is_required(self):
        response = self.client.post(self.url, self.base_payload(consent="false"), format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("consent", response.data)

    def test_name_and_phone_required(self):
        response = self.client.post(self.url, self.base_payload(full_name=""), format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("full_name", response.data)

    def test_photos_are_not_duplicated(self):
        payload = self.base_payload()
        payload["photos"] = [make_image("a.jpg"), make_image("b.jpg")]
        response = self.client.post(self.url, payload, format="multipart")
        self.assertEqual(response.status_code, 201, response.content)
        request_obj = TransportRequest.objects.first()
        # Two files uploaded must result in exactly two stored photos (no duplication).
        self.assertEqual(TransportRequestPhoto.objects.filter(request=request_obj).count(), 2)

    def test_detail_lookup_by_reference(self):
        create = self.client.post(self.url, self.base_payload(), format="multipart")
        reference = create.data["reference_code"]
        detail_url = reverse("transport-request-detail", kwargs={"reference_code": reference})
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["reference_code"], reference)


class PublicTrackingPrivacyTests(APITestCase):
    """Anonymous tracking must expose only coarse progress, never private data."""

    def setUp(self):
        cache.clear()  # reset per-IP anonymous throttle between tests
        self.service = ServiceType.objects.create(name="Colis")
        self.destination = DestinationCity.objects.create(name="Douala")
        self.customer = Customer.objects.create(
            full_name="Jean Dupont",
            phone="+33600000000",
            email="jean.secret@example.com",
        )
        self.request_obj = TransportRequest.objects.create(
            reference_code="STL-2026-000777",
            customer=self.customer,
            service_type=self.service,
            destination_city=self.destination,
            pickup_city="Paris",
            pickup_address="42 rue Privée, escalier B",
            internal_notes="Client difficile - ne pas rappeler avant 18h",
            customer_notes="Fragile",
            description="Cartons de déménagement",
            estimated_price="150.00",
            final_price="175.50",
            status="in_transit",
        )
        TransportRequestPhoto.objects.create(
            request=self.request_obj, image=SimpleUploadedFile("p.jpg", b"x", "image/jpeg")
        )
        self.url = reverse(
            "transport-request-detail",
            kwargs={"reference_code": self.request_obj.reference_code},
        )

    def test_safe_fields_are_present(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(set(response.data.keys()), {
            "reference_code", "status", "status_display", "service_type_name",
            "pickup_city", "destination_name", "preferred_pickup_date", "created_at",
        })
        self.assertEqual(response.data["reference_code"], "STL-2026-000777")
        self.assertEqual(response.data["status"], "in_transit")
        self.assertEqual(response.data["service_type_name"], "Colis")
        self.assertEqual(response.data["destination_name"], "Douala")

    def test_private_fields_are_absent(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200, response.content)
        for leaked in (
            "customer", "phone", "email", "pickup_address", "internal_notes",
            "customer_notes", "description", "estimated_price", "final_price",
            "photos", "quantity", "dimensions", "estimated_weight", "id",
        ):
            self.assertNotIn(leaked, response.data)
        # Defence in depth: none of the private values may appear anywhere in the body.
        body = response.content.decode()
        for secret in (
            "jean.secret@example.com", "+33600000000", "Jean Dupont",
            "42 rue Privée", "ne pas rappeler", "150.00", "175.50",
        ):
            self.assertNotIn(secret, body)


class StatusTransitionTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )
        self.customer = Customer.objects.create(full_name="Client", phone="+33611111111")
        self.request_obj = TransportRequest.objects.create(
            reference_code="STL-2026-000001",
            customer=self.customer,
            pickup_city="Lyon",
            pickup_address="2 rue Garibaldi",
            status="new",
        )

    def test_valid_transition(self):
        self.client.force_authenticate(self.admin)
        url = reverse("admin-request-status-update", kwargs={"pk": self.request_obj.pk})
        response = self.client.patch(url, {"status": "contacted"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, "contacted")

    def test_invalid_transition_rejected(self):
        self.client.force_authenticate(self.admin)
        url = reverse("admin-request-status-update", kwargs={"pk": self.request_obj.pk})
        response = self.client.patch(url, {"status": "delivered"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.request_obj.refresh_from_db()
        self.assertEqual(self.request_obj.status, "new")

    def test_status_update_requires_staff(self):
        url = reverse("admin-request-status-update", kwargs={"pk": self.request_obj.pk})
        response = self.client.patch(url, {"status": "contacted"}, format="json")
        self.assertIn(response.status_code, (401, 403))


class CustomerRequestListTests(APITestCase):
    def test_my_requests_only_returns_own(self):
        user = User.objects.create_user(
            email="cust@example.com", password="StrongPass123!", role="customer"
        )
        customer = Customer.objects.create(user=user, full_name="Owner", phone="+33622222222")
        other = Customer.objects.create(full_name="Other", phone="+33633333333")
        TransportRequest.objects.create(
            reference_code="STL-2026-000010", customer=customer,
            pickup_city="Paris", pickup_address="addr", status="new",
        )
        TransportRequest.objects.create(
            reference_code="STL-2026-000011", customer=other,
            pickup_city="Paris", pickup_address="addr", status="new",
        )
        self.client.force_authenticate(user)
        response = self.client.get(reverse("customer-request-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["reference_code"], "STL-2026-000010")
