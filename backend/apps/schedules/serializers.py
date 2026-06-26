from rest_framework import serializers
from .models import PickupSchedule, LoadingDate
from apps.core.i18n import is_admin_request, translate_database_value

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not is_admin_request(self):
            data['title'] = translate_database_value(data['title'])
            data['description'] = translate_database_value(data['description'])
        return data


class AdminLoadingDateSerializer(LoadingDateSerializer):
    """Admin surface: exposes ``active`` so loadings can be toggled without
    deletion (the public list already hides inactive ones)."""

    class Meta(LoadingDateSerializer.Meta):
        fields = LoadingDateSerializer.Meta.fields + ('active',)
