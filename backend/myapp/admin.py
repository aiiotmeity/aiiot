from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Signup, UserLogin, HealthAssessment, FamilyMembers, 
    Support, ResourceFile, Resource, Brochure, WorkshopEvent,
    Product, ProductFeature, ProductSpecification
)

admin.site.site_header = "AI-IoT Admin Panel"
admin.site.site_title = "AI-IoT Admin"

# --- 1. HEALTH ASSESSMENT (Advanced Visuals) ---
@admin.register(HealthAssessment)
class HealthAssessmentAdmin(admin.ModelAdmin):
    list_display = ('user_link', 'phone_number', 'risk_badge', 'updated_at')
    list_filter = ('health_score', 'created_at')
    search_fields = ('phone_number', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

    # Custom Badge for Risk Level
    def risk_badge(self, obj):
        score = obj.health_score
        if score <= 50:
            color = "#28a745" # Green
            label = "Low Risk"
        elif score <= 100:
            color = "#ffc107" # Yellow
            label = "Moderate"
        else:
            color = "#dc3545" # Red
            label = "High Risk"
            
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 10px; font-weight: bold;">{} ({})</span>',
            color, label, score
        )
    risk_badge.short_description = "Risk Level"

    # Clickable link to User
    def user_link(self, obj):
        if obj.user:
            return format_html('<a href="/admin/myapp/signup/{}/change/">{}</a>', obj.user.id, obj.user.username)
        return "-"
    user_link.short_description = "User Account"

# --- 2. PRODUCT ADMIN (Image Previews) ---
class FeatureInline(admin.TabularInline):
    model = ProductFeature
    extra = 1

class SpecInline(admin.TabularInline):
    model = ProductSpecification
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price_display', 'slug')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [FeatureInline, SpecInline]
    list_per_page = 20

    def price_display(self, obj):
        return f"₹{obj.price}" if hasattr(obj, 'price') else "-"
    price_display.short_description = "Price"

# --- 3. SIGNUP/USER ADMIN ---
@admin.register(Signup)
class SignupAdmin(admin.ModelAdmin):
    list_display = ('username', 'phone_number', 'email', 'status_icon', 'created_at')
    list_filter = ('is_verified', 'created_at')
    search_fields = ('username', 'email', 'phone_number')
    list_editable = ('is_verified',) # Allow verifying users directly from the list

    def status_icon(self, obj):
        if obj.is_verified:
            return format_html('<span style="color: green;">✔ Verified</span>')
        return format_html('<span style="color: red;">✖ Unverified</span>')
    status_icon.short_description = "Status"

# --- 4. SUPPORT ADMIN ---
@admin.register(Support)
class SupportAdmin(admin.ModelAdmin):
    list_display = ('sl_no', 'email', 'short_desc', 'submitted_at')
    readonly_fields = ('submitted_at',)
    
    def short_desc(self, obj):
        return obj.case_description[:50] + "..." if obj.case_description else ""
    short_desc.short_description = "Issue Summary"

# --- REMAINING SIMPLE ADMINS ---

@admin.register(Brochure)
class BrochureAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_active')
    list_editable = ('is_active',)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')

@admin.register(UserLogin)
class UserLoginAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(FamilyMembers)
class FamilyMembersAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_user', 'relationship', 'age')

@admin.register(ResourceFile)
class ResourceFileAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'uploaded_at')

@admin.register(WorkshopEvent)
class WorkshopEventAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'event_date_text', 'participants')
    list_filter = ('category',)