from .models import PriceRule
from apps.services.models import ServiceType

def create_pricing():
    # mapping by service name
    try:
        fut = ServiceType.objects.get(name='Fût 200L')
        vol = ServiceType.objects.get(name='Volume m³')
        car = ServiceType.objects.get(name='Voiture chargée')
        colis = ServiceType.objects.get(name='Colis')
    except ServiceType.DoesNotExist:
        return

    rules = [
        {'service_type': fut, 'label': 'Fût 200L', 'price_amount': 175, 'unit': 'pièce'},
        {'service_type': vol, 'label': '1 m³', 'price_amount': 600, 'unit': 'm³'},
        {'service_type': car, 'label': 'Petite voiture', 'price_amount': 1090, 'unit': 'voiture'},
        {'service_type': car, 'label': 'Berline', 'price_amount': 1290, 'unit': 'voiture'},
        {'service_type': car, 'label': 'SUV/4x4', 'price_amount': 1590, 'unit': 'voiture'},
        {'service_type': car, 'label': 'Grand SUV', 'price_amount': 2090, 'unit': 'voiture'},
        {'service_type': colis, 'label': 'Colis standard', 'price_amount': 37.68, 'unit': 'pièce'},
    ]
    for rule in rules:
        PriceRule.objects.get_or_create(
            service_type=rule['service_type'],
            label=rule['label'],
            defaults=rule
        )