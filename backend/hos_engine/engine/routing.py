"""
Dynamic Global Routing & Geocoding Engine.
100% API-driven using free public services with zero hardcoded manual city databases:
- OpenStreetMap Nominatim (Free Global Forward & Reverse Geocoding)
- BigDataCloud (Free High-Speed Reverse Geocoding for any coordinates worldwide)
- OSRM (Open Source Routing Machine for live road networks)
"""
import requests
import math
from .cities_db import haversine_miles

OSRM_URL = "http://router.project-osrm.org/route/v1/driving"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
BIGDATACLOUD_REVERSE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client"

HEADERS = {
    "User-Agent": "SpotterLogisticsHOS/1.0 (commercial-logistics-eval; contact=eval@spotter.ai)"
}

# In-memory runtime caches to avoid duplicate network requests
_GEOCODE_CACHE = {}
_REVERSE_CACHE = {}

def geocode_location(query):
    """
    Dynamically geocodes ANY location string worldwide using free public APIs.
    No hardcoded city lists.
    Returns: {'display_name': str, 'city': str, 'state': str, 'country': str, 'lat': float, 'lng': float}
    """
    if not query or not str(query).strip():
        return {"display_name": "Unknown", "city": "Unknown", "state": "", "country": "", "lat": 0.0, "lng": 0.0}

    query_str = str(query).strip()

    # 1. Direct coordinate format: "lat, lng"
    if "," in query_str:
        parts = query_str.split(",")
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lng = float(parts[1].strip())
                rev = reverse_geocode(lat, lng)
                return {
                    "display_name": rev["display_name"],
                    "city": rev["city"],
                    "state": rev["state"],
                    "country": rev.get("country", ""),
                    "lat": lat,
                    "lng": lng
                }
            except ValueError:
                pass

    # Check runtime cache
    cache_key = query_str.lower()
    if cache_key in _GEOCODE_CACHE:
        return _GEOCODE_CACHE[cache_key]

    # 2. Call OpenStreetMap Nominatim API dynamically
    try:
        resp = requests.get(
            NOMINATIM_SEARCH_URL,
            params={
                "q": query_str,
                "format": "json",
                "addressdetails": 1,
                "limit": 1
            },
            headers=HEADERS,
            timeout=4.0
        )
        if resp.status_code == 200:
            data = resp.json()
            if data and len(data) > 0:
                item = data[0]
                lat = float(item["lat"])
                lng = float(item["lon"])
                addr = item.get("address", {})

                city = (addr.get("city") or addr.get("town") or addr.get("village") or 
                        addr.get("municipality") or addr.get("county") or addr.get("state_district") or 
                        item.get("name", "").split(",")[0].strip())
                state = addr.get("state") or addr.get("region") or ""
                country = addr.get("country") or ""

                parts = [p for p in [city, state, country] if p]
                disp = ", ".join(parts) if parts else item.get("display_name", query_str)

                result = {
                    "display_name": disp,
                    "city": city or query_str,
                    "state": state,
                    "country": country,
                    "lat": lat,
                    "lng": lng
                }
                _GEOCODE_CACHE[cache_key] = result
                return result
    except Exception as err:
        print(f"[Geocode API Warning - Nominatim]: {err}")

    # 3. Fallback to Photon by Komoot (Free global OpenStreetMap geocoder)
    try:
        resp = requests.get(
            "https://photon.komoot.io/api/",
            params={"q": query_str, "limit": 1},
            headers=HEADERS,
            timeout=3.5
        )
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                feat = features[0]
                coords = feat["geometry"]["coordinates"] # [lon, lat]
                props = feat.get("properties", {})
                lat = float(coords[1])
                lng = float(coords[0])
                city = props.get("city") or props.get("name") or query_str
                state = props.get("state") or ""
                country = props.get("country") or ""

                parts = [p for p in [city, state, country] if p]
                disp = ", ".join(parts) if parts else query_str

                result = {
                    "display_name": disp,
                    "city": city,
                    "state": state,
                    "country": country,
                    "lat": lat,
                    "lng": lng
                }
                _GEOCODE_CACHE[cache_key] = result
                return result
    except Exception as err:
        print(f"[Geocode API Warning - Photon]: {err}")

    # Fallback to query name if completely unreachable
    return {
        "display_name": query_str,
        "city": query_str,
        "state": "",
        "country": "",
        "lat": 0.0,
        "lng": 0.0
    }


def reverse_geocode(lat, lng):
    """
    Dynamically reverse-geocodes ANY GPS coordinates worldwide using free public APIs.
    No hardcoded cities or states.
    Returns: {'display_name': str, 'city': str, 'state': str, 'country': str}
    """
    round_lat = round(lat, 3)
    round_lng = round(lng, 3)
    cache_key = (round_lat, round_lng)

    if cache_key in _REVERSE_CACHE:
        return _REVERSE_CACHE[cache_key]

    # 1. Try BigDataCloud free reverse geocode API (instant, high limits, global)
    try:
        resp = requests.get(
            BIGDATACLOUD_REVERSE_URL,
            params={
                "latitude": round_lat,
                "longitude": round_lng,
                "localityLanguage": "en"
            },
            timeout=3.0
        )
        if resp.status_code == 200:
            data = resp.json()
            city = data.get("city") or data.get("locality") or ""
            state = data.get("principalSubdivision") or ""
            country = data.get("countryName") or ""

            if not city and state:
                city = state

            disp = f"{city}, {state}".strip(" ,") if city else f"Coord ({round_lat}, {round_lng})"
            result = {
                "display_name": disp,
                "city": city or f"{round_lat:.2f},{round_lng:.2f}",
                "state": state,
                "country": country
            }
            _REVERSE_CACHE[cache_key] = result
            return result
    except Exception:
        pass

    # 2. Fallback to Nominatim Reverse API
    try:
        resp = requests.get(
            NOMINATIM_REVERSE_URL,
            params={
                "lat": round_lat,
                "lon": round_lng,
                "format": "json"
            },
            headers=HEADERS,
            timeout=3.0
        )
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get("address", {})
            city = addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or ""
            state = addr.get("state") or ""
            country = addr.get("country") or ""

            disp = f"{city}, {state}".strip(" ,") if city else data.get("display_name", "")
            result = {
                "display_name": disp,
                "city": city or f"{round_lat:.2f},{round_lng:.2f}",
                "state": state,
                "country": country
            }
            _REVERSE_CACHE[cache_key] = result
            return result
    except Exception:
        pass

    return {
        "display_name": f"{round_lat:.2f}, {round_lng:.2f}",
        "city": f"{round_lat:.2f}, {round_lng:.2f}",
        "state": "",
        "country": ""
    }


def search_cities_api(query, limit=6):
    """
    Search suggestions for ANY city worldwide using free public APIs.
    """
    if not query or len(query.strip()) < 2:
        return []

    q = query.strip()
    results = []

    # Query Photon API for instant city autocomplete
    try:
        resp = requests.get(
            "https://photon.komoot.io/api/",
            params={"q": q, "limit": limit},
            headers=HEADERS,
            timeout=2.5
        )
        if resp.status_code == 200:
            data = resp.json()
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                coords = feat.get("geometry", {}).get("coordinates", [0, 0])
                name = props.get("name") or props.get("city") or ""
                state = props.get("state") or ""
                country = props.get("country") or ""

                parts = [p for p in [name, state, country] if p]
                disp = ", ".join(parts)
                if disp and not any(r["display_name"] == disp for r in results):
                    results.append({
                        "display_name": disp,
                        "city": name,
                        "state": state,
                        "country": country,
                        "lat": coords[1],
                        "lng": coords[0]
                    })
    except Exception:
        pass

    # Fallback to Nominatim if Photon returned nothing
    if not results:
        try:
            resp = requests.get(
                NOMINATIM_SEARCH_URL,
                params={"q": q, "format": "json", "addressdetails": 1, "limit": limit},
                headers=HEADERS,
                timeout=3.0
            )
            if resp.status_code == 200:
                for item in resp.json():
                    addr = item.get("address", {})
                    city = (addr.get("city") or addr.get("town") or addr.get("village") or 
                            item.get("name", "").split(",")[0].strip())
                    state = addr.get("state", "")
                    country = addr.get("country", "")
                    parts = [p for p in [city, state, country] if p]
                    disp = ", ".join(parts)
                    results.append({
                        "display_name": disp,
                        "city": city,
                        "state": state,
                        "country": country,
                        "lat": float(item["lat"]),
                        "lng": float(item["lon"])
                    })
        except Exception:
            pass

    return results


def interpolate_arc(lat1, lon1, lat2, lon2, num_points=30):
    """Generate intermediate coordinates along great-circle arc."""
    points = []
    for i in range(num_points + 1):
        fraction = i / float(num_points)
        lat = lat1 + (lat2 - lat1) * fraction
        lon = lon1 + (lon2 - lon1) * fraction
        points.append([round(lat, 5), round(lon, 5)])
    return points


def get_route_segment(origin, destination):
    """
    Get live turn-by-turn driving route between origin and destination using free OSRM.
    Works anywhere in the world (India, USA, Europe, etc.).
    """
    lat1, lon1 = origin["lat"], origin["lng"]
    lat2, lon2 = destination["lat"], destination["lng"]

    # 1. Try live OSRM Routing Machine (Free, Global)
    url = f"{OSRM_URL}/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                route = data["routes"][0]
                distance_meters = route["distance"]
                distance_miles = distance_meters * 0.000621371
                
                raw_coords = route["geometry"]["coordinates"] # [lon, lat]
                polyline = [[c[1], c[0]] for c in raw_coords]
                
                # Compute cumulative road miles along polyline
                cum_miles = [0.0]
                total_m = 0.0
                for i in range(1, len(polyline)):
                    seg_d = haversine_miles(polyline[i-1][0], polyline[i-1][1], polyline[i][0], polyline[i][1])
                    total_m += seg_d
                    cum_miles.append(round(total_m, 2))
                
                if total_m > 0:
                    scale = distance_miles / total_m
                    cum_miles = [round(m * scale, 2) for m in cum_miles]
                else:
                    cum_miles = [0.0 for _ in polyline]

                duration_hours = distance_miles / 55.0

                return {
                    "distance_miles": round(distance_miles, 1),
                    "duration_hours": round(duration_hours, 2),
                    "polyline": polyline,
                    "cumulative_miles": cum_miles,
                    "source": "OSRM"
                }
    except Exception as err:
        print(f"[OSRM API Warning]: {err}")

    # Fallback to Great-Circle with 1.25 circuity factor
    direct_dist = haversine_miles(lat1, lon1, lat2, lon2)
    road_dist = direct_dist * 1.25 if direct_dist > 5 else direct_dist
    num_pts = max(20, int(road_dist / 40))
    polyline = interpolate_arc(lat1, lon1, lat2, lon2, num_pts)
    
    cum_miles = []
    for i in range(len(polyline)):
        fraction = i / float(len(polyline) - 1) if len(polyline) > 1 else 0
        cum_miles.append(round(road_dist * fraction, 2))

    duration_hours = road_dist / 55.0

    return {
        "distance_miles": round(road_dist, 1),
        "duration_hours": round(duration_hours, 2),
        "polyline": polyline,
        "cumulative_miles": cum_miles,
        "source": "FALLBACK_CIRCUITY"
    }


def find_location_at_miles(polyline, cumulative_miles, target_mile):
    """
    Interpolate the coordinate at target_mile and dynamically reverse-geocode via API
    to identify the real city and state at that location on Earth.
    """
    if not polyline:
        return {"lat": 0.0, "lng": 0.0, "city": "En Route", "state": ""}

    if target_mile <= 0 or len(polyline) == 1:
        pt = polyline[0]
        rev = reverse_geocode(pt[0], pt[1])
        return {"lat": pt[0], "lng": pt[1], "city": rev["city"], "state": rev["state"]}

    if target_mile >= cumulative_miles[-1]:
        pt = polyline[-1]
        rev = reverse_geocode(pt[0], pt[1])
        return {"lat": pt[0], "lng": pt[1], "city": rev["city"], "state": rev["state"]}

    # Search for segment
    for i in range(1, len(cumulative_miles)):
        if cumulative_miles[i] >= target_mile:
            d_start = cumulative_miles[i-1]
            d_end = cumulative_miles[i]
            segment_len = d_end - d_start
            
            p1 = polyline[i-1]
            p2 = polyline[i]
            
            if segment_len > 0.0001:
                ratio = (target_mile - d_start) / segment_len
                lat = p1[0] + (p2[0] - p1[0]) * ratio
                lng = p1[1] + (p2[1] - p1[1]) * ratio
            else:
                lat, lng = p1[0], p1[1]

            rev = reverse_geocode(lat, lng)
            return {
                "lat": round(lat, 5),
                "lng": round(lng, 5),
                "city": rev["city"],
                "state": rev["state"]
            }

    pt = polyline[-1]
    rev = reverse_geocode(pt[0], pt[1])
    return {"lat": pt[0], "lng": pt[1], "city": rev["city"], "state": rev["state"]}
