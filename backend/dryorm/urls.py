from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('save', views.save, name='save'),
    path('<uuid:pk>', views.detail, name='detail'),
    path('', TemplateView.as_view(template_name='index.html')),
]
