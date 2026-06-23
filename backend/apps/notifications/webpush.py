from pywebpush import webpush, WebPushException
from django.conf import settings

def send_web_push(subscription_info, message_body):
    """subscription_info: dict with endpoint, keys (p256dh, auth)"""
    try:
        webpush(
            subscription_info={
                "endpoint": subscription_info["endpoint"],
                "keys": {
                    "p256dh": subscription_info["p256dh"],
                    "auth": subscription_info["auth"]
                }
            },
            data=message_body,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={
                "sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"
            },
            timeout=10
        )
        return True
    except WebPushException as ex:
        print(f"Push failed: {ex}")
        return False