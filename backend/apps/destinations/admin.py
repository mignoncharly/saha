from django.contrib import admin
from .models import DestinationCity

@admin.register(DestinationCity)
class DestinationCityAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'active')