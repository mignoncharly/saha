from django.core.management.base import BaseCommand
from apps.services.seed_data import create_services
from apps.pricing.seed_data import create_pricing
from apps.schedules.seed_data import create_schedules
from apps.destinations.seed_data import create_destinations

class Command(BaseCommand):
    help = 'Seeds initial data from business flyers'

    def handle(self, *args, **options):
        self.stdout.write('Creating services...')
        create_services()
        self.stdout.write('Creating pricing...')
        create_pricing()
        self.stdout.write('Creating schedules and loading dates...')
        create_schedules()
        self.stdout.write('Creating destinations...')
        create_destinations()
        self.stdout.write('Seed complete.')