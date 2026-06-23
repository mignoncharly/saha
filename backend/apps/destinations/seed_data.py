from .models import DestinationCity

def create_destinations():
    cities = ['Douala', 'Yaoundé', 'Bafoussam']
    for city in cities:
        DestinationCity.objects.get_or_create(name=city)