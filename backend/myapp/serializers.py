from rest_framework import serializers
from .models import Resource, Brochure , WorkshopEvent
from .models import Product, ProductFeature, ProductSpecification

class WorkshopEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopEvent
        # We removed 'brochure_file' from this list
        fields = ['id', 'title', 'category', 'duration', 'event_date_text', 'participants', 'description', 'created_at']

class BrochureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brochure
        fields = '__all__'