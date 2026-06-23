from django.db import models
from apps.customers.models import Customer
from apps.services.models import ServiceType
from apps.destinations.models import DestinationCity

class TransportRequest(models.Model):
    STATUS_CHOICES = [
        ('new', 'Nouveau'),
        ('contacted', 'Contacté'),
        ('confirmed', 'Confirmé'),
        ('pickup_scheduled', 'Ramassage planifié'),
        ('received', 'Reçu'),
        ('loaded', 'Chargé'),
        ('in_transit', 'En route'),
        ('arrived_cameroon', 'Arrivé au Cameroun'),
        ('delivered', 'Livré'),
        ('cancelled', 'Annulé'),
    ]
    reference_code = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='requests')
    service_type = models.ForeignKey(ServiceType, on_delete=models.SET_NULL, null=True, blank=True)
    pickup_city = models.CharField(max_length=200)
    pickup_address = models.TextField()
    preferred_pickup_date = models.DateField(null=True, blank=True)
    destination_city = models.ForeignKey(DestinationCity, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.IntegerField(default=1)
    dimensions = models.CharField(max_length=200, blank=True)
    estimated_weight = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='new')
    internal_notes = models.TextField(blank=True)
    customer_notes = models.TextField(blank=True)
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference_code} - {self.customer.full_name}"

class TransportRequestPhoto(models.Model):
    request = models.ForeignKey(TransportRequest, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='request_photos/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo {self.id} for {self.request.reference_code}"