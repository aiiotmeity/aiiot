# backend/myproject/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from myapp import views as myapp_views

urlpatterns = [
    # 1. The admin path comes first.
    path('admin/', admin.site.urls),

    # 2. Your API paths come next.
    path('api/', include('myapp.urls')),
    path('api/weather/', include('weather_monitoring.urls')),  # ← ADD THIS LINE
    # Simple CSRF token endpoint used by the frontend (optional)
    path('csrf/', myapp_views.csrf_token_api),

  
]