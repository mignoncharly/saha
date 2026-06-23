from django.contrib import admin
from .models import PriceRule

@admin.register(PriceRule)
class PriceRuleAdmin(admin.ModelAdmin):
    list_display = ('label', 'service_type', 'price_amount', 'currency', 'active')
    list_filter = ('service_type', 'currency', 'active')
    search_fields = ('label',)