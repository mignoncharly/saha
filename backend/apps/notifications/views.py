from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.conf import settings
from .models import PushSubscription, NotificationLog, CustomerNotification, NotificationPreference
from .serializers import (
    PushSubscriptionSerializer,
    BroadcastSerializer,
    CustomerNotificationSerializer,
    NotificationPreferenceSerializer,
)
from .tasks import send_broadcast_notification
from apps.core.permissions import IsStaffOrAdmin
from apps.core.throttles import PushSubscriptionThrottle
from django.utils.translation import gettext as _


def _customer_of(request):
    """Return the customer profile linked to the request user, or None."""
    user = request.user
    return getattr(user, 'customer_profile', None) if user.is_authenticated else None

class PushSubscriptionCreateView(generics.CreateAPIView):
    serializer_class = PushSubscriptionSerializer
    permission_classes = []
    throttle_classes = [PushSubscriptionThrottle]

    def perform_create(self, serializer):
        # Link the subscription to the authenticated customer so that
        # per-request status notifications can target them later.
        customer = None
        user = self.request.user
        if user.is_authenticated:
            customer = getattr(user, 'customer_profile', None)
        serializer.save(customer=customer)

class VapidPublicKeyView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({'public_key': settings.VAPID_PUBLIC_KEY})

# Admin broadcast
class AdminBroadcastView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    serializer_class = BroadcastSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        log = NotificationLog.objects.create(
            title=data['title'],
            body=data['body'],
            target_type=data.get('target_type', 'all'),
            target_region=data.get('target_region', ''),
        )
        send_broadcast_notification.delay(log.id)
        return Response({'detail': _('Notification is being sent in the background.'), 'log_id': log.id}, status=status.HTTP_201_CREATED)


# ---- Customer notification center ----

class CustomerNotificationListView(APIView):
    """History of the logged-in customer's notifications + unread count."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        customer = _customer_of(request)
        if not customer:
            return Response({'unread': 0, 'results': []})
        qs = customer.notifications.all()[:50]
        unread = customer.notifications.filter(read=False).count()
        return Response({
            'unread': unread,
            'results': CustomerNotificationSerializer(qs, many=True).data,
        })


class CustomerNotificationUnreadCountView(APIView):
    """Lightweight unread count for the navbar badge."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        customer = _customer_of(request)
        unread = customer.notifications.filter(read=False).count() if customer else 0
        return Response({'unread': unread})


class CustomerNotificationMarkReadView(APIView):
    """Mark notifications as read. Optional body {"ids": [...]}; defaults to all."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        customer = _customer_of(request)
        if not customer:
            return Response({'unread': 0})
        qs = customer.notifications.filter(read=False)
        ids = request.data.get('ids')
        if ids:
            qs = qs.filter(id__in=ids)
        qs.update(read=True)
        return Response({'unread': customer.notifications.filter(read=False).count()})


class NotificationPreferenceView(APIView):
    """Get or update the logged-in customer's notification preferences."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        customer = _customer_of(request)
        if not customer:
            return Response({'detail': _('No customer profile found.')}, status=status.HTTP_404_NOT_FOUND)
        pref, created = NotificationPreference.objects.get_or_create(customer=customer)
        return Response(NotificationPreferenceSerializer(pref).data)

    def put(self, request):
        customer = _customer_of(request)
        if not customer:
            return Response({'detail': _('No customer profile found.')}, status=status.HTTP_404_NOT_FOUND)
        pref, created = NotificationPreference.objects.get_or_create(customer=customer)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
