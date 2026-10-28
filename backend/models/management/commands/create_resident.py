from getpass import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError


class Command(BaseCommand):
    help = "Create a resident account. The password is prompted, never passed on the command line."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("--name", default="")
        parser.add_argument("--email", default="")

    def handle(self, *args, **options):
        User = get_user_model()
        user = User(
            username=options["username"],
            first_name=options["name"],
            email=options["email"],
        )
        password = getpass("Password: ")
        if password != getpass("Confirm password: "):
            raise CommandError("Passwords do not match.")
        try:
            validate_password(password, user=user)
            user.full_clean(exclude=["password"])
            user.set_password(password)
            user.save()
        except (ValidationError, IntegrityError) as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(self.style.SUCCESS(f"Resident {user.username} created."))
