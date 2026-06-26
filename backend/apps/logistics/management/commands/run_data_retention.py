from django.conf import settings
from django.core.management.base import BaseCommand

from apps.logistics.retention import run_data_retention


class Command(BaseCommand):
    help = "Run the data-retention workflow for old terminal transport requests."

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=None, help="Override DATA_RETENTION_DAYS.")
        parser.add_argument("--apply", action="store_true", help="Delete/anonymize data. Defaults to dry-run.")
        parser.add_argument(
            "--anonymize-customers",
            action="store_true",
            help="Also anonymize eligible customer PII for customers with no active/recent requests.",
        )

    def handle(self, *args, **options):
        anonymize = options["anonymize_customers"] or getattr(settings, "DATA_RETENTION_ANONYMIZE_CUSTOMERS", False)
        result = run_data_retention(
            days=options["days"],
            apply=options["apply"],
            anonymize_customers=anonymize,
        )
        mode = "applied" if options["apply"] else "dry-run"
        self.stdout.write(self.style.SUCCESS(f"Data retention {mode}: {result}"))
