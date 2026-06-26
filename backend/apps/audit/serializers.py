from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = ('id', 'actor_email', 'action', 'entity_type', 'entity_id', 'metadata', 'created_at')
        read_only_fields = fields
