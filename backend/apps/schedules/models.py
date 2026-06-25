from django.db import models
from django.utils.translation import gettext_lazy as _

class PickupRegion(models.Model):
    name = models.CharField(max_length=200)
    country = models.CharField(max_length=100, default='Allemagne')
    cities = models.TextField(help_text=_("Comma-separated list of cities"))
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class PickupSchedule(models.Model):
    region = models.ForeignKey(PickupRegion, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=255, blank=True)
    cities = models.TextField(blank=True, help_text=_("Override cities for this schedule"))
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return f"{self.region.name} - {self.start_date}"

class LoadingDate(models.Model):
    date = models.DateField(unique=True)
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return _("Loading %(date)s") % {'date': self.date}
