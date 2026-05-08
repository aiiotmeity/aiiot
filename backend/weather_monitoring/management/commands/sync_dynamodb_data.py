from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import json
import os
from dotenv import load_dotenv

from weather_monitoring.models import WeatherStation, WeatherReading

load_dotenv()


class Command(BaseCommand):
    help = 'Sync real-time weather data from DynamoDB to PostgreSQL for admin display'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=1,
            help='Fetch data from last N hours (default: 1)'
        )
        parser.add_argument(
            '--all-stations',
            action='store_true',
            help='Sync all stations (V1 and V2)'
        )

    def get_val(self, obj, default=None):
        """Helper to extract values from DynamoDB Decimal or dict format"""
        if obj is None:
            return default
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, dict):
            if 'N' in obj:
                return float(obj['N'])
            if 'S' in obj:
                return obj['S']
        if isinstance(obj, (int, float)):
            return float(obj)
        return default

    def handle(self, *args, **options):
        hours = options['hours']
        sync_all = options.get('all_stations', False)

        self.stdout.write(self.style.SUCCESS('Starting DynamoDB real-time sync...'))

        try:
            # Initialize DynamoDB
            AWS_REGION = os.getenv('AWS_DYNAMODB_REGION', 'us-east-1')
            dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
            
            weather_table_v1 = dynamodb.Table('weather_station_data')
            weather_table_v2 = dynamodb.Table('Weather_station_data_v2')

            total_synced = 0

            # ========== SYNC V2 STATIONS (aws-asiet-v1) ==========
            if sync_all:
                stations_to_sync = [
                    ('weather-v2', weather_table_v1, 'V1'),
                    ('aws-asiet-v1', weather_table_v2, 'V2')
                ]
            else:
                # Default: sync latest from V2 only
                stations_to_sync = [('aws-asiet-v1', weather_table_v2, 'V2')]

            for station_id, table, version in stations_to_sync:
                try:
                    self.stdout.write(f'\n📡 Processing {station_id} ({version} Table)...')
                    
                    # Get or create station
                    station, created = WeatherStation.objects.get_or_create(
                        device_id=station_id,
                        defaults={
                            'station_name': f'{station_id.replace("-", " ").title()} Station',
                            'station_type': version,
                            'is_active': True
                        }
                    )
                    
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Created new station: {station.station_name}'))

                    count = 0
                    
                    # ===== V2 TABLE (New Format) =====
                    if version == 'V2':
                        try:
                            response = table.query(
                                KeyConditionExpression=Key('device_id').eq(station_id),
                                ScanIndexForward=False,
                                Limit=100
                            )
                            items = response.get('Items', [])
                            
                            # Handle pagination
                            while 'LastEvaluatedKey' in response:
                                response = table.query(
                                    KeyConditionExpression=Key('device_id').eq(station_id),
                                    ScanIndexForward=False,
                                    ExclusiveStartKey=response['LastEvaluatedKey'],
                                    Limit=100
                                )
                                items.extend(response.get('Items', []))

                            for item in items:
                                try:
                                    payload = item.get('payload', {})
                                    received_at = item.get('received_at', '')
                                    
                                    # Parse timestamp
                                    try:
                                        recorded_at = datetime.fromisoformat(received_at.replace('Z', '+00:00'))
                                    except:
                                        recorded_at = timezone.now()

                                    # Check if already exists (avoid duplicates)
                                    existing = WeatherReading.objects.filter(
                                        station=station,
                                        dynamodb_timestamp=received_at
                                    ).exists()
                                    
                                    if existing:
                                        continue

                                    # Extract weather data
                                    temperature_c = self.get_val(payload.get('temperature_c'))
                                    humidity = self.get_val(payload.get('humidity'))
                                    wind_speed_kph = self.get_val(payload.get('wind_speed_kph'))
                                    wind_direction = self.get_val(payload.get('wind_direction'))
                                    rain_1h_mm = self.get_val(payload.get('rain_1h_mm'))
                                    rain_24h_mm = self.get_val(payload.get('rain_24h_mm'))
                                    server_time = payload.get('server_time', '')
                                    if isinstance(server_time, dict):
                                        server_time = server_time.get('S', '')

                                    # Create reading
                                    WeatherReading.objects.create(
                                        station=station,
                                        temperature_c=temperature_c,
                                        humidity=humidity,
                                        pressure=1013.0,  # Default as per API
                                        wind_speed_kph=wind_speed_kph,
                                        wind_direction=wind_direction,
                                        rain_1h_mm=rain_1h_mm,
                                        rain_24h_mm=rain_24h_mm,
                                        server_time=str(server_time),
                                        dynamodb_timestamp=received_at,
                                        recorded_at=recorded_at
                                    )
                                    count += 1

                                except Exception as e:
                                    self.stdout.write(self.style.WARNING(f'    ⚠ Item error: {str(e)}'))
                                    continue

                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'  ✗ V2 Query failed: {str(e)}'))

                    # ===== V1 TABLE (Old Format with nested structure) =====
                    else:
                        try:
                            # V1 has leading space in device_id
                            response = table.query(
                                KeyConditionExpression=Key('device_id').eq(' ' + station_id),
                                ScanIndexForward=False,
                                Limit=100
                            )
                            items = response.get('Items', [])

                            for item in items:
                                try:
                                    # V1 data is nested under 'data.decoded_payload'
                                    payload = item.get('data', {}).get('decoded_payload', {})
                                    timestamp_str = item.get('timestamp', timezone.now().isoformat())
                                    
                                    # Parse timestamp
                                    try:
                                        recorded_at = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                                    except:
                                        recorded_at = timezone.now()

                                    # Extract V1 weather data
                                    temperature_c = self.get_val(payload.get('temperature'))
                                    humidity = self.get_val(payload.get('humidity'))
                                    wind_speed_kph = self.get_val(payload.get('wind_speed'))
                                    wind_direction = self.get_val(payload.get('wind_direction'))
                                    rain_1h_mm = self.get_val(payload.get('rainfall_1h'))
                                    rain_24h_mm = self.get_val(payload.get('rainfall_24h'))

                                    # Create reading
                                    WeatherReading.objects.create(
                                        station=station,
                                        temperature_c=temperature_c,
                                        humidity=humidity,
                                        pressure=self.get_val(payload.get('pressure'), 1013.0),
                                        wind_speed_kph=wind_speed_kph,
                                        wind_direction=wind_direction,
                                        rain_1h_mm=rain_1h_mm,
                                        rain_24h_mm=rain_24h_mm,
                                        dynamodb_timestamp=timestamp_str,
                                        recorded_at=recorded_at
                                    )
                                    count += 1

                                except Exception as e:
                                    self.stdout.write(self.style.WARNING(f'    ⚠ Item error: {str(e)}'))
                                    continue

                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f'  ✗ V1 Query failed: {str(e)}'))

                    self.stdout.write(self.style.SUCCESS(f'  ✓ Synced {count} records for {station_id}'))
                    total_synced += count

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  ✗ Error syncing {station_id}: {str(e)}'))

            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Successfully synced {total_synced} real-time weather records to admin panel!')
            )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error during sync: {str(e)}'))
