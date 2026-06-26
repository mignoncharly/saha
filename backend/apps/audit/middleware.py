from .local import set_current_request, clear_current_request


class AuditLogMiddleware:
    """Expose the in-flight request to the audit signals so they can attribute
    the acting user. Cleared in `finally` so threads never leak a stale request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        set_current_request(request)
        try:
            return self.get_response(request)
        finally:
            clear_current_request()
