import logging

from pywebpush import webpush, WebPushException
from django.conf import settings

logger = logging.getLogger(__name__)

# Result codes returned by send_web_push.
PUSH_OK = "ok"
PUSH_GONE = "gone"      # subscription expired/unsubscribed (HTTP 404/410) -> deactivate
PUSH_FAILED = "failed"  # transient/other error -> keep, count as failed


def send_web_push(subscription_info, message_body):
    """Send one web-push message.

    Returns one of PUSH_OK / PUSH_GONE / PUSH_FAILED. PUSH_GONE means the push
    service reported the subscription as gone (404) or expired (410); callers
    should mark that subscription inactive instead of retrying it forever.
    """
    try:
        webpush(
            subscription_info={
                "endpoint": subscription_info["endpoint"],
                "keys": {
                    "p256dh": subscription_info["p256dh"],
                    "auth": subscription_info["auth"],
                },
            },
            data=message_body,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"},
            timeout=10,
        )
        return PUSH_OK
    except WebPushException as ex:
        status_code = getattr(getattr(ex, "response", None), "status_code", None)
        if status_code in (404, 410):
            logger.info("Web push subscription gone (HTTP %s); deactivating.", status_code)
            return PUSH_GONE
        logger.warning("Web push failed (HTTP %s): %s", status_code, ex)
        return PUSH_FAILED
