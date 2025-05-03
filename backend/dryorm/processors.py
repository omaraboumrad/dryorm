from . import constants

def extras(request):
    return {
        'executors': [constants.EXECUTOR]
    }
