from django.views import generic
from django import http
import os
import tomllib
import re
from django.conf import settings

from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from . import models
from . import templates
from . import constants
from . import databases
import tasks


class SnippetListView(generic.ListView):
    model = models.Snippet
    template_name = "snippet_list.html"
    paginate_by = 20

    def get_queryset(self):
        q = self.request.GET.get("q")
        qs_filter = Q(private=False)

        if q:
            qs_filter &= Q(name__icontains=q) | Q(code__icontains=q)

        return super().get_queryset().filter(qs_filter).order_by("-created")

    def get_template_names(self):
        if self.request.headers.get("HX-Request") == "true":
            return ["components/snippets.html"]
        return [self.template_name]


class SnippetDetailView(generic.DetailView):
    model = models.Snippet
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["databases"] = databases.DATABASES
        context["orm_versions"] = constants.ORM_VERSIONS
        context["templates"] = templates.EXECUTOR_TEMPLATES
        context["first"] = templates.EXECUTOR_TEMPLATES["django"]["basic"]
        context["journeys"] = {}
        return context


class SnippetHomeView(generic.TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["databases"] = databases.DATABASES
        context["orm_versions"] = constants.ORM_VERSIONS
        context["templates"] = templates.EXECUTOR_TEMPLATES
        context["first"] = templates.EXECUTOR_TEMPLATES["django"]["basic"]
        # Only load journeys if this is a journey URL
        if self.request.path.startswith('/j/'):
            context["journeys"] = load_journeys()
        else:
            context["journeys"] = {}
        return context


class AboutView(generic.TemplateView):
    template_name = "about.html"


def save(request):
    if request.method != "POST":
        return http.HttpResponseNotAllowed("nope!")

    instance = models.Snippet.objects.create_snippet(
        name=request.POST.get("name"),
        code=request.POST.get("code"),
        database=request.POST.get("database"),
        private=request.POST.get("private") == "true",
        django_version=request.POST.get("django_version", "5.2.8"),
    )

    return http.HttpResponse(f'"{instance.slug}"')


def slugify(text):
    """Convert text to a URL-friendly slug."""
    # Remove or replace special characters, convert to lowercase
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    # Replace spaces and multiple dashes with single dashes
    slug = re.sub(r'[-\s]+', '-', slug)
    # Strip leading/trailing dashes
    return slug.strip('-')

def load_journeys():
    journeys_path = os.path.join(settings.BASE_DIR, 'data', 'journeys')
    journeys_list = []
    
    if os.path.exists(journeys_path):
        for filename in os.listdir(journeys_path):
            if filename.endswith('.toml'):
                file_path = os.path.join(journeys_path, filename)
                try:
                    with open(file_path, 'rb') as f:
                        journey_data = tomllib.load(f)
                    
                    slug = filename[:-5]  # Remove .toml extension
                    journey = {
                        'title': journey_data.get('title', slug),
                        'slug': slug,
                        'chapters': journey_data.get('chapters', []),
                        'order': journey_data.get('order', 999)  # Default to high number if no order
                    }
                    
                    # Add slugs to chapters based on their titles
                    for chapter in journey['chapters']:
                        chapter['slug'] = slugify(chapter['title'])
                    
                    journeys_list.append(journey)
                        
                except Exception as e:
                    print(f"Error loading journey {filename}: {e}")
    
    # Sort by order field and convert to dict
    journeys_list.sort(key=lambda x: x['order'])
    journeys = {journey['slug']: journey for journey in journeys_list}
    
    return journeys


def journeys_api(request):
    if request.method != "GET":
        return http.HttpResponseNotAllowed(["GET"])

    journeys = load_journeys()
    return JsonResponse(journeys)


@csrf_exempt
def execute(request):
    """HTTP endpoint for executing ORM snippets synchronously."""
    if request.method != "POST":
        return http.HttpResponseNotAllowed(["POST"])

    try:
        payload = json.loads(request.body)
        code = payload.get("code")
        database = payload.get("database", "sqlite")
        orm_version = payload.get("orm_version", "django-5.2.8")
        ignore_cache = payload.get("ignore_cache", False)

        if not code:
            return JsonResponse(
                {"event": constants.JOB_CODE_ERROR_EVENT, "error": "No code provided"},
                status=400
            )

        # Execute the task synchronously
        result = tasks.run_django_sync(code, database, ignore_cache, orm_version)
        return JsonResponse(result)

    except json.JSONDecodeError:
        return JsonResponse(
            {"event": constants.JOB_CODE_ERROR_EVENT, "error": "Invalid JSON"},
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {"event": constants.JOB_INTERNAL_ERROR_EVENT, "error": str(e)},
            status=500
        )


# Define templates as a dictionary

home = SnippetHomeView.as_view()
about = AboutView.as_view()
detail = SnippetDetailView.as_view()
list_snippets = SnippetListView.as_view()
