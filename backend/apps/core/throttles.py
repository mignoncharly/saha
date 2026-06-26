from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class PublicAnonRateThrottle(AnonRateThrottle):
    """Strict per-IP limit for anonymous transport-request submissions."""
    scope = 'public_submit'
    rate = '10/minute'


class PasswordResetThrottle(AnonRateThrottle):
    """Per-IP limit for password-reset request and confirm endpoints."""
    scope = 'password_reset'
    rate = '5/minute'


class EmailVerificationThrottle(AnonRateThrottle):
    """Per-IP limit for the anonymous email-verification endpoint."""
    scope = 'email_verification'
    rate = '10/minute'


class ResendVerificationThrottle(UserRateThrottle):
    """Per-user limit for resending the verification email."""
    scope = 'resend_verification'
    rate = '3/minute'


class PushSubscriptionThrottle(AnonRateThrottle):
    """Per-IP limit for web-push subscription writes."""
    scope = 'push_subscription'
    rate = '30/minute'


class ContactRateThrottle(AnonRateThrottle):
    """Strict per-IP limit for the public contact form."""
    scope = 'contact'
    rate = '5/minute'


class AuthRateThrottle(AnonRateThrottle):
    """Limit anonymous authentication attempts (login / register) per IP."""
    scope = 'auth'
    rate = '10/minute'
