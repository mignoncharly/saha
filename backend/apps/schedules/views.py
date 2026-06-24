from rest_framework import generics, permissions
from django.utils import timezone
from .models import PickupSchedule, LoadingDate
from .serializers import PickupScheduleSerializer, LoadingDateSerializer
from apps.core.permissions import IsStaffOrAdmin

class PickupScheduleListView(generics.ListAPIView):
    queryset = PickupSchedule.objects.filter(active=True).select_related('region').order_by('start_date')
    serializer_class = PickupScheduleSerializer
    permission_classes = []

class LoadingDateListView(generics.ListAPIView):
    serializer_class = LoadingDateSerializer
    permission_classes = []

    def get_queryset(self):
        # Public endpoint: only upcoming loadings from today onward, nearest first.
        return LoadingDate.objects.filter(
            active=True,
            date__gte=timezone.localdate(),
        ).order_by('date')

# Admin views
class AdminPickupScheduleListCreateView(generics.ListCreateAPIView):
    queryset = PickupSchedule.objects.select_related('region').all().order_by('start_date')
    serializer_class = PickupScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class AdminPickupScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PickupSchedule.objects.all()
    serializer_class = PickupScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class AdminLoadingDateListCreateView(generics.ListCreateAPIView):
    queryset = LoadingDate.objects.all().order_by('date')
    serializer_class = LoadingDateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class AdminLoadingDateDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = LoadingDate.objects.all()
    serializer_class = LoadingDateSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]