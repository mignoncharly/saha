import io
import shutil
import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase

from apps.audit.models import AuditLog
from apps.customers.models import Customer
from apps.destinations.models import DestinationCity
from apps.logistics.models import TransportRequest, TransportRequestPhoto
from apps.logistics.reference import create_transport_request_with_reference
from apps.logistics.retention import run_data_retention
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


class ReferenceCodeTests(APITestCase):
    def setUp(self):
        self.customer = Customer.objects.create(full_name="C", phone="+33600000099")

    def test_codes_are_sequential(self):
        r1 = create_transport_request_with_reference(
            customer=self.customer, pickup_city="A", pickup_address="x"
        )
        r2 = create_transport_request_with_reference(
            customer=self.customer, pickup_city="B", pickup_address="y"
        )
        self.assertTrue(r1.reference_code.endswith("-000001"))
        n1 = int(r1.reference_code.split("-")[-1])
        n2 = int(r2.reference_code.split("-")[-1])
        self.assertEqual(n2, n1 + 1)

    @patch("apps.logistics.reference._peek_next_reference_code")
    def test_retries_on_reference_collision(self, mock_peek):
        # Simulate a concurrent submission having already taken the first number:
        # the first peek collides (IntegrityError) and the helper retries.
        taken = "STL-2026-000001"
        TransportRequest.objects.create(
            reference_code=taken, customer=self.customer, pickup_city="A", pickup_address="x"
        )
        fresh = "STL-2026-000002"
        mock_peek.side_effect = [taken, fresh]
        obj = create_transport_request_with_reference(
            customer=self.customer, pickup_city="B", pickup_address="y"
        )
        self.assertEqual(obj.reference_code, fresh)
        self.assertEqual(mock_peek.call_count, 2)


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


class DataRetentionTests(APITestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.override = override_settings(MEDIA_ROOT=self.media_root, DATA_RETENTION_DAYS=30)
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.addCleanup(lambda: shutil.rmtree(self.media_root, ignore_errors=True))
        self.admin = User.objects.create_user(
            email="admin@example.com", password="StrongPass123!", role="admin"
        )

    def _request_with_photo(self, *, status="delivered", days_old=45, customer=None):
        customer = customer or Customer.objects.create(
            full_name="Client Privé",
            phone="+33600000000",
            whatsapp_number="+33600000000",
            email="client@example.com",
        )
        req = TransportRequest.objects.create(
            reference_code=f"STL-2026-{TransportRequest.objects.count() + 1:06d}",
            customer=customer,
            pickup_city="Paris",
            pickup_address="1 rue privée",
            status=status,
        )
        old_time = timezone.now() - timezone.timedelta(days=days_old)
        TransportRequest.objects.filter(id=req.id).update(updated_at=old_time)
        req.refresh_from_db()
        photo = TransportRequestPhoto.objects.create(
            request=req, image=SimpleUploadedFile("retention.jpg", b"photo", "image/jpeg")
        )
        return req, photo

    def test_retention_dry_run_reports_without_deleting_photos(self):
        _req, photo = self._request_with_photo()
        path = photo.image.path

        result = run_data_retention(apply=False, anonymize_customers=False)

        self.assertTrue(result["dry_run"])
        self.assertEqual(result["photos_deleted"], 1)
        self.assertTrue(TransportRequestPhoto.objects.filter(id=photo.id).exists())
        self.assertTrue(photo.image.storage.exists(photo.image.name))
        self.assertTrue(path)

    def test_retention_apply_deletes_only_old_terminal_photos(self):
        _eligible, eligible_photo = self._request_with_photo(status="delivered", days_old=45)
        _active, active_photo = self._request_with_photo(status="in_transit", days_old=45)
        _recent, recent_photo = self._request_with_photo(status="delivered", days_old=5)
        eligible_name = eligible_photo.image.name

        result = run_data_retention(apply=True, anonymize_customers=False, actor=self.admin)

        self.assertFalse(result["dry_run"])
        self.assertEqual(result["photos_deleted"], 1)
        self.assertFalse(TransportRequestPhoto.objects.filter(id=eligible_photo.id).exists())
        self.assertFalse(eligible_photo.image.storage.exists(eligible_name))
        self.assertTrue(TransportRequestPhoto.objects.filter(id=active_photo.id).exists())
        self.assertTrue(TransportRequestPhoto.objects.filter(id=recent_photo.id).exists())
        self.assertTrue(AuditLog.objects.filter(action="retention_photos_purged").exists())

    def test_retention_anonymizes_only_customers_without_active_or_recent_requests(self):
        eligible_customer = Customer.objects.create(
            full_name="Eligible Client", phone="+331", whatsapp_number="+331", email="old@example.com"
        )
        active_customer = Customer.objects.create(
            full_name="Active Client", phone="+332", whatsapp_number="+332", email="active@example.com"
        )
        self._request_with_photo(status="delivered", days_old=45, customer=eligible_customer)
        self._request_with_photo(status="in_transit", days_old=45, customer=active_customer)

        result = run_data_retention(apply=True, anonymize_customers=True, actor=self.admin)

        self.assertEqual(result["customers_anonymized"], 1)
        eligible_customer.refresh_from_db()
        active_customer.refresh_from_db()
        self.assertEqual(eligible_customer.full_name, f"Anonymized #{eligible_customer.id}")
        self.assertIsNone(eligible_customer.phone)
        self.assertIsNone(eligible_customer.whatsapp_number)
        self.assertIsNone(eligible_customer.email)
        self.assertEqual(active_customer.full_name, "Active Client")
        self.assertTrue(AuditLog.objects.filter(action="retention_customers_anonymized").exists())

    def test_admin_retention_endpoint_is_staff_only_and_dry_run_by_default(self):
        _req, photo = self._request_with_photo()
        customer = User.objects.create_user(
            email="customer@example.com", password="StrongPass123!", role="customer"
        )
        self.client.force_authenticate(customer)
        forbidden = self.client.post(reverse("admin-data-retention"), {}, format="json")
        self.assertIn(forbidden.status_code, (401, 403))

        self.client.force_authenticate(self.admin)
        response = self.client.post(reverse("admin-data-retention"), {}, format="json")

        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.data["dry_run"])
        self.assertEqual(response.data["photos_deleted"], 1)
        self.assertTrue(TransportRequestPhoto.objects.filter(id=photo.id).exists())

    def test_admin_retention_endpoint_can_apply(self):
        _req, photo = self._request_with_photo()
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            reverse("admin-data-retention"), {"apply": True}, format="json"
        )

        self.assertEqual(response.status_code, 200, response.content)
        self.assertFalse(response.data["dry_run"])
        self.assertEqual(response.data["photos_deleted"], 1)
        self.assertFalse(TransportRequestPhoto.objects.filter(id=photo.id).exists())
