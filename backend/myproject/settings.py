import os
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

# --- Core Paths (Corrected Order) ---
# Define BASE_DIR first
BASE_DIR = Path(__file__).resolve().parent.parent

# Define FRONTEND_DIR right after so it's available everywhere
FRONTEND_DIR = BASE_DIR / ".." / "frontend" / "build"

# Define STATICFILES_DIRS globally for both dev and production
STATICFILES_DIRS = [
    FRONTEND_DIR / "static",
]
# ------------------------------------

# Security and Debugging
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-here')
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'


# In myproject/settings.py

# This is the new, corrected configuration
DATABASES = {
    'default': dj_database_url.config(
        # This function will safely use the DATABASE_URL from your environment variables if it's valid.
        # If it's missing or empty (like when you're on your local computer),
        # it will automatically and correctly fall back to using your local sqlite3 file.
        default=f"sqlite:///{os.path.join(BASE_DIR, 'db.sqlite3')}"
    )
}


# Environment-specific settings (Production vs. Development)
if os.environ.get('RENDER'):
    # --- PRODUCTION Settings (on Render) ---
    ALLOWED_HOSTS = [
       # 'aiiot.it.com',
        #'www.aiiot.it.com',
        'airaware-app-gcw7.onrender.com',
        '.onrender.com'
    ]

    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'whitenoise.middleware.WhiteNoiseMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'corsheaders.middleware.CorsMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]

    STATIC_URL = '/static/'
    STATIC_ROOT = BASE_DIR / "staticfiles"
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

    CORS_ALLOWED_ORIGINS = [
        "https://aiiot.it.com",
        "https://www.aiiot.it.com",
        "https://airaware-app-gcw7.onrender.com",
    ]

    CSRF_TRUSTED_ORIGINS = [
        "https://aiiot.it.com",
        "https://www.aiiot.it.com",
        "https://airaware-app-gcw7.onrender.com",
    ]

    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

else:
    # --- DEVELOPMENT Settings (local) ---
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'aiiot.it.com']

    MIDDLEWARE = [
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'corsheaders.middleware.CorsMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
    ]

    STATIC_URL = '/static/'
    STATIC_ROOT = BASE_DIR / "staticfiles" # Also useful in dev

    CORS_ALLOW_ALL_ORIGINS = True


# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'myapp',
    'corsheaders',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [FRONTEND_DIR], # This now works because FRONTEND_DIR is defined above
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

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True # Note: L10N is deprecated in Django 5.0
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Session settings
SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_SAVE_EVERY_REQUEST = True

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Logging configuration
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