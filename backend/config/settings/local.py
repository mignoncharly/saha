from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

# Override to use console email
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'