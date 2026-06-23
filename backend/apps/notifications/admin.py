from django.contrib import admin
from .models import PushSubscription, NotificationLog

@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('endpoint', 'region', 'active', 'created_at')
    list_filter = ('region', 'active')

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'target_type', 'target_region', 'sent_count', 'created_at')