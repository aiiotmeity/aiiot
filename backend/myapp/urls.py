from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Main APIs
    path('api/home/', views.HomeAPI.as_view(), name='home_api'),
    path('api/dashboard/', views.dashboard_api, name='dashboard_api'),
    path('api/health-check/', views.health_check_api, name='health_check_api'),
    path('api/all-devices/', views.all_devices_api, name='all_devices_api'),

    # Map & Station APIs
    path('api/map/realtime/', views.map_realtimedata_api, name='map_realtimedata_api'),
    path('api/station/<str:station_id>/forecast/', views.station_forecast_api, name='station_forecast_api'),
    
    # Authentication APIs
    path('api/send-otp/', views.send_otp_api, name='send_otp_api'),
    path('api/verify-otp/', views.verify_otp_api, name='verify_otp_api'),
    path('api/signup/', views.signup_api, name='signup_api'),
    path('api/logout/', views.logout_api, name='logout_api'),
    
    # Health Assessment APIs
    path('api/health-assessment/', views.health_assessment_api, name='health_assessment_api'),
    path('api/calculate-health-score/', views.calculate_health_score_api, name='calculate_health_score_api'),
    path('api/health-assessment-status/', views.health_assessment_status, name='health_assessment_status'),
    
    # Location APIs
    path('api/save-user-location/', views.save_user_location_api, name='save_user_location_api'),
    path('api/get-user-location/', views.get_user_location_api, name='get_user_location_api'),
    path('api/health-report/', views.health_report_api, name='health_report_api'),
    path('api/family-members/', views.family_members_api, name='family_members_api'),
    path('api/family-members/<int:member_id>/', views.delete_family_member_api, name='delete_family_member_api'),
    path('api/family-members/', views.family_members_api, name='family_members_api'),
    path('api/family-members/<int:member_id>/', views.delete_family_member_api, name='delete_family_member_api'),
    path('api/family-members/update/<int:member_id>/', views.update_family_member_api, name='update_family_member_api'),
    
    path('api/admin/login/', views.admin_login_api, name='admin_login_api'),
    path('api/admin/dashboard/', views.admin_dashboard_api, name='admin_dashboard_api'),
]