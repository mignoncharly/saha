from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver

from apps.logistics.models import TransportRequest
from apps.services.models import ServiceType
from apps.pricing.models import PriceRule
from apps.schedules.models import PickupSchedule, LoadingDate
from .local import get_current_actor
from .services import log_action


def _stash_old(sender, instance, field):
    """Remember a field's pre-save value on the instance for before/after diffing."""
    attr = f"_audit_old_{field}"
    if instance.pk:
        try:
            setattr(instance, attr, sender.objects.values_list(field, flat=True).get(pk=instance.pk))
            return
        except sender.DoesNotExist:
            pass
    setattr(instance, attr, None)


def _diff(instance, field, metadata, created):
    """Add <field>_from/<field>_to to metadata when an existing row's value changed."""
    if created:
        return
    old = getattr(instance, f"_audit_old_{field}", None)
    new = getattr(instance, field)
    if old is not None and old != new:
        metadata[f"{field}_from"] = old
        metadata[f"{field}_to"] = new


# ---- TransportRequest: track status transitions ----

@receiver(pre_save, sender=TransportRequest)
def _stash_request_status(sender, instance, **kwargs):
    _stash_old(sender, instance, "status")


@receiver(post_save, sender=TransportRequest)
def log_request_change(sender, instance, created, **kwargs):
    metadata = {"status": instance.status, "reference": instance.reference_code}
    _diff(instance, "status", metadata, created)
    log_action(get_current_actor(), "created" if created else "updated",
               "TransportRequest", instance.id, metadata)


@receiver(post_delete, sender=TransportRequest)
def log_request_delete(sender, instance, **kwargs):
    log_action(get_current_actor(), "deleted", "TransportRequest", instance.id,
               {"reference": instance.reference_code})


# ---- Catalog models: track active toggles ----

@receiver(pre_save, sender=ServiceType)
@receiver(pre_save, sender=PriceRule)
@receiver(pre_save, sender=PickupSchedule)
@receiver(pre_save, sender=LoadingDate)
def _stash_active(sender, instance, **kwargs):
    _stash_old(sender, instance, "active")


@receiver(post_save, sender=ServiceType)
def log_service_change(sender, instance, created, **kwargs):
    metadata = {"name": instance.name}
    _diff(instance, "active", metadata, created)
    log_action(get_current_actor(), "created" if created else "updated",
               "ServiceType", instance.id, metadata)


@receiver(post_save, sender=PriceRule)
def log_price_change(sender, instance, created, **kwargs):
    metadata = {"label": instance.label}
    _diff(instance, "active", metadata, created)
    log_action(get_current_actor(), "created" if created else "updated",
               "PriceRule", instance.id, metadata)


@receiver(post_save, sender=PickupSchedule)
def log_schedule_change(sender, instance, created, **kwargs):
    metadata = {"region": instance.region.name if instance.region else ""}
    _diff(instance, "active", metadata, created)
    log_action(get_current_actor(), "created" if created else "updated",
               "PickupSchedule", instance.id, metadata)


@receiver(post_save, sender=LoadingDate)
def log_loading_date_change(sender, instance, created, **kwargs):
    metadata = {"date": str(instance.date)}
    _diff(instance, "active", metadata, created)
    log_action(get_current_actor(), "created" if created else "updated",
               "LoadingDate", instance.id, metadata)


@receiver(post_delete, sender=ServiceType)
def log_service_delete(sender, instance, **kwargs):
    log_action(get_current_actor(), "deleted", "ServiceType", instance.id, {"name": instance.name})


@receiver(post_delete, sender=PriceRule)
def log_price_delete(sender, instance, **kwargs):
    log_action(get_current_actor(), "deleted", "PriceRule", instance.id, {"label": instance.label})


@receiver(post_delete, sender=PickupSchedule)
def log_schedule_delete(sender, instance, **kwargs):
    log_action(get_current_actor(), "deleted", "PickupSchedule", instance.id,
               {"region": instance.region.name if instance.region else ""})


@receiver(post_delete, sender=LoadingDate)
def log_loading_date_delete(sender, instance, **kwargs):
    log_action(get_current_actor(), "deleted", "LoadingDate", instance.id, {"date": str(instance.date)})
