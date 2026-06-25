from django.utils.translation import gettext, gettext_noop


# Database-backed catalog values shipped by the seed data. gettext_noop keeps
# them extractable while translation happens only when a response is rendered.
DATABASE_MESSAGES = (
    gettext_noop('Colis'),
    gettext_noop('Fût 200L'),
    gettext_noop('Volume m³'),
    gettext_noop('Voiture chargée'),
    gettext_noop('Autre'),
    gettext_noop('Envoi de colis standard'),
    gettext_noop('Transport de fûts de 200 litres'),
    gettext_noop('Transport au volume (mètre cube)'),
    gettext_noop('Transport de véhicule avec marchandises'),
    gettext_noop('Autres marchandises sur devis'),
    gettext_noop('Petite voiture'),
    gettext_noop('Berline'),
    gettext_noop('SUV/4x4'),
    gettext_noop('Grand SUV'),
    gettext_noop('Colis standard'),
    gettext_noop('pièce'),
    gettext_noop('voiture'),
    gettext_noop('Cameroun'),
    gettext_noop('Allemagne'),
    gettext_noop('Prochain chargement'),
    gettext_noop('Date prévue de chargement pour le Cameroun'),
)


def translate_database_value(value):
    return gettext(value) if value else value


def is_admin_request(serializer):
    request = serializer.context.get('request')
    return bool(request and request.path.startswith('/api/admin/'))
