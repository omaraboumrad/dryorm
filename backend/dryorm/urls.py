from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path("", views.home, name="index"),
    path("about", views.about, name="about"),
    path("browse", views.list_snippets, name="list"),
    path("save", views.save, name="save"),
    path("execute", views.execute, name="execute"),
    path("fetch-pr", views.fetch_pr, name="fetch_pr"),
    path("search-refs", views.search_refs, name="search_refs"),
    # API endpoints for React frontend
    path("api/config", views.config_api, name="config_api"),
    path("api/journeys", views.journeys_api, name="journeys_api"),
    path("api/snippet/<slug:slug>", views.snippet_api, name="snippet_api"),
    path("api/journey/<slug:journey_slug>/<slug:chapter_slug>", views.journey_chapter_api, name="journey_chapter_api"),
    # React frontend routes (for testing - access at /react/)
    path("react/", views.react_home, name="react_index"),
    path("react/<path:path>", views.react_home, name="react_catch_all"),
    # Journey routes
    path("j/", views.home, name="journeys"),
    path("j/<slug:journey_slug>", views.home, name="journey"),
    # Snippet detail routes
    path("<slug:slug>", views.detail, name="detail"),
    path("<slug:slug>/run", views.detail, name="detail", kwargs={"run": True}),
]
