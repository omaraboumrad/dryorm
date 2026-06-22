from django.views import generic
from django import http
import os
import hashlib
import tomllib
import re
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

import event_monitoring

from . import models
from . import templates
from . import constants
from . import databases
from .github_service import ref_service, RefNotFoundError, RefFetchError
from . import tasks


# Map dryorm's internal job-* result events to dashboard event names.
EXECUTION_EVENTS = {
    constants.JOB_DONE_EVENT: "snippet_executed",
    constants.JOB_CODE_ERROR_EVENT: "snippet_failed",
    constants.JOB_TIMEOUT_EVENT: "worker_timeout",
    constants.JOB_OOM_KILLED_EVENT: "worker_oom",
    constants.JOB_OVERLOADED: "system_overloaded",
    constants.JOB_NETWORK_DISABLED_EVENT: "network_blocked",
    constants.JOB_IMAGE_NOT_FOUND_ERROR_EVENT: "executor_missing",
    constants.JOB_INTERNAL_ERROR_EVENT: "execution_error",
}


def _emit_execution(code, database, result, url=None, **extra):
    """Report one code execution to the monitoring dashboard (opt-in, best-effort)."""
    job_event = result.get("event")
    payload = {"database": database, "job_event": job_event, "code": code, **extra}
    if result.get("error"):
        payload["error"] = str(result["error"])
    event_monitoring.emit(
        EXECUTION_EVENTS.get(job_event, "execution_error"),
        entity_type="execution",
        entity_id=hashlib.md5((code or "").encode("utf-8")).hexdigest()[:12],
        url=url,
        payload=payload,
    )


class ReactHomeView(generic.TemplateView):
    """Serves the React frontend."""
    template_name = "index.html"


@csrf_exempt
def save(request):
    if request.method != "POST":
        return http.HttpResponseNotAllowed("nope!")

    # Parse JSON body
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return http.HttpResponseBadRequest("Invalid JSON")

    # Ensure session exists for ownership tracking
    if not request.session.session_key:
        request.session.create()

    session_key = request.session.session_key

    # Get version info - either orm_version or ref_type+ref_id+sha
    orm_version = data.get("orm_version")
    ref_type = data.get("ref_type")
    ref_id = data.get("ref_id")
    sha = data.get("sha") or data.get("ref_sha")  # Support both field names

    # Backwards compatibility: convert old django_version to new orm_version format
    if not orm_version and not ref_type:
        django_version = data.get("django_version", "5.2.8")
        orm_version = f"django-{django_version}"

    # Check if this is an update (slug provided)
    slug = data.get("slug")
    if slug:
        try:
            snippet = models.Snippet.objects.get(slug=slug)
            # Verify ownership
            if snippet.session_key != session_key:
                return JsonResponse({"error": "Not authorized to update this snippet"}, status=403)

            # Update existing snippet
            snippet.code = data.get("code", snippet.code)
            snippet.name = data.get("name", snippet.name)
            snippet.database = data.get("database", snippet.database)
            snippet.private = data.get("private") is True
            snippet.orm_version = orm_version
            snippet.ref_type = ref_type
            snippet.ref_id = ref_id
            snippet.sha = sha
            snippet.save()
            event_monitoring.emit(
                "snippet_updated",
                entity_type="snippet",
                entity_id=snippet.pk,
                actor_id=session_key,
                url=request.build_absolute_uri(f"/{snippet.slug}"),
                payload={"name": snippet.name, "database": snippet.database},
            )
            return JsonResponse({"slug": snippet.slug, "updated": True})
        except models.Snippet.DoesNotExist:
            return JsonResponse({"error": "Snippet not found"}, status=404)

    # Create new snippet with session_key
    instance = models.Snippet.objects.create_snippet(
        name=data.get("name"),
        code=data.get("code"),
        database=data.get("database"),
        private=data.get("private") is True,
        orm_version=orm_version,
        ref_type=ref_type,
        ref_id=ref_id,
        sha=sha,
        session_key=session_key,
    )

    event_monitoring.emit(
        "snippet_created",
        entity_type="snippet",
        entity_id=instance.pk,
        actor_id=session_key,
        url=request.build_absolute_uri(f"/{instance.slug}"),
        payload={
            "name": instance.name,
            "database": instance.database,
            "orm_version": orm_version,
            "private": data.get("private") is True,
        },
    )

    return JsonResponse({"slug": instance.slug})


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

    # Check if current session owns this snippet
    session_key = request.session.session_key
    is_owner = bool(snippet.session_key and session_key and snippet.session_key == session_key)

    data = {
        "code": snippet.code,
        "database": snippet.database,
        "ormVersion": snippet.orm_version,
        "name": snippet.name,
        "slug": snippet.slug,
        "isOwner": is_owner,
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

    code = None
    database = "sqlite"
    source_url = request.headers.get("Referer")
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

        _emit_execution(code, database, result, url=source_url, orm_version=orm_version,
                        ref_type=ref_type, ref_id=ref_id)
        return JsonResponse(result)

    except json.JSONDecodeError:
        return JsonResponse(
            {"event": constants.JOB_CODE_ERROR_EVENT, "error": "Invalid JSON"},
            status=400
        )
    except Exception as e:
        _emit_execution(code, database,
                        {"event": constants.JOB_INTERNAL_ERROR_EVENT, "error": str(e)},
                        url=source_url)
        return JsonResponse(
            {"event": constants.JOB_INTERNAL_ERROR_EVENT, "error": str(e)},
            status=500
        )


# View instance
react_home = ReactHomeView.as_view()
