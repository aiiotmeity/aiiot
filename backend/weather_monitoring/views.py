from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from botocore.exceptions import ClientError, NoCredentialsError
import boto3
from boto3.dynamodb.conditions import Attr, Key
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import json
import uuid
import os
from dotenv import load_dotenv
from rest_framework.renderers import JSONRenderer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from botocore.config import Config

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
    Returns the latest weather reading
    """
    try:
        # Note: Ensure the device_id matches exactly what is in your DynamoDB
        # Your code used ' weather-v2' (with a leading space). Keep it if that's correct.
        response = weather_table.query(
            KeyConditionExpression=Key('device_id').eq(' weather-v2'),
            ScanIndexForward=False,
            Limit=1
        )
        
        items = response.get('Items', [])
        if not items:
            return JsonResponse({"error": "No data found"}, status=404)
        
        # --- FIX IS HERE ---
        # Access the first item in the list using index [0]
        latest = items[0]['data']['decoded_payload'] 
        
        # Convert Decimal to float
        result = {k: float(v) if isinstance(v, Decimal) else v for k, v in latest.items()}
        
        return JsonResponse(result, encoder=DecimalEncoder)
        
    except Exception as e:
        # Check your terminal for this print statement to see the exact error
        print(f"Error in get_current_weather: {str(e)}")
        return JsonResponse({"error": "Failed to fetch weather data"}, status=500)


@require_GET
def get_historical_data(request):
    """
    GET /api/weather/historical-data?days=3&station_id=weather-v2
    Returns historical weather data
    """
    try:
        days = int(request.GET.get('days', 3))
        station_id_from_request = request.GET.get('station_id', 'weather-v2')
        
        # Handle device_id with leading space
        actual_device_id_in_db = ' ' + station_id_from_request.strip()
        
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)
        start_date_str = start_date.strftime('%Y-%m-%d')
        end_date_str = end_date.strftime('%Y-%m-%d')
        
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

    # ✅ EXACT key from S3 console
    key = f"aqi-training/{file_name}"

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=region
        )

        obj = s3.get_object(Bucket=bucket, Key=key)
        content = obj['Body'].read().decode('utf-8')

        lines = content.splitlines()

        print("📄 FIRST 5 LINES FROM S3:")
        for line in lines[:5]:
            print(line)

        return JsonResponse({
            "status": "success",
            "bucket": bucket,
            "key": key,
            "preview": lines[:5]
        })

    except Exception as e:
        print("❌ S3 READ ERROR:", e)
        return JsonResponse({
            "error": str(e),
            "bucket": bucket,
            "key": key
        }, status=500)


@require_GET
def flood_analysis(request):
    """
    1. Fetches real-time water level from S3.
    2. Processes kalady_dem.tif to find flooded areas.
    3. Returns flooded coordinates and details JSON.
    """
    # --- 1. GET WATER LEVEL FROM S3 ---
    bucket = os.getenv('AWS_STORAGE_BUCKET_NAME_FORECAST', 'aqi-training')
    key = "aqi-training/latest_water_level.csv" # Ensure this matches your S3 path
    current_water_level = 0.0

    try:
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_S3_REGION_NAME_BUCKET', 'ap-south-1')
        )
        obj = s3.get_object(Bucket=bucket, Key=key)
        content = obj['Body'].read().decode('utf-8').splitlines()
        
        # Parsing CSV: Assuming format is header, then data "date,time,level"
        # We grab the last non-empty line
        if len(content) > 1:
            last_line = content[-1].split(',')
            # Adjust index [-1] based on your CSV column structure
            val = last_line[-1].strip() 
            current_water_level = float(val) if val else 0.0
            
    except Exception as e:
        print(f"⚠️ S3 Error (using default): {e}")
        current_water_level = 0.0 # Default safe level

    # --- 2. CHECK THRESHOLD ---
    # Only calculate if water is high (Optimization)
    if current_water_level < 3.0:
        return JsonResponse({
            "status": "normal",
            "message": "Water level is safe. No flood analysis needed.",
            "current_water_level": current_water_level,
            "data": []
        })

    # --- 3. PROCESS TIFF FILE ---
    # Ensure 'kalady_dem.tif' is in your Django project base directory
    tif_path = os.path.join(settings.BASE_DIR, 'kalady_dem.tif') 
    
    flooded_locations = []
    
    try:
        with rasterio.open(tif_path) as src:
            dem = src.read(1)
            nodata = src.nodata
            transform_affine = src.transform
            crs = src.crs

            # Identify flooded pixels
            valid_mask = (dem != nodata) & (dem <= current_water_level)
            
            rows, cols = np.where(valid_mask)
            
            # Optimization: Downsample points if too many (take every 10th point)
            # This prevents the frontend map from crashing
            step = 10 if len(rows) > 5000 else 1 
            
            rows = rows[::step]
            cols = cols[::step]
            
            if len(rows) > 0:
                xs, ys = rasterio.transform.xy(transform_affine, rows, cols)
                lons, lats = transform(crs, "EPSG:4326", xs, ys)
                
                # Extract depths
                ground_levels = dem[rows, cols]
                
                for lat, lon, ground_h in zip(lats, lons, ground_levels):
                    depth = current_water_level - ground_h
                    
                    if depth < 0.3: expl = "Minor Waterlogging"
                    elif depth < 1.0: expl = "Moderate Flooding"
                    elif depth < 3.0: expl = "Significant Flooding"
                    else: expl = "Severe Flooding"

                    flooded_locations.append({
                        "lat": round(lat, 6),
                        "lon": round(lon, 6),
                        "depth": round(float(depth), 2),
                        "explanation": expl
                    })

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({
        "status": "alert",
        "current_water_level": current_water_level,
        "flooded_count": len(flooded_locations),
        "data": flooded_locations
    })