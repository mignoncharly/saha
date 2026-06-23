from rest_framework import generics, permissions
from rest_framework.response import Response
from django.db.models import Count
from django.db.models.functions import TruncDate
from apps.logistics.models import TransportRequest
from apps.core.permissions import IsStaffOrAdmin
from django.utils import timezone
from datetime import timedelta

class DashboardStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

    def get(self, request, *args, **kwargs):
        total = TransportRequest.objects.count()
        new = TransportRequest.objects.filter(status='new').count()
        confirmed = TransportRequest.objects.filter(status='confirmed').count()
        by_pickup = list(TransportRequest.objects.values('pickup_city').annotate(count=Count('id')).order_by('-count')[:5])
        by_destination = list(TransportRequest.objects.values('destination_city__name').annotate(count=Count('id')).order_by('-count')[:5])
        by_status = list(TransportRequest.objects.values('status').annotate(count=Count('id')))

        # Requests over time (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        over_time = list(
            TransportRequest.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        return Response({
            'total_requests': total,
            'new_requests': new,
            'confirmed_requests': confirmed,
            'by_pickup_city': by_pickup,
            'by_destination_city': by_destination,
            'by_status': by_status,
            'requests_over_time': over_time,
        })