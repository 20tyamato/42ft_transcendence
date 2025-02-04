from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Create a password hash for fixtures'

    def add_arguments(self, parser):
        parser.add_argument('password', type=str)

    def handle(self, *args, **options):
        password = options['password']
        hashed = make_password(password)
        self.stdout.write(hashed)
