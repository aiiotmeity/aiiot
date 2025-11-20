from django.contrib import admin
from .models import (
    Signup, UserLogin, HealthAssessment, FamilyMembers, 
    Support, ResourceFile, Resource
)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    fields = ('title', 'description', 'file')

@admin.register(Signup)
class SignupAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'phone_number', 'is_verified')

@admin.register(UserLogin)
class UserLoginAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'created_at')

@admin.register(HealthAssessment)
class HealthAssessmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'health_score', 'created_at')

@admin.register(FamilyMembers)
class FamilyMembersAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_user', 'relationship', 'age')

@admin.register(Support)
class SupportAdmin(admin.ModelAdmin):
    list_display = ('sl_no', 'email', 'submitted_at')

@admin.register(ResourceFile)
class ResourceFileAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')