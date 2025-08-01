# backend/myproject/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    # 1. The admin path comes first.
    path('admin/', admin.site.urls),

    # 2. Your API paths come next.
    path('api/', include('myapp.urls')),

    # 3. The catch-all for React comes LAST.
    # This ensures that any request not matching 'admin/' or 'api/'
    # is handled by the React frontend.
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]