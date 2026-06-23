import datetime
from django.db import transaction

def generate_reference_code():
    """Generate unique reference like STL-2026-000123"""
    year = datetime.date.today().year
    prefix = f"STL-{year}-"
    # Use a simple sequence via DB to avoid race conditions; here we'll use timestamp fallback but in production use sequence
    from .models import TransportRequest
    with transaction.atomic():
        # This approach is okay for MVP; to be robust we'd use a DB sequence
        latest = TransportRequest.objects.filter(reference_code__startswith=prefix).order_by('-reference_code').first()
        if latest:
            last_num = int(latest.reference_code.split('-')[-1])
            next_num = last_num + 1
        else:
            next_num = 1
        return f"{prefix}{next_num:06d}"