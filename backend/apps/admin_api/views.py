from rest_framework import generics, permissions
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from apps.logistics.models import TransportRequest
from apps.notifications.models import NotificationLog, PushSubscription
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

        failed_logs_30d = NotificationLog.objects.filter(
            failed_count__gt=0, created_at__gte=thirty_days_ago
        )
        recent_failed_notifications = list(
            NotificationLog.objects.filter(failed_count__gt=0)
            .order_by('-created_at')
            .values('id', 'title', 'target_type', 'target_region', 'sent_count', 'failed_count', 'created_at')[:5]
        )

        return Response({
            'total_requests': total,
            'new_requests': new,
            'confirmed_requests': confirmed,
            'by_pickup_city': by_pickup,
            'by_destination_city': by_destination,
            'by_status': by_status,
            'requests_over_time': over_time,
            'ops': {
                'failed_notification_logs_30d': failed_logs_30d.count(),
                'failed_notifications_30d': failed_logs_30d.aggregate(total=Sum('failed_count'))['total'] or 0,
                'inactive_push_subscriptions': PushSubscription.objects.filter(active=False).count(),
                'recent_failed_notifications': recent_failed_notifications,
            },
        })
