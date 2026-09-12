"""
Views for Spotter AI Commercial Logistics and HOS API.
"""
from datetime import datetime, time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import PlanTripInputSerializer
from .engine.routing import geocode_location, get_route_segment, search_cities_api
from .engine.hos_calculator import HosSimulationEngine
from .engine.log_splitter import split_events_into_daily_logs

class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "online",
            "service": "Spotter AI Logistics & FMCSA HOS Engine",
            "version": "1.0.0"
        })

class CitySearchView(APIView):
    def get(self, request):
        """Free dynamic global city search endpoint using public APIs."""
        query = request.query_params.get('q', '')
        results = search_cities_api(query, limit=8)
        return Response({"results": results})

class PlanTripView(APIView):
    def post(self, request):
        serializer = PlanTripInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Validation Error", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data

        # 1. Geocode locations
        current_loc = geocode_location(data["current_location"])
        pickup_loc = geocode_location(data["pickup_location"])
        dropoff_loc = geocode_location(data["dropoff_location"])

        # 2. Compute route segments
        # Segment 1: Current -> Pickup
        seg1 = get_route_segment(current_loc, pickup_loc)
        # Segment 2: Pickup -> Dropoff
        seg2 = get_route_segment(pickup_loc, dropoff_loc)

        # Merge polylines
        combined_polyline = list(seg1["polyline"])
        # Avoid duplicate coordinate at junction
        if combined_polyline and seg2["polyline"] and combined_polyline[-1] == seg2["polyline"][0]:
            combined_polyline.extend(seg2["polyline"][1:])
        else:
            combined_polyline.extend(seg2["polyline"])

        # Merge cumulative miles
        leg1_dist = seg1["distance_miles"]
        leg2_dist = seg2["distance_miles"]
        total_dist = round(leg1_dist + leg2_dist, 1)

        combined_cum_miles = list(seg1["cumulative_miles"])
        for m in seg2["cumulative_miles"]:
            combined_cum_miles.append(round(leg1_dist + m, 2))

        # 3. Parse trip start time
        raw_start = data.get("trip_start_time")
        if raw_start:
            try:
                start_dt = datetime.fromisoformat(raw_start)
            except Exception:
                # Default to today at 06:00:00
                today = datetime.now().date()
                start_dt = datetime.combine(today, time(6, 0))
        else:
            today = datetime.now().date()
            start_dt = datetime.combine(today, time(6, 0))

        # 4. Run HOS Simulation Engine
        engine = HosSimulationEngine(
            start_time=start_dt,
            current_cycle_used=data.get("current_cycle_used", 0.0),
            leg1_distance=leg1_dist,
            leg2_distance=leg2_dist,
            polyline=combined_polyline,
            cumulative_miles=combined_cum_miles,
            current_loc=current_loc,
            pickup_loc=pickup_loc,
            dropoff_loc=dropoff_loc
        )

        events, stops = engine.run()

        # 5. Partition events across midnight into official 24-hour daily log sheets
        trip_metadata = {
            "carrier_name": data.get("carrier_name", "Spotter Logistics LLC"),
            "main_office": data.get("main_office", "500 W Madison St, Chicago, IL 60661"),
            "driver_name": data.get("driver_name", "Kavankumar"),
            "driver_signature": data.get("driver_signature", "Kavankumar"),
            "tractor_number": data.get("tractor_number", "TRK-408"),
            "trailer_number": data.get("trailer_number", "TRL-992"),
            "shipping_doc": data.get("shipping_doc", "BOL #48291-SP"),
            "commodity": data.get("commodity", "General Freight #48291"),
        }
        daily_logs = split_events_into_daily_logs(events, trip_metadata)

        # 6. Calculate aggregate metrics
        total_driving_hrs = sum(e["duration_hours"] for e in events if e["duty_status"] == "DRIVING")
        total_trip_hrs = (datetime.fromisoformat(events[-1]["end_time"]) - datetime.fromisoformat(events[0]["start_time"])).total_seconds() / 3600.0

        fuel_stops_count = sum(1 for s in stops if s["stop_type"] == "FUEL")
        rest_10_count = sum(1 for s in stops if s["stop_type"] == "REST_10")
        rest_30_count = sum(1 for s in stops if s["stop_type"] == "REST_30")
        restart_34_count = sum(1 for s in stops if s["stop_type"] == "RESTART_34")

        summary = {
            "total_distance_miles": total_dist,
            "leg1_distance_miles": leg1_dist,
            "leg2_distance_miles": leg2_dist,
            "total_driving_hours": round(total_driving_hrs, 1),
            "total_trip_duration_hours": round(total_trip_hrs, 1),
            "fuel_stops_count": fuel_stops_count,
            "rest_stops_count": rest_10_count + rest_30_count + restart_34_count,
            "rest_10_count": rest_10_count,
            "rest_30_count": rest_30_count,
            "restart_34_count": restart_34_count,
            "start_time": events[0]["start_time"],
            "end_time": events[-1]["end_time"],
            "remaining_cycle_hours": round(max(0.0, 70.0 - engine.cycle_used), 2),
            "total_days": len(daily_logs)
        }

        # Downsample polyline for efficient frontend map rendering if too dense
        rendered_polyline = combined_polyline
        if len(rendered_polyline) > 1000:
            step = len(rendered_polyline) // 600
            rendered_polyline = rendered_polyline[::step]
            if rendered_polyline[-1] != combined_polyline[-1]:
                rendered_polyline.append(combined_polyline[-1])

        # Persist calculated trip record in Supabase / database
        try:
            from .models import TripPlanRecord
            TripPlanRecord.objects.create(
                current_location=current_loc.get('display_name', data['current_location']),
                pickup_location=pickup_loc.get('display_name', data['pickup_location']),
                dropoff_location=dropoff_loc.get('display_name', data['dropoff_location']),
                total_distance_miles=total_dist,
                total_driving_hours=round(total_driving_hrs, 1),
                total_trip_duration_hours=round(total_trip_hrs, 1),
                total_days=len(daily_logs),
                carrier_name=trip_metadata.get('carrier_name', 'Spotter Logistics LLC'),
                driver_name=trip_metadata.get('driver_name', 'Kavankumar'),
                current_cycle_used=data.get('current_cycle_used', 0.0),
                remaining_cycle_hours=summary['remaining_cycle_hours'],
                summary_data=summary
            )
        except Exception as db_err:
            # Non-blocking log if DB table is migrating
            print(f"[Supabase / DB Logging Notice]: {db_err}")

        return Response({
            "success": True,
            "summary": summary,
            "locations": {
                "current": current_loc,
                "pickup": pickup_loc,
                "dropoff": dropoff_loc,
            },
            "route_geometry": {
                "polyline": rendered_polyline,
                "source": seg1.get("source", "OSRM")
            },
            "stops": stops,
            "timeline": events,
            "daily_logs": daily_logs,
            "metadata": trip_metadata
        }, status=status.HTTP_200_OK)
