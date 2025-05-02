from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html')),
    path('save', views.save, name='save'),
    path('<slug:slug>', views.detail, name='detail'),
]
