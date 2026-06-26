import csv
import io
from datetime import date
from django.http import HttpResponse, JsonResponse
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import PickupSchedule, PickupRegion
from .serializers import PickupScheduleSerializer
from apps.core.permissions import IsStaffOrAdmin
from django.utils.translation import gettext as _


def _csv_cell(row, key):
    return (row.get(key) or '').strip()


def _parse_bool(value):
    return str(value or '1').strip().lower() in ('1', 'true', 'yes', 'oui')


def _parse_optional_date(value):
    value = (value or '').strip()
    if not value:
        return None
    return date.fromisoformat(value)


def _import_row_data(row, row_number, start_date=None, end_date=None, active=None):
    region_name = _csv_cell(row, 'region_name')
    cities = _csv_cell(row, 'cities')
    return {
        'row': row_number,
        'region_name': region_name,
        'cities': cities,
        'start_date': start_date.isoformat() if isinstance(start_date, date) else _csv_cell(row, 'start_date'),
        'end_date': end_date.isoformat() if isinstance(end_date, date) else (_csv_cell(row, 'end_date') or None),
        'notes': _csv_cell(row, 'notes'),
        'active': _parse_bool(row.get('active', '1')) if active is None else active,
    }


def _build_pickup_schedule_import_preview(data):
    reader = csv.DictReader(io.StringIO(data))
    existing_keys = set(
        PickupSchedule.objects.select_related('region').values_list('region__name', 'start_date')
    )
    planned_keys = set()
    to_create = []
    to_update = []
    errors = []

    for row_number, row in enumerate(reader, start=2):
        row_errors = []
        region_name = _csv_cell(row, 'region_name')
        raw_start_date = _csv_cell(row, 'start_date')

        if not region_name:
            row_errors.append(_('Region name is required.'))
        if not raw_start_date:
            row_errors.append(_('Start date is required.'))

        start_date = None
        end_date = None
        active = _parse_bool(row.get('active', '1'))
        if raw_start_date:
            try:
                start_date = date.fromisoformat(raw_start_date)
            except ValueError:
                row_errors.append(_('Start date must use YYYY-MM-DD.'))
        try:
            end_date = _parse_optional_date(row.get('end_date'))
        except ValueError:
            row_errors.append(_('End date must use YYYY-MM-DD.'))

        if row_errors:
            errors.append({
                'row': row_number,
                'messages': row_errors,
                'data': _import_row_data(row, row_number),
            })
            continue

        item = _import_row_data(row, row_number, start_date=start_date, end_date=end_date, active=active)
        key = (region_name, start_date)
        if key in existing_keys or key in planned_keys:
            to_update.append(item)
        else:
            to_create.append(item)
        planned_keys.add(key)

    return {
        'to_create': to_create,
        'to_update': to_update,
        'errors': errors,
    }

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
            return Response({'detail': _('No file provided.')}, status=400)
        try:
            data = file.read().decode('utf-8-sig')
            preview = _build_pickup_schedule_import_preview(data)
            if request.query_params.get('dry_run') in ('1', 'true', 'True'):
                return Response(preview)
            if preview['errors']:
                return Response(
                    {'detail': _('CSV contains errors.'), **preview},
                    status=400,
                )
            created = 0
            updated = 0
            with transaction.atomic():
                for row in preview['to_create'] + preview['to_update']:
                    region, _region_created = PickupRegion.objects.get_or_create(
                        name=row['region_name'],
                        defaults={'cities': row['cities']},
                    )
                    _schedule, created_flag = PickupSchedule.objects.update_or_create(
                        region=region,
                        start_date=row['start_date'],
                        defaults={
                            'cities': row['cities'],
                            'end_date': row['end_date'],
                            'notes': row['notes'],
                            'active': row['active'],
                        }
                    )
                    if created_flag:
                        created += 1
                    else:
                        updated += 1
            return Response({'created': created, 'updated': updated, **preview})
        except (UnicodeDecodeError, csv.Error, ValueError):
            return Response({'detail': _('Invalid CSV file.')}, status=400)
