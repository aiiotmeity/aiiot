from django.db import models
from django.contrib.auth.models import User
from django.contrib import admin
import os
from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15, unique=True)
    otp = models.CharField(max_length=6, blank=True, null=True)


    def __str__(self):
        return self.name


class login(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_verified = models.BooleanField(default=False)

    def __str__(self):
        return self.phone_number

class HealthQuestionnaire(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Assuming you have a User model
    question1 = models.CharField(max_length=100)  # Adjust field types as necessary
    question2 = models.CharField(max_length=100)
    # Add additional questions as needed

    def __str__(self):
        return f"Health Questionnaire for {self.user.name}"

# CORRECTED models.py - HealthAssessment class

class HealthAssessment(models.Model):
    # FIX: Use ForeignKey with unique=True instead of OneToOneField to avoid migration issues
    user = models.ForeignKey(User, on_delete=models.CASCADE, unique=True)
    
    age_group = models.CharField(max_length=20)
    gender = models.CharField(max_length=20)
    respiratory_conditions = models.JSONField(default=list)
    smoking_history = models.TextField()
    living_environment = models.JSONField(default=list)
    common_symptoms = models.JSONField(default=list)
    occupational_exposure = models.CharField(max_length=50)
    medical_history = models.JSONField(default=list)
    health_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['health_score']),
            models.Index(fields=['created_at']),
            models.Index(fields=['user']),
        ]
        verbose_name = "Health Assessment"
        verbose_name_plural = "Health Assessments"
        
    def __str__(self):
        return f"{self.user.name} - Health Assessment (Score: {self.health_score})"
    
    def get_risk_level(self):
        """Calculate risk level based on health score"""
        if self.health_score <= 50:
            return 'Low'
        elif self.health_score <= 100:
            return 'Moderate'
        elif self.health_score <= 150:
            return 'High'
        else:
            return 'Critical'
    
    def get_risk_color(self):
        """Get color code for risk level"""
        risk_colors = {
            'Low': '#10b981',      # Green
            'Moderate': '#f59e0b', # Yellow
            'High': '#ef4444',     # Red
            'Critical': '#dc2626'  # Dark Red
        }
        return risk_colors.get(self.get_risk_level(), '#6b7280')
    
    def get_recommendations(self):
        """Get health recommendations based on assessment"""
        recommendations = []
        
        # Age-based recommendations
        if self.age_group in ['0-12 years', '61 years and above']:
            recommendations.append("Monitor air quality closely and limit outdoor activities during high pollution days")
        
        # Respiratory condition recommendations
        if self.respiratory_conditions and 'None' not in self.respiratory_conditions:
            recommendations.append("Use air purifiers indoors and wear masks during high pollution periods")
            if 'Asthma' in self.respiratory_conditions:
                recommendations.append("Keep rescue inhalers accessible and avoid known triggers")
        
        # Smoking history recommendations
        if self.smoking_history == 'Current smoker':
            recommendations.append("Consider smoking cessation programs - smoking significantly worsens air pollution effects")
        elif self.smoking_history == 'Former smoker':
            recommendations.append("Continue avoiding tobacco and secondhand smoke to maintain respiratory health")
        elif self.smoking_history == 'Exposed to secondhand smoke':
            recommendations.append("Minimize exposure to secondhand smoke environments")
        
        # Environment-based recommendations
        if self.living_environment:
            if 'Urban area' in self.living_environment:
                recommendations.append("Consider indoor plants and regular home air quality monitoring")
            if 'Industrial zone' in self.living_environment:
                recommendations.append("Use high-efficiency air filters and monitor local air quality alerts")
        
        # Symptom-based recommendations
        if self.common_symptoms and 'None' not in self.common_symptoms:
            recommendations.append("Consult healthcare provider for persistent respiratory symptoms")
            if len(self.common_symptoms) >= 3:
                recommendations.append("Consider comprehensive pulmonary function testing")
        
        # Occupational recommendations
        high_risk_occupations = ['Construction/Mining', 'Chemical Industry']
        if self.occupational_exposure in high_risk_occupations:
            recommendations.append("Use proper personal protective equipment (PPE) at work")
            recommendations.append("Request regular occupational health screenings")
        
        # Medical history recommendations
        if self.medical_history:
            if 'Heart Disease' in self.medical_history:
                recommendations.append("Monitor air quality extra carefully as it can affect cardiovascular health")
            if 'Diabetes' in self.medical_history:
                recommendations.append("Poor air quality can affect blood sugar control - monitor more frequently")
            if 'Immunocompromised' in self.medical_history:
                recommendations.append("Take extra precautions during high pollution days and consider staying indoors")
        
        # Default recommendation if no specific risks
        if not recommendations:
            recommendations.append("Maintain awareness of local air quality conditions and general health practices")
        
        return recommendations
    
    def get_priority_actions(self):
        """Get high-priority actions based on risk level"""
        risk_level = self.get_risk_level()
        
        if risk_level == 'Critical':
            return [
                "Seek immediate medical consultation",
                "Use air purifiers in all living spaces",
                "Avoid outdoor activities during high pollution days",
                "Consider relocating if possible"
            ]
        elif risk_level == 'High':
            return [
                "Schedule healthcare provider consultation",
                "Install air quality monitoring system",
                "Use N95 masks when outdoors",
                "Create a clean air room at home"
            ]
        elif risk_level == 'Moderate':
            return [
                "Monitor daily air quality forecasts",
                "Use air purifiers in bedrooms",
                "Exercise indoors during high pollution days"
            ]
        else:  # Low risk
            return [
                "Stay informed about air quality conditions",
                "Maintain healthy lifestyle practices"
            ]
    
    def is_high_risk_individual(self):
        """Check if individual is in high-risk category"""
        # Age-based risk
        if self.age_group in ['0-12 years', '61 years and above']:
            return True
        
        # Health condition risk
        high_risk_conditions = ['Asthma', 'COPD', 'Heart Disease', 'Immunocompromised']
        if self.respiratory_conditions:
            if any(condition in self.respiratory_conditions for condition in high_risk_conditions):
                return True
        
        if self.medical_history:
            if any(condition in self.medical_history for condition in high_risk_conditions):
                return True
        
        # Smoking risk
        if self.smoking_history == 'Current smoker':
            return True
        
        # Symptom risk
        if self.common_symptoms and len([s for s in self.common_symptoms if s != 'None']) >= 2:
            return True
        
        return False

class AirQualityData(models.Model):
        co = models.FloatField(null=True)
        nh3 = models.FloatField(null=True)
        no2 = models.FloatField(null=True)
        o3 = models.FloatField(null=True)
        pm25 = models.FloatField(null=True)
        pm10 = models.FloatField(null=True)
        so2 = models.FloatField(null=True)
        hum = models.FloatField(null=True)
        temp = models.FloatField(null=True)
        pre = models.FloatField(null=True)
        date = models.DateField(null=True)
        time = models.TimeField(null=True)
        received_at = models.DateTimeField(auto_now_add=True)
        aqi = models.FloatField(null=True)

        class Meta:
            ordering = ['-received_at']

class AirQualityForecast(models.Model):
    date = models.DateField()
    gas_type = models.CharField(max_length=20)  # SO2, PM2.5, etc.
    forecasted_value = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('date', 'gas_type')
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['gas_type']),
        ]

    def __str__(self):
        return f"{self.gas_type} forecast for {self.date}"

class AdminUserlogin(models.Model):
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100)  # Store hashed in real projects!

    def __str__(self):
        return self.username



class FamilyMembers(models.Model):
    parent_user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='family_members')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    relationship = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.relationship})"
