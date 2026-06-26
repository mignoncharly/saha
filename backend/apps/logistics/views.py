from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import TransportRequest
from .serializers import (
    TransportRequestListSerializer,
    TransportRequestDetailSerializer,
    TransportRequestCreateSerializer,
    TransportRequestStatusSerializer,
    PublicTransportRequestTrackingSerializer,
)
from .status import ALLOWED_STATUS_TRANSITIONS
from apps.customers.matching import resolve_customer
from apps.core.permissions import IsStaffOrAdmin
from apps.core.pagination import StandardPagination
import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from apps.notifications.tasks import send_status_change_notification
from apps.core.throttles import PublicAnonRateThrottle
from rest_framework.permissions import IsAuthenticated
from .filters import TransportRequestFilter
from django.utils.translation import gettext as _

class PublicTransportRequestCreateView(generics.CreateAPIView):
    throttle_classes = [PublicAnonRateThrottle]
    serializer_class = TransportRequestCreateSerializer
    permission_classes = []
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        # Validate consent manually
        consent = request.data.get('consent')
        if consent != 'true' and consent != True:
            return Response(
                {'consent': [_('You must agree to be contacted.')]},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Extract customer data
        full_name = request.data.get('full_name', '').strip()
        phone = request.data.get('phone', '').strip()
        whatsapp_number = request.data.get('whatsapp_number', phone).strip()
        email = request.data.get('email', '').strip()

        if not full_name:
            return Response({'full_name': [_('This field is required.')]}, status=status.HTTP_400_BAD_REQUEST)
        if not phone:
            return Response({'phone': [_('This field is required.')]}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve the customer: normalized-phone matching, authenticated users
        # attach to their own profile, and anonymous submissions never overwrite
        # an existing customer's identity (only fill blanks).
        customer = resolve_customer(
            user=request.user,
            full_name=full_name,
            phone=phone,
            whatsapp_number=whatsapp_number,
            email=email,
            language=request.LANGUAGE_CODE,
        )

        # Now proceed with standard creation. The reference code is assigned
        # (race-safe, with retry) inside the serializer's create(), so we read it
        # back off the saved instance for the response.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer, customer=customer)
        ref = serializer.instance.reference_code
        headers = self.get_success_headers(serializer.data)
        return Response(
            {**serializer.data, 'reference_code': ref},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    def perform_create(self, serializer, customer=None):
        # Photos and the reference code are persisted by the serializer's
        # create(); we only need to attach the customer here.
        return serializer.save(customer=customer)

class PublicTransportRequestDetailView(generics.RetrieveAPIView):
    # Anonymous tracking by reference code. Uses the minimal privacy-safe
    # serializer so a leaked/guessed reference never exposes customer PII,
    # addresses, internal notes, prices, or photos.
    queryset = TransportRequest.objects.select_related('service_type', 'destination_city')
    serializer_class = PublicTransportRequestTrackingSerializer
    permission_classes = []
    lookup_field = 'reference_code'
    lookup_url_kwarg = 'reference_code'

class AdminTransportRequestListView(generics.ListAPIView):
    serializer_class = TransportRequestListSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    pagination_class = StandardPagination
    filterset_class = TransportRequestFilter
    search_fields = ['reference_code', 'customer__full_name', 'pickup_city']
    ordering_fields = ['created_at', 'preferred_pickup_date', 'status']

    def get_queryset(self):
        return TransportRequest.objects.select_related('customer', 'destination_city').all()

class AdminTransportRequestDetailView(generics.RetrieveUpdateAPIView):
    queryset = TransportRequest.objects.all()
    serializer_class = TransportRequestDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class AdminTransportRequestStatusUpdateView(generics.UpdateAPIView):
    serializer_class = TransportRequestStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    queryset = TransportRequest.objects.all()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']
        allowed = ALLOWED_STATUS_TRANSITIONS.get(instance.status, [])
        if new_status not in allowed:
            return Response(
                {'detail': _('Transition from %(current)s to %(new)s is not allowed.') % {
                    'current': instance.status,
                    'new': new_status,
                }},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.status = new_status
        if serializer.validated_data.get('internal_notes'):
            instance.internal_notes = serializer.validated_data['internal_notes']
        instance.save()
        # Trigger push notification (async)
        send_status_change_notification.delay(instance.id)
        return Response(TransportRequestDetailSerializer(instance).data)
    

class AdminTransportRequestExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

    def get(self, request, *args, **kwargs):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="requests.csv"'
        writer = csv.writer(response)
        writer.writerow([
            _('Reference'), _('Customer'), _('Phone'), _('Pickup city'),
            _('Destination'), _('Status'), _('Created at'),
        ])
        qs = TransportRequest.objects.select_related('customer', 'destination_city').all()
        for req in qs:
            writer.writerow([
                req.reference_code,
                req.customer.full_name if req.customer else '',
                req.customer.phone if req.customer else '',
                req.pickup_city,
                req.destination_city.name if req.destination_city else '',
                req.get_status_display(),
                req.created_at.strftime('%Y-%m-%d %H:%M'),
            ])
        return response
    

class CustomerRequestListView(generics.ListAPIView):
    serializer_class = TransportRequestListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        customer = getattr(self.request.user, 'customer_profile', None)
        if not customer:
            return TransportRequest.objects.none()
        return TransportRequest.objects.filter(customer=customer)
