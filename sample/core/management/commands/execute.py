from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'executes the transaction'

    def handle(self, *args, **options):
        call_command('makemigrations', verbosity=0)
        call_command('migrate', verbosity=0)
        call_command('runscript', 'sample_script')
