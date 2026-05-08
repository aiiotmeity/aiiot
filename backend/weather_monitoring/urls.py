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
    # Accept both with and without trailing slash to match frontend requests
    path('s3-presign', views.S3PresignView.as_view(), name='s3-presign'),
    path('s3-presign/', views.S3PresignView.as_view(), name='s3-presign-slash'),
    path('debug-read-s3', views.debug_read_s3_csv),
    path('admin-dashboard', views.weather_admin_dashboard_api, name='weather_admin_dashboard'),

    path('flood-analysis', views.flood_analysis, name='flood_analysis'),

]
