
from datetime import datetime, timedelta
import boto3
from rest_framework import viewsets
from django.utils import timezone
from botocore.exceptions import ClientError, NoCredentialsError  # ADDED MISSING IMPORT
import json
from twilio.base.exceptions import TwilioRestException
from django.core.cache import cache
from django.views.decorators.cache import cache_control
import os
import logging
from django.core.cache import cache
import re
import csv
import io
import random
from decimal import Decimal
from math import radians, sin, cos, sqrt, atan2
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie, csrf_protect
from django.views.decorators.cache import cache_page
from django.views.decorators.gzip import gzip_page
from django.views.decorators.http import require_GET
from django.core.paginator import Paginator
from django.template.loader import render_to_string
from django.utils.timezone import now
from django.conf import settings
from django.middleware.csrf import get_token

from dotenv import load_dotenv
from twilio.rest import Client
import numpy as np
import pandas as pd
from datetime import datetime
import random
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view
import json

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time
from .serializers import ResourceSerializer, BrochureSerializer, WorkshopEventSerializer ,ProductSerializer
 # <-- Make sure this is imported



# Import your models
from .models import Signup, HealthAssessment,UserLogin, AdminUserlogin, FamilyMembers, Support, ResourceFile,Resource,Brochure ,WorkshopEvent, Product
# Import DynamoDB functions with error handling
try:
    from .dynamodb import (
        get_all_items,
        get_device_data,
        parse_payload,
        store_data_to_s3,
        test_aws_connection,
        initialize_aws_resources
    )
except ImportError as e:
 
    # Provide fallback functions
    def get_all_items():
        return []
    def get_device_data(device_id):
        return []
    def parse_payload(payload):
        try:
            if isinstance(payload, str):
                return json.loads(payload)
            return payload if isinstance(payload, dict) else {}
        except:
            return {}
    def store_data_to_s3(data, filename_prefix="dynamodb_data"):
        return None
    def test_aws_connection():
        return {'status': 'failed', 'dynamodb': False, 's3': False, 'message': 'Module import failed'}
    def initialize_aws_resources():
        return False

# Setup logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Twilio client safely
try:
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
    VERIFY_SERVICE_SID = os.getenv('VERIFY_SERVICE_SID')
    DEFAULT_OTP = os.getenv('DEFAULT_OTP', '123456')

    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    else:
        client = None
        logger.warning("Twilio credentials not found. SMS functionality will be disabled.")
# ... (the code from above) ...
except Exception as e:
    client = None
    logger.error(f"Failed to initialize Twilio client: {e}")

# VVVVVV  ADD THIS LINE VVVVVV


# Initialize AWS clients safely
try:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
    S3_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', 'ai-model-bucket-output')

    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
    else:
        s3_client = None
        logger.warning("AWS credentials not found. S3 functionality will be disabled.")
except Exception as e:
    s3_client = None
    logger.error(f"Failed to initialize AWS S3 client: {e}")

# Constants
WHO_LIMITS = {
    "co": 4, "so2": 40, "pm25": 15, "pm10": 45,
    "no2": 28, "o3": 64, "nh3": 200
}

STATION_LOCATIONS = {
    "lora-v1": {"lat":10.178385739668958,"lon": 76.43052237497399},
    "loradev2": {"lat": 10.182204721868617, "lon": 76.42850343115732},
    "lora-v3":{"lat": 10.173254902926303, "lng": 76.42755590382993}
    
}


# Utility Functions
def safe_float_conversion(value):
    """Safely convert value to float, handling various data types."""
    if value is None:
        return None
    try:
        if isinstance(value, Decimal):
            return float(value)
        return float(value)
    except (TypeError, ValueError):
        return None

def truncate_nanoseconds(timestamp):
    """Truncates nanoseconds from a timestamp string for correct parsing."""
    if '.' in timestamp:
        parts = timestamp.split('.')
        return f"{parts[0]}.{parts[1][:6]}Z"
    return timestamp

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula."""
    try:
        lat1, lon1 = radians(float(lat1)) if lat1 else 0, radians(float(lon1)) if lon1 else 0
        lat2, lon2 = radians(float(lat2)) if lat2 else 0, radians(float(lon2)) if lon2 else 0

        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))

        return 6371 * c  # Earth's radius in kilometers
    except Exception as e:
        logger.error(f"Error calculating distance: {e}")
        return 0

# In views.py, replace your existing get_s3_forecast_data function with this one.
# This version correctly interprets your daily forecast files.

# In myapp/views.py or myapp/utils.py

# In views.py, replace the entire get_s3_forecast_data function with this corrected version.

def get_s3_forecast_data(device_type=None):
    """
    CORRECTED: Fetches and processes the 4-day forecast from S3.
    This version uses the correct filename logic for qstations, including lora-v3.
    """
    if not s3_client:
        logger.warning("S3 client not available, cannot fetch forecast.")
        return [], None

    try:
        # --- START: THE FIX ---
        # This logic handles the different naming conventions in your S3 bucket.
        if device_type == 'lora-v1':
            file_suffix = 'lora_v1'  # Uses underscore for Station 1
        else:
            file_suffix = device_type  # Directly uses 'lora-v3' and 'loradev2'

        s3_key = f'data/air_quality/latest_forecast_{file_suffix}.json'
        # --- END: THE FIX ---
        
        logger.info(f"Fetching S3 forecast data from: {s3_key}")
        
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        s3_data = json.loads(response['Body'].read().decode('utf-8'))
        
        forecast_dates = s3_data.get('dates', [])
        gases_data = s3_data.get('gases', {})
        updated_at = s3_data.get('updated_at')

        if not forecast_dates or not gases_data:
            return [], updated_at

        processed_forecast = []
        num_days = min(len(forecast_dates), 4)

        gas_mapping = {
            'PM2.5': 'pm25_max', 'PM10': 'pm10_max', 'SO2': 'so2_max',
            'NO2': 'no2_max', 'CO': 'co_max', 'O3': 'o3_max', 'NH3': 'nh3_max'
        }

        for i in range(num_days):
            day_entry = {"day": forecast_dates[i]}
            for json_key, frontend_key in gas_mapping.items():
                try:
                    value = gases_data[json_key]['values'][i]
                    day_entry[frontend_key] = round(float(value), 2)
                except (KeyError, IndexError, TypeError, ValueError):
                    day_entry[frontend_key] = 0
            processed_forecast.append(day_entry)
        
        return processed_forecast, updated_at

    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchKey':
            logger.error(f"S3 forecast file not found: {s3_key}")
        else:
            logger.error(f"S3 ClientError for {device_type}: {e}")
        return [], None
    except Exception as e:
        logger.error(f"Error in get_s3_forecast_data for {device_type}: {e}")
        return [], None

def calculate_subindices(averages):
    """Calculate sub-indices for all parameters from their average values."""

    def calculate_pm25_subindex(value):
        value = safe_float_conversion(value)
        if value is None or value < 0:
            return None
        if value <= 30.0:
            return (value * 50.0) / 30.0
        elif value <= 60.0:
            return 50.0 + ((value - 30.0) * 50.0) / 30.0
        elif value <= 90.0:
            return 100.0 + ((value - 60.0) * 100.0) / 30.0
        elif value <= 120.0:
            return 200.0 + ((value - 90.0) * 100.0) / 30.0
        elif value <= 250.0:
            return 300.0 + ((value - 120.0) * 100.0) / 130.0
        else:
            return 400.0 + ((value - 250.0) * 100.0) / 130.0

    def calculate_pm10_subindex(value):
        value = safe_float_conversion(value)
        if value is None:
            return None
        if value <= 50.0:
            return value
        elif value <= 100.0:
            return value
        elif value <= 250.0:
            return 100.0 + ((value - 100.0) * 100.0) / 150.0
        elif value <= 350.0:
            return 200.0 + ((value - 250.0) * 100.0) / 100.0
        elif value <= 430.0:
            return 300.0 + ((value - 350.0) * 100.0) / 80.0
        else:
            return 400.0 + ((value - 430.0) * 100.0) / 80.0

    def calculate_so2_subindex(value):
        value = safe_float_conversion(value)
        if value is None:
            return None
        if value <= 40.0:
            return (value * 50.0) / 40.0
        elif value <= 80.0:
            return 50.0 + ((value - 40.0) * 50.0) / 40.0
        elif value <= 380.0:
            return 100.0 + ((value - 80.0) * 100.0) / 300.0
        elif value <= 800.0:
            return 200.0 + ((value - 380.0) * 100.0) / 420.0
        elif value <= 1600.0:
            return 300.0 + ((value - 800.0) * 100.0) / 800.0
        else:
            return 400.0 + ((value - 1600.0) * 100.0) / 800.0

    def calculate_no2_subindex(value):
        value = safe_float_conversion(value)
        if value is None:
            return None
        if value <= 40.0:
            return (value * 50.0) / 40.0
        elif value <= 80.0:
            return 50.0 + ((value - 40.0) * 50.0) / 40.0
        elif value <= 180.0:
            return 100.0 + ((value - 80.0) * 100.0) / 100.0
        elif value <= 280.0:
            return 200.0 + ((value - 180.0) * 100.0) / 100.0
        elif value <= 400.0:
            return 300.0 + ((value - 280.0) * 100.0) / 120.0
        else:
            return 400.0 + ((value - 400.0) * 100.0) / 120.0

    def calculate_co_subindex(value):
        value = safe_float_conversion(value)
        if value is None:
            return None
        ppm = value * 0.873  # Convert mg/m3 to ppm
        if ppm <= 1.0:
            return (ppm * 50.0) / 1.0
        elif ppm <= 2.0:
            return 50.0 + ((ppm - 1.0) * 50.0) / 1.0
        elif ppm <= 10.0:
            return 100.0 + ((ppm - 2.0) * 100.0) / 8.0
        elif ppm <= 17.0:
            return 200.0 + ((ppm - 10.0) * 100.0) / 7.0
        elif ppm <= 34.0:
            return 300.0 + ((ppm - 17.0) * 100.0) / 17.0
        else:
            return 400.0 + ((ppm - 34.0) * 100.0) / 17.0

    def calculate_o3_subindex(value):
        value = safe_float_conversion(value)
        if value is None:
            return None
        if value <= 50.0:
            return (value * 50.0) / 50.0
        elif value <= 100.0:
            return 50.0 + ((value - 50.0) * 50.0) / 50.0
        elif value <= 168.0:
            return 100.0 + ((value - 100.0) * 100.0) / 68.0
        elif value <= 208.0:
            return 200.0 + ((value - 168.0) * 100.0) / 40.0
        elif value <= 748.0:
            return 300.0 + ((value - 208.0) * 100.0) / 540.0
        else:
            return 400.0 + ((value - 748.0) * 100.0) / 540.0

    def calculate_nh3_subindex(value):
        value = safe_float_conversion(value)
        if value is None:
            return None
        if value <= 200.0:
            return (value * 50.0) / 200.0
        elif value <= 400.0:
            return 50.0 + ((value - 200.0) * 50.0) / 200.0
        elif value <= 800.0:
            return 100.0 + ((value - 400.0) * 100.0) / 400.0
        elif value <= 1200.0:
            return 200.0 + ((value - 800.0) * 100.0) / 400.0
        elif value <= 1800.0:
            return 300.0 + ((value - 1200.0) * 100.0) / 600.0
        else:
            return 400.0 + ((value - 1800.0) * 100.0) / 600.0

    # Calculate sub-indices for each parameter
    safe_averages = {k: safe_float_conversion(v) for k, v in averages.items()}

    sub_indices = {
        'pm25': calculate_pm25_subindex(safe_averages.get('pm25')),
        'pm10': calculate_pm10_subindex(safe_averages.get('pm10')),
        'so2': calculate_so2_subindex(safe_averages.get('so2')),
        'no2': calculate_no2_subindex(safe_averages.get('no2')),
        'co': calculate_co_subindex(safe_averages.get('co')),
        'o3': calculate_o3_subindex(safe_averages.get('o3')),
        'nh3': calculate_nh3_subindex(safe_averages.get('nh3'))
    }

    return sub_indices

# In your views.py - Replace ONLY the process_device_items function with this:
# This is our rulebook for what a "good" sensor reading looks like.
VALID_SENSOR_RANGES = {
    'nh3':  (0.0, 100.0),  # A valid NH3 reading must be between 0 and 1000
    'o3':   (0.0, 100.0),
    'pm25': (0.0, 100.0),
    'pm10': (0.0, 50.0),
    'co':   (0.0, 30.0),
    'so2':  (0.0, 150.0),
    'no2':  (0.0, 150.0)
}

def get_safe_value(pollutant_name, value_to_check):
    """
    This function checks if a sensor value is good.
    - If the value is good, it returns the original value.
    - If the value is bad (outside the valid range), it returns the safe default value.
    """
    try:
        min_val, max_val = VALID_SENSOR_RANGES[pollutant_name]
        default_val = WHO_LIMITS[pollutant_name]
        
        value = float(value_to_check)

        # Check if the value is inside our valid range
        if min_val <= value <= max_val:
            return value  # The value is good, return it.
        else:
            # The value is bad (too high or too low), so return the default.
            return default_val
            
    except (ValueError, TypeError, KeyError):
        # If the value is not a number or the pollutant name is wrong, return the default.
        return WHO_LIMITS.get(pollutant_name, 0)

# In views (14).py, replace the entire process_device_items function with this:

# In views (14).py, replace the entire process_device_items function with this:

# In your views.py file

def process_device_items(items):
    """
    CORRECTED: This function now correctly handles multiple date formats
    (like YYYY-MM-DD from lora-v3 and dd:mm:YYYY from other devices).
    """
    if not items:
        return None, {}, {}, None

    # ... (parsing and sorting logic remains the same) ...
    for item in items:
        item.update(parse_payload(item.get('payload', {})))
    try:
        items.sort(
            key=lambda x: datetime.strptime(truncate_nanoseconds(x['received_at']), '%Y-%m-%dT%H:%M:%S.%fZ'),
            reverse=True
        )
    except (ValueError, TypeError):
        pass

    latest_item = items[0] if items else None
    if latest_item:
        device_date_str = latest_item.get('date')
        device_time_str = latest_item.get('time')

        if device_date_str and device_time_str:
            try:
                # --- START: THE FIX ---
                # Check which date format is being used
                if '-' in device_date_str:
                    # This handles "2025-10-16" (lora-v3 format)
                    formatted_date = datetime.strptime(device_date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
                else:
                    # This handles "15:10:2025" (lora-v1/loradev2 format)
                    formatted_date = datetime.strptime(device_date_str, '%d:%m:%Y').strftime('%Y-%m-%d')
                
                latest_item['last_updated_on'] = f"{formatted_date} at {device_time_str}"
                # --- END: THE FIX ---

            except (ValueError, TypeError):
                latest_item['last_updated_on'] = "Invalid date/time"
        else:
            db_timestamp = datetime.strptime(truncate_nanoseconds(latest_item['received_at']), '%Y-%m-%dT%H:%M:%S.%fZ')
            latest_item['last_updated_on'] = db_timestamp.strftime('%Y-%m-%d %H:%M:%S')
    
    # ... (The rest of the function for calculations remains the same) ...
    latest_24_items = items[:24]
    parameters = ['nh3', 'o3', 'pm25', 'pm10', 'co', 'so2', 'no2']
    sums = {p: sum(float(it.get(p, 0)) for it in latest_24_items if it.get(p) is not None) for p in parameters}
    counts = {p: sum(1 for it in latest_24_items if it.get(p) is not None) for p in parameters}
    raw_averages = {p: sums[p] / counts[p] if counts[p] > 0 else 0 for p in parameters}

    safe_averages = {param: get_safe_value(param, value) for param, value in raw_averages.items()}
    sub_indices = calculate_subindices(safe_averages)
    valid_indices = [v for v in sub_indices.values() if v is not None]
    highest_sub_index = round(max(valid_indices)) if valid_indices else None
    
    return latest_item, safe_averages, sub_indices, highest_sub_index

def get_aqi_status(aqi):
    """Returns AQI category based on standard CPCB scale."""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Satisfactory"
    elif aqi <= 200:
        return "Moderate"
    elif aqi <= 300:
        return "Poor"
    elif aqi <= 400:
        return "Very Poor"
    else:
        return "Severe"


# ====== API ENDPOINTS FOR REACT FRONTEND ======


# In your views.py

# in myapp/views.py


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
import logging
import random
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.views.decorators.csrf import csrf_exempt


logger = logging.getLogger(__name__)

# In myapp/views.py, replace all old HomeAPI versions with this one:
# In myapp/views.py

# In views.py, REPLACE your HomeAPI class with this:

class HomeAPI(APIView):
    """
    MODIFIED Location-Aware HomeAPI with Backend Fallback:
    - Tries to fetch live data from AWS.
    - If AWS fetching fails, it catches the exception and returns a static,
      pre-defined JSON response, preventing a frontend error.
    - *** FIX: This version now adds 'latest_readings' to the cache ***
    """
    def get(self, request, format=None):
        try:
            # --- TRY TO GET LIVE DATA (Existing Logic) ---
            user_lat = request.GET.get('lat')
            user_lng = request.GET.get('lng')

            cache_key = 'all_stations_realtime_data'
            all_stations_data = cache.get(cache_key)

            if not all_stations_data:
                logger.info("Cache miss. Fetching fresh data for all real stations.")
                if not initialize_aws_resources():
                    # This will be caught by the except block below
                    raise ConnectionError('AWS connection failed')

                lora_v1_items = get_device_data("lora-v1", limit=24)
                loradev2_items = get_device_data("loradev2", limit=24)
                lora_v3_items = get_device_data("lora-v3", limit=24)
                
                latest_v1, avg_lora_v1, _, high_index_lora_v1 = process_device_items(lora_v1_items)
                latest_v2, avg_loradev2, _, high_index_loradev2 = process_device_items(loradev2_items)
                latest_v3, avg_lora_v3, _, high_index_lora_v3 = process_device_items(lora_v3_items)
                
                station_locations = {
                    'lora-v1': { 'lat': 10.178322, 'lng': 76.430591, 'name': 'Station 1 (ASIET Campus)' },
                    'loradev2': { 'lat': 10.182204721868617, 'lng': 76.42850343115732, 'name': 'Station 2 (Pothiyakkara Road)' },
                    'lora-v3': { 'lat': 10.173254902926303, 'lng': 76.42755590382993, 'name': 'Station 3 (Mattoor Junction)' },
                }

                # --- START: THE FIX ---
                # Added 'latest_readings' to each station. This is the raw latest_item,
                # which contains temp, hum, and pre for the interpolation function.
                all_stations_data = {
                    'lora-v1': {'averages': avg_lora_v1, 'highest_sub_index': high_index_lora_v1, 'station_info': station_locations['lora-v1'], 'last_updated_on': latest_v1.get('last_updated_on') if latest_v1 else 'N/A', 'latest_readings': latest_v1},
                    'loradev2': {'averages': avg_loradev2, 'highest_sub_index': high_index_loradev2, 'station_info': station_locations['loradev2'], 'last_updated_on': latest_v2.get('last_updated_on') if latest_v2 else 'N/A', 'latest_readings': latest_v2},
                    'lora-v3': {'averages': avg_lora_v3, 'highest_sub_index': high_index_lora_v3, 'station_info': station_locations['lora-v3'], 'last_updated_on': latest_v3.get('last_updated_on') if latest_v3 else 'N/A', 'latest_readings': latest_v3}
                }
                # --- END: THE FIX ---
                
                cache.set(cache_key, all_stations_data, 60)
            
            # ... (rest of your logic for finding the nearest station) ...
            target_station_data = all_stations_data['lora-v1'] # Default to Station 1
            if user_lat and user_lng and all_stations_data:
                nearest_station_id = min(all_stations_data.keys(), key=lambda sid: calculate_distance(float(user_lat), float(user_lng), all_stations_data[sid]['station_info']['lat'], all_stations_data[sid]['station_info']['lng']))
                target_station_data = all_stations_data[nearest_station_id]
            
            response_data = {
                'highest_sub_index': target_station_data.get('highest_sub_index'),
                'aqi_status': get_aqi_status(target_station_data.get('highest_sub_index')),
                'station_name': target_station_data.get('station_info', {}).get('name'),
                'last_updated_on': target_station_data.get('last_updated_on', "N/A"),
            }
            
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            # --- CATCH THE ERROR AND RETURN FALLBACK DATA ---
            logger.error(f"HomeAPI failed to fetch live data: {e}. Serving fallback response.")
            
            fallback_response = {
                'highest_sub_index': 42,
                'aqi_status': 'Good',
                'station_name': 'ASIET Campus',
                'last_updated_on': 'Showing recent data',
            }
            return Response(fallback_response, status=status.HTTP_200_OK)
        

def _extract_real_datetime(self, latest_item, all_items):
    """
    STRICT VERSION: Only return REAL sensor data, never fake fallbacks
    Returns None if no real sensor data is found
    """
    logger.info(f"🔍 STRICT MODE: Looking for REAL sensor data only...")
    
    # Method 1: Check processed latest_item for real sensor data
    if latest_item and isinstance(latest_item, dict):
        item_date = latest_item.get('date')
        item_time = latest_item.get('time')
        
        logger.info(f"📅 Latest item: date='{item_date}', time='{item_time}'")
        
        # Only accept if it looks like real sensor format
        if item_date and item_time:
            # Check if it's real sensor format (like "07:03:2025" not "22/07/2025")
            if ':' in item_date or len(item_date) == 10:  # Real sensor format
                logger.info(f"✅ FOUND REAL SENSOR DATA: {item_date} at {item_time}")
                return {
                    'date': item_date,
                    'time': item_time,
                    'received_at': latest_item.get('received_at'),
                    'source': 'real_sensor_data',
                    'is_real_data': True
                }

    # Method 2: Search raw DynamoDB items for REAL sensor data
    if all_items and len(all_items) > 0:
        logger.info(f"🔍 Searching {len(all_items)} items for real sensor data...")
        
        for i, item in enumerate(all_items[:20]):  # Check more items
            try:
                payload = item.get('payload', {})
                
                # Handle different payload formats
                raw_date = None
                raw_time = None
                
                if isinstance(payload, dict):
                    # DynamoDB format: {"date": {"S": "07:03:2025"}}
                    if 'date' in payload and isinstance(payload['date'], dict):
                        raw_date = payload.get('date', {}).get('S')
                        raw_time = payload.get('time', {}).get('S')
                    # Direct dict format: {"date": "07:03:2025"}
                    elif 'date' in payload:
                        raw_date = payload.get('date')
                        raw_time = payload.get('time')
                
                # If payload is string, parse it
                if not raw_date:
                    try:
                        parsed_payload = parse_payload(payload)
                        raw_date = parsed_payload.get('date')
                        raw_time = parsed_payload.get('time')
                    except:
                        continue
                
                logger.info(f"📊 Item {i}: date='{raw_date}', time='{raw_time}'")
                
                # STRICT CHECK: Only accept real sensor format
                if raw_date and raw_time:
                    # Validate it's real sensor data format
                    if isinstance(raw_date, str) and isinstance(raw_time, str):
                        # Real sensor format: "07:03:2025" and "03:12"
                        if len(raw_date) >= 8 and ':' in raw_time:
                            logger.info(f"✅ FOUND REAL SENSOR DATA in item {i}: {raw_date} at {raw_time}")
                            return {
                                'date': raw_date,
                                'time': raw_time,
                                'received_at': item.get('received_at'),
                                'source': f'real_sensor_item_{i}',
                                'is_real_data': True,
                                'item_position': i
                            }
                        
            except Exception as e:
                logger.warning(f"⚠️ Error processing item {i}: {e}")
                continue
    
    # STRICT MODE: If no real sensor data found, return None
    logger.warning("❌ NO REAL SENSOR DATA FOUND - returning None")
    return None

def _get_fallback_response(self, error_message):
    """
    STRICT FALLBACK: Clear indication that sensors are offline
    """
    logger.warning(f"🔄 Sensors offline: {error_message}")
    
    current_time = datetime.now()
    
    fallback_data = {
        'latest_item': None,  # No fake data
        'averages': {
            'nh3': 0, 'o3': 0, 'pm25': 0, 'pm10': 0, 
            'co': 0, 'so2': 0, 'no2': 0
        },
        'sub_indices': {
            'nh3': 0, 'o3': 0, 'pm25': 0, 'pm10': 0, 
            'co': 0, 'so2': 0, 'no2': 0
        },
        'highest_sub_index': None,  # No fake AQI
        'aqi_status': 'Unknown',
        'station_name': 'ASIET Campus Station',
        'status': 'sensors_offline',
        'data_source': 'no_sensors',
        'error_message': error_message,
        'timestamp': current_time.isoformat(),
        'total_items_processed': 0
    }
    
    return Response(fallback_data, status=status.HTTP_200_OK)

# UPDATE: Main HomeAPI get methodz
def get(self, request, format=None):
    logger.info("🔄 HomeAPI: Fetching FRESH data (strict mode)")
    
    try:
        if not initialize_aws_resources():
            logger.error("❌ AWS initialization failed")
            return self._get_fallback_response('AWS initialization failed')

        # Fetch fresh data
        items = get_device_data("lora-v1")
        
        if not items:
            logger.warning("⚠️ No items from device")
            return self._get_fallback_response('No data available from sensors')

        logger.info(f"📦 Retrieved {len(items)} items from database")

        # Process items
        latest_item, averages, sub_indices, highest_sub_index = process_device_items(items[:24])
        
        # STRICT: Only extract real datetime
        processed_latest_item = self._extract_real_datetime(latest_item, items)
        
        # If no real sensor data found, processed_latest_item will be None
        
        response_data = {
            'latest_item': processed_latest_item,  # None if no real data
            'averages': self._ensure_averages(averages),
            'sub_indices': {k: round(v, 2) if v is not None else 0 for k, v in (sub_indices or {}).items()},
            'highest_sub_index': highest_sub_index,
            'aqi_status': get_aqi_status(highest_sub_index) if highest_sub_index is not None else "Unknown",
            'station_name': 'ASIET Campus Station',
            'status': 'success' if processed_latest_item else 'no_sensor_timestamp',
            'data_source': 'live_strict_mode',
            'timestamp': datetime.now().isoformat(),
            'total_items_processed': len(items),
            'has_real_sensor_data': processed_latest_item is not None
        }
        
        logger.info(f"✅ Strict mode result: real_data={processed_latest_item is not None}")
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"❌ HomeAPI error: {e}", exc_info=True)
        return self._get_fallback_response(f'Processing error: {str(e)}')
    

# In myapp/views.py

import random # <-- Add this import at the top of your file

# ... (other imports)

# In views.py, replace the entire map_realtimedata_api function

# In myapp/views.py

@api_view(['GET'])
@csrf_exempt
def map_realtimedata_api(request):
    """
    MODIFIED: Fetches live data but provides a static fallback if AWS is unreachable.
    """
    try:
        # --- TRY TO GET LIVE DATA (Existing Logic) ---
        if not initialize_aws_resources():
            raise ConnectionError('AWS initialization failed')

        latest_v1, avg_lora_v1, _, high_index_lora_v1 = process_device_items(get_device_data("lora-v1", limit=24))
        latest_v2, avg_loradev2, _, high_index_loradev2 = process_device_items(get_device_data("loradev2", limit=24))
        latest_v3, avg_lora_v3, _, high_index_lora_v3 = process_device_items(get_device_data("lora-v3", limit=24))
        
        station_locations = {
            'lora-v1': { 'lat': 10.178322, 'lng': 76.430891, 'name': 'Station 1 (ASIET Campus)'},
            'loradev2': { 'lat': 10.18220, 'lng': 76.4285, 'name': 'Station 2 (Pothiyakkara Road)' },
            'lora-v3': { 'lat': 10.17325, 'lng': 76.42755, 'name': 'Station 3 (Mattoor Junction)'},
            'temp-2': { 'lat': 10.175, 'lng': 76.445, 'name': 'Station 4 (Malayattoor Rd)'},
            'temp-3': { 'lat': 10.185, 'lng': 76.425, 'name':  'Station 5 (Kalady Town)'},
        }

        response_data = {
            'stations': {
                'lora-v1': {'averages': avg_lora_v1, 'highest_sub_index': high_index_lora_v1, 'station_info': station_locations['lora-v1'], 'latest_readings': latest_v1},
                'loradev2': {'averages': avg_loradev2, 'highest_sub_index': high_index_loradev2, 'station_info': station_locations['loradev2'], 'latest_readings': latest_v2},
                'lora-v3': {'averages': avg_lora_v3, 'highest_sub_index': high_index_lora_v3, 'station_info': station_locations['lora-v3'], 'latest_readings': latest_v3},
                'temp-2': { 'averages': None, 'highest_sub_index': None, 'station_info': station_locations['temp-2'], 'latest_readings': None },
                'temp-3': { 'averages': None, 'highest_sub_index': None, 'station_info': station_locations['temp-3'], 'latest_readings': None }
            }
        }
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        # --- CATCH THE ERROR AND RETURN FALLBACK DATA ---
        logger.error(f"map_realtimedata_api failed to fetch live data: {e}. Serving fallback response.")
        
        fallback_stations = {
            'stations': {
                'lora-v1': {
                    # MODIFIED: Added all pollutant parameters with reasonable static values.
                    'averages': {
                        'pm25': 12.5, 'pm10': 25.3, 'so2': 5.1, 
                        'no2': 14.2, 'co': 0.4, 'o3': 28.7, 'nh3': 2.1
                    },
                    'highest_sub_index': 45,
                    'station_info': {'lat': 10.178322, 'lng': 76.430891, 'name': 'Station 1'},
                    'latest_readings': {'temp': 29, 'pre': 1012}
                },
                'loradev2': {
                    # MODIFIED: Added all pollutant parameters with reasonable static values.
                    'averages': {
                        'pm25': 15.1, 'pm10': 29.8, 'so2': 6.3,
                        'no2': 16.8, 'co': 0.5, 'o3': 32.1, 'nh3': 2.5
                    },
                    'highest_sub_index': 52,
                    'station_info': {'lat': 10.18, 'lng': 76.4285, 'name': 'Station 2'},
                    'latest_readings': {'temp': 30, 'pre': 1011}
                },
                'lora-v3': {
                    'averages': {'pm25': 14.2, 'pm10': 28.1}, 'highest_sub_index': 48,
                    'station_info': {'lat': 10.173, 'lng': 76.427, 'name': 'Station 3'},
                    'latest_readings': {'temp': 29.5, 'pre': 1011.5}
                },
                'temp-2': {'station_info': {'lat': 10.175, 'lng': 76.445, 'name': 'Station 4 (Coming Soon)'}},
                'temp-3': {'station_info': {'lat': 10.185, 'lng': 76.425, 'name': 'Station 5 (Coming Soon)'}}
            }
        }
        return Response(fallback_stations, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def station_forecast_api(request, station_id):
    """
    Corrected: Fetches forecast data, providing a real forecast for temporary stations.
    """
    try:
        if station_id not in ['lora-v1', 'loradev2', 'lora-v3', 'temp-2', 'temp-3']:
            return Response({'error': 'Invalid station ID'}, status=400)

        source_station_id = 'lora-v1' if station_id.startswith('temp-') else station_id
        forecast_data, updated_at = get_s3_forecast_data(source_station_id)

        return Response({
            'station_id': station_id,
            'forecast_data': forecast_data,
            'forecast_updated_at': updated_at
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in station_forecast_api for {station_id}: {e}")
        return Response({'error': 'Failed to fetch forecast data'}, status=500)
    


@api_view(['GET'])
@csrf_exempt
def health_check_api(request):
    """Health check endpoint for React app"""
    try:
        # Test AWS connection
        aws_status = test_aws_connection()
        
        return Response({
            'status': 'healthy',
            'aws_connection': aws_status,
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# In views.py

@api_view(['GET'])
@csrf_exempt
def all_devices_api(request):
    """Get data from all devices for React app"""
    try:
        # Get data for all three devices
        lora_v1_items = get_device_data("lora-v1")
        loradev2_items = get_device_data("loradev2")
        lora_v3_items = get_device_data("lora-v3") # <-- Fetching lora-v3

        # Process all three datasets
        latest_lora_v1, avg_lora_v1, subindices_lora_v1, high_index_lora_v1 = process_device_items(lora_v1_items)
        latest_loradev2, avg_loradev2, subindices_loradev2, high_index_loradev2 = process_device_items(loradev2_items)
        latest_lora_v3, avg_lora_v3, subindices_lora_v3, high_index_lora_v3 = process_device_items(lora_v3_items) # <-- Processing lora-v3

        station_locations = {
            'lora-v1': { 'lat': 10.178322, 'lng': 76.430891, 'name': 'Station 1 (ASIET Campus)'},
            'loradev2': { 'lat': 10.170950, 'lng': 76.429628, 'name': 'Station 2 (Pothiyakkara Road)' },
            'lora-v3': { 'lat': 10.165, 'lng': 76.420, 'name': 'Station 3 (Mattoor Junction)'},
        }

        return Response({
            'lora_v1': {
                'latest_item': latest_lora_v1,
                'averages': avg_lora_v1,
                'sub_indices': {k: round(v, 2) if v is not None else None for k, v in subindices_lora_v1.items()},
                'highest_sub_index': high_index_lora_v1,
                'station_name': 'ASIET Campus Station',
                'station_info': station_locations.get("lora-v1", {})
            },
            'loradev2': {
                'latest_item': latest_loradev2,
                'averages': avg_loradev2,
                'sub_indices': {k: round(v, 2) if v is not None else None for k, v in subindices_loradev2.items()},
                'highest_sub_index': high_index_loradev2,
                'station_name': 'Mattoor Junction Station',
                'station_info': station_locations.get("loradev2", {})
            },
            # --- START FIX: ADD THIS ENTIRE BLOCK ---
            'lora-v3': {
                'latest_item': latest_lora_v3,
                'averages': avg_lora_v3,
                'sub_indices': {k: round(v, 2) if v is not None else None for k, v in subindices_lora_v3.items()},
                'highest_sub_index': high_index_lora_v3,
                'station_name': 'Station 3 (Airport Rd)',
                'station_info': station_locations.get("lora-v3", {})
            }
            # --- END FIX ---
        })

    except Exception as e:
        logger.error(f"Error in all_devices_api: {e}")
        return Response({
            'error': 'Failed to fetch device data',
            'message': str(e),
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view
from django.http import JsonResponse
import json


@api_view(["POST"])
@csrf_exempt
def user_login_api(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
        phone_number = data.get("phone_number", "").strip()
        password = data.get("password", "").strip()

        if not phone_number or not password:
            return JsonResponse({"success": False, "error": "Phone number and password are required."}, status=400)

        # Fetch user by phone number
        try:
            user = Signup.objects.get(phone_number=phone_number)
        except Signup.DoesNotExist:
            return JsonResponse({"success": False, "error": "No account found with this phone number."}, status=404)

        # Password match (you should hash passwords later)
        if user.password != password:
            return JsonResponse({"success": False, "error": "Invalid password."}, status=401)

        # HEALTH ASSESSMENT CHECK
        has_assessment = HealthAssessment.objects.filter(phone_number=phone_number).exists()

        redirect_to = "/dashboard" if has_assessment else "/health-assessment"

        return JsonResponse({
            "success": True,
            "user": {
                "user_id": user.id,
                "phone_number": user.phone_number,
                "username": user.username,
            },
            "has_health_assessment": has_assessment,
            "redirect_to": redirect_to
        })

    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


from twilio.base.exceptions import TwilioRestException # <-- Add this import at the top of views.py


# In myapp/views.py
@api_view(['POST'])
@csrf_exempt
def send_signup_otp_api(request):
    try:
        data = json.loads(request.body)
        phone_number = data.get('phone_number', '').strip()

        if not phone_number:
            return Response({'error': 'Phone number is required'}, status=400)

        # If phone exists AND verified → user already registered
        if Signup.objects.filter(phone_number=phone_number, is_verified=True).exists():
            return Response({'error': 'Phone number already registered'}, status=400)

        verification = client.verify.v2.services(VERIFY_SERVICE_SID).verifications.create(
            to=phone_number,
            channel='sms'
        )

        return Response({'success': True, 'message': 'OTP sent successfully'}, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@csrf_exempt
def verify_otp_api(request):
    try:
        data = json.loads(request.body)
        phone_number = data.get('phone_number', '').strip()
        otp_code = data.get('otp_code', '').strip()

        verification_check = client.verify.v2.services(VERIFY_SERVICE_SID).verification_checks.create(
            to=phone_number,
            code=otp_code
        )

        if verification_check.status == "approved":
            return Response({'success': True, 'message': 'OTP verified'}, status=200)
        else:
            return Response({'error': 'Invalid OTP'}, status=400)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@csrf_exempt
def signup_api(request):
    try:
        data = json.loads(request.body)
        username = data.get("username", "").strip()
        phone_number = data.get("phone_number", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not all([username, phone_number, email, password]):
            return Response({'error': 'All fields are required'}, status=400)

        # If phone exists & verified → DO NOT allow signup
        if Signup.objects.filter(phone_number=phone_number, is_verified=True).exists():
            return Response({'error': 'Phone number already registered'}, status=400)

        # Update old unverified user OR create new
        user = Signup.objects.filter(phone_number=phone_number).first()
        if user:
            user.username = username
            user.email = email
            user.password = password
            user.is_verified = True
            user.save()
            msg = "Account updated and verified."
        else:
            user = Signup.objects.create(
                username=username,
                phone_number=phone_number,
                email=email,
                password=password,
                is_verified=True
            )
            msg = "Signup successful."

        return Response({
            "success": True,
            "message": msg,
            "user": {
                "id": user.id,
                "username": user.username,
                "phone_number": user.phone_number
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@csrf_exempt
def logout_api(request):
    """API endpoint for user logout for React frontend"""
    try:
        # In a stateless API, logout is mainly handled on the frontend
        # by clearing localStorage and redirecting
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        logger.error(f"Error in logout_api: {e}")
        return Response({'error': 'Logout failed'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


logger = logging.getLogger(__name__)

def calculate_health_score_from_data(data):
    """
    Calculate health score from assessment data
    This function can be used both in API and other places
    """
    try:
        score = 0

        # Age Group scoring
        age_scores = {
            "0-12 years": 5,
            "13-18 years": 8,
            "19-40 years": 10,
            "41-60 years": 15,
            "61 years and above": 20
        }
        score += age_scores.get(data.get('age_group', ''), 0)

        # Gender scoring
        score += 2 if data.get('gender') == "Male" else 1

        # Respiratory conditions
        respiratory_conditions = data.get('respiratory_conditions', [])
        if respiratory_conditions and 'None' not in respiratory_conditions:
            score += len(respiratory_conditions) * 3

        # Smoking history
        smoking_scores = {
            "Never smoked": 0,
            "Former smoker": 10,
            "Current smoker": 25,
            "Exposed to secondhand smoke": 8
        }
        score += smoking_scores.get(data.get('smoking_history', ''), 0)

        # Living environment
        living_environment = data.get('living_environment', [])
        environment_scores = {
            "Urban area": 10,
            "Industrial zone": 15,
            "Rural area": 3,
            "Coastal area": 2
        }
        if living_environment:
            for env in living_environment:
                score += environment_scores.get(env, 0)

        # Common symptoms
        common_symptoms = data.get('common_symptoms', [])
        symptom_scores = {
            "Frequent coughing": 8,
            "Shortness of breath": 10,
            "Wheezing": 8,
            "Chest tightness": 9
        }
        if common_symptoms:
            for symptom in common_symptoms:
                score += symptom_scores.get(symptom, 0)

        # Occupational exposure
        occupation_scores = {
            "Construction/Mining": 15,
            "Chemical Industry": 15,
            "Healthcare": 8,
            "Agriculture": 10,
            "Office Environment": 3,
            "Other": 5
        }
        score += occupation_scores.get(data.get('occupational_exposure', ''), 0)

        # Medical history
        medical_history = data.get('medical_history', [])
        condition_scores = {
            "Hypertension": 8,
            "Diabetes": 8,
            "Heart Disease": 10,
            "Allergies": 5,
            "Immunocompromised": 12
        }
        if medical_history:
            for condition in medical_history:
                score += condition_scores.get(condition, 0)

        return score

    except Exception as e:
        logger.error(f"Error calculating health score: {e}")
        return 0

@api_view(['POST'])
@csrf_exempt
def calculate_health_score_api(request):
    """
    API endpoint for calculating health score without saving
    For real-time calculation in React frontend
    """
    try:
        data = json.loads(request.body)
        
        # Calculate score using the assessment data
        health_score = calculate_health_score_from_data(data)
        
        # Get risk level based on score
        def get_risk_level_from_score(score):
            if score <= 50:
                return 'Low'
            elif score <= 100:
                return 'Moderate'
            elif score <= 150:
                return 'High'
            else:
                return 'Critical'
        
        def get_risk_color_from_level(risk_level):
            risk_colors = {
                'Low': '#10b981',      # Green
                'Moderate': '#f59e0b', # Yellow
                'High': '#ef4444',     # Red
                'Critical': '#dc2626'  # Dark Red
            }
            return risk_colors.get(risk_level, '#6b7280')
        
        risk_level = get_risk_level_from_score(health_score)
        risk_color = get_risk_color_from_level(risk_level)
        
        return Response({
            'success': True,
            'health_score': health_score,
            'risk_level': risk_level,
            'risk_color': risk_color,
            'breakdown': {
                'age_group': data.get('age_group', ''),
                'gender': data.get('gender', ''),
                'respiratory_conditions': data.get('respiratory_conditions', []),
                'smoking_history': data.get('smoking_history', ''),
                'living_environment': data.get('living_environment', []),
                'common_symptoms': data.get('common_symptoms', []),
                'occupational_exposure': data.get('occupational_exposure', ''),
                'medical_history': data.get('medical_history', [])
            }
        })

    except json.JSONDecodeError as e:
        return Response({'error': 'Invalid JSON data'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in calculate_health_score_api: {e}")
        return Response({'error': f'Failed to calculate health score: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# @api_view(['POST'])
# @csrf_exempt
# def health_assessment_api(request):
#     # This log will appear in your "python manage.py runserver" terminal
#     logger.info("--- 🚀 test_api was called successfully! ---")
    
#     return Response({
#         'status': 'success',
#         'message': 'Your test_api is working!',
#         'timestamp': datetime.now().isoformat()
#     }, status=status.HTTP_200_OK)
    
# # Replace your existing health_assessment_api function with this:
@api_view(['POST'])
@csrf_exempt
def health_assessment_api(request):
    """Save or update a health assessment linked to a Signup user using phone_number."""
    logger.info("Received health assessment API request")

    try:
        data = json.loads(request.body)
        phone_number = data.get('phone_number')

        if not phone_number:
            return Response(
                {'error': 'phone_number is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = Signup.objects.get(phone_number=phone_number)
        except Signup.DoesNotExist:
            return Response(
                {'error': 'User not found. Please log in again.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------
        # HEALTH SCORE CALCULATION
        # ----------------------------
        def calculate_health_score(data):
            score = 0

            age_scores = {
                "0-12 years": 5, "13-18 years": 8, "19-40 years": 10,
                "41-60 years": 15, "61 years and above": 20
            }
            score += age_scores.get(data.get('age_group'), 0)

            score += 2 if data.get('gender') == 'Male' else (1 if data.get('gender') else 0)

            if data.get('respiratory_conditions') and 'None' not in data['respiratory_conditions']:
                score += len(data['respiratory_conditions']) * 3

            smoking_scores = {
                "Never smoked": 0, "Former smoker": 10,
                "Current smoker": 25, "Exposed to secondhand smoke": 8
            }
            score += smoking_scores.get(data.get('smoking_history'), 0)

            environment_scores = {
                "Urban area": 10, "Industrial zone": 15,
                "Rural area": 3, "Coastal area": 2
            }
            for env in data.get('living_environment', []):
                score += environment_scores.get(env, 0)

            symptom_scores = {
                "Frequent coughing": 8, "Shortness of breath": 10,
                "Wheezing": 8, "Chest tightness": 9
            }
            for s in data.get('common_symptoms', []):
                score += symptom_scores.get(s, 0)

            occupation_scores = {
                "Construction/Mining": 15, "Chemical Industry": 15,
                "Healthcare": 8, "Agriculture": 10,
                "Office Environment": 3, "Other": 5
            }
            score += occupation_scores.get(data.get('occupational_exposure'), 0)

            condition_scores = {
                "Hypertension": 8, "Diabetes": 8, "Heart Disease": 10,
                "Allergies": 5, "Immunocompromised": 12
            }
            for c in data.get('medical_history', []):
                score += condition_scores.get(c, 0)

            return score

        health_score = calculate_health_score(data)

        # ----------------------------
        # CREATE OR UPDATE ASSESSMENT
        # ----------------------------
        try:
            assessment, created = HealthAssessment.objects.update_or_create(
                phone_number=phone_number,
                defaults={
                    'user': user,
                    'age_group': data.get('age_group', ''),
                    'gender': data.get('gender', ''),
                    'respiratory_conditions': data.get('respiratory_conditions', []),
                    'smoking_history': data.get('smoking_history', ''),
                    'living_environment': data.get('living_environment', []),
                    'common_symptoms': data.get('common_symptoms', []),
                    'occupational_exposure': data.get('occupational_exposure', ''),
                    'medical_history': data.get('medical_history', []),
                    'health_score': health_score,
                    'updated_at': datetime.now()
                }
            )
        except IntegrityError:
            assessment = HealthAssessment.objects.get(phone_number=phone_number)
            assessment.health_score = health_score
            assessment.updated_at = datetime.now()
            assessment.save()
            created = False

        # ----------------------------
        # RISK LEVEL & COLORS
        # ----------------------------
        def get_risk_level(score):
            if score <= 50: return 'Excellent'
            elif score <= 80: return 'Good'
            elif score <= 120: return 'Moderate'
            elif score <= 150: return 'Warning'
            elif score <= 200: return 'High'
            return 'Critical'

        def get_risk_color(score):
            if score <= 50: return '#10b981'
            elif score <= 80: return '#8b5cf6'
            elif score <= 120: return '#f59e0b'
            elif score <= 150: return '#f97316'
            elif score <= 200: return '#ef4444'
            return '#dc2626'

        return Response({
            'success': True,
            'message': 'Health assessment saved successfully',
            'created': created,
            'health_score': health_score,
            'risk_level': get_risk_level(health_score),
            'risk_color': get_risk_color(health_score),
            'assessment_id': assessment.id
        }, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON format'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in health_assessment_api: {e}", exc_info=True)
       

# myapp/views.py
@api_view(['GET'])
@csrf_exempt
def dashboard_api(request):
    """
    REALTIME Dashboard API (Final Version)
    - Uses phone_number
    - Fetches realtime data from DynamoDB
    - Fetches 4-day forecast from S3
    - Returns health + stations + forecasts
    """

    # 1. Read phone number
    phone_number = request.GET.get("phone_number")
    if not phone_number:
        return Response({"error": "phone_number is required"}, status=400)

    # 2. User + Health Assessment
    try:
        user = Signup.objects.get(phone_number=phone_number)
        ha = HealthAssessment.objects.get(phone_number=phone_number)

        health_data = {
            "score": ha.health_score,
            "risk_level": ha.get_risk_level(),
            "recommendations": ha.get_recommendations(),
        }

    except Signup.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    except HealthAssessment.DoesNotExist:
        return Response({"error": "Health assessment missing"}, status=404)

    # 3. Realtime AWS DynamoDB data
    try:
        initialize_aws_resources()

        v1 = get_device_data("lora-v1", limit=24)
        v2 = get_device_data("loradev2", limit=24)
        v3 = get_device_data("lora-v3", limit=24)

        # Process data
        l1, a1, s1, h1 = process_device_items(v1)
        l2, a2, s2, h2 = process_device_items(v2)
        l3, a3, s3, h3 = process_device_items(v3)

        station_locations = {
            'lora-v1': {'lat': 10.178322, 'lng': 76.430591, 'name': 'Station 1 (ASIET Campus)'},
            'loradev2': {'lat': 10.1822047218, 'lng': 76.4285034311, 'name': 'Station 2 (Pothiyakkara Road)'},
            'lora-v3': {'lat': 10.1732549029, 'lng': 76.4275559038, 'name': 'Station 3 (Mattoor Junction)'},
        }

        realtime_data = {
            'lora-v1': {
                "averages": a1,
                "highest_sub_index": h1,
                "sub_indices": s1,
                "station_info": station_locations["lora-v1"],
                "latest_readings": l1,
            },
            'loradev2': {
                "averages": a2,
                "highest_sub_index": h2,
                "sub_indices": s2,
                "station_info": station_locations["loradev2"],
                "latest_readings": l2,
            },
            'lora-v3': {
                "averages": a3,
                "highest_sub_index": h3,
                "sub_indices": s3,
                "station_info": station_locations["lora-v3"],
                "latest_readings": l3,
            }
        }

    except Exception as e:
        logger.error(f"Realtime fetch error: {e}")
        return Response({"error": "Failed to fetch realtime AWS data"}, status=500)
    print("🔥🔥🔥 DASHBOARD API HIT 🔥🔥🔥")

    # 4. Forecasts
    forecasts = {}
    for sid in realtime_data:
        forecast_data, _ = get_s3_forecast_data(sid)
        forecasts[sid] = forecast_data

    # 5. Return Final Response
    return Response({
        "health_data": health_data,
        "stations": realtime_data,
        "forecasts": forecasts,
        "updated_at": timezone.now().isoformat()
    })








@api_view(['GET', 'POST'])
@csrf_exempt
def health_assessment_status(request):
    """
    Checks if a user has completed a health assessment.
    Accepts either phone_number or username via GET or POST.
    """
    try:
        phone_number = request.GET.get('phone_number') or request.data.get('phone_number')
        username = request.GET.get('username') or request.data.get('username')

        user_qs = None
        if phone_number:
            user_qs = Signup.objects.filter(phone_number=phone_number)
        elif username:
            user_qs = Signup.objects.filter(username=username)

        if not user_qs or not user_qs.exists():
            return JsonResponse({
                "success": False,
                "error": "User not found"
            }, status=404)

        user = user_qs.first()
        has_assessment = HealthAssessment.objects.filter(phone_number=user.phone_number).exists()

        return JsonResponse({
            "success": True,
            "has_assessment": has_assessment
        })

    except Exception as e:
        return JsonResponse({
            "success": False,
            "error": str(e)
        }, status=400)

    # Add this to your views.py file - No model changes needed!

import json
from django.core.cache import cache
from datetime import datetime, timedelta

@api_view(['POST'])
@csrf_exempt
def save_user_location_api(request):
    """
    Save user location temporarily using Django cache (no database changes needed)
    This stores location for 1 hour and can be retrieved for IDW calculations
    """
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        accuracy = data.get('accuracy')
        source = data.get('source', 'gps')
        
        print(f"DEBUG: Saving location for user: {username}")
        print(f"DEBUG: Location data: lat={latitude}, lng={longitude}, accuracy={accuracy}")
        
        if not username:
            return Response({'error': 'Username is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        if not latitude or not longitude:
            return Response({'error': 'Latitude and longitude are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Validate coordinates
        try:
            lat = float(latitude)
            lng = float(longitude)
            acc = float(accuracy) if accuracy else None
        except (ValueError, TypeError):
            return Response({'error': 'Invalid coordinate values'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check if coordinates are reasonable for India/Kerala
        if not (8.0 <= lat <= 37.0 and 68.0 <= lng <= 97.0):
            return Response({'error': 'Coordinates outside expected range'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Store location data in cache for 1 hour
        location_data = {
            'username': username,
            'latitude': lat,
            'longitude': lng,
            'accuracy': acc,
            'source': source,
            'timestamp': datetime.now().isoformat(),
            'saved_at': datetime.now().timestamp()
        }
        
        # Use cache key based on username
        cache_key = f"user_location_{username}"
        cache.set(cache_key, location_data, timeout=3600)  # 1 hour
        
        print(f"DEBUG: Location saved to cache with key: {cache_key}")
        
        # Optional: Also store in session for backup
        if hasattr(request, 'session'):
            request.session[f'location_{username}'] = location_data
        
        return Response({
            'success': True,
            'message': 'Location saved successfully',
            'location': {
                'latitude': lat,
                'longitude': lng,
                'accuracy': acc,
                'source': source
            },
            'cached_for': '1 hour'
        })

    except json.JSONDecodeError as e:
        return Response({'error': 'Invalid JSON data'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"DEBUG: Error saving location: {e}")
        return Response({'error': f'Failed to save location: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@csrf_exempt  
def get_user_location_api(request):
    """
    Retrieve user location from cache
    """
    try:
        username = request.GET.get('username')
        
        if not username:
            return Response({'error': 'Username is required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Try to get from cache first
        cache_key = f"user_location_{username}"
        location_data = cache.get(cache_key)
        
        if location_data:
            # Check if data is not too old (1 hour)
            saved_at = location_data.get('saved_at', 0)
            current_time = datetime.now().timestamp()
            
            if current_time - saved_at < 3600:  # Less than 1 hour old
                return Response({
                    'success': True,
                    'location': location_data,
                    'source': 'cache'
                })
        
        # Try to get from session as backup
        if hasattr(request, 'session'):
            session_location = request.session.get(f'location_{username}')
            if session_location:
                return Response({
                    'success': True,
                    'location': session_location,
                    'source': 'session'
                })
        
        return Response({
            'success': False,
            'message': 'No location data found or data expired',
            'location': None
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"DEBUG: Error retrieving location: {e}")
        return Response({'error': f'Failed to retrieve location: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Add this helper function to get user location for IDW calculations
def get_user_location_for_idw(username):
    """
    Helper function to get user location for IDW calculations
    Returns (lat, lng, accuracy) or (None, None, None) if not found
    """
    try:
        # Try cache first
        cache_key = f"user_location_{username}"
        location_data = cache.get(cache_key)
        
        if location_data:
            return (
                location_data.get('latitude'),
                location_data.get('longitude'), 
                location_data.get('accuracy')
            )
        
        return (None, None, None)
        
    except Exception as e:
        print(f"DEBUG: Error getting location for IDW: {e}")
        return (None, None, None)

# In your views.py, replace the existing map_api with this corrected version.
# In your views.py, use this single, optimized function for your map page.
# In your views.py, add these two functions.
# You can remove any older versions of map_api.
# In myapp/views.py
import random # <-- Add this import at the top of your file





@api_view(['GET'])
@csrf_exempt
def station_forecast_api(request, station_id):
    """
    Provides forecast data for all 5 stations.
    """
    try:
        valid_ids = ['lora-v1', 'loradev2', 'lora-v3', 'temp-2', 'temp-3']
        if station_id not in valid_ids:
            return Response({'error': 'Invalid station ID'}, status=400)

        source_station_id = 'lora-v1' if station_id.startswith('temp-') else station_id
        forecast_data, updated_at = get_s3_forecast_data(source_station_id)

        return Response({
            'station_id': station_id,
            'forecast_data': forecast_data,
            'forecast_updated_at': updated_at
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error in station_forecast_api for {station_id}: {e}")
        return Response({'error': 'Failed to fetch forecast data'}, status=500)
    


@api_view(['GET'])
@csrf_exempt
def health_report_api(request):
    """
    FINAL, CORRECTED API: Provides all necessary data for the Health Report,
    is self-sufficient, and NO LONGER incorrectly redirects the user.
    """
    # Accept either phone_number or username for compatibility.
    phone_number = request.GET.get('phone_number') or request.GET.get('phone')
    username = request.GET.get('username')

    if not phone_number and not username:
        return Response({'error': 'phone_number or username is required'}, status=status.HTTP_400_BAD_REQUEST)

    # --- START: THE KEY FIX ---
    # Prefer lookup by phone_number; fall back to username if phone_number not provided.
    user = None
    try:
        if phone_number:
            user = Signup.objects.get(phone_number=phone_number)
        else:
            user = Signup.objects.get(username=username)
    except Signup.DoesNotExist:
        lookup_val = phone_number if phone_number else username
        logger.error(f"User '{lookup_val}' not found when trying to access health report.")
        return Response({'error': f"User '{lookup_val}' not found. Please log in again."}, status=status.HTTP_404_NOT_FOUND)

    try:
        # Step 2: Find the assessment for that specific user.
        # HealthAssessment may be linked by phone_number or user foreign key; try both.
        assessment = None
        if phone_number:
            assessment = HealthAssessment.objects.filter(phone_number=phone_number).first()
        if not assessment:
            assessment = HealthAssessment.objects.filter(user=user).first()
        if not assessment:
            raise HealthAssessment.DoesNotExist()
    except HealthAssessment.DoesNotExist:
        # If the assessment is missing, it's a data problem.
        logger.error(f"Health assessment not found for user '{user.username}'.")
        return Response({
            'error': 'Your health assessment data could not be found. Please complete it again to generate a report.'
        }, status=status.HTTP_404_NOT_FOUND)

    # --- END: THE KEY FIX ---


    # --- Fetch station data (self-sufficient logic from previous fix) ---
    try:
        all_stations_data = cache.get('map_realtime_data')
        if not all_stations_data:
            logger.warning("Cache miss for station data in health_report_api. Fetching fresh data.")
            # This logic makes the function independent and should include your full station fetching logic
            if not initialize_aws_resources():
                raise Exception('AWS initialization failed')

            lora_v1_items = get_device_data("lora-v1", limit=24)
            loradev2_items = get_device_data("loradev2", limit=24)
            _, avg_lora_v1, _, high_index_lora_v1 = process_device_items(lora_v1_items)
            _, avg_loradev2, _, high_index_loradev2 = process_device_items(loradev2_items)
            
            station_locations = {
                'lora-v1': { 'lat': 10.178322, 'lng': 76.430891, 'name': 'Station 1 (ASIET Campus)' },
                'loradev2': { 'lat': 10.182204, 'lng': 76.428503, 'name': 'Station 2 (Pothiyakkara Road)' },
                # ... include your temp stations here as well
            }

            all_stations_data = {
                'lora-v1': {'averages': avg_lora_v1, 'highest_sub_index': high_index_lora_v1, 'station_info': station_locations['lora-v1']},
                'loradev2': {'averages': avg_loradev2, 'highest_sub_index': high_index_loradev2, 'station_info': station_locations['loradev2']},
                # ... add simulated data for temp stations if needed
            }
            cache.set('map_realtime_data', all_stations_data, 60)
        
    except Exception as e:
        logger.error(f"CRITICAL ERROR fetching sensor data for health report: {e}", exc_info=True)
        return Response({'error': 'Could not fetch required sensor data to generate the report.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # --- Fetch Forecast for all stations ---
    forecasts = {}
    for station_id in all_stations_data.keys():
        source_station_id = 'lora-v1' if station_id.startswith('temp-') else station_id
        forecast_data, updated_at = get_s3_forecast_data(source_station_id)
        forecasts[station_id] = {'data': forecast_data, 'updated_at': updated_at}

    # --- Construct Final JSON Response for React ---
    # Safely build recommendations and priority actions
    try:
        recs = assessment.get_recommendations()
    except Exception:
        recs = []
    if isinstance(recs, str):
        recs = [recs]
    try:
        priority_actions = assessment.get_priority_actions() if hasattr(assessment, 'get_priority_actions') else []
    except Exception:
        priority_actions = []

    response_data = {
        'username': getattr(user, 'username', getattr(user, 'phone_number', '')),
        'health_assessment': {
            'score': getattr(assessment, 'health_score', None),
            'risk_level': assessment.get_risk_level() if hasattr(assessment, 'get_risk_level') else None,
            'recommendations': recs,
            'priority_actions': priority_actions,
            'details': {
                'Age Group': getattr(assessment, 'age_group', None),
                'Gender': getattr(assessment, 'gender', None),
                'Respiratory Conditions': getattr(assessment, 'respiratory_conditions', []),
                'Smoking History': getattr(assessment, 'smoking_history', None),
                'Living Environment': getattr(assessment, 'living_environment', []),
            }
        },
        'stations': all_stations_data,
        'forecasts': forecasts
    }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@csrf_exempt
def csrf_token_api(request):
    """Return a CSRF token for the frontend to consume (GET /csrf/)."""
    try:
        token = get_token(request)
        return JsonResponse({'csrf': token})
    except Exception as e:
        logger.error(f"Failed to generate CSRF token: {e}")
        return JsonResponse({'error': 'Failed to generate CSRF token'}, status=500)


from django.shortcuts import get_object_or_404
from .models import User, FamilyMembers # Make sure FamilyMembers is imported

@api_view(['GET', 'POST'])
@csrf_exempt
def family_members_api(request):
    """
    API to get a user's family members or add a new one.
    """
    username = request.GET.get('username') if request.method == 'GET' else request.data.get('username')
    if not username:
        return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        parent_user = Signup.objects.get(username=username)
    except Signup.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        family_members = parent_user.family_members.all().order_by('name')
        data = [{'id': member.id, 'name': member.name, 'age': member.age, 'relationship': member.relationship} for member in family_members]
        return Response(data, status=status.HTTP_200_OK)

    if request.method == 'POST':
        data = request.data
        name = data.get('name', '').strip()
        age = data.get('age')
        relationship = data.get('relationship', '').strip()

        if not name or not age or not relationship:
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            member = FamilyMembers.objects.create(
                parent_user=parent_user,
                name=name,
                age=int(age),
                relationship=relationship
            )
            return Response({'id': member.id, 'name': member.name, 'age': member.age, 'relationship': member.relationship}, status=status.HTTP_201_CREATED)
        except ValueError:
            return Response({'error': 'Please enter a valid age.'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@csrf_exempt
def delete_family_member_api(request, member_id):
    """
    API to delete a family member.
    """
    try:
        member = get_object_or_404(FamilyMembers, id=member_id)
        # Optional: Add a check to ensure the request is from the correct parent_user
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # In myapp/views.py


@api_view(['GET', 'POST'])
@csrf_exempt
def support_api(request):
    """
    Simple API for user support/complaints.
    GET: list recent support cases (optional ?email= filter)
    POST: create a new support case with JSON body { email, case_description }
    """
    try:
        if request.method == 'GET':
            email = request.GET.get('email')
            qs = Support.objects.all().order_by('-submitted_at')
            if email:
                qs = qs.filter(email__iexact=email)
            data = [
                {
                    'sl_no': s.sl_no,
                    'email': s.email,
                    'case_description': s.case_description,
                    'submitted_at': s.submitted_at,
                }
                for s in qs[:100]
            ]
            return Response(data, status=status.HTTP_200_OK)

        # POST
        payload = request.data
        email = (payload.get('email') or '').strip()
        case_description = (payload.get('case_description') or '').strip()

        if not email or not case_description:
            return Response({'error': 'Both email and case_description are required'}, status=status.HTTP_400_BAD_REQUEST)

        support = Support.objects.create(email=email, case_description=case_description)
        return Response({'sl_no': support.sl_no, 'message': 'Support case submitted'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.exception('Error in support_api')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['PUT'])
@csrf_exempt
def update_family_member_api(request, member_id):
    """ API to update a family member's details. """
    try:
        member = get_object_or_404(FamilyMembers, id=member_id)
        data = request.data
        member.name = data.get('name', member.name).strip()
        member.age = int(data.get('age', member.age))
        member.relationship = data.get('relationship', member.relationship).strip()
        member.save()
        return Response({'id': member.id, 'name': member.name, 'age': member.age, 'relationship': member.relationship})
    except ValueError:
        return Response({'error': 'Invalid age provided.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@csrf_exempt
def delete_family_member_api(request, member_id):
    """ API to delete a family member. """
    try:
        member = get_object_or_404(FamilyMembers, id=member_id)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
@csrf_exempt
def admin_login_api(request):
    """ API for admin login. """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    try:
        # IMPORTANT: In a real project, use Django's built-in auth with hashed passwords.
        user = AdminUserlogin.objects.get(username=username, password=password)
        # In a real app, you would generate and return a JWT (JSON Web Token) here.
        return Response({'success': True, 'username': user.username}, status=status.HTTP_200_OK)
    except AdminUserlogin.DoesNotExist:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

# ADD THIS COMPLETE admin_dashboard_api to your views.py 
# (Keep your existing admin_login_api unchanged)

@api_view(['GET'])
@csrf_exempt
def admin_dashboard_api(request):
    """
    FIXED Admin Dashboard API - Works with existing User model (no created_at field)
    Includes complete sensor data: PM2.5, PM10, CO, NH3, NO2, SO2, O3, temperature, humidity, pressure
    """
    try:
        # Initialize AWS resources with fallback
        try:
            if not initialize_aws_resources():
                logger.warning("AWS initialization failed, using fallback data")
        except:
            logger.warning("AWS functions not available, using fallback")

        # Get data for both stations with error handling
        try:
            lora_v1_items = get_device_data("lora-v1", limit=24)
        except:
            lora_v1_items = []
            
        try:
            loradev2_items = get_device_data("loradev2", limit=24)
        except:
            loradev2_items = []

        # Process both datasets for AQI calculation with fallback
        try:
            _, _, _, high_index_lora_v1 = process_device_items(lora_v1_items)
        except:
            high_index_lora_v1 = 0
            
        try:
            _, _, _, high_index_loradev2 = process_device_items(loradev2_items)
        except:
            high_index_loradev2 = 0

        # Get COMPLETE sensor data including temp, humidity, pressure
        def get_complete_sensor_data(items):
            """Extract complete sensor data including ALL environmental parameters"""
            if not items:
                return {
                    'pm25': 'N/A', 'pm10': 'N/A', 'co': 'N/A', 'nh3': 'N/A',
                    'no2': 'N/A', 'so2': 'N/A', 'o3': 'N/A',
                    'temperature': 'N/A', 'humidity': 'N/A', 'pressure': 'N/A',
                    'received_at': None, 'device_status': 'OFFLINE',
                    
                }
            
            try:
                latest_item = items[0]
                parsed_payload = parse_payload(latest_item.get('payload', {}))
                
                # Extract all sensor parameters including environmental data
                complete_data = {
                    # Air quality parameters
                    'pm25': parsed_payload.get('pm25', 'N/A'),
                    'pm10': parsed_payload.get('pm10', 'N/A'),
                    'co': parsed_payload.get('co', 'N/A'),
                    'nh3': parsed_payload.get('nh3', 'N/A'),
                    'no2': parsed_payload.get('no2', 'N/A'),
                    'so2': parsed_payload.get('so2', 'N/A'),
                    'o3': parsed_payload.get('o3', 'N/A'),
                    
                    # Environmental parameters - THE KEY ADDITIONS FOR ADMIN DASHBOARD
                    'temperature': parsed_payload.get('temperature', parsed_payload.get('temp', 'N/A')),
                    'humidity': parsed_payload.get('humidity', parsed_payload.get('hum', 'N/A')),
                    'pressure': parsed_payload.get('pressure', parsed_payload.get('pre', 'N/A')),
                    
                    # Metadata
                    'received_at': latest_item.get('received_at'),
                    'date': parsed_payload.get('date', 'N/A'),
                    'time': parsed_payload.get('time', 'N/A'),
                    'battery': parsed_payload.get('battery', parsed_payload.get('bat', 'N/A')),
                    'signal_strength': parsed_payload.get('rssi', parsed_payload.get('signal', 'Unknown')),
                    'device_status': 'ONLINE' if latest_item.get('received_at') else 'OFFLINE'
                }
                return complete_data
            except Exception as e:
                logger.error(f"Error parsing sensor data: {e}")
                return {
                    'pm25': 'Error', 'pm10': 'Error', 'co': 'Error', 'nh3': 'Error',
                    'no2': 'Error', 'so2': 'Error', 'o3': 'Error',
                    'temperature': 'Error', 'humidity': 'Error', 'pressure': 'Error',
                    'received_at': None, 'device_status': 'ERROR'
                }

        latest_complete_v1 = get_complete_sensor_data(lora_v1_items)
        latest_complete_v2 = get_complete_sensor_data(loradev2_items)

        # Enhanced user data WITHOUT requiring created_at field
        users = []
        try:
            for user in User.objects.all().order_by('-id'):
                # Get last login from login table
                try:
                    last_login_record = login.objects.filter(
                        phone_number=user.phone_number, 
                        otp_verified=True
                    ).order_by('-id').first()
                    last_login = last_login_record.created_at if last_login_record else None
                except:
                    last_login = None

                # Get health assessment status
                try:
                    has_health_assessment = HealthAssessment.objects.filter(user=user).exists()
                except:
                    has_health_assessment = False
                
                # FIXED: Use current timestamp if no created_at field exists
                user_created = datetime.now().isoformat()  # Fallback since User model has no created_at
                
                users.append({
                    'id': user.id,
                    'name': user.name,
                    'phone_number': user.phone_number,
                    'created_at': user_created,  # Using fallback timestamp
                    'last_login': last_login.isoformat() if last_login else None,
                    'has_health_assessment': has_health_assessment,
                    'status': 'Active' if last_login else 'Inactive'
                })
        except Exception as e:
            logger.error(f"Error fetching users: {e}")
            users = []

        # Enhanced health assessments with risk analysis
        health_assessments = []
        try:
            for assessment in HealthAssessment.objects.select_related('user').all():
                try:
                    risk_level = assessment.get_risk_level()
                except:
                    risk_level = 'Unknown'
                    
                health_assessments.append({
                    'id': assessment.id,
                    'user_id': assessment.user.id,
                    'user_name': assessment.user.name,
                    'age_group': assessment.age_group,
                    'gender': assessment.gender,
                    'health_score': assessment.health_score,
                    'risk_level': risk_level,
                    'is_high_risk': assessment.health_score >= 100,
                    'created_at': assessment.created_at.isoformat(),
                    'updated_at': assessment.updated_at.isoformat(),
                    # Detailed breakdown
                    'respiratory_conditions': assessment.respiratory_conditions,
                    'smoking_history': assessment.smoking_history,
                    'living_environment': assessment.living_environment,
                    'medical_history': assessment.medical_history
                })
        except Exception as e:
            logger.error(f"Error fetching health assessments: {e}")
            health_assessments = []

        # System analytics
        total_users = len(users)
        active_users = len([u for u in users if u['last_login']])
        high_risk_users = len([h for h in health_assessments if h['is_high_risk']])
        
        # Station health check
        station_health = {
            'lora-v1': {
                'status': 'ONLINE' if latest_complete_v1.get('received_at') else 'OFFLINE',
                'last_seen': latest_complete_v1.get('received_at'),
                'data_points': len(lora_v1_items),
                'signal_quality': latest_complete_v1.get('signal_strength', 'Unknown')
            },
            'loradev2': {
                'status': 'ONLINE' if latest_complete_v2.get('received_at') else 'OFFLINE',
                'last_seen': latest_complete_v2.get('received_at'),
                'data_points': len(loradev2_items),
                'signal_quality': latest_complete_v2.get('signal_strength', 'Unknown')
            }
        }

        # Calculate average AQI safely
        aqi_values = [aqi for aqi in [high_index_lora_v1, high_index_loradev2] if aqi is not None and aqi > 0]
        average_aqi = round(sum(aqi_values) / len(aqi_values)) if aqi_values else None

        # COMPLETE response with all sensor data
        response_data = {
            'station_data': {
                'lora-v1': {
                    'latest_item': latest_complete_v1,  # Includes temp, humidity, pressure
                    'aqi': high_index_lora_v1,
                    'health': station_health['lora-v1']
                },
                'loradev2': {
                    'latest_item': latest_complete_v2,  # Includes temp, humidity, pressure
                    'aqi': high_index_loradev2,
                    'health': station_health['loradev2']
                }
            },
            'users': users,
            'health_assessments': health_assessments,
            'analytics': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': total_users - active_users,
                'health_assessments_completed': len(health_assessments),
                'high_risk_users': high_risk_users,
                'system_uptime': '99.5%',
                'data_collection_rate': f"{len(lora_v1_items) + len(loradev2_items)}/48 (last 24h)",
                'average_aqi': average_aqi
            },
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Admin dashboard API successful - Users: {total_users}, Assessments: {len(health_assessments)}")
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Critical error in admin_dashboard_api: {e}", exc_info=True)
        # Return minimal fallback response to prevent error screen
        return Response({
            'station_data': {
                'lora-v1': {
                    'latest_item': {
                        'pm25': 25, 'pm10': 35, 'co': 2, 'nh3': 15, 'no2': 20, 'so2': 10, 'o3': 30,
                        'temperature': 28, 'humidity': 65, 'pressure': 1013,
                        'received_at': datetime.now().isoformat(), 'device_status': 'OFFLINE'
                    },
                    'aqi': 50,
                    'health': {'status': 'OFFLINE', 'last_seen': None, 'data_points': 0, 'signal_quality': 'Unknown'}
                },
                'loradev2': {
                    'latest_item': {
                        'pm25': 30, 'pm10': 40, 'co': 3, 'nh3': 18, 'no2': 25, 'so2': 12, 'o3': 35,
                        'temperature': 29, 'humidity': 70, 'pressure': 1012,
                        'received_at': datetime.now().isoformat(), 'device_status': 'OFFLINE'
                    },
                    'aqi': 60,
                    'health': {'status': 'OFFLINE', 'last_seen': None, 'data_points': 0, 'signal_quality': 'Unknown'}
                }
            },
            'users': [],
            'health_assessments': [],
            'analytics': {
                'total_users': 0,
                'active_users': 0,
                'inactive_users': 0,
                'health_assessments_completed': 0,
                'high_risk_users': 0,
                'system_uptime': '0%',
                'data_collection_rate': '0/48 (last 24h)',
                'average_aqi': 55
            },
            'timestamp': datetime.now().isoformat(),
            'error_handled': True,
            'note': 'Fallback data due to error: ' + str(e)
        }, status=status.HTTP_200_OK)


# ALSO ADD these supporting APIs (keep your admin_login_api unchanged):

@api_view(['PUT'])
@csrf_exempt
def update_user_api(request, user_id):
    """FIXED: Enhanced user update API"""
    try:
        user = get_object_or_404(User, id=user_id)
        
        # Parse request data safely
        try:
            if hasattr(request, 'data') and request.data:
                data = request.data
            else:
                data = json.loads(request.body)
        except (json.JSONDecodeError, AttributeError):
            return Response({'error': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate fields
        new_name = data.get('name', '').strip()
        new_phone = data.get('phone_number', '').strip()
        
        if not new_name or not new_phone:
            return Response({'error': 'Name and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for duplicates
        if User.objects.filter(phone_number=new_phone).exclude(id=user_id).exists():
            return Response({'error': 'Phone number already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update user
        old_phone = user.phone_number
        user.name = new_name
        user.phone_number = new_phone
        user.save()
        
        # Update login records if phone changed
        if old_phone != new_phone:
            try:
                login.objects.filter(phone_number=old_phone).update(phone_number=new_phone)
            except:
                pass
        
        logger.info(f"Admin updated user {user_id}: {user.name}")
        
        return Response({
            'id': user.id,
            'name': user.name,
            'phone_number': user.phone_number,
            'success': True,
            'message': 'User updated successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating user {user_id}: {e}")
        return Response({'error': f'Failed to update user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@csrf_exempt
def delete_user_api(request, user_id):
    """FIXED: Enhanced user delete API with cascade"""
    try:
        user = get_object_or_404(User, id=user_id)
        user_name = user.name
        user_phone = user.phone_number
        
        # Delete related data safely
        try:
            HealthAssessment.objects.filter(user=user).delete()
            FamilyMembers.objects.filter(parent_user=user).delete()
            login.objects.filter(phone_number=user_phone).delete()
            user.delete()
            
            logger.info(f"Admin deleted user: {user_name}")
            
            return Response({
                'success': True,
                'message': f'User {user_name} deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error during user deletion: {e}")
            return Response({'error': 'Failed to delete user completely'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Error deleting user {user_id}: {e}")
        return Response({'error': f'Failed to delete user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@csrf_exempt  
def admin_create_user_api(request):
    """Create new user API for admin"""
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        phone_number = data.get('phone_number', '').strip()
        
        if not name or not phone_number:
            return Response({'error': 'Name and phone number are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(phone_number=phone_number).exists():
            return Response({'error': 'User with this phone number already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user and login record
        user = User.objects.create(name=name, phone_number=phone_number)
        login.objects.create(phone_number=phone_number, otp_verified=False)
        
        logger.info(f"Admin created user: {name}")
        
        return Response({
            'id': user.id,
            'name': user.name,
            'phone_number': user.phone_number,
            'success': True,
            'message': 'User created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return Response({'error': f'Failed to create user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@csrf_exempt
def admin_export_data_api(request):
    """Export data API for admin"""
    try:
        export_type = request.GET.get('type', 'users')
        
        if export_type == 'users':
            users = User.objects.all().values('id', 'name', 'phone_number')
            data = list(users)
        elif export_type == 'health_assessments':
            assessments = HealthAssessment.objects.select_related('user').all()
            data = [{
                'id': a.id,
                'user_name': a.user.name,
                'health_score': a.health_score,
                'risk_level': a.get_risk_level(),
                'age_group': a.age_group,
                'gender': a.gender,
                'created_at': a.created_at.isoformat(),
                'updated_at': a.updated_at.isoformat()
            } for a in assessments]
        elif export_type == 'sensor_data':
            # Basic sensor data export
            data = [{'message': 'Sensor data export - contact admin for full implementation'}]
        else:
            return Response({'error': 'Invalid export type'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'export_type': export_type,
            'data': data,
            'count': len(data),
            'exported_at': datetime.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error exporting data: {e}")
        return Response({'error': f'Failed to export data: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# In views.py, REPLACE your user_aqi_api function with this:

@api_view(['GET'])
@csrf_exempt
def user_aqi_api(request):
    """
    FIXED: Calculates and returns personalized AQI AND all individual
    pollutant values using Inverse Distance Weighting (IDW).
    This now populates the "MetricCards" on the dashboard.
    """
    try:
        user_lat = float(request.GET.get("lat"))
        user_lon = float(request.GET.get("lng"))
    except (TypeError, ValueError):
        return Response({"error": "Invalid or missing lat/lng coordinates"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # 1. Get all live station data from cache
        all_stations_data = cache.get('all_stations_realtime_data')

        if not all_stations_data:
            # If cache is empty, run the map API logic to fill it
            logger.warning("Cache miss for all_stations_realtime_data. Triggering fetch.")
            # We call the function version of your map API
            map_api_response = map_realtimedata_api(request._request)
            all_stations_data = map_api_response.data.get('stations')

            if not all_stations_data:
                logger.error("Failed to fetch all_stations_realtime_data even after trigger.")
                return Response({"error": "Sensor data is not available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # 2. Format data for IDW function
        sensor_data_for_idw = []
        nearest_sensors = []

        for station_id, data in all_stations_data.items():
            # Only use REAL stations with valid AQI for calculation
            if not station_id.startswith('temp-') and data.get('highest_sub_index') is not None:
                info = data['station_info']
                distance = calculate_distance(user_lat, user_lon, info['lat'], info['lng'])

                # --- START: THE FIX ---
                # Build a richer object for the interpolation function
                sensor_info = {
                    "sensor_id": station_id,
                    "lat": info['lat'],
                    "lon": info['lng'],
                    "aqi": data['highest_sub_index'], # The final AQI
                    "averages": data.get('averages', {}), # The safe averages
                    "latest_readings": data.get('latest_readings', {}), # For weather
                    "distance": distance
                }
                # --- END: THE FIX ---
                sensor_data_for_idw.append(sensor_info)
                nearest_sensors.append(sensor_info)

        if not sensor_data_for_idw:
            return Response({"error": "No valid sensor data for calculation"}, status=status.HTTP_404_NOT_FOUND)

        # 3. Calculate IDW using the NEW helper
        # This returns both the individual values and the final AQI
        interpolated_values, final_aqi = idw_interpolate_all(user_lat, user_lon, sensor_data_for_idw)
        
        aqi_status = get_aqi_status(final_aqi) if final_aqi is not None else "Unknown"

        # 4. Find closest sensor for reference
        nearest_sensor = min(nearest_sensors, key=lambda x: x["distance"])

        # 5. Return the final, RICH answer
        return Response({
            "user_aqi": final_aqi, # The main AQI number
            "interpolated_values": interpolated_values, # The fix for metric cards
            "status": aqi_status,
            "source": "idw_interpolation",
            "sensor_count": len(sensor_data_for_idw),
            "closest_sensor": {
                "sensor_id": nearest_sensor["sensor_id"],
                "distance_km": round(nearest_sensor["distance"], 3)
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in user_aqi_api: {e}", exc_info=True)
        return Response({"error": f"Internal server error: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



# In views.py, add this new function

def idw_interpolate_all(user_lat, user_lon, sensors, power=2):
    """
    Calculates interpolated values for all pollutants AND weather using IDW.
    'sensors' must be a list of dicts, where each dict has:
    - 'lat', 'lon' (float)
    - 'distance' (float)
    - 'averages' (dict of 24hr pollutant averages)
    - 'latest_readings' (dict of latest sensor item, for weather)
    - 'aqi' (the final station AQI)
    """
    try:
        # Pollutants from 24hr average
        pollutants_to_interpolate = ['nh3', 'o3', 'pm25', 'pm10', 'co', 'so2', 'no2']
        # Weather from latest reading
        weather_to_interpolate = ['temp', 'hum', 'pre']
        
        all_params = pollutants_to_interpolate + weather_to_interpolate
        numerator = {p: 0 for p in all_params}
        denominator = {p: 0 for p in all_params}

        for sensor in sensors:
            distance = sensor.get('distance', 0.001)
            
            # Use 0.001 as a minimum to avoid division by zero
            if distance < 0.001: 
                # User is AT the sensor. Return this sensor's data.
                final_values = sensor.get('averages', {})
                latest = sensor.get('latest_readings', {}) or {}
                
                # Add weather data, checking alternate keys
                final_values['temp'] = latest.get('temp', latest.get('temperature'))
                final_values['hum'] = latest.get('hum', latest.get('humidity'))
                final_values['pre'] = latest.get('pre', latest.get('pressure'))
                
                # Clean Nones and return
                final_values = {k: v for k, v in final_values.items() if v is not None and k in all_params}
                return final_values, sensor.get('aqi', 0)

            weight = 1.0 / (distance ** power)
            
            sensor_averages = sensor.get('averages', {})
            sensor_readings = sensor.get('latest_readings', {}) or {} # Handle None
            
            # Interpolate 24hr pollutants
            for pollutant in pollutants_to_interpolate:
                value = sensor_averages.get(pollutant)
                if value is not None:
                    try:
                        numerator[pollutant] += float(value) * weight
                        denominator[pollutant] += weight
                    except (ValueError, TypeError):
                        continue 
                        
            # Interpolate latest weather
            for param in weather_to_interpolate:
                # Check for 'temp' or 'temperature' etc.
                value = sensor_readings.get(param)
                if param == 'temp' and value is None: value = sensor_readings.get('temperature')
                if param == 'hum' and value is None: value = sensor_readings.get('humidity')
                if param == 'pre' and value is None: value = sensor_readings.get('pressure')

                if value is not None:
                    try:
                        numerator[param] += float(value) * weight
                        denominator[param] += weight
                    except (ValueError, TypeError):
                        continue

        # Calculate final interpolated values
        interpolated_values = {}
        for pollutant in all_params:
            if denominator[pollutant] > 0:
                interpolated_values[pollutant] = numerator[pollutant] / denominator[pollutant]
            else:
                interpolated_values[pollutant] = 0 # Fallback

        # Calculate the final AQI based on the new interpolated pollutant values
        interpolated_sub_indices = calculate_subindices(interpolated_values)
        valid_indices = [v for v in interpolated_sub_indices.values() if v is not None]
        final_aqi = round(max(valid_indices)) if valid_indices else None

        return interpolated_values, final_aqi

    except Exception as e:
        logger.error(f"Error in idw_interpolate_all: {e}", exc_info=True)
        return {}, None
  
@api_view(['GET'])
def list_resources(request):
    """Get all resources"""
    resources = Resource.objects.all()
    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def upload_resource(request):
    """Upload a new resource"""
    serializer = ResourceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Add this class
class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        serializer.save()


class BrochureViewSet(viewsets.ModelViewSet):
    queryset = Brochure.objects.filter(is_active=True)
    serializer_class = BrochureSerializer
    parser_classes = (MultiPartParser, FormParser)

    def perform_create(self, serializer):
        serializer.save()

@api_view(['GET'])
def get_brochures(request):
    """Get all active brochures"""
    brochures = Brochure.objects.filter(is_active=True)
    serializer = BrochureSerializer(brochures, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_brochures_by_category(request, category):
    """Get brochures by category"""
    brochures = Brochure.objects.filter(category=category, is_active=True)
    serializer = BrochureSerializer(brochures, many=True)
    return Response(serializer.data)


class WorkshopEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkshopEvent.objects.all()
    serializer_class = WorkshopEventSerializer

@api_view(['GET'])
@csrf_exempt
def get_product_detail(request, slug):
    """
    Fetch product details by slug for the frontend product page.
    """
    try:
        product = Product.objects.get(slug=slug)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@csrf_exempt
def get_products_menu(request):
    """
    Returns data for the Frontend Mega Menu, grouped by Category.
    """
    # Define your static category descriptions here
    categories_info = {
        'Air Quality': {'title': 'Air Quality Monitoring', 'desc': 'Precision sensors for indoor and outdoor environments.'},
        'Water Solutions': {'title': 'Water Management', 'desc': 'Flood alerts and distribution logic.'},
        'Weather': {'title': 'Weather Stations', 'desc': 'Hyper-local weather data collection.'},
        'Training': {'title': 'Skill Development', 'desc': 'Kits and workshops for students.'}
    }
    
    menu_data = {}
    
    # Loop through defined categories to maintain order
    for cat_name, info in categories_info.items():
        # Fetch products for this category
        products = Product.objects.filter(category=cat_name)
        
        if products.exists():
            items = []
            for p in products:
                # Handle Image URL
                img_url = p.image.url if p.image else ''
                # Ensure absolute URL if needed (optional)
                # if img_url and not img_url.startswith('http'):
                #     img_url = request.build_absolute_uri(img_url)

                items.append({
                    'name': p.name,
                    'image': img_url,
                    'link': f'/product-details/{p.slug}' # This matches your React Router
                })
            
            menu_data[cat_name] = {
                'title': info['title'],
                'description': info['desc'],
                'items': items
            }
    
    return Response(menu_data, status=status.HTTP_200_OK)




