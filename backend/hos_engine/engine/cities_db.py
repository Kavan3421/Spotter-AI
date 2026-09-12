"""
Geometric distance calculation utilities.
No manual or hardcoded cities database — all geocoding is performed dynamically via free public APIs.
"""
import math

def haversine_miles(lat1, lon1, lat2, lon2):
    """Calculate Great Circle distance in statute miles between two points."""
    R = 3958.8  # Earth radius in statute miles
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c
