from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import TransportRequest, RequestStatusEvent, RequestComment
from .serializers import TransportRequestDetailSerializer, RequestCommentSerializer
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


class AdminRequestCommentView(generics.ListCreateAPIView):
    # Admin thread: sees and posts all comments (internal + customer-visible).
    serializer_class = RequestCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

    def _request_obj(self):
        return get_object_or_404(TransportRequest, pk=self.kwargs['pk'])

    def get_queryset(self):
        return self._request_obj().comments.select_related('author')

    def perform_create(self, serializer):
        is_internal = str(self.request.data.get('is_internal', '')).lower() in ('1', 'true', 'on')
        serializer.save(request=self._request_obj(), author=self.request.user, is_internal=is_internal)