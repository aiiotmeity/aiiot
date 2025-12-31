from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import boto3
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal
import json

from weather_monitoring.models import WeatherStation, WeatherData, SensorReading


class Command(BaseCommand):
    help = 'Sync real-time data from DynamoDB to PostgreSQL for admin display'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Fetch data from last N hours (default: 24)'
        )
        parser.add_argument(
            '--station-id',
            type=str,
            default='weather-v2',
            help='Station ID to sync (default: weather-v2)'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        station_id = options['station_id']

        self.stdout.write(self.style.SUCCESS(f'Starting DynamoDB sync (last {hours} hours)...'))

        try:
            # Initialize DynamoDB
            dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
            weather_table = dynamodb.Table('weather_station_data')

            # Get or create station
            station, created = WeatherStation.objects.get_or_create(
                device_id=station_id,
                defaults={
                    'device_name': station_id.replace('-', ' ').title(),
                    'location': 'Unknown Location'
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created new station: {station.device_name}'))

            # Fetch data from DynamoDB
            start_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            start_time_str = start_time.isoformat()

            # Try common device_id variants: with leading space and without
            items = []
            used_device = None
            for candidate in (f' {station_id}', station_id):
                try:
                    response = weather_table.query(
                        KeyConditionExpression=Key('device_id').eq(candidate),
                        ScanIndexForward=False,
                        Limit=100
                    )
                    if response.get('Items'):
                        items = response.get('Items', [])
                        used_device = candidate
                        break
                except Exception:
                    continue

            # Fallback: scan by contains if query returned nothing
            if not items:
                try:
                    response = weather_table.scan(
                        FilterExpression=Attr('device_id').contains(station_id)
                    )
                    items = response.get('Items', [])
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ DynamoDB scan failed: {e}'))
            count = 0

            for item in items:
                try:
                    # Extract data
                    payload = item.get('data', {}).get('decoded_payload', {})
                    timestamp_str = item.get('timestamp', timezone.now().isoformat())
                    
                    # Parse timestamp
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    except:
                        timestamp = timezone.now()

                    # Check if already exists
                    weather_data, created = WeatherData.objects.get_or_create(
                        station=station,
                        timestamp=timestamp,
                        defaults={
                            'temperature': float(payload.get('temperature')) if payload.get('temperature') else None,
                            'humidity': float(payload.get('humidity')) if payload.get('humidity') else None,
                            'pressure': float(payload.get('pressure')) if payload.get('pressure') else None,
                            'wind_speed': float(payload.get('wind_speed')) if payload.get('wind_speed') else None,
                            'wind_direction': payload.get('wind_direction', ''),
                            'rainfall': float(payload.get('rainfall')) if payload.get('rainfall') else None,
                            'raw_data': payload
                        }
                    )
                    
                    if created:
                        count += 1

                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'⚠ Error processing item: {str(e)}'))
                    continue

            # Update station's last_data_received
            if items:
                station.last_data_received = timezone.now()
                station.save()

            self.stdout.write(
                self.style.SUCCESS(f'✓ Successfully synced {count} new records to PostgreSQL')
            )

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error syncing DynamoDB: {str(e)}'))
