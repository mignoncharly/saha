#!/usr/bin/env python
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()
from apps.accounts.models import User
if not User.objects.filter(email='info@gestionatech.de').exists():
    User.objects.create_superuser('info@gestionatech.de', 'admin123')
    print('Admin created')
else:
    print('Admin already exists')