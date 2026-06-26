from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import TransportRequest, RequestStatusEvent
from .serializers import TransportRequestDetailSerializer
from .status import ALLOWED_STATUS_TRANSITIONS
from .admin_serializers import BulkStatusUpdateSerializer
from apps.core.permissions import IsStaffOrAdmin
from apps.notifications.tasks import send_status_change_notification

class BulkStatusUpdateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    serializer_class = BulkStatusUpdateSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data['ids']
        new_status = serializer.validated_data['status']
        requests = TransportRequest.objects.filter(id__in=ids)
        updated = 0
        for req in requests:
            allowed = ALLOWED_STATUS_TRANSITIONS.get(req.status, [])
            if new_status in allowed:
                old_status = req.status
                req.status = new_status
                req.save()
                RequestStatusEvent.objects.create(
                    request=req, from_status=old_status, to_status=new_status,
                    actor=request.user if request.user.is_authenticated else None,
                )
                updated += 1
                send_status_change_notification.delay(req.id)
        return Response({'updated': updated, 'total': len(ids)})