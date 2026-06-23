from rest_framework import serializers
from .models import PriceRule

class PriceRuleSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service_type.name', read_only=True)

    class Meta:
        model = PriceRule
        fields = ('id', 'service_type', 'service_name', 'label', 'price_amount', 'currency', 'unit', 'description')