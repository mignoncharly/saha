from rest_framework import generics, permissions

from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.core.permissions import IsStaffOrAdmin
from apps.core.pagination import StandardPagination


class AdminAuditLogListView(generics.ListAPIView):
    """Read-only, paginated audit trail for admins. Optional query filters:
    ?entity_type= ?action= ?actor= (actor matches email, case-insensitive)."""
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = AuditLog.objects.select_related('actor').order_by('-created_at')
        p = self.request.query_params
        if p.get('entity_type'):
            qs = qs.filter(entity_type=p['entity_type'])
        if p.get('action'):
            qs = qs.filter(action=p['action'])
        if p.get('actor'):
            qs = qs.filter(actor__email__icontains=p['actor'])
        return qs
