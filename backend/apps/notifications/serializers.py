from rest_framework import serializers
from .models import PushSubscription, CustomerNotification, NotificationPreference
from django.utils.translation import gettext_lazy as _

class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ('endpoint', 'p256dh', 'auth', 'region', 'language')

class BroadcastSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    body = serializers.CharField()
    target_type = serializers.ChoiceField(choices=[('all', _('All')), ('region', _('Region'))], default='all')
    target_region = serializers.CharField(required=False, allow_blank=True)

class CustomerNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerNotification
        fields = ('id', 'title', 'body', 'reference_code', 'read', 'created_at')
        read_only_fields = fields

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ('language', 'regions', 'status_updates', 'pickup_alerts', 'updated_at')
        read_only_fields = ('updated_at',)
