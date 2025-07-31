#from django.contrib import admin
from django.urls import path,include

#urlpatterns = [
#    path('admin/', admin.site.urls),
#    path('',include('myapp.urls')),
#]
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('myapp.urls')),
    # This will serve your React HomePage.js when someone visits your website
    path('', TemplateView.as_view(template_name='index.html'), name='react_app'),
]