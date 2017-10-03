from django.db import connection
from core.models import Driver

def run():

    Driver.objects.bulk_create([
        Driver(name='omar'),
        Driver(name='moe'),
        Driver(name='ali'),
    ])


    qs = Driver.objects.all()
    names = list(qs.values_list('name', flat=True))

    print(connection.queries)
