from django.contrib import admin
from .models import (
    Signup, UserLogin, HealthAssessment, FamilyMembers, 
    Support, ResourceFile, Resource, Brochure ,WorkshopEvent
)

admin.site.site_header = "AI-IoT Admin Panel"
admin.site.site_title = "Admin"
admin.site.index_title = "Welcome to Admin Dashboard"

@admin.register(Brochure)
class BrochureAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('title', 'description')
    fields = ('title', 'description', 'category', 'icon', 'file', 'is_active')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    fields = ('title', 'description', 'file')
    readonly_fields = ('created_at',)

@admin.register(Signup)
class SignupAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'phone_number', 'is_verified')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('username', 'email', 'phone_number')

@admin.register(UserLogin)
class UserLoginAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('phone_number',)
    readonly_fields = ('created_at',)

@admin.register(HealthAssessment)
class HealthAssessmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'health_score', 'created_at')
    list_filter = ('created_at', 'health_score')
    search_fields = ('phone_number',)

@admin.register(FamilyMembers)
class FamilyMembersAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_user', 'relationship', 'age')
    search_fields = ('name', 'parent_user__username')

@admin.register(Support)
class SupportAdmin(admin.ModelAdmin):
    list_display = ('sl_no', 'email', 'submitted_at')
    list_filter = ('submitted_at',)
    search_fields = ('email',)
    readonly_fields = ('submitted_at',)

@admin.register(ResourceFile)
class ResourceFileAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')
    list_filter = ('category', 'uploaded_at')
    search_fields = ('title',)

@admin.register(WorkshopEvent)
class WorkshopEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'event_date_text', 'participants')
    search_fields = ('title', 'description')
    list_filter = ('category',)