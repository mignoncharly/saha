from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from apps.logistics.models import TransportRequest
from apps.services.models import ServiceType
from apps.pricing.models import PriceRule
from apps.schedules.models import PickupSchedule, LoadingDate
from .services import log_action

User = get_user_model()

def get_current_user():
    # Middleware should set thread-local user; simplified for now
    return None

@receiver(post_save, sender=TransportRequest)
def log_request_change(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    log_action(
        actor=None,  # thread-local user would be set
        action=action,
        entity_type='TransportRequest',
        entity_id=instance.id,
        metadata={'status': instance.status, 'reference': instance.reference_code}
    )

@receiver(post_save, sender=ServiceType)
def log_service_change(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    log_action(None, action, 'ServiceType', instance.id, {'name': instance.name})

@receiver(post_save, sender=PriceRule)
def log_price_change(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    log_action(None, action, 'PriceRule', instance.id, {'label': instance.label})

@receiver(post_save, sender=PickupSchedule)
def log_schedule_change(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    log_action(None, action, 'PickupSchedule', instance.id, {'region': instance.region.name if instance.region else ''})

@receiver(post_save, sender=LoadingDate)
def log_loading_date_change(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    log_action(None, action, 'LoadingDate', instance.id, {'date': str(instance.date)})

@receiver(post_delete, sender=TransportRequest)
def log_request_delete(sender, instance, **kwargs):
    log_action(None, 'deleted', 'TransportRequest', instance.id, {'reference': instance.reference_code})

@receiver(post_delete, sender=ServiceType)
def log_service_delete(sender, instance, **kwargs):
    log_action(None, 'deleted', 'ServiceType', instance.id, {'name': instance.name})

@receiver(post_delete, sender=PriceRule)
def log_price_delete(sender, instance, **kwargs):
    log_action(None, 'deleted', 'PriceRule', instance.id, {'label': instance.label})

@receiver(post_delete, sender=PickupSchedule)
def log_schedule_delete(sender, instance, **kwargs):
    log_action(None, 'deleted', 'PickupSchedule', instance.id, {'region': instance.region.name if instance.region else ''})

@receiver(post_delete, sender=LoadingDate)
def log_loading_date_delete(sender, instance, **kwargs):
    log_action(None, 'deleted', 'LoadingDate', instance.id, {'date': str(instance.date)})