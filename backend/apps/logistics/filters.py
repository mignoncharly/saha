import django_filters
from .models import TransportRequest

class TransportRequestFilter(django_filters.FilterSet):
    status = django_filters.MultipleChoiceFilter(
        field_name='status', choices=TransportRequest.STATUS_CHOICES
    )
    pickup_city = django_filters.CharFilter(field_name='pickup_city', lookup_expr='icontains')
    destination_city = django_filters.NumberFilter(field_name='destination_city_id')
    service_type = django_filters.NumberFilter(field_name='service_type_id')
    preferred_pickup_date_gte = django_filters.DateFilter(field_name='preferred_pickup_date', lookup_expr='gte')
    preferred_pickup_date_lte = django_filters.DateFilter(field_name='preferred_pickup_date', lookup_expr='lte')
    created_at_gte = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_at_lte = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = TransportRequest
        fields = [
            'status', 'pickup_city', 'destination_city', 'service_type',
            'preferred_pickup_date_gte', 'preferred_pickup_date_lte',
            'created_at_gte', 'created_at_lte',
        ]