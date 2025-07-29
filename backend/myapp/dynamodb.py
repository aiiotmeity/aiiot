from datetime import datetime
import boto3
import json
import os
import logging
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import NoCredentialsError, ClientError, BotoCoreError

# Setup logging
logger = logging.getLogger(__name__)

# Global variables for AWS resources
dynamodb = None
s3 = None
table = None
S3_BUCKET_NAME = 'ai-model-bucket-output'

# Cache variables
_aws_initialized = False
_initialization_attempted = False

def initialize_aws_resources():
    """Initialize AWS resources with proper error handling."""
    global dynamodb, s3, table, _aws_initialized, _initialization_attempted
    
    if _aws_initialized and dynamodb is not None and table is not None:
        return True
    
    if _initialization_attempted and not _aws_initialized:
        return False
    
    _initialization_attempted = True
    
    try:
        # Load environment variables
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        
        # Force set environment variables if not available
        if not os.getenv('AWS_ACCESS_KEY_ID'):
            os.environ['AWS_ACCESS_KEY_ID'] = 'AKIAWX2IF6FQ5PMWSN7G'
            os.environ['AWS_SECRET_ACCESS_KEY'] = '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'
            os.environ['AWS_S3_REGION_NAME'] = 'us-east-1'
            os.environ['AWS_STORAGE_BUCKET_NAME'] = 'ai-model-bucket-output'
        
        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_S3_REGION_NAME', 'us-east-1')

        if not aws_access_key or not aws_secret_key:
            logger.error("AWS credentials not found in environment variables")
            return False

        # Initialize AWS resources
        dynamodb = boto3.resource(
            'dynamodb',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        )
        
        s3 = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region
        )
        
        table = dynamodb.Table('ttn_aws_db')
        
        # Test table accessibility
        table.load()
        test_response = table.scan(Limit=1)
        
        _aws_initialized = True
        logger.info("AWS resources initialized successfully")
        return True
            
    except Exception as e:
        logger.error(f"AWS initialization failed: {e}")
        dynamodb = None
        s3 = None
        table = None
        _aws_initialized = False
        return False

def ensure_aws_connection():
    """Ensure AWS connection is available."""
    return initialize_aws_resources()

def get_all_items():
    """Fetch all items from DynamoDB."""
    if not ensure_aws_connection():
        logger.warning("AWS not available - returning empty list")
        return []
    
    try:
        items = []
        response = table.scan()
        items.extend(response.get('Items', []))

        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))

        logger.info(f"Retrieved {len(items)} items from DynamoDB")
        return items
        
    except Exception as e:
        logger.error(f"Error fetching items: {e}")
        return []

def get_device_data(device_id, limit=24):
    """
    --- 🚀 PERFORMANCE FIX ---
    Fetches the most recent data for a device using a 'query' operation,
    which is much faster and more efficient than 'scan'.

    This requires your DynamoDB table to have:
    - A Partition Key (Primary Key) named 'device_id'.
    - A Sort Key named 'received_at' (storing a timestamp string).
    """
    if not initialize_aws_resources():
        logger.warning(f"AWS not available for device {device_id} - returning empty list")
        return []
    
    try:
        # A 'query' is vastly more efficient than 'scan'.
        response = table.query(
            KeyConditionExpression=Key('device_id').eq(device_id),
            ScanIndexForward=False,  # Sorts results descending (newest first)
            Limit=limit              # Gets only the most recent 'limit' items
        )
        items = response.get('Items', [])
        logger.info(f"✅ Retrieved {len(items)} items for device '{device_id}' via efficient query.")
        return items
        
    except ClientError as e:
        if e.response['Error']['Code'] == 'ValidationException':
            logger.error(
                "DynamoDB Query Failed! Ensure your table has Partition Key 'device_id' and Sort Key 'received_at'."
            )
        else:
            logger.error(f"An error occurred querying data for device '{device_id}': {e}")
        return []
    except Exception as e:
        logger.error(f"An unexpected error occurred in get_device_data for '{device_id}': {e}")
        return []



def add_item(device_id, received_at, payload):
    """Add item to DynamoDB."""
    if not ensure_aws_connection():
        logger.error("AWS not available for adding item")
        return False
    
    try:
        item = {
            'device_id': device_id,
            'received_at': received_at,
            'payload': json.dumps(payload) if not isinstance(payload, str) else payload,
        }
        table.put_item(Item=item)
        logger.info(f"Added item for device {device_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error adding item: {e}")
        return False

def parse_payload(payload):
    """
    Safely parses a JSON payload string into a dictionary.
    """
    if isinstance(payload, str):
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            logger.warning(f"Could not parse JSON payload: {payload}")
            return {}
    return payload if isinstance(payload, dict) else {}


def store_data_to_s3(data, filename_prefix="dynamodb_data"):
    """Store data to S3."""
    if not ensure_aws_connection():
        logger.error("S3 not available")
        return None
    
    try:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.json"
        json_data = json.dumps(data, indent=4, default=str)

        s3.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=filename,
            Body=json_data,
            ContentType='application/json'
        )

        logger.info(f"Data saved to S3: {filename}")
        return filename

    except Exception as e:
        logger.error(f"Error saving to S3: {e}")
        return None

def test_aws_connection():
    """Test AWS connection."""
    try:
        if not ensure_aws_connection():
            return {
                'status': 'failed',
                'dynamodb': False,
                's3': False,
                'message': 'AWS not configured or initialization failed'
            }
        
        dynamodb_ok = False
        try:
            table.load()
            test_response = table.scan(Limit=1)
            dynamodb_ok = True
        except Exception as e:
            logger.error(f"DynamoDB test failed: {e}")
        
        s3_ok = False
        try:
            s3.head_bucket(Bucket=S3_BUCKET_NAME)
            s3_ok = True
        except Exception as e:
            logger.error(f"S3 test failed: {e}")
        
        return {
            'status': 'success' if (dynamodb_ok and s3_ok) else 'partial',
            'dynamodb': dynamodb_ok,
            's3': s3_ok,
            'message': 'Connection test completed'
        }
        
    except Exception as e:
        return {
            'status': 'failed',
            'dynamodb': False,
            's3': False,
            'message': str(e)
        }

# Initialize on import
try:
    initialize_aws_resources()
    logger.info("DynamoDB module loaded successfully")
except Exception as e:
    logger.warning(f"DynamoDB module initialization warning: {e}")