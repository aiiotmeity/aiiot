from django.contrib import admin
from django.utils.html import format_html
from .models import WeatherStation, WeatherReading, DataRequest
from django.urls import reverse
from django.utils.safestring import mark_safe


@admin.register(WeatherStation)
class WeatherStationAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'station_name', 'station_type', 'status_badge', 'latest_reading', 'updated_at')
    list_filter = ('station_type', 'is_active', 'updated_at')
    search_fields = ('device_id', 'station_name')
    readonly_fields = ('device_id', 'created_at', 'updated_at', 'latest_reading_display')
    
    fieldsets = (
        ('Station Information', {
            'fields': ('device_id', 'station_name', 'station_type', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Latest Reading', {
            'fields': ('latest_reading_display',),
        }),
    )
    
    def status_badge(self, obj):
        color = 'green' if obj.is_active else 'red'
        status_text = 'ACTIVE' if obj.is_active else 'INACTIVE'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">{}</span>',
            color, status_text
        )
    status_badge.short_description = "Status"
    
    def latest_reading(self, obj):
        latest = obj.readings.first()
        if latest:
            return f"{latest.temperature_c}°C, {latest.humidity}% | {latest.recorded_at.strftime('%Y-%m-%d %H:%M')}"
        return "No readings"
    latest_reading.short_description = "Latest Reading"
    
    def latest_reading_display(self, obj):
        latest = obj.readings.first()
        if not latest:
            return "No readings available"
        
        html = f"""
        <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0;">
                <td style="padding: 8px; border: 1px solid #ddd;"><b>Parameter</b></td>
                <td style="padding: 8px; border: 1px solid #ddd;"><b>Value</b></td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Temperature</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.temperature_c}°C</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 8px; border: 1px solid #ddd;">Humidity</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.humidity}%</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Pressure</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.pressure} hPa</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 8px; border: 1px solid #ddd;">Wind Speed</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.wind_speed_kph} km/h</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Wind Direction</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.wind_direction}°</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 8px; border: 1px solid #ddd;">Rainfall (1h)</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.rain_1h_mm} mm</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">Rainfall (24h)</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.rain_24h_mm} mm</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td style="padding: 8px; border: 1px solid #ddd;">Recorded At</td>
                <td style="padding: 8px; border: 1px solid #ddd;">{latest.recorded_at.strftime('%Y-%m-%d %H:%M:%S')}</td>
            </tr>
        </table>
        """
        return mark_safe(html)
    latest_reading_display.short_description = "Latest Weather Reading"


@admin.register(WeatherReading)
class WeatherReadingAdmin(admin.ModelAdmin):
    list_display = ('station', 'temperature_display', 'humidity_display', 'wind_speed_display', 'recorded_at')
    list_filter = ('station', 'recorded_at')
    search_fields = ('station__device_id',)
    readonly_fields = ('recorded_at', 'dynamodb_timestamp')
    date_hierarchy = 'recorded_at'
    
    fieldsets = (
        ('Station', {
            'fields': ('station',)
        }),
        ('Environmental Parameters', {
            'fields': ('temperature_c', 'humidity', 'pressure')
        }),
        ('Wind Data', {
            'fields': ('wind_speed_kph', 'wind_direction')
        }),
        ('Rainfall', {
            'fields': ('rain_1h_mm', 'rain_24h_mm')
        }),
        ('Timestamps', {
            'fields': ('recorded_at', 'dynamodb_timestamp', 'server_time'),
            'classes': ('collapse',)
        }),
    )
    
    def temperature_display(self, obj):
        if obj.temperature_c is None:
            return "N/A"
        color = 'red' if obj.temperature_c > 35 else 'orange' if obj.temperature_c > 25 else 'blue'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{:.1f}°C</span>',
            color, obj.temperature_c
        )
    temperature_display.short_description = "Temperature"
    
    def humidity_display(self, obj):
        if obj.humidity is None:
            return "N/A"
        return f"{obj.humidity:.1f}%"
    humidity_display.short_description = "Humidity"
    
    def wind_speed_display(self, obj):
        if obj.wind_speed_kph is None:
            return "N/A"
        return f"{obj.wind_speed_kph:.1f} km/h"
    wind_speed_display.short_description = "Wind Speed"


@admin.register(DataRequest)
class DataRequestAdmin(admin.ModelAdmin):
    list_display = ('request_id', 'email', 'station_id', 'status_badge', 'date_range', 'request_timestamp')
    list_filter = ('status', 'request_timestamp', 'station_id')
    search_fields = ('email', 'organization', 'request_id')
    readonly_fields = ('request_id', 'request_timestamp', 'updated_at')
    
    fieldsets = (
        ('Request Information', {
            'fields': ('request_id', 'status', 'email', 'organization')
        }),
        ('Data Request Details', {
            'fields': ('station_id', 'start_date', 'end_date', 'data_parameters', 'purpose')
        }),
        ('Admin Notes', {
            'fields': ('admin_notes',),
            'classes': ('wide',)
        }),
        ('Timestamps', {
            'fields': ('request_timestamp', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_requests', 'reject_requests', 'mark_completed']
    
    def status_badge(self, obj):
        colors = {
            'pending': '#FFA500',
            'approved': '#28a745',
            'rejected': '#dc3545',
            'completed': '#17a2b8'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = "Status"
    
    def date_range(self, obj):
        return f"{obj.start_date} to {obj.end_date}"
    date_range.short_description = "Date Range"
    
    @admin.action(description="Approve selected requests")
    def approve_requests(self, request, queryset):
        count = queryset.update(status='approved')
        self.message_user(request, f"{count} request(s) approved.")
    
    @admin.action(description="Reject selected requests")
    def reject_requests(self, request, queryset):
        count = queryset.update(status='rejected')
        self.message_user(request, f"{count} request(s) rejected.")
    
    @admin.action(description="Mark selected as completed")
    def mark_completed(self, request, queryset):
        count = queryset.update(status='completed')
        self.message_user(request, f"{count} request(s) marked as completed.")