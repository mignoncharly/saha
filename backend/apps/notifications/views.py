from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.conf import settings
from .models import PushSubscription, NotificationLog
from .serializers import PushSubscriptionSerializer, BroadcastSerializer
from .tasks import send_broadcast_notification
from apps.core.permissions import IsStaffOrAdmin

class PushSubscriptionCreateView(generics.CreateAPIView):
    serializer_class = PushSubscriptionSerializer
    permission_classes = []

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
        return Response({'detail': 'Notification envoyée en arrière-plan.', 'log_id': log.id}, status=status.HTTP_201_CREATED)