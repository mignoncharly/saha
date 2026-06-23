from django.db import models
from apps.customers.models import Customer

class PushSubscription(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    region = models.CharField(max_length=255, blank=True, help_text="Region/city interest")
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
        ('all', 'All'),
        ('region', 'Region'),
        ('request_status', 'Request Status'),
    ])
    target_region = models.CharField(max_length=255, blank=True)
    sent_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.sent_count} sent)"