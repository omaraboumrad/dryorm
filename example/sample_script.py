from django.db import connection
from core.models import Driver


def run():

    Driver.objects.bulk_create([
        Driver(name='john'),
        Driver(name='doe'),
        Driver(name='jane'),
        Driver(name='smith'),
    ])


    qs = Driver.objects.all()
    names = list(qs.values_list('name', flat=True))

    print(f'Available Drivers: {names}')
