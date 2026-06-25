from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import translation
from django.utils.translation import gettext as _
from .models import PushSubscription, NotificationLog
from .webpush import send_web_push
from . import emails
import json
import logging

logger = logging.getLogger(__name__)


def _send_html_email(subject, text_body, html_body, to_email):
    """Send a multipart email (plain-text + HTML) to a single recipient."""
    msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [to_email])
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)

@shared_task
def send_broadcast_notification(notification_log_id):
    from .models import CustomerNotification, NotificationPreference
    log = NotificationLog.objects.get(id=notification_log_id)
    if log.target_type == 'region':
        subs = PushSubscription.objects.filter(active=True, region__icontains=log.target_region)
    else:
        subs = PushSubscription.objects.filter(active=True)

    # Customers who opted out of pickup alerts are excluded from this broadcast.
    opted_out = set(
        NotificationPreference.objects.filter(pickup_alerts=False).values_list('customer_id', flat=True)
    )

    # Record in-app history for each targeted customer (once), respecting opt-out.
    customer_ids = {
        cid for cid in subs.exclude(customer=None).values_list('customer_id', flat=True)
        if cid not in opted_out
    }
    if customer_ids:
        CustomerNotification.objects.bulk_create([
            CustomerNotification(customer_id=cid, title=log.title, body=log.body)
            for cid in customer_ids
        ])

    payload = json.dumps({
        "title": log.title,
        "body": log.body,
        "icon": "/icons/icon-192.png",
    })
    sent = 0
    failed = 0
    for sub in subs:
        if sub.customer_id and sub.customer_id in opted_out:
            continue
        try:
            success = send_web_push(
                {"endpoint": sub.endpoint, "p256dh": sub.p256dh, "auth": sub.auth},
                payload
            )
            if success:
                sent += 1
            else:
                failed += 1
        except Exception:
            failed += 1
    log.sent_count = sent
    log.failed_count = failed
    log.save()
    return sent, failed

@shared_task
def send_status_change_notification(request_id):
    from apps.logistics.models import TransportRequest
    from .models import CustomerNotification, NotificationPreference
    try:
        req = TransportRequest.objects.select_related('customer').get(id=request_id)
    except TransportRequest.DoesNotExist:
        return
    customer = req.customer
    if not customer:
        return
    pref = NotificationPreference.objects.filter(customer=customer).first()
    language = (pref.language if pref else customer.preferred_language) or 'fr'
    with translation.override(language):
        status_label = req.get_status_display()
        title = _('Request %(reference)s') % {'reference': req.reference_code}
        body = _('Status updated: %(status)s') % {'status': status_label}
        log_title = _('Status update %(reference)s') % {'reference': req.reference_code}

    # Always record in-app history so the customer sees it in their center.
    CustomerNotification.objects.create(
        customer=customer, title=title, body=body, reference_code=req.reference_code,
    )

    # Push delivery honors the customer's status-update preference.
    if pref and not pref.status_updates:
        return

    subs = PushSubscription.objects.filter(customer=customer, active=True)
    if not subs:
        return
    payload = json.dumps({
        "title": f"STL – {title}",
        "body": body,
        "icon": "/icons/icon-192.png",
    })
    sent = 0
    failed = 0
    for sub in subs:
        try:
            success = send_web_push(
                {"endpoint": sub.endpoint, "p256dh": sub.p256dh, "auth": sub.auth},
                payload,
            )
            if success:
                sent += 1
            else:
                failed += 1
        except Exception:
            failed += 1
    NotificationLog.objects.create(
        title=log_title,
        body=str(status_label),
        target_type='request_status',
        sent_count=sent,
        failed_count=failed,
    )

@shared_task
def send_verification_email(user_id, token):
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    verify_url = f"{settings.FRONTEND_URL}/compte/verify-email?token={token}"
    customer = getattr(user, 'customer_profile', None)
    language = getattr(customer, 'preferred_language', 'fr') or 'fr'
    try:
        with translation.override(language):
            subject, text_body, html_body = emails.build_verification_email(verify_url)
            _send_html_email(subject, text_body, html_body, user.email)
    except Exception:
        logger.exception("Failed to send verification email to %s", user.email)
        raise

@shared_task
def send_password_reset_email(user_id, reset_url):
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    customer = getattr(user, 'customer_profile', None)
    language = getattr(customer, 'preferred_language', 'fr') or 'fr'
    try:
        with translation.override(language):
            subject, text_body, html_body = emails.build_password_reset_email(reset_url)
            _send_html_email(subject, text_body, html_body, user.email)
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)
        raise
