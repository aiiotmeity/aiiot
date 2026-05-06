from django.db import models
from decimal import Decimal

class WeatherStation(models.Model):
    """Metadata for weather stations (synced from DynamoDB)"""
    device_id = models.CharField(max_length=100, unique=True, db_index=True)
    station_name = models.CharField(max_length=255, default="Unknown Station")
    station_type = models.CharField(
        max_length=20,
        choices=[('V1', 'Old V1 Station'), ('V2', 'New V2 Station')],
        default='V2'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.device_id} ({self.station_name})"
    
    class Meta:
        verbose_name = "Weather Station"
        verbose_name_plural = "Weather Stations"
        ordering = ['-updated_at']


class WeatherReading(models.Model):
    """Real-time weather data readings from DynamoDB"""
    station = models.ForeignKey(WeatherStation, on_delete=models.CASCADE, related_name='readings')
    
    # Environmental Parameters (from payload/decoded_payload)
    temperature_c = models.FloatField(null=True, blank=True, help_text="Temperature in Celsius")
    humidity = models.FloatField(null=True, blank=True, help_text="Humidity %")
    pressure = models.FloatField(null=True, blank=True, help_text="Air Pressure hPa")
    
    # Wind Data
    wind_speed_kph = models.FloatField(null=True, blank=True, help_text="Wind Speed km/h")
    wind_direction = models.FloatField(null=True, blank=True, help_text="Wind Direction degrees")
    
    # Rainfall
    rain_1h_mm = models.FloatField(null=True, blank=True, help_text="Rainfall 1h mm")
    rain_24h_mm = models.FloatField(null=True, blank=True, help_text="Rainfall 24h mm")
    
    # Metadata
    server_time = models.CharField(max_length=50, blank=True, help_text="Server Time DD:MM:YYYY:HH:MM")
    recorded_at = models.DateTimeField(auto_now=True, db_index=True)
    dynamodb_timestamp = models.CharField(max_length=100, blank=True, help_text="DynamoDB received_at")
    
    def __str__(self):
        return f"{self.station.device_id} - {self.recorded_at}"
    
    class Meta:
        verbose_name = "Weather Reading"
        verbose_name_plural = "Weather Readings"
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['station', '-recorded_at']),
        ]


class DataRequest(models.Model):
    """User requests for weather data (from data_requests DynamoDB table)"""
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    
    request_id = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    organization = models.CharField(max_length=255, default="N/A")
    
    # Date Range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Station & Parameters
    station_id = models.CharField(max_length=100, db_index=True)
    data_parameters = models.JSONField(default=list, blank=True, help_text="List of requested parameters")
    
    # Request Details
    purpose = models.TextField(default="N/A")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    request_timestamp = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Admin Notes
    admin_notes = models.TextField(blank=True, help_text="Admin approval/rejection notes")
    
    def __str__(self):
        return f"{self.email} - {self.station_id} ({self.status})"
    
    class Meta:
        verbose_name = "Data Request"
        verbose_name_plural = "Data Requests"
        ordering = ['-request_timestamp']
        indexes = [
            models.Index(fields=['status', '-request_timestamp']),
        ]
