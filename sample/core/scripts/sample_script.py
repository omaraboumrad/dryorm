from core.models import Question

def run():
    print('starting script')
    print(Question.objects.all())
    print('ending script')
