import re

from .models import Customer


def normalize_phone(raw):
    """Normalize a phone number for matching/storage.

    Conservative: strips spaces and formatting punctuation and unifies the
    international prefix (a leading ``00`` becomes ``+``). It deliberately does
    NOT convert national to international form (e.g. ``06…`` -> ``+336…``) since
    that needs a known country; full E.164 normalization is a future enhancement
    (would require the ``phonenumbers`` lib + region).

    Returns the input unchanged when empty.
    """
    if not raw:
        return raw
    s = raw.strip()
    has_plus = s.startswith('+')
    has_intl_00 = s.startswith('00')
    digits = re.sub(r'\D', '', s)
    if has_intl_00:
        return '+' + digits[2:]
    if has_plus:
        return '+' + digits
    return digits


def _apply_fields(customer, *, full_name, phone, whatsapp_number, email, language, overwrite):
    """Set customer fields. With overwrite=False only blank fields are filled, so
    an anonymous submission can never clobber an existing customer's identity."""
    changed = []

    def maybe_set(field, value):
        if not value:
            return
        current = getattr(customer, field)
        if (overwrite or not current) and current != value:
            setattr(customer, field, value)
            changed.append(field)

    maybe_set('full_name', full_name)
    maybe_set('phone', phone)
    maybe_set('whatsapp_number', whatsapp_number)
    maybe_set('email', email)
    # Language is a low-risk preference; keep it current when provided.
    if language and customer.preferred_language != language:
        customer.preferred_language = language
        changed.append('preferred_language')

    if changed:
        customer.save(update_fields=changed + ['updated_at'])
    return customer


def resolve_customer(*, user, full_name, phone, whatsapp_number, email, language):
    """Find or create the Customer a transport request should attach to.

    Order of precedence:
      1. An authenticated user's own ``customer_profile`` (we trust them to
         update their own details — overwrite=True).
      2. An existing customer matched by normalized phone. For anonymous
         submissions we only fill blank fields (never overwrite identity).
      3. Otherwise create a new customer.
    """
    norm_phone = normalize_phone(phone)
    norm_whatsapp = normalize_phone(whatsapp_number) or norm_phone
    is_auth = bool(user is not None and getattr(user, 'is_authenticated', False))

    # 1. Authenticated user with an existing profile.
    if is_auth:
        own = getattr(user, 'customer_profile', None)
        if own is not None:
            return _apply_fields(
                own, full_name=full_name, phone=norm_phone,
                whatsapp_number=norm_whatsapp, email=email, language=language,
                overwrite=True,
            )

    # 2. Match an existing customer by normalized phone.
    customer = Customer.objects.filter(phone=norm_phone).first() if norm_phone else None
    if customer is None:
        return Customer.objects.create(
            user=user if is_auth else None,
            full_name=full_name,
            phone=norm_phone,
            whatsapp_number=norm_whatsapp,
            email=email or None,
            preferred_language=language or 'fr',
        )

    # 3. Existing match — fill gaps only for anonymous; link the user if known.
    _apply_fields(
        customer, full_name=full_name, phone=norm_phone,
        whatsapp_number=norm_whatsapp, email=email, language=language,
        overwrite=False,
    )
    if is_auth and customer.user_id is None:
        customer.user = user
        customer.save(update_fields=['user', 'updated_at'])
    return customer
