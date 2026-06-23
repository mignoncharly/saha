from rest_framework import serializers
from .models import PickupSchedule, LoadingDate

class PickupScheduleSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    cities = serializers.SerializerMethodField()

    class Meta:
        model = PickupSchedule
        fields = ('id', 'region_name', 'cities', 'start_date', 'end_date', 'notes')

    def get_cities(self, obj):
        return obj.cities or obj.region.cities

class LoadingDateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoadingDate
        fields = ('id', 'date', 'title', 'description')