import datetime

from django.db import IntegrityError, transaction

# How many times to re-pick a reference number when a concurrent submission
# grabs the same one before us.
MAX_REFERENCE_RETRIES = 5


def _peek_next_reference_code():
    """Best-effort next code (``STL-YYYY-NNNNNN``) from the current max for the year.

    This read is inherently racy on its own — two concurrent callers can compute
    the same number. Callers MUST insert the row via
    :func:`create_transport_request_with_reference`, which retries on the unique
    constraint collision that race produces.
    """
    from .models import TransportRequest

    year = datetime.date.today().year
    prefix = f"STL-{year}-"
    latest = (
        TransportRequest.objects
        .filter(reference_code__startswith=prefix)
        .order_by('-reference_code')
        .first()
    )
    next_num = int(latest.reference_code.split('-')[-1]) + 1 if latest else 1
    return f"{prefix}{next_num:06d}"


def create_transport_request_with_reference(**fields):
    """Create a ``TransportRequest`` with a unique reference code.

    Replaces the race-prone "read latest, +1, save later" flow: each attempt
    picks the next code and inserts inside a savepoint, so a colliding INSERT
    (another request took the number) is caught and retried with a fresh number
    rather than surfacing a 500. The ``reference_code`` unique constraint is the
    source of truth.
    """
    from .models import TransportRequest

    last_exc = None
    for _ in range(MAX_REFERENCE_RETRIES):
        reference_code = _peek_next_reference_code()
        try:
            with transaction.atomic():
                return TransportRequest.objects.create(
                    reference_code=reference_code, **fields
                )
        except IntegrityError as exc:
            last_exc = exc
    # Exhausted retries — re-raise the last collision so the caller sees a 500
    # rather than silently dropping the request.
    raise last_exc


# Backwards-compatible alias for the old name (peek only — not race-safe by
# itself; prefer create_transport_request_with_reference for inserts).
generate_reference_code = _peek_next_reference_code
