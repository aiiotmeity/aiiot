from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from botocore.exceptions import ClientError, NoCredentialsError
import boto3
from boto3.dynamodb.conditions import Attr, Key
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import json
import uuid,requests
import os
from dotenv import load_dotenv
from rest_framework.renderers import JSONRenderer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from botocore.config import Config
import reverse_geocoder as rg

load_dotenv()

# Initialize S3 client (will use environment credentials or IAM role if available)
try:
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    AWS_REGION = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')
    S3_BUCKET_FORECAST = os.getenv('AWS_STORAGE_BUCKET_NAME_FORECAST')

    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
    else:
        # boto3 will fallback to environment / instance profile if available
        s3_client = boto3.client('s3', region_name=AWS_REGION)
except Exception as e:
    s3_client = None
    print(f"Failed to initialize S3 client: {e}")

# DynamoDB setup (initialize safely to avoid import-time failures)
try:
    dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_DYNAMODB_REGION', 'us-east-1'))
    weather_table = dynamodb.Table('weather_station_data')
    weather_table_v2 = dynamodb.Table('Weather_station_data_v2')
    requests_table = dynamodb.Table('data_requests')
except Exception as e:
    dynamodb = None
    weather_table = None
    requests_table = None
    print(f"DynamoDB initialization failed: {e}")

# Custom JSON encoder for Decimal
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)


@require_GET
def get_current_weather(request):
    """
    GET /api/weather/current
    Smartly routes requests to V1 (Old) or V2 (New) tables based on station ID.
    """
    try:
        # 1. Get the station ID from URL parameters (default to 'weather-v2' if missing)
        # Frontend sends ?stationid=aws-asiet-v1 or ?stationid=weather-v2
        station_id = request.GET.get('stationid', 'weather-v2').strip()

        # =========================================================
        # SCENARIO 1: NEW STATION (aws-asiet-v1)
        # Uses 'Weather_station_data_v2' table with flat schema
        # =========================================================
        if station_id == 'aws-asiet-v1':
            # Query the V2 table
            response = weather_table_v2.query(
                KeyConditionExpression=Key('device_id').eq(station_id),
                ScanIndexForward=False, # Latest first
                Limit=1
            )
            
            items = response.get('Items', [])
            if not items:
                return JsonResponse({"error": "No data found for V2 station"}, status=404)

            # Extract the 'payload' directly (Data is flattened in V2)
            # DynamoDB might wrap numbers in Decimal, so we handle that below
            latest_item = items[0]
            payload = latest_item.get('payload', {})

            # Helper to safely clean DynamoDB formats (e.g., {"N": "30"} -> 30.0)
            def get_val(key, default=0.0):
                val = payload.get(key, default)
                
                # Handle DynamoDB JSON format like {'N': '43'}
                if isinstance(val, dict):
                    if 'N' in val: return float(val['N'])
                    if 'S' in val: return val['S']
                
                # Handle standard Decimal or Number types
                if isinstance(val, (int, float, Decimal)):
                    return float(val)
                return default

            # Parse custom time format "17:01:2026:16:49" (DD:MM:YYYY:HH:MM)
            # Sometimes it comes as a string, sometimes as a dict {"S": "..."}
            raw_time_obj = payload.get('server_time', '')
            raw_time = raw_time_obj.get('S', '') if isinstance(raw_time_obj, dict) else raw_time_obj
            
            date_str, time_str = "N/A", "N/A"
            if raw_time and ':' in raw_time:
                try:
                    p = raw_time.split(':') # ['17', '01', '2026', '16', '49']
                    if len(p) >= 5:
                        date_str = f"{p[2]}-{p[1]}-{p[0]}" # YYYY-MM-DD
                        time_str = f"{p[3]}:{p[4]}"        # HH:MM
                except:
                    pass

            # Map New V2 Fields -> Old Frontend Fields
            result = {
                "temperature": get_val('temperature_c'),    # Maps temperature_c -> temperature
                "humidity": get_val('humidity'),
                "airPressure": 1013,                        # Default (Sensor missing in V2)
                "WindSpeedAvg": round(get_val('wind_speed_kph') / 3.6, 2), # Convert kph -> m/s
                "windDirection": get_val('wind_direction'),
                "rainfall1h": get_val('rain_1h_mm'),
                "rainfall24h": get_val('rain_24h_mm'),      # New V2 Feature
                "date": date_str,
                "time": time_str
            }
            return JsonResponse(result, encoder=DecimalEncoder)

        # =========================================================
        # SCENARIO 2: OLD STATION (weather-v2)
        # Uses 'weather_station_data' table with nested 'decoded_payload'
        # =========================================================
        else:
            # Your old database keys have a leading space (e.g., " weather-v2")
            # We preserve this logic for backward compatibility
            target_id = ' weather-v2' if station_id == 'weather-v2' else station_id
            
            response = weather_table.query(
                KeyConditionExpression=Key('device_id').eq(target_id),
                ScanIndexForward=False,
                Limit=1
            )
            
            items = response.get('Items', [])
            if not items:
                return JsonResponse({"error": "No data found for V1 station"}, status=404)
            
            # Old data structure is nested inside data -> decoded_payload
            latest = items[0]['data']['decoded_payload']
            
            # Return as is, just converting Decimals to floats
            result = {k: float(v) if isinstance(v, Decimal) else v for k, v in latest.items()}
            return JsonResponse(result, encoder=DecimalEncoder)

    except Exception as e:
        print(f"Error in get_current_weather: {str(e)}")
        return JsonResponse({"error": "Failed to fetch weather data"}, status=500)

@require_GET
def get_historical_data(request):
    """
    GET /api/weather/historical-data?days=3&station_id=weather-v2
    Returns historical weather data for both V1 (Old) and V2 (New) stations.
    """
    try:
        days = int(request.GET.get('days', 3))
        station_id_from_request = request.GET.get('station_id', 'weather-v2').strip()
        
        # Calculate Date Range
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)
        start_date_str = start_date.strftime('%Y-%m-%d')
        end_date_str = end_date.strftime('%Y-%m-%d')

        # =========================================================
        # SCENARIO 1: NEW STATION (aws-asiet-v1) - Uses V2 Table
        # =========================================================
        if station_id_from_request == 'aws-asiet-v1':
            # V2 uses 'received_at' (ISO 8601) for time filtering
            # We add time components to ensure we capture the full days
            start_iso = f"{start_date_str}T00:00:00"
            end_iso = f"{end_date_str}T23:59:59"

            filter_expression = (
                Attr('device_id').eq(station_id_from_request) & 
                Attr('received_at').between(start_iso, end_iso)
            )

            # Use the V2 Table
            response = weather_table_v2.scan(FilterExpression=filter_expression)
            items = response.get('Items', [])

            # Handle Pagination for V2
            while 'LastEvaluatedKey' in response:
                response = weather_table_v2.scan(
                    FilterExpression=filter_expression,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))

            if not items:
                 return JsonResponse({
                    "error": f"No data found for station '{station_id_from_request}' in the last {days} days."
                }, status=404)

            # Helper to safely extract numbers from DynamoDB JSON (e.g. {"N": "30"})
            def get_val(source, key):
                val = source.get(key, 0)
                if isinstance(val, dict):
                    if 'N' in val: return float(val['N'])
                    if 'S' in val: return val['S']
                if isinstance(val, (int, float, Decimal)):
                    return float(val)
                return 0.0

            formatted_data = []
            
            for item in items:
                payload = item.get('payload', {})
                
                # Parse Time: Try 'server_time' (DD:MM:YYYY:HH:MM), fallback to 'received_at'
                raw_time_obj = payload.get('server_time', '')
                raw_time = raw_time_obj.get('S', '') if isinstance(raw_time_obj, dict) else raw_time_obj
                
                timestamp = item.get('received_at', '') # Default fallback
                
                if raw_time and ':' in raw_time:
                    try:
                        p = raw_time.split(':') # ['17', '01', '2026', '16', '49']
                        if len(p) >= 5:
                            # Reformat to ISO: YYYY-MM-DDTHH:MM:SS
                            timestamp = f"{p[2]}-{p[1]}-{p[0]}T{p[3]}:{p[4]}:00"
                    except:
                        pass
                
                # Normalize Data to match Frontend expectations
                data_point = {
                    'timestamp': timestamp,
                    'temperature': get_val(payload, 'temperature_c'),
                    'humidity': get_val(payload, 'humidity'),
                    'airPressure': 1013, # Default
                    'WindSpeedAvg': round(get_val(payload, 'wind_speed_kph') / 3.6, 2), # Convert kph -> m/s
                    'windDirection': get_val(payload, 'wind_direction'),
                    'rainfall1h': get_val(payload, 'rain_1h_mm'),
                    'rainfall24h': get_val(payload, 'rain_24h_mm')
                }
                formatted_data.append(data_point)

            # Sort by timestamp
            formatted_data.sort(key=lambda x: x['timestamp'])

            return JsonResponse({'data': formatted_data}, encoder=DecimalEncoder)

        # =========================================================
        # SCENARIO 2: OLD STATION (weather-v2) - Uses Old Table
        # =========================================================
        else:
            # Handle device_id with leading space (Legacy DB requirement)
            actual_device_id_in_db = ' ' + station_id_from_request.strip()
            
            filter_expression = (
                Attr('device_id').eq(actual_device_id_in_db) & 
                Attr('data.decoded_payload.date').between(start_date_str, end_date_str)
            )
            
            response = weather_table.scan(FilterExpression=filter_expression)
            items = response.get('Items', [])
            
            # Handle pagination
            while 'LastEvaluatedKey' in response:
                response = weather_table.scan(
                    FilterExpression=filter_expression,
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                items.extend(response.get('Items', []))
            
            if not items:
                return JsonResponse({
                    "error": f"No data found for station '{station_id_from_request}' in the last {days} days."
                }, status=404)
            
            # Sort and format items
            sorted_items = sorted(
                items,
                key=lambda x: f"{x.get('data', {}).get('decoded_payload', {}).get('date', '')} {x.get('data', {}).get('decoded_payload', {}).get('time', '')}"
            )
            
            formatted_data = []
            for item in sorted_items:
                payload = item.get('data', {}).get('decoded_payload', {})
                if payload and 'date' in payload and 'time' in payload:
                    timestamp = f"{payload['date']}T{payload['time']}"
                    data_point = {'timestamp': timestamp}
                    for key, value in payload.items():
                        if isinstance(value, Decimal):
                            data_point[key] = float(value)
                        else:
                            data_point[key] = value
                    formatted_data.append(data_point)
            
            return JsonResponse({'data': formatted_data}, encoder=DecimalEncoder)
        
    except Exception as e:
        print(f"Error in get_historical_data: {str(e)}")
        return JsonResponse({"error": "An unexpected server error occurred"}, status=500)

@csrf_exempt
@require_POST
def request_data(request):
    """
    POST /api/weather/request-data
    Submit a data request for admin approval
    """
    try:
        data = json.loads(request.body)
        request_id = str(uuid.uuid4())
        
        request_details = {
            'request_id': request_id,
            'email': data['email'],
            'organization': data.get('organization', 'N/A'),
            'start_date': data['start_date'],
            'end_date': data['end_date'],
            'station_id': data['stationId'],
            'data_parameters': data.get('parameters'),
            'purpose': data.get('purpose', 'N/A'),
            'request_timestamp': datetime.now(timezone.utc).isoformat(),
            'status': 'pending'
        }
        
        requests_table.put_item(Item=request_details)
        
        return JsonResponse({
            "message": "Your request has been submitted and is pending approval.",
            "request_id": request_id
        })
        
    except Exception as e:
        print(f"Error processing data request: {str(e)}")
        return JsonResponse({"error": "Failed to submit data request."}, status=500)


@require_GET
def get_all_requests(request):
    """
    GET /api/weather/requests
    Get all data requests (for admin)
    """
    try:
        response = requests_table.scan()
        items = response.get('Items', [])
        
        return JsonResponse({'requests': items}, encoder=DecimalEncoder)
        
    except Exception as e:
        print(f"Error fetching requests: {str(e)}")
        return JsonResponse({"error": "Failed to fetch requests"}, status=500)
    


# Ensure we have a usable S3 client (don't raise at import time)
if 's3_client' not in globals() or s3_client is None:
    try:
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_S3_REGION_NAME', os.getenv('AWS_S3_REGION_NAME_BUCKET', 'ap-south-1'))
        )
    except Exception as e:
        s3_client = None
        print(f"Failed to initialize S3 client (fallback): {e}")

class S3PresignView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        file_name = request.query_params.get('file', None)
        file_type = request.query_params.get('file_type', None)

        # Mapping for file_type requests
        file_mapping = {
            'forecast': 'forecast_output.csv',
            'causality': 'lime_sentences_manual.txt', # Updated to match your specific file
            'labels': 'latest_water_level.csv',
        }

        if not file_name and file_type:
            file_name = file_mapping.get(file_type)

        if not file_name:
            return Response({'error': 'Missing file parameter'}, status=status.HTTP_400_BAD_REQUEST)

        # Use the specific bucket where your CSVs are stored
        bucket = os.getenv('AWS_STORAGE_BUCKET_NAME_FORECAST')
        if not bucket:
            # Fallback if the specific forecast bucket env var isn't set
            bucket = 'aqi-training' 

        try:
            # Generate a Presigned URL (valid for 1 hour)
            url = s3_client.generate_presigned_url(
                ClientMethod='get_object',
                Params={
                    'Bucket': bucket,
                    'Key': file_name,
                    'ResponseContentType': 'text/csv' if file_name.endswith('.csv') else 'text/plain'
                },
                ExpiresIn=3600
            )

            # Return the URL so the frontend can use it
            return Response({'status': 'success', 'url': url})

        except ClientError as e:
            print('❌ S3 GENERATE URL ERROR:', e)
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print('❌ GENERAL ERROR:', e)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@require_GET
def debug_read_s3_csv(request):
    file_name = request.GET.get('file', 'forecast_output.csv')

    bucket = os.getenv('AWS_STORAGE_BUCKET_NAME_FORECAST', 'aqi-training')
    region = os.getenv('AWS_S3_REGION_NAME_BUCKET', 'ap-south-1')
    key = file_name.lstrip('/')
    tried_keys = [key]

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=region
        )

        try:
            obj = s3.get_object(Bucket=bucket, Key=key)
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                fallback_key = f"{bucket}/{key}"
                tried_keys.append(fallback_key)
                obj = s3.get_object(Bucket=bucket, Key=fallback_key)
            else:
                raise

        content = obj['Body'].read().decode('utf-8')
        lines = content.splitlines()

        # ✅ CRITICAL FIX FOR LIME DATA
        if file_name.endswith('.txt'):
            # For text files
            preview_data = lines[-6:]
        else:
            # For CSV files (Water Level & Forecast)
            header = lines[0] if lines else ""
            
            # ✅ FIX: Change [-5:] to [-12:] to ensure we have enough data for all 6 cards
            recent_lines = lines[-6:]
            
            if len(lines) > 12 and header not in recent_lines:
                preview_data = [header] + recent_lines
            else:
                preview_data = recent_lines

        return JsonResponse({
            "status": "success",
            "bucket": bucket,
            "key": key,
            "preview": preview_data 
        })

    except Exception as e:
        print("❌ S3 READ ERROR:", e)
        return JsonResponse({"error": str(e)}, status=500)


@require_GET
def flood_analysis(request):
    """
    Returns flood zones based on the REAL-TIME water level from S3.
    """
    # ... (Keep existing imports if needed) ...

    # 1. Check if frontend requested a simulation (Manual Override)
    simulated_level = request.GET.get('level')
    current_water_level = 0.0

    if simulated_level and simulated_level != "--":
        try:
            current_water_level = float(simulated_level)
            print(f"🧪 SIMULATION MODE: Using simulated water level {current_water_level}m")
        except ValueError:
            current_water_level = 0.0
    else:
        # --- ✅ FIXED S3 FETCHING LOGIC (Matches RiverDashboard.js) ---
        bucket = os.getenv('AWS_STORAGE_BUCKET_NAME_FORECAST', 'aqi-training')
        key = "aqi-training/latest_water_level.csv"
        
        try:
            # Initialize S3 (Ensure Region is correct)
            s3 = boto3.client(
                's3', 
                aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'), 
                aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'), 
                region_name=os.getenv('AWS_S3_REGION_NAME', 'ap-south-1')
            )

            # Read File
            obj = s3.get_object(Bucket=bucket, Key=key)
            content = obj['Body'].read().decode('utf-8').strip().splitlines()
            
            # Filter out empty lines
            valid_lines = [line for line in content if line.strip()]

            if len(valid_lines) > 1:
                # 1. Parse Headers (First Line)
                headers = [h.strip().lower() for h in valid_lines[0].split(',')]
                
                # 2. Find "level" column index
                try:
                    target_index = headers.index('level')
                except ValueError:
                    target_index = -1

                # 3. Get Last Data Line
                last_line = valid_lines[-1]
                values = [v.strip() for v in last_line.split(',')]

                # 4. Extract Value Safely
                if target_index != -1 and len(values) > target_index:
                    # Best Case: We found the "level" column
                    val_str = values[target_index]
                else:
                    # Fallback: RiverDashboard Logic (Last valid value)
                    valid_values = [v for v in values if v]
                    val_str = valid_values[-1] if valid_values else "0"

                # 5. Convert to Float
                current_water_level = float(val_str)
                print(f"✅ S3 FETCH SUCCESS: Real-time Level is {current_water_level}m")

            else:
                print("⚠️ S3 WARNING: File is empty or missing headers.")

        except Exception as e:
            print(f"❌ S3 ERROR in flood_analysis: {e}")
            # Do NOT default to 0.0 silently if we want to debug, but for safety we keep it 0.0
            current_water_level = 0.0

    # --- 2. CHECK THRESHOLD (Optimization) ---
    # Only skip if it's REAL-TIME mode (not simulation) AND level is very low
    if not simulated_level and current_water_level < 0.1:
        return JsonResponse({
            "status": "normal",
            "message": "Water level is safe/low. No flood analysis needed.",
            "current_water_level": current_water_level,
            "data": []
        })

    # --- 3. PROCESS TIFF FILE (Geo-Analysis) ---
    # (This part of your code was correct, keep it as is)
    try:
        import rasterio
        from rasterio.warp import transform
        import numpy as np
        from django.conf import settings

        tif_path = os.path.join(settings.BASE_DIR, 'weather_monitoring', 'kalady_dem.tif')
        
        flooded_locations = []
        
        with rasterio.open(tif_path) as src:
            dem = src.read(1)
            nodata = src.nodata
            transform_affine = src.transform
            crs = src.crs

            # Identify flooded pixels
            valid_mask = (dem != nodata) & (dem <= current_water_level)
            rows, cols = np.where(valid_mask)
            
            # Optimization: Downsample
            step = 10 if len(rows) > 5000 else 1 
            rows, cols = rows[::step], cols[::step]
            
            if len(rows) > 0:
                xs, ys = rasterio.transform.xy(transform_affine, rows, cols)
                lons, lats = transform(crs, "EPSG:4326", xs, ys)
                ground_levels = dem[rows, cols]

                # Batch Geocoding
                coords_for_geocoding = list(zip(lats, lons))
                geo_results = rg.search(coords_for_geocoding)

                for i, (lat, lon, ground_h) in enumerate(zip(lats, lons, ground_levels)):
                    depth = current_water_level - ground_h
                    
                    if depth < 3: expl = "Minor Waterlogging"
                    elif depth < 6: expl = "Moderate Flooding"
                    elif depth < 8.0: expl = "Significant Flooding"
                    else: expl = "Severe Flooding"

                    place = geo_results[i].get('name', 'Unknown Area')

                    flooded_locations.append({
                        "lat": round(lat, 6),
                        "lon": round(lon, 6),
                        "depth": round(float(depth), 2),
                        "explanation": expl,
                        "place": place 
                    })

    except Exception as e:
        print(f"❌ CRITICAL ERROR in Analysis: {e}")
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
    
    return JsonResponse({
        "status": "alert",
        "current_water_level": current_water_level,
        "flooded_count": len(flooded_locations),
        "data": flooded_locations
    })
def get_place(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {"User-Agent": "PeriyarWatch/1.0"}
        r = requests.get(url, headers=headers, timeout=2)
        if r.status_code == 200:
            data = r.json()
            return data.get("display_name", "Unknown Area")
    except:
        return "Unknown Area"
