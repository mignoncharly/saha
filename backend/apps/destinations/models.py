from django.db import models

class DestinationCity(models.Model):
    name = models.CharField(max_length=200)
    country = models.CharField(max_length=100, default='Cameroun')
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}, {self.country}"