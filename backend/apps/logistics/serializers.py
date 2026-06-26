from rest_framework import serializers
from .models import TransportRequest, TransportRequestPhoto
from apps.customers.serializers import CustomerSerializer
from apps.services.serializers import ServiceTypeSerializer
from apps.destinations.serializers import DestinationCitySerializer
from apps.uploads.validators import validate_image_extension, validate_file_size
from django.utils.translation import gettext as _

class TransportRequestPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRequestPhoto
        fields = ('id', 'image', 'uploaded_at')

class TransportRequestListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    destination_name = serializers.CharField(source='destination_city.name', read_only=True)

    class Meta:
        model = TransportRequest
        fields = ('id', 'reference_code', 'customer_name', 'pickup_city', 'destination_name', 'status', 'created_at', 'preferred_pickup_date')

class PublicTransportRequestTrackingSerializer(serializers.ModelSerializer):
    """Minimal, privacy-safe projection for anonymous tracking by reference code.

    Anyone who knows a reference code can read this, so it deliberately omits
    everything private: customer name/phone/email, the full pickup address,
    internal notes, prices, photos, and free-text description/notes. Only the
    coarse shipment progress is exposed. Keep the full
    ``TransportRequestDetailSerializer`` for admin / authenticated detail views.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)
    destination_name = serializers.CharField(source='destination_city.name', read_only=True)

    class Meta:
        model = TransportRequest
        fields = (
            'reference_code',
            'status',
            'status_display',
            'service_type_name',
            'pickup_city',
            'destination_name',
            'preferred_pickup_date',
            'created_at',
        )
        read_only_fields = fields


class CustomerTransportRequestDetailSerializer(serializers.ModelSerializer):
    """Full detail of a request for its OWNER (an authenticated customer).

    Includes the private fields the customer is entitled to see about their own
    shipment — address, prices, photos, their own notes — but NEVER the
    admin-only ``internal_notes``.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_type_name = serializers.CharField(source='service_type.name', read_only=True)
    destination_name = serializers.CharField(source='destination_city.name', read_only=True)
    photos = TransportRequestPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = TransportRequest
        fields = (
            'reference_code', 'status', 'status_display',
            'service_type_name', 'pickup_city', 'pickup_address',
            'preferred_pickup_date', 'destination_name',
            'quantity', 'dimensions', 'estimated_weight', 'description',
            'customer_notes', 'estimated_price', 'final_price',
            'photos', 'created_at', 'updated_at',
        )
        read_only_fields = fields


class TransportRequestDetailSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    service_type = ServiceTypeSerializer(read_only=True)
    destination_city = DestinationCitySerializer(read_only=True)
    photos = TransportRequestPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = TransportRequest
        fields = '__all__'

class TransportRequestCreateSerializer(serializers.ModelSerializer):
    photos = serializers.ListField(
        child=serializers.ImageField(
            max_length=None,
            allow_empty_file=False,
            use_url=True,
            validators=[validate_image_extension, validate_file_size],
        ),
        write_only=True,
        required=False,
        max_length=10,
    )

    class Meta:
        model = TransportRequest
        fields = [
            'service_type', 'pickup_city', 'pickup_address', 'preferred_pickup_date',
            'destination_city', 'quantity', 'dimensions', 'estimated_weight', 'description',
            'customer_notes', 'photos'
        ]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError(_('Quantity must be at least 1.'))
        return value

    def create(self, validated_data):
        from .reference import create_transport_request_with_reference
        photos_data = validated_data.pop('photos', [])
        # Reference code is assigned here (with collision retry), not in the view,
        # so the read-of-latest and the INSERT happen together.
        request_obj = create_transport_request_with_reference(**validated_data)
        for photo in photos_data:
            TransportRequestPhoto.objects.create(request=request_obj, image=photo)
        return request_obj

class TransportRequestStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=TransportRequest.STATUS_CHOICES)
    internal_notes = serializers.CharField(required=False, allow_blank=True)
