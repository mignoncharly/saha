from rest_framework import generics
from .models import DestinationCity
from .serializers import DestinationCitySerializer

class DestinationCityListView(generics.ListAPIView):
    queryset = DestinationCity.objects.filter(active=True)
    serializer_class = DestinationCitySerializer
    permission_classes = []