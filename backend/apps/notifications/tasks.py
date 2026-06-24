from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import PushSubscription, NotificationLog
from .webpush import send_web_push
import json

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
    status_label = dict(TransportRequest.STATUS_CHOICES).get(req.status, req.status)
    title = f"Demande {req.reference_code}"
    body = f"Statut mis à jour : {status_label}"

    # Always record in-app history so the customer sees it in their center.
    CustomerNotification.objects.create(
        customer=customer, title=title, body=body, reference_code=req.reference_code,
    )

    # Push delivery honors the customer's status-update preference.
    pref = NotificationPreference.objects.filter(customer=customer).first()
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
        title=f"Status update {req.reference_code}",
        body=f"{status_label}",
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
    send_mail(
        'STL - Vérification de votre adresse email',
        f'Bonjour,\n\nVeuillez vérifier votre adresse email en cliquant sur ce lien : {verify_url}\n\nL\'équipe STL.',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )

@shared_task
def send_password_reset_email(email, reset_url):
    send_mail(
        'STL - Réinitialisation de mot de passe',
        f'Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez ici : {reset_url}\n\nSi vous n\'êtes pas à l\'origine de cette demande, ignorez ce message.',
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=True,
    )