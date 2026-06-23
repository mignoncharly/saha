from django.contrib import admin
from .models import TransportRequest, TransportRequestPhoto

class TransportRequestPhotoInline(admin.TabularInline):
    model = TransportRequestPhoto
    extra = 0

@admin.register(TransportRequest)
class TransportRequestAdmin(admin.ModelAdmin):
    list_display = ('reference_code', 'customer', 'status', 'pickup_city', 'destination_city', 'created_at')
    list_filter = ('status', 'pickup_city', 'destination_city')
    search_fields = ('reference_code', 'customer__full_name')
    inlines = [TransportRequestPhotoInline]