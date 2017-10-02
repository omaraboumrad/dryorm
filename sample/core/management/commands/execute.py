import os
import sys

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'executes the transaction'

    def handle(self, *args, **options):

        # Quick hack, it sucks, figure out a better way.
        stdout_backup, sys.stdout = sys.stdout, open(os.devnull, 'a')
        call_command('makemigrations')
        call_command('migrate')

        sys.stdout = stdout_backup
        call_command('runscript', 'sample_script')
