from django.db import models
from django.db.models import Q
from django.utils import timezone
from apps.services.models import ServiceType
from django.utils.translation import gettext_lazy as _


class PriceRuleQuerySet(models.QuerySet):
    def current(self):
        """Active rules whose optional validity window covers today.

        A null ``valid_from``/``valid_until`` means "no lower/upper bound".
        Used for every public-facing price surface so inactive or
        out-of-window rules never leak into the published price list.
        """
        today = timezone.localdate()
        return self.filter(active=True).filter(
            Q(valid_from__isnull=True) | Q(valid_from__lte=today)
        ).filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=today)
        )


class PriceRule(models.Model):
    service_type = models.ForeignKey(ServiceType, on_delete=models.CASCADE, related_name='prices')
    label = models.CharField(max_length=255)
    price_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    unit = models.CharField(max_length=50, blank=True, help_text=_("Example: 'piece', 'm³', 'vehicle'"))
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PriceRuleQuerySet.as_manager()

    class Meta:
        ordering = ['service_type', 'price_amount']

    def __str__(self):
        return f"{self.label} - {self.price_amount} {self.currency}"
