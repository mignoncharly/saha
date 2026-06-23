from .models import AuditLog

def log_action(actor, action, entity_type, entity_id=None, metadata=None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        metadata=metadata or {},
    )