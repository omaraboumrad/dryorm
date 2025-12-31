from django.urls import path, re_path

from . import views

urlpatterns = [
    # API endpoints
    path("api/config", views.config_api, name="config_api"),
    path("api/journeys", views.journeys_api, name="journeys_api"),
    path("api/snippets", views.snippets_api, name="snippets_api"),
    path("api/snippet/<slug:slug>", views.snippet_api, name="snippet_api"),
    path("api/journey/<slug:journey_slug>/<slug:chapter_slug>", views.journey_chapter_api, name="journey_chapter_api"),
    # Backend endpoints
    path("save", views.save, name="save"),
    path("execute", views.execute, name="execute"),
    path("fetch-pr", views.fetch_pr, name="fetch_pr"),
    path("search-refs", views.search_refs, name="search_refs"),
    # React SPA catch-all - serves index.html for all other routes
    re_path(r"^.*$", views.react_home, name="react_catchall"),
]
