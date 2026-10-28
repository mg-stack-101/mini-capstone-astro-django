from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from services.demo import seed_demo


class Command(BaseCommand):
    help = "Create development accounts and six sample complaints with demo photos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-passwords",
            action="store_true",
            help="Reset passwords only for matching existing demo accounts.",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "Demo seeding requires DJANGO_DEBUG=True. Do not use demo credentials in production."
            )
        try:
            count = seed_demo(reset_passwords=options["reset_passwords"])
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(
            self.style.SUCCESS(
                f"Demo accounts ready. Created {count} complaints; existing demo records were preserved."
            )
        )
        self.stdout.write(
            "See SUPABASE_SETUP.md for credentials. Existing passwords are retained unless --reset-passwords is specified."
        )
