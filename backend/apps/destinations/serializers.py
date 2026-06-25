from rest_framework import serializers
from .models import DestinationCity
from apps.core.i18n import is_admin_request, translate_database_value

class DestinationCitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DestinationCity
        fields = ('id', 'name', 'country')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not is_admin_request(self):
            data['country'] = translate_database_value(data['country'])
        return data
