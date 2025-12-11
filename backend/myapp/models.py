
from django.db import models
from django.contrib.auth.models import User
from django.contrib import admin
import os
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage


# --- PASTE THESE TWO MODELS ---
# (Delete your old 'User' and 'login' models)

# In myapp/models.py
from django.db import models

# --- PASTE THESE TWO MODELS ---
# (Delete your old 'User' and 'login' models)

class Signup(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100)
    phone_number = models.CharField(unique=True, max_length=15)
    email = models.CharField(unique=True, max_length=100)
    password = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False  # Tells Django to use the existing table
        db_table = 'signup' # Links to your 'signup' table

class UserLogin(models.Model):
    id = models.AutoField(primary_key=True)
    phone_number = models.CharField(max_length=20, unique=True)   # ✔ for login  # optional
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'user_login'
 # Links to your 'user_login' table

# --- KEEP YOUR OTHER MODELS (HealthAssessment, etc.) BELOW ---
class HealthQuestionnaire(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)  # Assuming you have a User model
    question1 = models.CharField(max_length=100)  # Adjust field types as necessary
    question2 = models.CharField(max_length=100)
    # Add additional questions as needed

    def __str__(self):
        return f"Health Questionnaire for {self.user.name}"

# CORRECTED models.py - HealthAssessment class

class HealthAssessment(models.Model):
    id = models.AutoField(primary_key=True)
    
    user = models.OneToOneField(
        'Signup',
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='health_assessment'
    )

    phone_number = models.CharField(
        max_length=15,
        unique=True,
        db_index=True
    )

    age_group = models.CharField(max_length=20, null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)

    respiratory_conditions = models.JSONField(default=list, blank=True)
    smoking_history = models.TextField(null=True, blank=True)
    living_environment = models.JSONField(default=list, blank=True)
    common_symptoms = models.JSONField(default=list, blank=True)
    occupational_exposure = models.CharField(max_length=50, null=True, blank=True)
    medical_history = models.JSONField(default=list, blank=True)

    health_score = models.IntegerField(default=0)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    # ============================
    # ADD THESE TWO FUNCTIONS HERE
    # ============================

    def get_risk_level(self):
        """
        Convert health_score → risk level text.
        """
        if self.health_score is None:
            return "Unknown"

        if self.health_score >= 80:
            return "Low"
        elif self.health_score >= 50:
            return "Medium"
        else:
            return "High"

    def get_recommendations(self):
        """
        Basic recommendations based on risk level.
        """
        risk = self.get_risk_level()

        if risk == "Low":
            return "Maintain healthy habits and avoid prolonged pollution exposure."

        if risk == "Medium":
            return "Limit outdoor activity. Use a mask when going outside."

        if risk == "High":
            return "High risk! Avoid outdoor exposure, keep windows closed, use an air purifier."

        return "No recommendation available."

    # ============================

    class Meta:
        db_table = 'health_assessment'
        managed = False
        constraints = [
            models.UniqueConstraint(fields=['user'], name='health_assessment_user_id_key'),
            models.UniqueConstraint(fields=['phone_number'], name='health_assessment_phone_number_key'),
        ]

    def __str__(self):
        return f"Health Assessment for {self.user.username if self.user else self.phone_number}"




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
    # class FamilyMembers(models.Model):
    
    # THIS IS THE FIXED LINE:
    parent_user = models.ForeignKey('Signup', on_delete=models.CASCADE, related_name='family_members')
    
    # ... other fields
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    relationship = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.relationship})"


class Support(models.Model):
    sl_no = models.AutoField(primary_key=True, db_column='sl_no')
    email = models.CharField(max_length=255)
    case_description = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True, db_column='submitted_at')

    class Meta:
        db_table = 'support'
        managed = False

    def __str__(self):
        return f"Support #{self.sl_no} from {self.email}"
    

class ResourceFile(models.Model):
    CATEGORY_CHOICES = [
        ('brochure', 'Brochure'),
        ('poster', 'Poster'),
        ('slide', 'Slide'),
        ('image', 'Image'),
        ('other', 'Other'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to="resources/%Y/%m/%d/")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Resource(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='resources/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
    
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from django.contrib.auth.models import User  # Only keep if you use default Django auth

# 1. AUTH MODELS (Managed = False)
class Signup(models.Model):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100)
    phone_number = models.CharField(unique=True, max_length=15)
    email = models.CharField(unique=True, max_length=100)
    password = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'signup'

class UserLogin(models.Model):
    id = models.AutoField(primary_key=True)
    phone_number = models.CharField(max_length=20, unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'user_login'

class AdminUserlogin(models.Model):
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.username

# 2. HEALTH & USER DATA
class HealthQuestionnaire(models.Model):
    # FIXED: Changed 'User' to 'Signup' to match your other models
    user = models.OneToOneField('Signup', on_delete=models.CASCADE) 
    question1 = models.CharField(max_length=100)
    question2 = models.CharField(max_length=100)

    def __str__(self):
        return f"Health Questionnaire for {self.user.username}"

class HealthAssessment(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(
        'Signup',
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='health_assessment'
    )
    phone_number = models.CharField(max_length=15, unique=True, db_index=True)
    age_group = models.CharField(max_length=20, null=True, blank=True)
    gender = models.CharField(max_length=20, null=True, blank=True)
    respiratory_conditions = models.JSONField(default=list, blank=True)
    smoking_history = models.TextField(null=True, blank=True)
    living_environment = models.JSONField(default=list, blank=True)
    common_symptoms = models.JSONField(default=list, blank=True)
    occupational_exposure = models.CharField(max_length=50, null=True, blank=True)
    medical_history = models.JSONField(default=list, blank=True)
    health_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    def get_risk_level(self):
        if self.health_score is None: return "Unknown"
        if self.health_score >= 80: return "Low"
        elif self.health_score >= 50: return "Medium"
        return "High"

    def get_recommendations(self):
        risk = self.get_risk_level()
        if risk == "Low": return "Maintain healthy habits."
        if risk == "Medium": return "Limit outdoor activity. Use a mask."
        if risk == "High": return "High risk! Avoid outdoor exposure."
        return "No recommendation available."

    class Meta:
        db_table = 'health_assessment'
        managed = False
        constraints = [
            models.UniqueConstraint(fields=['user'], name='health_assessment_user_id_key'),
            models.UniqueConstraint(fields=['phone_number'], name='health_assessment_phone_number_key'),
        ]

    def __str__(self):
        return f"Assessment for {self.phone_number}"

class FamilyMembers(models.Model):
    parent_user = models.ForeignKey('Signup', on_delete=models.CASCADE, related_name='family_members')
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    relationship = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.relationship})"

# 3. ENVIRONMENT & SUPPORT
class AirQualityForecast(models.Model):
    date = models.DateField()
    gas_type = models.CharField(max_length=20)
    forecasted_value = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('date', 'gas_type')
        indexes = [models.Index(fields=['date']), models.Index(fields=['gas_type'])]

    def __str__(self):
        return f"{self.gas_type} forecast for {self.date}"

class Support(models.Model):
    sl_no = models.AutoField(primary_key=True, db_column='sl_no')
    email = models.CharField(max_length=255)
    case_description = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True, db_column='submitted_at')

    class Meta:
        db_table = 'support'
        managed = False

    def __str__(self):
        return f"Support #{self.sl_no}"

# 4. RESOURCES (S3 ENABLED)

class Brochure(models.Model):
    CATEGORY_CHOICES = [
    ('iot_internship', 'Internship'),
    ('workshop', 'Workshop'),
    ('vision', 'Vision & Mission'),
    ('project', 'Projects'),
    ('research', 'Research & Publications'),
    ('Brochure', 'Brochure'),
    ('',''),
]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    # SAVES TO: brochures/2025/11/29/filename.pdf
    file = models.FileField(upload_to='brochures/%Y/%m/%d/')
    icon = models.CharField(max_length=10, default='📄')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# In models.py
# myapp/models.py

# myapp/models.py (Update the WorkshopEvent class)

class WorkshopEvent(models.Model):
    CATEGORY_CHOICES = [
        ('Hands-on-Workshop', 'Hands-on Workshop'),
        ('Summer Internship', 'Summer Internship'),
        ('Value Added Course', 'Value Added Course'),
        ('Workshop', 'Workshop'),
        ('Research', 'Research'),
    ]

    title = models.CharField(max_length=255) 
    # This matches "Type" in your table image
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Workshop') 
    
    # --- NEW FIELD FOR TABLE ---
    duration = models.CharField(max_length=50, blank=True, help_text="e.g. '1 Day', '15 Days'")
    
    event_date_text = models.CharField(max_length=100, help_text="e.g. 'March 19, 2025'")
    participants = models.CharField(max_length=50, blank=True, help_text="e.g. '40 Participants'")
    
    description = models.TextField(blank=True)
    brochure_file = models.FileField(upload_to='workshops/brochures/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at'] 

    def __str__(self):
        return self.title
# In models.py

class Product(models.Model):
    # This slug is the URL link (e.g. 'indoor-monitor')
    slug = models.SlugField(unique=True, max_length=100, help_text="Unique URL ID (e.g. 'indoor-monitor')")
    name = models.CharField(max_length=255)  # e.g. "Indoor Air Quality Monitor"
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    
    # Category matches your Mega Menu tabs
    CATEGORY_CHOICES = [
        ('Air Quality', 'Air Quality'),
        ('Water Solutions', 'Water Solutions'),
        ('Weather', 'Weather'),
        ('Training', 'Training'),
    ]
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Air Quality')
    
    image = models.ImageField(upload_to='products/hero/')
    sub_image = models.ImageField(upload_to='products/sub/', blank=True, null=True)
    brochure = models.FileField(upload_to='products/brochures/', blank=True, null=True)

    def __str__(self):
        return self.name

# --- NEW MODELS FOR FEATURES & SPECS (Better than JSON) ---
class ProductFeature(models.Model):
    product = models.ForeignKey(Product, related_name='features', on_delete=models.CASCADE)
    title = models.CharField(max_length=100) # e.g. "Laser Sensor"
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='⚡', help_text="Paste an Emoji here")

    def __str__(self):
        return self.title

class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, related_name='specifications', on_delete=models.CASCADE)
    spec_key = models.CharField(max_length=100) # e.g. "Range"
    spec_value = models.CharField(max_length=100) # e.g. "10 KM"

    def __str__(self):
        return f"{self.spec_key}: {self.spec_value}"

class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, related_name='specifications', on_delete=models.CASCADE)
    spec_key = models.CharField(max_length=100) # e.g. "Range"
    spec_value = models.CharField(max_length=100) # e.g. "0-1000 ug/m3"

    def __str__(self):
        return f"{self.product.name} - {self.spec_key}"