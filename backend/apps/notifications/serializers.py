from rest_framework import serializers
from .models import PushSubscription

class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ('endpoint', 'p256dh', 'auth', 'region', 'language')

class BroadcastSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    body = serializers.CharField()
    target_type = serializers.ChoiceField(choices=[('all', 'All'), ('region', 'Region')], default='all')
    target_region = serializers.CharField(required=False, allow_blank=True)