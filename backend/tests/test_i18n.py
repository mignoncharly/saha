from django.urls import reverse
from django.utils import translation
from rest_framework.test import APITestCase

from apps.logistics.models import TransportRequest
from apps.pricing.models import PriceRule
from apps.services.models import ServiceType


class InternationalizationTests(APITestCase):
    def test_german_validation_message_follows_accept_language(self):
        response = self.client.post(
            reverse('transport-request-create'),
            {'consent': 'false'},
            format='multipart',
            HTTP_ACCEPT_LANGUAGE='de-DE,de;q=0.9',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            str(response.data['consent'][0]),
            'Sie müssen der Kontaktaufnahme zustimmen.',
        )

    def test_public_database_labels_are_translated_without_mutating_source(self):
        service = ServiceType.objects.create(name='Voiture chargée')
        rule = PriceRule.objects.create(
            service_type=service,
            label='Berline',
            price_amount=500,
            unit='voiture',
        )

        response = self.client.get(
            reverse('price-estimate'),
            {'service_type_id': service.id},
            HTTP_ACCEPT_LANGUAGE='de',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['label'], 'Limousine')
        self.assertEqual(response.data['unit'], 'Fahrzeug')
        rule.refresh_from_db()
        self.assertEqual(rule.label, 'Berline')
        self.assertEqual(rule.unit, 'voiture')

    def test_lazy_model_choice_uses_active_language(self):
        request_obj = TransportRequest(status='new')

        with translation.override('fr'):
            self.assertEqual(request_obj.get_status_display(), 'Nouveau')
        with translation.override('de'):
            self.assertEqual(request_obj.get_status_display(), 'Neu')
