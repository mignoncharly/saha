from rest_framework import generics, permissions
from .models import ServiceType
from .serializers import ServiceTypeSerializer, AdminServiceTypeSerializer
from apps.core.permissions import IsStaffOrAdmin

class ServiceTypeListView(generics.ListAPIView):
    queryset = ServiceType.objects.filter(active=True)
    serializer_class = ServiceTypeSerializer
    permission_classes = []

# Admin views — use the admin serializer so active/sort_order persist.
class AdminServiceTypeListCreateView(generics.ListCreateAPIView):
    queryset = ServiceType.objects.all()
    serializer_class = AdminServiceTypeSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class AdminServiceTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ServiceType.objects.all()
    serializer_class = AdminServiceTypeSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]