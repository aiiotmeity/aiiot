
# urls.py
from django.urls import path
from . import views


def get_csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})
# THESE ARE THE FIXED URLS WITH THE '' PREFIX
urlpatterns = [
    # Main API Endpoints
    path('home/', views.HomeAPI.as_view(), name='home_api'),
    path('dashboard_api/', views.dashboard_api, name='dashboard_api'),

    path('health-check/', views.health_check_api, name='health_check_api'),
    path('user-aqi/', views.user_aqi_api, name='api_user_aqi'),

    # Auth Endpoints
    path('user_login_api/', views.user_login_api, name='user_login_api'),
    path('send-signup-otp/', views.send_signup_otp_api, name='send_signup_otp'),
    path('verify-otp/', views.verify_otp_api, name='verify_otp_api'),
    path('signup/', views.signup_api, name='signup_api'),
    path('logout/', views.logout_api, name='logout_api'),

    # Health Assessment Endpoints
    path('health-assessment-api/', views.health_assessment_api, name='health_assessment_api'),
    path('calculate-health-score/', views.calculate_health_score_api, name='calculate_health_score_api'),
    path('health-assessment-status/', views.health_assessment_status, name='health_assessment_status'),
    path('health-report/', views.health_report_api, name='health_report_api'),

    # Location Endpoints
    path('save-user-location/', views.save_user_location_api, name='save_user_location_api'),
    path('get-user-location/', views.get_user_location_api, name='get_user_location_api'),
    
    # Family Endpoints
    path('family-members/', views.family_members_api, name='family_members_api'),
    path('family-members/<int:member_id>/', views.delete_family_member_api, name='delete_family_member_api'),
    path('family-members/update/<int:member_id>/', views.update_family_member_api, name='update_family_member_api'),
    # Support / Complaints
    path('support/', views.support_api, name='support_api'),

    # Map/Station Endpoints
    path('all-devices/', views.all_devices_api, name='all_devices_api'),
    path('map/realtime/', views.map_realtimedata_api, name='map_realtimedata_api'),
    path('station/<str:station_id>/forecast/', views.station_forecast_api, name='station_forecast_api'),

    # Admin Endpoints
    path('admin/login/', views.admin_login_api, name='admin_login_api'),
    path('admin/dashboard/', views.admin_dashboard_api, name='admin_dashboard_api'),
    path('admin/users/create/', views.admin_create_user_api, name='admin_create_user_api'),
    path('admin/users/update/<int:user_id>/', views.update_user_api, name='update_user_api'),
    path('admin/users/delete/<int:user_id>/', views.delete_user_api, name='delete_user_api'),
    path('admin/export/', views.admin_export_data_api, name='admin_export_data_api'),

    path('csrf/', get_csrf_token, name='csrf'),
]
