from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Signup, UserLogin, HealthAssessment, FamilyMembers, 
    Support, ResourceFile, Resource, Brochure, WorkshopEvent,
    Product, ProductFeature, ProductSpecification, AdminUserlogin ,Notification
)

admin.site.site_header = "AI-IoT Admin Panel"
admin.site.site_title = "Admin"
admin.site.index_title = "Welcome to Admin Dashboard"

# --- EXISTING ADMINS ---

@admin.register(AdminUserlogin)
class AdminUserloginAdmin(admin.ModelAdmin):
    list_display = ('username',)  # Removed 'created_at' as it doesn't exist

@admin.register(Brochure)
class BrochureAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status_badge', 'created_at')
    list_filter = ('category', 'is_active')
    search_fields = ('title',)

    def status_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color: white; background: green; padding: 3px 8px; border-radius: 5px;">Active</span>')
        return format_html('<span style="color: white; background: grey; padding: 3px 8px; border-radius: 5px;">Inactive</span>')
    status_badge.short_description = "Status"

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')

@admin.register(Signup)
class SignupAdmin(admin.ModelAdmin):
    # FIXED: Added 'is_verified' here so it matches list_editable
    list_display = ('username', 'phone_number', 'email', 'is_verified', 'verification_visual')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('username', 'email', 'phone_number')
    list_per_page = 20
    
    # This makes the checkbox appear in the list for quick editing
    list_editable = ('is_verified',) 

    def verification_visual(self, obj):
        if obj.is_verified:
            return format_html('<b style="color:green;">✔ Verified</b>')
        return format_html('<b style="color:red;">✖ Unverified</b>')
    verification_visual.short_description = "Visual Status"

@admin.register(UserLogin)
class UserLoginAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('phone_number',)
    readonly_fields = ('created_at',)

@admin.register(HealthAssessment)
class HealthAssessmentAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'health_score', 'risk_level_badge', 'created_at')
    list_filter = ('created_at', 'health_score')
    search_fields = ('phone_number', 'user__username')
    ordering = ('-created_at',)

    def risk_level_badge(self, obj):
        score = obj.health_score
        if score <= 50:
            color = "#28a745"  # Green
            label = "Low Risk"
        elif score <= 100:
            color = "#ffc107"  # Yellow
            label = "Moderate"
        elif score <= 150:
            color = "#fd7e14"  # Orange
            label = "High Risk"
        else:
            color = "#dc3545"  # Red
            label = "Critical"
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 10px; border-radius: 15px; font-weight: bold;">{}</span>',
            color, label
        )
    risk_level_badge.short_description = "Risk Analysis"

@admin.register(FamilyMembers)
class FamilyMembersAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_user', 'relationship', 'age')
    search_fields = ('name', 'parent_user__username')
    list_filter = ('relationship',)

@admin.register(Support)
class SupportAdmin(admin.ModelAdmin):
    list_display = ('sl_no', 'email', 'short_description', 'submitted_at')
    list_filter = ('submitted_at',)
    search_fields = ('email', 'case_description')
    readonly_fields = ('submitted_at',)

    def short_description(self, obj):
        return (obj.case_description[:50] + '...') if obj.case_description else '-'
    short_description.short_description = "Issue"

@admin.register(ResourceFile)
class ResourceFileAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')
    list_filter = ('category', 'uploaded_at')

@admin.register(WorkshopEvent)
class WorkshopEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'duration', 'event_date_text', 'participants')
    search_fields = ('title', 'category')
    list_filter = ('category',)

# --- PRODUCT ADMINS ---

class FeatureInline(admin.TabularInline):
    model = ProductFeature
    extra = 1

class SpecInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'slug')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)} 
    inlines = [FeatureInline, SpecInline]

# 1. UPDATE THE IMPORT (Add 'Notification' to the list)
from .models import (
    Signup, UserLogin, HealthAssessment, FamilyMembers, 
    Support, ResourceFile, Resource, Brochure, WorkshopEvent,
    Product, ProductFeature, ProductSpecification, AdminUserlogin,
    Notification  # <--- ADD THIS
)

# ... (keep all your existing admin classes) ...


# 2. PASTE THIS AT THE BOTTOM OF admin.py

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    # Columns to show in the list
    list_display = ('message', 'start_date', 'end_date', 'is_active', 'is_recurring')
    
    # Sidebar filters
    list_filter = ('is_active', 'is_recurring', 'start_date')
    
    # Search box functionality
    search_fields = ('message', 'link')
    
    # Default ordering (newest first)
    ordering = ('-start_date',)

    # Help text to make it clear which ones are recurring
    fieldsets = (
        (None, {
            'fields': ('message', 'link', 'is_active')
        }),
        ('Timing', {
            'fields': ('start_date', 'end_date', 'is_recurring'),
            'description': 'For "Recurring" events (like Independence Day), the year does not matter—it will repeat every year on these Month/Day dates.'
        }),
    )
