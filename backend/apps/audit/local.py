"""Per-request actor tracking for audit logging.

The audit signals fire during ``model.save()`` inside a view, by which point
DRF has authenticated the request (its ``user`` setter writes through to the
underlying ``HttpRequest``). We stash the request in a thread-local in
middleware and read ``request.user`` at log time. Gunicorn sync workers handle
one request per thread, so a thread-local is safe here.
"""
import threading

_state = threading.local()


def set_current_request(request):
    _state.request = request


def clear_current_request():
    _state.request = None


def get_current_actor():
    """Return the authenticated user for the in-flight request, or None."""
    request = getattr(_state, "request", None)
    user = getattr(request, "user", None) if request is not None else None
    if user is not None and getattr(user, "is_authenticated", False):
        return user
    return None
