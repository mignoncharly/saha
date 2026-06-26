from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone

from apps.audit.services import log_action
from apps.customers.models import Customer

from .models import TransportRequest, TransportRequestPhoto

TERMINAL_STATUSES = ("delivered", "cancelled")
ANONYMIZED_VALUE = "Anonymized"


def retention_cutoff(days=None):
    days = settings.DATA_RETENTION_DAYS if days is None else days
    return timezone.now() - timezone.timedelta(days=days)


def _eligible_requests(cutoff):
    return TransportRequest.objects.filter(
        status__in=TERMINAL_STATUSES,
        updated_at__lt=cutoff,
    )


def _delete_photo(photo, apply):
    path = photo.image.name
    if apply:
        storage = photo.image.storage
        if path and storage.exists(path):
            storage.delete(path)
        photo.delete()
    return path


def purge_request_photos(*, days=None, apply=False, actor=None):
    cutoff = retention_cutoff(days)
    photos = TransportRequestPhoto.objects.select_related("request").filter(
        request__in=_eligible_requests(cutoff)
    )
    result = {
        "cutoff": cutoff.isoformat(),
        "eligible_request_count": _eligible_requests(cutoff).count(),
        "photos_deleted": 0,
        "photo_paths": [],
    }
    for photo in photos:
        result["photo_paths"].append(_delete_photo(photo, apply))
        result["photos_deleted"] += 1

    if apply and result["photos_deleted"]:
        log_action(
            actor,
            "retention_photos_purged",
            "TransportRequestPhoto",
            metadata={
                "cutoff": result["cutoff"],
                "photos_deleted": result["photos_deleted"],
            },
        )
    return result


def _eligible_customers(cutoff):
    return (
        Customer.objects.annotate(
            total_requests=Count("requests", distinct=True),
            active_requests=Count(
                "requests",
                filter=~Q(requests__status__in=TERMINAL_STATUSES) | Q(requests__updated_at__gte=cutoff),
                distinct=True,
            ),
        )
        .filter(total_requests__gt=0, active_requests=0)
    )


def anonymize_customer_pii(*, days=None, apply=False, actor=None):
    cutoff = retention_cutoff(days)
    customers = _eligible_customers(cutoff)
    result = {
        "cutoff": cutoff.isoformat(),
        "customers_anonymized": 0,
        "customer_ids": [],
    }
    for customer in customers:
        result["customer_ids"].append(customer.id)
        result["customers_anonymized"] += 1
        if apply:
            customer.full_name = f"{ANONYMIZED_VALUE} #{customer.id}"
            customer.phone = None
            customer.whatsapp_number = None
            customer.email = None
            customer.save(update_fields=["full_name", "phone", "whatsapp_number", "email", "updated_at"])

    if apply and result["customers_anonymized"]:
        log_action(
            actor,
            "retention_customers_anonymized",
            "Customer",
            metadata={
                "cutoff": result["cutoff"],
                "customers_anonymized": result["customers_anonymized"],
            },
        )
    return result


def run_data_retention(*, days=None, apply=False, anonymize_customers=None, actor=None):
    if anonymize_customers is None:
        anonymize_customers = getattr(settings, "DATA_RETENTION_ANONYMIZE_CUSTOMERS", False)
    photos = purge_request_photos(days=days, apply=apply, actor=actor)
    customers = {"customers_anonymized": 0, "customer_ids": [], "cutoff": photos["cutoff"]}
    if anonymize_customers:
        customers = anonymize_customer_pii(days=days, apply=apply, actor=actor)
    return {
        "dry_run": not apply,
        "days": settings.DATA_RETENTION_DAYS if days is None else days,
        "anonymize_customers": bool(anonymize_customers),
        **photos,
        **customers,
    }
