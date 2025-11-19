from django.contrib import admin
from .models import Signup,UserLogin,HealthQuestionnaire,HealthAssessment,AirQualityData,FamilyMembers
from .models import AdminUserlogin, Support



admin.site.register(Signup)
admin.site.register(UserLogin)
admin.site.register(HealthQuestionnaire)
admin.site.register(HealthAssessment)
admin.site.register(AirQualityData)
admin.site.register(AdminUserlogin)
admin.site.register(FamilyMembers)
# Register Support model
admin.site.register(Support)
# Register your models here.


# Register your models here.
