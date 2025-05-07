import os
from django.contrib import messages
from pathlib import Path


env = os.environ.get

PROJECT = env('PROJECT')
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR / PROJECT
SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG') == 'True'
ALLOWED_HOSTS = ["localhost", "webserver", "dryorm.d.xterm.info", "dryorm.xterm.info"]
CSRF_TRUSTED_ORIGINS = ["http://localhost:8060", "http://webserver:8060", "http://dryorm.d.xterm.info", "https://dryorm.xterm.info"]


INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'django_cotton',
    'django_extensions',
    'channels',

    'dryorm',
]


MIDDLEWARE = [

    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

]

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_AUTHENTICATION_METHOD = 'email'
LOGIN_REDIRECT_URL = '/'

ROOT_URLCONF = f'{PROJECT}.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            PROJECT_DIR / "templates"
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'dryorm.processors.extras',
            ],
        },
    },
]

WSGI_APPLICATION = f'{PROJECT}.wsgi.application'


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": env("POSTGRES_DB"),
        "USER": env("POSTGRES_USER"),
        "PASSWORD": env("POSTGRES_PASSWORD"),
        "HOST": env("POSTGRES_HOST"),
        "PORT": 5432 
    },
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [PROJECT_DIR / "static"]
STATIC_ROOT = BASE_DIR / "static"


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"},
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('redis', 6379)],
        },
    },
}

ASGI_APPLICATION = f'{PROJECT}.asgi.application'

COTTON_DIR = "components"
COTTON_SNAKE_CASED_NAMES = False

import sentry_sdk

sentry_sdk.init(
    dsn=env('SENTRY_DSN'),
    environment=env('ENVIRONMENT'),
    send_default_pii=True,
)
