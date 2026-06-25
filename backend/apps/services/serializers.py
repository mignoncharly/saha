from rest_framework import serializers
from .models import ServiceType
from apps.core.i18n import is_admin_request, translate_database_value

class ServiceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceType
        fields = ('id', 'name', 'description', 'icon')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not is_admin_request(self):
            data['name'] = translate_database_value(data['name'])
            data['description'] = translate_database_value(data['description'])
        return data
