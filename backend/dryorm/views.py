from django.views import generic
from django import http
import os
import tomllib
import re
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

from . import models
from . import templates
from . import constants
from . import databases
from .pr_service import ref_service, RefNotFoundError, RefFetchError, pr_service, PRNotFoundError, PRFetchError
import tasks


class ReactHomeView(generic.TemplateView):
    """Serves the React frontend."""
    template_name = "index.html"


def save(request):
    if request.method != "POST":
        return http.HttpResponseNotAllowed("nope!")

    # Get version info - either orm_version or ref_type+ref_id+sha
    orm_version = request.POST.get("orm_version")
    ref_type = request.POST.get("ref_type")
    ref_id = request.POST.get("ref_id")
    sha = request.POST.get("sha")

    # Backwards compatibility: convert old django_version to new orm_version format
    if not orm_version and not ref_type:
        django_version = request.POST.get("django_version", "5.2.8")
        orm_version = f"django-{django_version}"

    instance = models.Snippet.objects.create_snippet(
        name=request.POST.get("name"),
        code=request.POST.get("code"),
        database=request.POST.get("database"),
        private=request.POST.get("private") == "true",
        orm_version=orm_version,
        ref_type=ref_type,
        ref_id=ref_id,
        sha=sha,
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


def config_api(request):
    """API endpoint to return app configuration for the React frontend."""
    if request.method != "GET":
        return http.HttpResponseNotAllowed(["GET"])

    # Build databases list
    databases_list = [
        {"value": key, "label": db.description}
        for key, db in databases.DATABASES.items()
    ]

    # Build ORM versions list
    orm_versions_list = [
        {"value": key, "label": version.description}
        for key, version in constants.ORM_VERSIONS.items()
    ]

    # Build templates grouped by ORM type
    templates_grouped = {}
    for orm_type, orm_templates in templates.EXECUTOR_TEMPLATES.items():
        templates_grouped[orm_type] = [
            {"value": name, "label": name.title(), "code": code}
            for name, code in orm_templates.items()
        ]

    return JsonResponse({
        "databases": databases_list,
        "ormVersions": orm_versions_list,
        "templates": templates_grouped,
    })


def snippets_api(request):
    """API endpoint to list public snippets."""
    if request.method != "GET":
        return http.HttpResponseNotAllowed(["GET"])

    query = request.GET.get("q", "").strip()
    page = int(request.GET.get("page", 1))
    per_page = 20

    snippets = models.Snippet.objects.filter(private=False).order_by("-created")

    if query:
        from django.db.models import Q
        snippets = snippets.filter(Q(name__icontains=query) | Q(code__icontains=query))

    total = snippets.count()
    total_pages = (total + per_page - 1) // per_page
    snippets = snippets[(page - 1) * per_page : page * per_page]

    from django.utils.timesince import timesince

    return JsonResponse({
        "snippets": [
            {
                "slug": s.slug,
                "name": s.name,
                "database": s.database,
                "orm_version": s.orm_version,
                "ref_type": s.ref_type,
                "ref_id": s.ref_id,
                "sha": s.sha,
                "created": timesince(s.created),
            }
            for s in snippets
        ],
        "pagination": {
            "page": page,
            "totalPages": total_pages,
            "total": total,
        }
    })


def snippet_api(request, slug):
    """API endpoint to return snippet data for loading."""
    if request.method != "GET":
        return http.HttpResponseNotAllowed(["GET"])

    try:
        snippet = models.Snippet.objects.get(slug=slug)
    except models.Snippet.DoesNotExist:
        return JsonResponse({"error": "Snippet not found"}, status=404)

    data = {
        "code": snippet.code,
        "database": snippet.database,
        "ormVersion": snippet.orm_version,
        "name": snippet.name,
    }

    # Add ref info if present
    if snippet.ref_type:
        data["refInfo"] = {
            "type": snippet.ref_type,
            "id": snippet.ref_id,
            "sha": snippet.sha,
        }

    return JsonResponse(data)


def journey_chapter_api(request, journey_slug, chapter_slug):
    """API endpoint to return a specific journey chapter's code."""
    if request.method != "GET":
        return http.HttpResponseNotAllowed(["GET"])

    journeys = load_journeys()

    if journey_slug not in journeys:
        return JsonResponse({"error": "Journey not found"}, status=404)

    journey = journeys[journey_slug]
    chapters = journey.get("chapters", [])

    # Find the chapter by slug
    chapter = None
    for ch in chapters:
        if ch.get("slug") == chapter_slug:
            chapter = ch
            break

    if not chapter:
        return JsonResponse({"error": "Chapter not found"}, status=404)

    return JsonResponse({
        "code": chapter.get("content", "") or chapter.get("code", ""),
        "title": chapter.get("title", ""),
        "description": chapter.get("description", ""),
    })


@csrf_exempt
def fetch_ref(request):
    """HTTP endpoint for fetching and caching a Django ref (PR, branch, or tag) from GitHub."""
    if request.method != "POST":
        return http.HttpResponseNotAllowed(["POST"])

    try:
        payload = json.loads(request.body)
        ref_type = payload.get("ref_type", "pr")  # pr, branch, or tag
        ref_id = payload.get("ref_id")

        # Backwards compatibility: support pr_id for PR type
        if not ref_id and ref_type == "pr":
            ref_id = payload.get("pr_id")

        if not ref_id:
            return JsonResponse(
                {"success": False, "error": f"No {ref_type} ID provided"},
                status=400
            )

        # Validate PR ID is a number
        if ref_type == "pr":
            try:
                ref_id = str(int(ref_id))
            except (ValueError, TypeError):
                return JsonResponse(
                    {"success": False, "error": "PR ID must be a number"},
                    status=400
                )

        # Check if ref is already cached
        cached_ref = ref_service.get_cached_ref(ref_type, ref_id)
        was_cached = cached_ref is not None

        # Fetch (and cache if needed) the ref
        ref_info = ref_service.fetch_ref(ref_type, ref_id)

        return JsonResponse({
            "success": True,
            "ref": {
                "type": ref_info.ref_type,
                "id": ref_info.ref_id,
                "title": ref_info.title,
                "sha": ref_info.sha,
                "state": ref_info.state,
                "author": ref_info.author,
                "cached": was_cached,
            }
        })

    except RefNotFoundError as e:
        return JsonResponse(
            {"success": False, "error": str(e)},
            status=404
        )
    except RefFetchError as e:
        return JsonResponse(
            {"success": False, "error": str(e)},
            status=500
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {"success": False, "error": "Invalid JSON"},
            status=400
        )


# Backwards compatibility alias
fetch_pr = fetch_ref


@csrf_exempt
def search_refs(request):
    """HTTP endpoint for searching Django refs (PRs, branches, tags)."""
    if request.method != "GET":
        return http.HttpResponseNotAllowed(["GET"])

    ref_type = request.GET.get("type", "pr")
    query = request.GET.get("q", "").strip()

    if not query:
        return JsonResponse({"results": []})

    try:
        if ref_type == "pr":
            results = ref_service.search_prs(query)
        elif ref_type == "branch":
            results = ref_service.search_branches(query)
        elif ref_type == "tag":
            results = ref_service.search_tags(query)
        else:
            return JsonResponse({"error": "Invalid ref type"}, status=400)

        return JsonResponse({"results": results})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


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

        # Ref mode (PR, branch, or tag)
        ref_type = payload.get("ref_type")  # pr, branch, or tag
        ref_id = payload.get("ref_id")
        ref_sha = payload.get("ref_sha")  # Specific SHA to use
        print(f"[DEBUG] Received: ref_type={ref_type}, ref_id={ref_id}, ref_sha={ref_sha}")

        # Backwards compatibility: support pr_id
        if not ref_type and payload.get("pr_id"):
            ref_type = "pr"
            ref_id = str(payload.get("pr_id"))

        if not code:
            return JsonResponse(
                {"event": constants.JOB_CODE_ERROR_EVENT, "error": "No code provided"},
                status=400
            )

        # Execute the task synchronously
        if ref_type and ref_id:
            # Ref mode - get cached ref info and pass to executor
            try:
                ref_info = None
                # If a specific SHA is requested, check if that exact SHA is cached
                if ref_sha:
                    ref_info = ref_service.get_cached_ref_by_sha(ref_type, ref_id, ref_sha)
                    print(f"[DEBUG] get_cached_ref_by_sha({ref_type}, {ref_id}, {ref_sha}) -> {ref_info}")
                else:
                    # No SHA specified (old snippet) - use any cached version
                    ref_info = ref_service.get_cached_ref(ref_type, ref_id)
                    print(f"[DEBUG] get_cached_ref({ref_type}, {ref_id}) -> {ref_info}")

                if not ref_info:
                    # Fetch the ref (will use current SHA from GitHub)
                    print(f"[DEBUG] Worktree not cached, fetching fresh...")
                    ref_info = ref_service.fetch_ref(ref_type, ref_id)
                    print(f"[DEBUG] Fetched ref_info.sha = {ref_info.sha}")

                # Normalize SHA to 12 chars for cache key consistency
                # (worktree directories use sha[:12], so cache keys should too)
                raw_sha = ref_sha if ref_sha else ref_info.sha
                execution_sha = raw_sha[:12]
                print(f"[DEBUG] execution_sha = {execution_sha}, ref_info.host_path = {ref_info.host_path}")
                result = tasks.run_django_ref_sync(
                    code, database, ignore_cache, ref_type, ref_id, execution_sha, ref_info.host_path
                )
            except (RefNotFoundError, RefFetchError) as e:
                return JsonResponse(
                    {"event": constants.JOB_CODE_ERROR_EVENT, "error": str(e)},
                    status=400
                )
        else:
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


# View instance
react_home = ReactHomeView.as_view()
