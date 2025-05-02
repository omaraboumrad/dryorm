from django.views import generic
from django import http

from . import models
from . import forms


class SnippetDetailView(generic.DetailView):

    model = models.Snippet
    template_name = 'index.html'


def save(request):
    if request.method != 'POST':
        return http.HttpResponseNotAllowed('nope!')

    instance = models.Snippet.objects.create_snippet(
        name=request.POST.get('name'),
        code=request.POST.get('code'),
        framework=request.POST.get('framework'),
        private=request.POST.get('private') == 'on'
    )

    return http.HttpResponse(f'"{instance.slug}"')

detail = SnippetDetailView.as_view()
