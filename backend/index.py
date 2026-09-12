import os
import sys
from pathlib import Path

# Add backend directory to sys.path so Django can find spotter_logistics & hos_engine
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotter_logistics.settings')

from spotter_logistics.wsgi import application

# Vercel serverless WSGI entry point
app = application
