from django.contrib import admin
from .models import PickupRegion, PickupSchedule, LoadingDate

@admin.register(PickupRegion)
class PickupRegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'active')

@admin.register(PickupSchedule)
class PickupScheduleAdmin(admin.ModelAdmin):
    list_display = ('region', 'start_date', 'end_date', 'active')
    list_filter = ('region', 'active')

@admin.register(LoadingDate)
class LoadingDateAdmin(admin.ModelAdmin):
    list_display = ('date', 'title', 'active')