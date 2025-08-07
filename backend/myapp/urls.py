from django.urls import path
from . import views

# These are your API endpoints - React HomePage will call these
urlpatterns = [
    path('home/', views.HomeAPI.as_view(), name='home_api'),
    path('dashboard/', views.dashboard_api, name='dashboard_api'),
    path('health-check/', views.health_check_api, name='health_check_api'),
    path('all-devices/', views.all_devices_api, name='all_devices_api'),
    path('map/realtime/', views.map_realtimedata_api, name='map_realtimedata_api'),
    path('station/<str:station_id>/forecast/', views.station_forecast_api, name='station_forecast_api'),
    path('send-otp/', views.send_otp_api, name='send_otp_api'),
    path('verify-otp/', views.verify_otp_api, name='verify_otp_api'),
    path('signup/', views.signup_api, name='signup_api'),
    path('logout/', views.logout_api, name='logout_api'),
    path('health-assessment/', views.health_assessment_api, name='health_assessment_api'),
    path('calculate-health-score/', views.calculate_health_score_api, name='calculate_health_score_api'),
    path('health-assessment-status/', views.health_assessment_status, name='health_assessment_status'),
    path('save-user-location/', views.save_user_location_api, name='save_user_location_api'),
    path('get-user-location/', views.get_user_location_api, name='get_user_location_api'),
    path('health-report/', views.health_report_api, name='health_report_api'),
    path('family-members/', views.family_members_api, name='family_members_api'),
    path('family-members/<int:member_id>/', views.delete_family_member_api, name='delete_family_member_api'),
    path('family-members/update/<int:member_id>/', views.update_family_member_api, name='update_family_member_api'),
    path('admin/login/', views.admin_login_api, name='admin_login_api'),
    path('admin/dashboard/', views.admin_dashboard_api, name='admin_dashboard_api'),
     # <-- ADD THIS LINE
]