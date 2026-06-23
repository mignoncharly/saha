from .models import PickupRegion, PickupSchedule, LoadingDate
from datetime import date

def create_schedules():
    # Regions
    regions_data = [
        {'name': 'Frankfurt / Mainz / Darmstadt / Friedberg / Mannheim / Germersheim / Kaiserslautern', 'cities': 'Frankfurt, Mainz, Darmstadt, Friedberg, Mannheim, Germersheim, Kaiserslautern'},
        {'name': 'Strasbourg / Offenburg', 'cities': 'Strasbourg, Offenburg'},
        {'name': 'Nancy / Metz / Thionville', 'cities': 'Nancy, Metz, Thionville'},
        {'name': 'Saarland / Moselle / Luxembourg', 'cities': 'Saarland, Forbach, Luxembourg'},
        {'name': 'Stuttgart / Pforzheim / Heidelberg', 'cities': 'Stuttgart, Pforzheim, Heidelberg'},
        {'name': 'Karlsruhe / Pforzheim / Heidelberg', 'cities': 'Karlsruhe, Pforzheim, Heidelberg'},
        {'name': 'Ludwigshafen / Mannheim / Germersheim', 'cities': 'Ludwigshafen, Mannheim, Germersheim'},
    ]
    regions = {}
    for rd in regions_data:
        region, _ = PickupRegion.objects.get_or_create(name=rd['name'], defaults=rd)
        regions[region.name] = region

    # Example schedules (dates from flyer, but obviously configurable)
    example_schedules = [
        {'region': regions['Frankfurt / Mainz / Darmstadt / Friedberg / Mannheim / Germersheim / Kaiserslautern'], 'start_date': date(2026, 7, 4), 'end_date': date(2026, 7, 4)},
        {'region': regions['Strasbourg / Offenburg'], 'start_date': date(2026, 7, 5), 'end_date': date(2026, 7, 5)},
        {'region': regions['Nancy / Metz / Thionville'], 'start_date': date(2026, 7, 7), 'end_date': date(2026, 7, 7)},
        {'region': regions['Saarland / Moselle / Luxembourg'], 'start_date': date(2026, 6, 21), 'end_date': date(2026, 7, 7)},
    ]
    for sched in example_schedules:
        PickupSchedule.objects.get_or_create(
            region=sched['region'],
            start_date=sched['start_date'],
            defaults=sched
        )

    # Loading dates
    LoadingDate.objects.get_or_create(
        date=date(2026, 7, 11),
        defaults={'title': 'Prochain chargement', 'description': 'Date prévue de chargement pour le Cameroun'}
    )