from core.models import Driver

def run():
    print('starting script')

    Driver.objects.bulk_create([
        Driver(name='omar'),
        Driver(name='moe'),
        Driver(name='ali'),
    ])

    print('Testing query output')

    qs = Driver.objects.all()

    print(f'qs: {qs.query}')

    names = qs.values_list('name', flat=True)

    print(f'output: {names}')

    print('ending script')
