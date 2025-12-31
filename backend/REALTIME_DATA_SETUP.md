# Real-Time Data Display in Django Admin - Setup Guide

## Problem Solved
Your real-time sensor data was stored **only in DynamoDB** and not visible in Django admin because:
1. Django admin only displays **PostgreSQL models**
2. No models existed for weather/sensor data
3. Weather monitoring app was not registered in admin

## Solution Implemented

### 1. New Models Created
- `WeatherStation` - Metadata for weather stations
- `WeatherData` - Cached real-time weather readings from DynamoDB
- `SensorReading` - Generic sensor readings (temperature, PM2.5, CO2, etc.)

### 2. Admin Dashboard
Registered in `weather_monitoring/admin.py` with:
- Real-time status indicators (🟢 Online, 🟠 Idle, 🔴 Offline)
- Data freshness badges (Fresh/Recent/Stale)
- Alert status displays
- Search and filtering capabilities
- Pretty-formatted data display

### 3. Data Synchronization
Created management command to sync DynamoDB → PostgreSQL

## Setup Steps

### Step 1: Create Database Migrations
```bash
cd backend
python manage.py makemigrations weather_monitoring
python manage.py migrate weather_monitoring
```

### Step 2: Sync Data from DynamoDB
```bash
# Sync last 24 hours of data
python manage.py sync_dynamodb_data

# Or specify different timeframe
python manage.py sync_dynamodb_data --hours=48

# Or specify station
python manage.py sync_dynamodb_data --station-id=weather-v2
```

### Step 3: Set Up Automatic Sync (Optional)
To keep data updated automatically, add a periodic task using `celery-beat`:

**Install Celery (if not already installed):**
```bash
pip install celery celery-beat
```

**Add to settings.py:**
```python
# Celery Configuration
CELERY_BROKER_URL = 'redis://localhost:6379'
CELERY_RESULT_BACKEND = 'redis://localhost:6379'

CELERY_BEAT_SCHEDULE = {
    'sync-dynamodb-every-5-minutes': {
        'task': 'weather_monitoring.tasks.sync_weather_data',
        'schedule': 300.0,  # 5 minutes
    },
}
```

**Create weather_monitoring/tasks.py:**
```python
from celery import shared_task
from .management.commands.sync_dynamodb_data import Command
from django.core.management import call_command

@shared_task
def sync_weather_data():
    call_command('sync_dynamodb_data', hours=1)
```

### Step 4: Access Admin Dashboard
1. Go to: `http://localhost:8000/admin`
2. Navigate to "Weather Monitoring" section
3. View:
   - **Weather Stations** - List all sensors
   - **Weather Data** - Real-time readings with status
   - **Sensor Readings** - Individual measurements and alerts

## Features

### Weather Station Dashboard
- ✓ Online/Offline status
- ✓ Last data received timestamp
- ✓ Location information

### Real-Time Data Display
- ✓ Temperature, Humidity, Pressure
- ✓ Wind speed and direction
- ✓ Rainfall data
- ✓ Raw JSON payload view
- ✓ Data freshness indicator

### Sensor Readings Display
- ✓ Alert status (Normal/Alert)
- ✓ Sensor type filtering
- ✓ Historical data view
- ✓ Location-based search

## Alternative: Direct API Access

If you want real-time data without caching, use the existing endpoints:

```bash
# Get latest weather data
GET /api/weather/current

# Get historical data
GET /api/weather/historical-data?days=3&station_id=weather-v2

# Get air quality data
GET /api/air/current-aqi
```

## Troubleshooting

### Data not appearing in admin?
1. Check AWS credentials are set in `.env`
2. Verify DynamoDB table name: `weather_station_data`
3. Run migrations: `python manage.py migrate`
4. Sync data: `python manage.py sync_dynamodb_data`

### Performance issues with large datasets?
- Add indexes (already configured in models)
- Use date_hierarchy filtering in admin
- Limit historical data sync: `--hours=24`

### Want to update frequently?
- Set up Celery Beat for automated syncing
- Or run: `python manage.py sync_dynamodb_data` periodically via cron

## Next Steps

1. ✓ Models created
2. ✓ Admin interface configured
3. ✓ Management command ready
4. ⚪ Run migrations
5. ⚪ Sync initial data
6. ⚪ Set up automatic sync (optional)
