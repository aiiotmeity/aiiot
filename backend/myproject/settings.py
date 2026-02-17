import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

# Load environment variables from .env file
load_dotenv()

# ==========================================
# 1. CORE PATHS & SECURITY
# ==========================================
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / ".." / "frontend" / "build"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = ['*']  # Allows all hosts


# ==========================================
# 2. INSTALLED APPS
# ==========================================
INSTALLED_APPS = [
    'jazzmin',  # Must be at the very top
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'corsheaders',
    'storages',  # REQUIRED for AWS S3
    
    # Your apps
    'myapp',
    'weather_monitoring',

                    # <--- Add this line at the top

]

# ==========================================
# 3. MIDDLEWARE
# ==========================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Handles static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

# ==========================================
# 4. TEMPLATES
# ==========================================
# TEMPLATES = [
#     {
#         'BACKEND': 'django.template.backends.django.DjangoTemplates',
#         'DIRS': [FRONTEND_DIR],
#         'APP_DIRS': True,
#         'OPTIONS': {
#             'context_processors': [
#                 'django.template.context_processors.debug',
#                 'django.template.context_processors.request',
#                 'django.contrib.auth.context_processors.auth',
#                 'django.contrib.messages.context_processors.messages',
#             ],
#         },
#     },
# ]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            FRONTEND_DIR,                       # Keep your existing frontend path
            os.path.join(BASE_DIR, 'templates') # Add this NEW line
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'


# ==========================================
# 5. DATABASE
# ==========================================
DB_NAME = os.environ.get('DB_NAME')

if DB_NAME:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': DB_NAME,
            'USER': os.environ.get('DB_USER'),
            'PASSWORD': os.environ.get('DB_PASSWORD'),
            'HOST': os.environ.get('DB_HOST'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    # Safe fallback for environments where Postgres is not configured
    # (useful for local development or if env vars are missing in deployment)
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(BASE_DIR / 'db.sqlite3'),
        }
    }


# ==========================================
# 6. PASSWORD VALIDATION
# ==========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ==========================================
# 7. INTERNATIONALIZATION
# ==========================================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ==========================================
# 8. STATIC FILES (CSS, JavaScript, Images)
# ==========================================
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Only keep this if you have a /static/ folder in your project root
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# ADD THIS LINE to prevent the build crash
WHITENOISE_MANIFEST_STRICT = False

# ==========================================
# 9. AWS S3 & STORAGE CONFIGURATION (FIXED)
# ==========================================

# 1. Credentials
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# 2. Bucket Config
AWS_STORAGE_BUCKET_NAME = 'ai-model-bucket-output'
AWS_S3_REGION_NAME = 'us-east-1'
AWS_S3_SIGNATURE_VERSION = 's3v4'

# 3. File Settings
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None 
AWS_S3_VERIFY = True

# 4. Public URL Settings
AWS_QUERYSTRING_AUTH = False
MEDIA_URL = f'https://{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com/'

# 5. Storage Backend (REMOVED LEGACY CONFLICTS)
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Use a non-manifest staticfiles backend during development to avoid
# "Missing staticfiles manifest entry" errors when `collectstatic` has
# not been run. In production (DEBUG=False) you should run
# `python manage.py collectstatic` and use the manifest storage.
if DEBUG:
    STORAGES['staticfiles']['BACKEND'] = 'whitenoise.storage.CompressedStaticFilesStorage'

# ==========================================
# 10. CORS & CSRF SETTINGS
# ==========================================
CORS_ALLOW_CREDENTIALS = True

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://aiiot.it.com",
    "https://www.aiiot.it.com",
    "https://aiiot-2.onrender.com",
    "https://aiiot-1.onrender.com",
]

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:8000",
    "http://localhost:8000",

    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://aiiot.it.com",
    "https://www.aiiot.it.com",
    "https://aiiot-2.onrender.com",
    "https://aiiot-1.onrender.com",
]



# ==========================================
# 11. REST FRAMEWORK & LOGGING
# ==========================================
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': ['rest_framework.filters.SearchFilter'],
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}


# settings.py

JAZZMIN_SETTINGS = {
    # Title of the window
    "site_title": "AI-IoT Admin",
    "site_header": "AI-IoT Dashboard",
    "site_brand": "AI-IoT System",
    "welcome_sign": "Welcome to the AI-IoT Control Center",
    "copyright": "Center for AI-IOT Innovation & Team",
    
    # Sidebar Search (searches User model by default)
    "search_model": "auth.User",

    # Top Menu
    "topmenu_links": [
        {"name": "Home",  "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Live Map", "url": "https://aiiot.it.com", "new_window": True},
    ],

    # Side Menu Custom Icons (FontAwesome)
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        
        # Your Custom Models
        "myapp.Signup": "fas fa-user-plus",
        "myapp.UserLogin": "fas fa-key",
        "myapp.HealthAssessment": "fas fa-heartbeat",
        "myapp.FamilyMembers": "fas fa-house-user",
        "myapp.Product": "fas fa-box-open",
        "myapp.WorkshopEvent": "fas fa-calendar-alt",
        "myapp.Support": "fas fa-headset",
        "myapp.Resource": "fas fa-file-download",
    },
    
    # Order of apps in the sidebar
    "order_with_respect_to": ["myapp", "auth"],
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-primary",
    "navbar": "navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-primary",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "flatly",  # Options: darkly, flatly, simplex, slate
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"
