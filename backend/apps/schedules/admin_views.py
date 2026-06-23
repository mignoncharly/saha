import csv
import io
from django.http import HttpResponse, JsonResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import PickupSchedule, PickupRegion
from .serializers import PickupScheduleSerializer
from apps.core.permissions import IsStaffOrAdmin

class ExportPickupSchedulesCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pickup_schedules.csv"'
        writer = csv.writer(response)
        writer.writerow(['region_name', 'cities', 'start_date', 'end_date', 'notes', 'active'])
        schedules = PickupSchedule.objects.select_related('region').all()
        for s in schedules:
            writer.writerow([s.region.name if s.region else '', s.cities, s.start_date, s.end_date or '', s.notes, '1' if s.active else '0'])
        return response

class ImportPickupSchedulesView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'Aucun fichier fourni'}, status=400)
        try:
            data = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(data))
            created = 0
            updated = 0
            for row in reader:
                region_name = row.get('region_name', '').strip()
                cities = row.get('cities', '').strip()
                start_date = row.get('start_date', '').strip()
                end_date = row.get('end_date', '').strip() or None
                notes = row.get('notes', '').strip()
                active = row.get('active', '1').strip() in ('1', 'true', 'True')
                if not region_name or not start_date:
                    continue
                region, _ = PickupRegion.objects.get_or_create(name=region_name, defaults={'cities': cities})
                schedule, created_flag = PickupSchedule.objects.update_or_create(
                    region=region,
                    start_date=start_date,
                    defaults={
                        'cities': cities,
                        'end_date': end_date if end_date else None,
                        'notes': notes,
                        'active': active,
                    }
                )
                if created_flag:
                    created += 1
                else:
                    updated += 1
            return Response({'created': created, 'updated': updated})
        except Exception as e:
            return Response({'detail': str(e)}, status=400)