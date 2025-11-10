from . import constants


def extras(request):
    # Return all unique executors
    executors = list(constants.EXECUTORS.values())
    return {"executors": executors}
