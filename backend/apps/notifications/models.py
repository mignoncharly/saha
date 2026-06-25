from django.db import models
from apps.customers.models import Customer
from django.utils.translation import gettext_lazy as _

class PushSubscription(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    region = models.CharField(max_length=255, blank=True, help_text=_("Region/city interest"))
    language = models.CharField(max_length=10, default='fr')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Sub {self.id} ({self.region})"

class NotificationLog(models.Model):
    title = models.CharField(max_length=255)
    body = models.TextField()
    target_type = models.CharField(max_length=50, choices=[
        ('all', _('All')),
        ('region', _('Region')),
        ('request_status', _('Request status')),
    ])
    target_region = models.CharField(max_length=255, blank=True)
    sent_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return _("%(title)s (%(count)s sent)") % {'title': self.title, 'count': self.sent_count}


class CustomerNotification(models.Model):
    """In-app notification history for a specific customer."""
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    reference_code = models.CharField(max_length=50, blank=True, help_text=_("Linked request reference, if any"))
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} -> {self.customer_id}"


class NotificationPreference(models.Model):
    """Per-customer notification preferences."""
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='notification_preference')
    language = models.CharField(max_length=10, default='fr')
    regions = models.CharField(max_length=500, blank=True, help_text=_("Comma-separated preferred pickup regions"))
    status_updates = models.BooleanField(default=True, help_text=_("Receive request status updates"))
    pickup_alerts = models.BooleanField(default=True, help_text=_("Receive pickup/loading alerts"))
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return _("Preferences %(customer_id)s") % {'customer_id': self.customer_id}
