# backend/myproject/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from myapp import views as myapp_views
from weather_monitoring import views as weather_views
from django.conf.urls.static import static
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin/weather-dashboard/', admin.site.admin_view(weather_views.weather_dashboard_view), name='weather_dashboard'),
    path('api/', include('myapp.urls')),
    path('api/weather/', include('weather_monitoring.urls')),
    path('csrf/', myapp_views.csrf_token_api),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)