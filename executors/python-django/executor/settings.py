import pathlib
import os

env = os.environ.get

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
SECRET_KEY = 'fgta52w%k0^(hxp_sf9nk!abb@d!--9f@q*1!%z5b^0==*jwzy'
DEBUG = True

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'executor',
]

MIDDLEWARE = []


with open(BASE_DIR / 'executor' / 'models.py') as f:
    contents = f.read()
    if 'urlpatterns' in contents:
        ROOT_URLCONF = 'executor.models'

TEMPLATES = []

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
#     }
# }

match env('DB_TYPE', 'sqlite'):
    case 'sqlite':
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
            }
        }
    case 'postgres':
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql_psycopg2",
                "NAME": env('DB_NAME'),
                "USER": env('DB_USER'),
                "PASSWORD": env('DB_PASSWORD'),
                "HOST": env('SERVICE_DB_HOST'),
                "PORT": env('SERVICE_DB_PORT'),
            },
        }
    case 'mariadb':
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.mysql",
                "NAME": env('DB_NAME'),
                "USER": env('DB_USER'),
                "PASSWORD": env('DB_PASSWORD'),
                "HOST": env('SERVICE_DB_HOST'),
                "PORT": env('SERVICE_DB_PORT'),
            },
        }

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = '/static/'
