from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
import boto3
from boto3.dynamodb.conditions import Attr, Key
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import json
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

# DynamoDB setup
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
weather_table = dynamodb.Table('weather_station_data')
requests_table = dynamodb.Table('data_requests')

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
        response = weather_table.query(
            KeyConditionExpression=Key('device_id').eq(' weather-v2'),
            ScanIndexForward=False,
            Limit=1
        )
        
        items = response.get('Items', [])
        if not items:
            return JsonResponse({"error": "No data found"}, status=404)
        
        latest = items['data']['decoded_payload']
        
        # Convert Decimal to float
        result = {k: float(v) if isinstance(v, Decimal) else v for k, v in latest.items()}
        
        return JsonResponse(result, encoder=DecimalEncoder)
        
    except Exception as e:
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
