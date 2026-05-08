# 🌤️ Weather Monitoring Live Dashboard - Setup Guide

## Overview
You now have a beautiful real-time weather dashboard for your Django admin that displays:
- Temperature 🌡️
- Humidity 💧  
- Air Pressure 🌊
- Wind Speed & Direction 💨
- Rainfall (1h & 24h) 🌧️

Just like the "Live Command Center" in myapp!

## Quick Start

### Step 1: Sync Real-Time Data from DynamoDB

```bash
cd backend
python manage.py sync_dynamodb_data
```

This pulls the latest weather readings from your DynamoDB tables into the Django database.

### Step 2: Access the Weather Dashboard

Navigate to:
```
http://localhost:8000/weather-admin/
```

You'll see a beautiful card-based dashboard showing all your weather stations with live data!

## Dashboard Features

### 🟢 Live Status Indicator
- **LIVE** (Green pulse): Station has data from the last 30 minutes
- **OFFLINE** (Red): No recent data

### 📊 Data Display
Each card shows:

**🌡️ Atmosphere Section**
- Temperature with color coding (Hot/Warm/Cold)
- Humidity percentage
- Air Pressure in hPa

**💨 Wind Section**
- Wind Speed in km/h
- Wind Direction in degrees + compass direction (N, NE, E, etc.)

**🌧️ Rainfall Section**
- Rainfall in the last hour (mm)
- Rainfall in the last 24 hours (mm)

**⏰ Last Update Time**
- Shows when the data was last recorded

### 🎨 Visual Design
- Beautiful gradient card headers
- Hover effects for interactivity
- Color-coded temperature indicators
- Auto-refresh every 5 seconds
- Responsive grid layout (adapts to mobile/tablet)

## API Endpoints

The dashboard fetches data from:
```
GET /api/weather/admin-dashboard
```

This endpoint returns real-time data for all weather stations in JSON format.

## Automation Setup (Optional)

To keep the dashboard updated automatically, run the sync command periodically:

### Using crontab (Linux/Mac)
```bash
# Sync every 5 minutes
*/5 * * * * cd /path/to/backend && python manage.py sync_dynamodb_data

# Full sync every hour
0 * * * * cd /path/to/backend && python manage.py sync_dynamodb_data --all-stations
```

### Using Django management command in background
```bash
# Run in background
nohup python manage.py sync_dynamodb_data --hours=1 > sync.log 2>&1 &
```

### Using Celery (if configured)
Add to your Celery beat schedule:
```python
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'sync-weather-data': {
        'task': 'weather_monitoring.tasks.sync_dynamodb_data',
        'schedule': crontab(minute='*/5'),  # Every 5 minutes
    },
}
```

## Data Sources

The dashboard pulls from:
- **V2 Station** (New): `aws-asiet-v1` → Weather_station_data_v2 table
- **V1 Station** (Legacy): `weather-v2` → weather_station_data table

Both data sources are automatically normalized and displayed consistently.

## Weather Admin vs Main Admin

### Weather Admin (`/weather-admin/`)
- **Live Dashboard** with real-time cards
- Dedicated weather monitoring interface
- Beautiful card-based layout
- 5-second auto-refresh

### Main Admin (`/admin/`)
- Traditional Django admin table views
- Detailed weather reading records
- Data management and editing
- Date hierarchy browsing

## Troubleshooting

### No Data Showing?
1. Run: `python manage.py sync_dynamodb_data`
2. Check AWS credentials in `.env`
3. Verify DynamoDB table names and regions

### Dashboard Not Loading?
1. Check browser console for errors (F12)
2. Verify `/api/weather/admin-dashboard` endpoint is accessible
3. Check Django logs for API errors

### Data Not Updating?
1. Ensure sync command is running regularly
2. Check if WeatherReading records are being created
3. Verify station status (LIVE vs OFFLINE)

## File Structure

```
weather_monitoring/
├── admin.py                          # Custom admin site + registrations
├── models.py                         # WeatherStation, WeatherReading, DataRequest
├── views.py                          # API endpoints (including weather_admin_dashboard_api)
├── urls.py                           # URL routes
├── management/
│   └── commands/
│       └── sync_dynamodb_data.py     # Sync command
└── templates/
    └── admin/
        └── weather_dashboard.html    # Beautiful dashboard template

myproject/urls.py                     # Registered weather_admin_site
```

## Next Steps

1. ✅ First-time setup: Run `python manage.py sync_dynamodb_data`
2. ✅ Access the dashboard at `/weather-admin/`
3. ✅ Set up automation to keep data fresh
4. ✅ Customize station names/locations in the admin interface

Enjoy your beautiful weather dashboard! 🌤️📊
