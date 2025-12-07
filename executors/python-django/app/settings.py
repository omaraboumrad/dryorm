import pathlib
import os

env = os.environ.get

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
SECRET_KEY = "fgta52w%k0^(hxp_sf9nk!abb@d!--9f@q*1!%z5b^0==*jwzy"
DEBUG = True

ALLOWED_HOSTS = ["testserver"]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "app.apps.BaseAppConfig",
]

# Conditionally add GeoDjango support
if env("DB_TYPE") == "postgis":
    INSTALLED_APPS.insert(0, "django.contrib.gis")

MIDDLEWARE = []


with open(BASE_DIR / "app" / "models.py") as f:
    contents = f.read()
    if "urlpatterns" in contents:
        ROOT_URLCONF = "app.models"

TEMPLATES = []

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
#     }
# }

match env("DB_TYPE", "sqlite"):
    case "sqlite":
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
            }
        }
    case "postgres":
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.postgresql_psycopg2",
                "NAME": env("DB_NAME"),
                "USER": env("DB_USER"),
                "PASSWORD": env("DB_PASSWORD"),
                "HOST": env("SERVICE_DB_HOST"),
                "PORT": env("SERVICE_DB_PORT"),
            },
        }
    case "postgis":
        DATABASES = {
            "default": {
                "ENGINE": "django.contrib.gis.db.backends.postgis",
                "NAME": env("DB_NAME"),
                "USER": env("DB_USER"),
                "PASSWORD": env("DB_PASSWORD"),
                "HOST": env("SERVICE_DB_HOST"),
                "PORT": env("SERVICE_DB_PORT"),
            },
        }
    case "mariadb":
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.mysql",
                "NAME": env("DB_NAME"),
                "USER": env("DB_USER"),
                "PASSWORD": env("DB_PASSWORD"),
                "HOST": env("SERVICE_DB_HOST"),
                "PORT": env("SERVICE_DB_PORT"),
            },
        }

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True

STATIC_URL = "/static/"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]
