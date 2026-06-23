from django.db import models
from apps.services.models import ServiceType

class PriceRule(models.Model):
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE, related_name='prices')
    label = models.CharField(max_length=255)
    price_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    unit = models.CharField(max_length=50, blank=True, help_text="Example: 'pièce', 'm³', 'voiture'")
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['service_type', 'price_amount']

    def __str__(self):
        return f"{self.label} - {self.price_amount} {self.currency}"