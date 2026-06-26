"""Settings for the automated test suite (CI and local).

Redirects every external dependency to an isolated/in-memory target so a test
run never touches a real Postgres/Redis — safe to run even on the production
host. Use with: DJANGO_SETTINGS_MODULE=config.settings.test
"""
from .base import *  # noqa: F401,F403

DEBUG = False
SECRET_KEY = "ci-test-secret-not-used-in-production"
ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}
}
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}

# Run Celery tasks inline; never connect to a broker.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
MEDIA_ROOT = BASE_DIR / "test_media"  # noqa: F405

# Faster password hashing in tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
