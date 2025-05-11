from django.views import generic
from django import http
from django.http import JsonResponse

from . import models
from . import templates
from . import constants
from . import databases


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

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['databases'] = databases.DATABASES
        context['templates'] = templates.TEMPLATES
        context['first'] = templates.TEMPLATES['basic']
        return context


class SnippetHomeView(generic.TemplateView):
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['databases'] = databases.DATABASES
        context['templates'] = templates.TEMPLATES
        context['first'] = templates.TEMPLATES['basic']
        return context


class AboutView(generic.TemplateView):
    template_name = 'about.html'


def save(request):
    if request.method != 'POST':
        return http.HttpResponseNotAllowed('nope!')

    instance = models.Snippet.objects.create_snippet(
        name=request.POST.get('name'),
        code=request.POST.get('code'),
        database=request.POST.get('database'),
        private=request.POST.get('private') == 'true'
    )

    return http.HttpResponse(f'"{instance.slug}"')


# Define templates as a dictionary

home = SnippetHomeView.as_view()
about = AboutView.as_view()
detail = SnippetDetailView.as_view()
list_snippets = SnippetListView.as_view()
