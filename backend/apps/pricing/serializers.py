from rest_framework import serializers
from .models import PriceRule
from apps.core.i18n import is_admin_request, translate_database_value

class PriceRuleSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service_type.name', read_only=True)

    class Meta:
        model = PriceRule
        fields = ('id', 'service_type', 'service_name', 'label', 'price_amount', 'currency', 'unit', 'description')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not is_admin_request(self):
            for field in ('service_name', 'label', 'unit', 'description'):
                data[field] = translate_database_value(data[field])
        return data


class AdminPriceRuleSerializer(PriceRuleSerializer):
    """Admin surface: exposes the lifecycle fields the public list hides so the
    admin UI can actually set them (active toggle, validity window)."""

    class Meta(PriceRuleSerializer.Meta):
        fields = PriceRuleSerializer.Meta.fields + ('active', 'valid_from', 'valid_until')
