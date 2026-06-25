import os
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils.translation import gettext as _

def validate_image_extension(value):
    ext = os.path.splitext(value.name)[1].lower()
    valid_extensions = settings.ALLOWED_UPLOAD_EXTENSIONS
    if ext not in valid_extensions:
        raise ValidationError(_('Unsupported file extension. Allowed: %(extensions)s') % {
            'extensions': ', '.join(valid_extensions),
        })

def validate_file_size(value):
    limit = settings.FILE_UPLOAD_MAX_MEMORY_SIZE
    if value.size > limit:
        raise ValidationError(_('File size exceeds the limit of %(limit).1f MB.') % {
            'limit': limit / 1024 / 1024,
        })
