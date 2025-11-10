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
    path("api/journeys", views.journeys_api, name="journeys_api"),
    path("j/", views.home, name="journeys"),
    path("j/<slug:journey_slug>", views.home, name="journey"),
    path("<slug:slug>", views.detail, name="detail"),
    path("<slug:slug>/run", views.detail, name="detail", kwargs={"run": True}),
]
