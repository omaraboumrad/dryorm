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

    form = forms.SnippetForm(request.POST)

    if form.is_valid():
        instance = form.save()
        return http.HttpResponse(f'"{instance.pk}"')


detail = SnippetDetailView.as_view()
