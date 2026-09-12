"""WSGI config for spotter_logistics project."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotter_logistics.settings')
application = get_wsgi_application()
