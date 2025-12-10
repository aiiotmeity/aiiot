from rest_framework import serializers
from .models import Resource, Brochure , WorkshopEvent
from .models import Product, ProductFeature, ProductSpecification


class BrochureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brochure
        fields = ['id', 'title', 'description', 'category', 'icon', 'file', 'is_active', 'created_at']


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'title', 'description', 'file', 'created_at']
        
class WorkshopEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkshopEvent
        fields = '__all__'
class ProductFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFeature
        fields = ['title', 'icon']

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ['spec_key', 'spec_value']

class ProductSerializer(serializers.ModelSerializer):
    features = ProductFeatureSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['slug', 'name', 'tagline', 'description', 'category', 'image', 'features', 'specifications']