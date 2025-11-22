from rest_framework import serializers
from .models import Resource, Brochure


class BrochureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brochure
        fields = ['id', 'title', 'description', 'category', 'icon', 'file', 'is_active', 'created_at']


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'title', 'description', 'file', 'created_at']
