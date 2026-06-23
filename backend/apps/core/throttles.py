from rest_framework.throttling import AnonRateThrottle


class PublicAnonRateThrottle(AnonRateThrottle):
    """Strict per-IP limit for anonymous transport-request submissions."""
    scope = 'public_submit'
    rate = '10/minute'


class ContactRateThrottle(AnonRateThrottle):
    """Strict per-IP limit for the public contact form."""
    scope = 'contact'
    rate = '5/minute'


class AuthRateThrottle(AnonRateThrottle):
    """Limit anonymous authentication attempts (login / register) per IP."""
    scope = 'auth'
    rate = '10/minute'
