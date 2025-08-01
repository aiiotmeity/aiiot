#from django.contrib import admin
from django.urls import path,include

#urlpatterns = [
#    path('admin/', admin.site.urls),
#    path('',include('myapp.urls')),
#]
from django.contrib import admin
from django.urls import path, include,re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('myapp.urls')),
   # This catch-all route directs all other requests to React's index.html
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]