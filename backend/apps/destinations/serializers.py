from rest_framework import serializers
from .models import DestinationCity

class DestinationCitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationCity
        fields = ('id', 'name', 'country')