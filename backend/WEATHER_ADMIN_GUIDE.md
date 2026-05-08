# Real-Time Weather Data Admin Panel Guide

## Overview
The Django admin panel now displays real-time weather data with comprehensive metrics including temperature, humidity, pressure, wind speed/direction, and rainfall data.

## Quick Start

### 1. Sync Data from DynamoDB to Admin Panel

Run the management command to pull real-time data from DynamoDB and populate the admin interface:

```bash
# Sync latest data from the new V2 station (aws-asiet-v1)
python manage.py sync_dynamodb_data

# Sync data from both V1 and V2 stations
python manage.py sync_dynamodb_data --all-stations

# Sync data from last N hours (default: 1 hour)
python manage.py sync_dynamodb_data --hours=6
```

### 2. Access the Admin Panel

1. Navigate to: `http://localhost:8000/admin/`
2. Login with your Django admin credentials

### 3. View Real-Time Weather Data

#### **Weather Stations View**
- Path: `/admin/weather_monitoring/weatherstation/`
- Shows all registered weather stations
- Displays latest reading directly in the list view
- Click on any station to see detailed real-time weather summary with all parameters

#### **Weather Readings View**
- Path: `/admin/weather_monitoring/weatherreading/`
- Lists all historical and real-time readings
- Shows color-coded weather parameters:
  - 🌡️ **Temperature**: Red (>35°C) | Orange (25-35°C) | Blue (<25°C)
  - 💧 **Humidity**: Green (>60%) | Yellow (40-60%) | Orange (<40%)
  - 💨 **Wind Speed**: Red (>30 km/h) | Orange (15-30 km/h) | Green (<15 km/h)

### 4. Displayed Data Points

Each weather reading includes:

| Parameter | Unit | Source |
|-----------|------|--------|
| 🌡️ Temperature | °C | `temperature_c` from payload |
| 💧 Humidity | % | `humidity` from payload |
| 🌊 Air Pressure | hPa | `pressure` (default: 1013) |
| 💨 Wind Speed | km/h | `wind_speed_kph` (converted from km/h to m/s in API) |
| 🧭 Wind Direction | degrees | `wind_direction` |
| 🌧️ Rainfall (1h) | mm | `rain_1h_mm` |
| 🌧️ Rainfall (24h) | mm | `rain_24h_mm` |

### 5. Data Sources

The admin panel pulls data from:

- **V2 Station (New)**: AWS IoT Core → Weather_station_data_v2 table
  - Station ID: `aws-asiet-v1`
  - Data format: Flat structure with `payload` containing all readings
  
- **V1 Station (Legacy)**: AWS IoT Core → weather_station_data table
  - Station ID: `weather-v2` (with leading space in DB)
  - Data format: Nested structure under `data.decoded_payload`

### 6. Automation (Optional)

To automatically sync data at regular intervals, add to your crontab:

```bash
# Sync every 5 minutes
*/5 * * * * cd /path/to/my-django-react-app/backend && python manage.py sync_dynamodb_data

# Sync every hour (full sync)
0 * * * * cd /path/to/my-django-react-app/backend && python manage.py sync_dynamodb_data --all-stations
```

Or use Django-crontab or Celery for background tasks.

### 7. Troubleshooting

**No data appearing?**
1. Check AWS credentials in `.env` file
2. Verify DynamoDB table names and regions
3. Run: `python manage.py sync_dynamodb_data` manually to check for errors
4. Verify data exists in DynamoDB before troubleshooting Django

**Permission errors?**
- Ensure AWS IAM user has permissions: `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan`

**Connection timeouts?**
- Check AWS_REGION and AWS_DYNAMODB_REGION settings
- Verify network connectivity to AWS

## Data Model

### WeatherStation
```python
- device_id: Unique station identifier
- station_name: Human-readable name
- station_type: V1 (Legacy) or V2 (New)
- is_active: Active/Inactive status
```

### WeatherReading
```python
- station: Foreign key to WeatherStation
- temperature_c: Temperature in Celsius
- humidity: Humidity percentage
- pressure: Air pressure in hPa
- wind_speed_kph: Wind speed in km/h
- wind_direction: Wind direction in degrees
- rain_1h_mm: Rainfall in last hour
- rain_24h_mm: Rainfall in last 24 hours
- recorded_at: Timestamp of reading
- dynamodb_timestamp: Original DynamoDB timestamp
```

## API Integration

The admin panel displays the same data that's served by:
- `GET /api/weather/current` - Current weather
- `GET /api/weather/historical-data` - Historical data

The sync command ensures this data is accessible in the Django admin interface.
