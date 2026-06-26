from rest_framework import serializers
from django.utils.translation import gettext as _
from .models import PickupSchedule, LoadingDate, PickupRegion
from apps.core.i18n import is_admin_request, translate_database_value

class PickupScheduleSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source='region.name', read_only=True)
    cities = serializers.SerializerMethodField()

    class Meta:
        model = PickupSchedule
        fields = ('id', 'region_name', 'cities', 'start_date', 'end_date', 'notes')

    def get_cities(self, obj):
        return obj.cities or obj.region.cities


class AdminPickupScheduleSerializer(serializers.ModelSerializer):
    """Admin write surface for pickup schedules.

    ``region_name`` is the input field: conservatively, we create-or-get the
    ``PickupRegion`` by name (mirroring the CSV importer) rather than exposing a
    separate region manager. The read value is injected in ``to_representation``.
    ``cities`` here is the raw per-schedule override (blank = inherit region's
    cities), so editing preserves the inherit semantics.
    """
    region_name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = PickupSchedule
        fields = ('id', 'region_name', 'title', 'cities', 'start_date', 'end_date', 'notes', 'active')

    def validate(self, attrs):
        if self.instance is None and not (attrs.get('region_name') or '').strip():
            raise serializers.ValidationError({'region_name': _('This field is required.')})
        return attrs

    def _resolve_region(self, region_name, cities):
        region, _created = PickupRegion.objects.get_or_create(
            name=region_name.strip(),
            defaults={'cities': cities or ''},
        )
        return region

    def create(self, validated_data):
        region_name = validated_data.pop('region_name')
        validated_data['region'] = self._resolve_region(region_name, validated_data.get('cities', ''))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        region_name = validated_data.pop('region_name', None)
        if region_name and region_name.strip():
            validated_data['region'] = self._resolve_region(
                region_name, validated_data.get('cities', instance.cities)
            )
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['region_name'] = instance.region.name if instance.region else ''
        return data

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
