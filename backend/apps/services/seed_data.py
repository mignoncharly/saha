from .models import ServiceType

def create_services():
    data = [
        {'name': 'Colis', 'description': 'Envoi de colis standard', 'icon': 'package', 'sort_order': 1},
        {'name': 'Fût 200L', 'description': 'Transport de fûts de 200 litres', 'icon': 'barrel', 'sort_order': 2},
        {'name': 'Volume m³', 'description': 'Transport au volume (mètre cube)', 'icon': 'cube', 'sort_order': 3},
        {'name': 'Voiture chargée', 'description': 'Transport de véhicule avec marchandises', 'icon': 'car', 'sort_order': 4},
        {'name': 'Autre', 'description': 'Autres marchandises sur devis', 'icon': 'help-circle', 'sort_order': 5},
    ]
    for d in data:
        ServiceType.objects.get_or_create(name=d['name'], defaults=d)