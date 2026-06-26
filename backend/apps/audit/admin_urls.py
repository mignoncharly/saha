from django.urls import path

from . import admin_views

urlpatterns = [
    path('', admin_views.AdminAuditLogListView.as_view(), name='admin-audit-list'),
]
