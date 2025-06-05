from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path("", views.home, name="index"),
    path("about", views.about, name="about"),
    path("browse", views.list_snippets, name="list"),
    path("save", views.save, name="save"),
    path("<slug:slug>", views.detail, name="detail"),
]
