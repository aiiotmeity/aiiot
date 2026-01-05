from django.urls import path
from . import views


app_name = 'weather'

urlpatterns = [
    # Weather data endpoints
    path('current', views.get_current_weather, name='current_weather'),
    path('historical-data', views.get_historical_data, name='historical_data'),
    path('request-data', views.request_data, name='request_data'),
    path('requests', views.get_all_requests, name='all_requests'),
    # Presign endpoint for frontend to request temporary S3 URLs for forecast files
    path('s3-presign', views.s3_presign, name='s3_presign'),
]
