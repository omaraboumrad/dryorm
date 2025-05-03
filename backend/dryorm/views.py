from django.views import generic
from django import http

from . import models


class SnippetListView(generic.ListView):
    model = models.Snippet
    template_name = 'snippet_list.html'

    def get_queryset(self):
        return models.Snippet.objects.filter(
            private=False
        ).order_by('-created')


class SnippetDetailView(generic.DetailView):

    model = models.Snippet
    template_name = 'index.html'


def save(request):
    if request.method != 'POST':
        return http.HttpResponseNotAllowed('nope!')

    instance = models.Snippet.objects.create_snippet(
        name=request.POST.get('name'),
        code=request.POST.get('code'),
        private=request.POST.get('private') == 'true'
    )

    return http.HttpResponse(f'"{instance.slug}"')

detail = SnippetDetailView.as_view()
list_snippets = SnippetListView.as_view()
