"""
Automated unit tests for FMCSA HOS Engine, Simulation, and 24-hour log partitioning.
"""
from datetime import datetime, time
from django.test import TestCase
from rest_framework.test import APIClient
from hos_engine.engine.hos_calculator import HosSimulationEngine
from hos_engine.engine.log_splitter import split_events_into_daily_logs
from hos_engine.engine.routing import geocode_location, get_route_segment

class HosEngineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.start_dt = datetime(2026, 9, 12, 6, 0)
        self.chicago = geocode_location("Chicago, IL")
        self.gary = geocode_location("Gary, IN")
        self.la = geocode_location("Los Angeles, CA")

    def test_routing_and_geocoding(self):
        self.assertAlmostEqual(self.chicago["lat"], 41.8781, places=1)
        self.assertAlmostEqual(self.la["lat"], 34.0522, places=1)
        seg = get_route_segment(self.chicago, self.la)
        self.assertGreater(seg["distance_miles"], 1800)
        self.assertGreater(len(seg["polyline"]), 10)

    def test_hos_simulation_rules_cross_country(self):
        """Test long cross-country trip (Chicago -> Gary -> LA ~2000+ miles)."""
        seg1 = get_route_segment(self.chicago, self.gary)
        seg2 = get_route_segment(self.gary, self.la)
        
        combined_poly = list(seg1["polyline"]) + list(seg2["polyline"])
        cum_miles = list(seg1["cumulative_miles"])
        for m in seg2["cumulative_miles"]:
            cum_miles.append(seg1["distance_miles"] + m)

        engine = HosSimulationEngine(
            start_time=self.start_dt,
            current_cycle_used=10.0,
            leg1_distance=seg1["distance_miles"],
            leg2_distance=seg2["distance_miles"],
            polyline=combined_poly,
            cumulative_miles=cum_miles,
            current_loc=self.chicago,
            pickup_loc=self.gary,
            dropoff_loc=self.la
        )
        events, stops = engine.run()

        # Check pickup and dropoff
        pickup_stops = [s for s in stops if s["stop_type"] == "PICKUP"]
        dropoff_stops = [s for s in stops if s["stop_type"] == "DROPOFF"]
        self.assertEqual(len(pickup_stops), 1)
        self.assertEqual(len(dropoff_stops), 1)
        self.assertEqual(pickup_stops[0]["duration_hours"], 1.0)
        self.assertEqual(dropoff_stops[0]["duration_hours"], 1.0)

        # Check fuel stops for ~2000 miles: at least 2 fuel stops
        fuel_stops = [s for s in stops if s["stop_type"] == "FUEL"]
        self.assertGreaterEqual(len(fuel_stops), 2)

        # Check 10-hour rest stops: must have multiple 10h rests for a 2,000 mi trip
        rest_10_stops = [s for s in stops if s["stop_type"] == "REST_10"]
        self.assertGreaterEqual(len(rest_10_stops), 3)

    def test_24_hour_log_sheets_exact_totals(self):
        """Verify that every single daily log sheet sums to exactly 24.0 hours."""
        seg1 = get_route_segment(self.chicago, self.gary)
        seg2 = get_route_segment(self.gary, self.la)
        
        combined_poly = list(seg1["polyline"]) + list(seg2["polyline"])
        cum_miles = list(seg1["cumulative_miles"])
        for m in seg2["cumulative_miles"]:
            cum_miles.append(seg1["distance_miles"] + m)

        engine = HosSimulationEngine(
            start_time=self.start_dt,
            current_cycle_used=0.0,
            leg1_distance=seg1["distance_miles"],
            leg2_distance=seg2["distance_miles"],
            polyline=combined_poly,
            cumulative_miles=cum_miles,
            current_loc=self.chicago,
            pickup_loc=self.gary,
            dropoff_loc=self.la
        )
        events, stops = engine.run()
        daily_logs = split_events_into_daily_logs(events)

        self.assertGreaterEqual(len(daily_logs), 3)
        for day in daily_logs:
            totals = day["line_totals"]
            day_sum = round(
                totals["line_1_off_duty"] +
                totals["line_2_sleeper_berth"] +
                totals["line_3_driving"] +
                totals["line_4_on_duty"], 2
            )
            self.assertEqual(day_sum, 24.0, f"Day {day['day_number']} sum is {day_sum}, expected 24.0")
            self.assertEqual(totals["total_hours"], 24.0)

    def test_cycle_restart_at_high_hours(self):
        """If driver starts with 68 hours used, 34-hour restart must be scheduled when reaching 70."""
        engine = HosSimulationEngine(
            start_time=self.start_dt,
            current_cycle_used=68.0,
            leg1_distance=10.0,
            leg2_distance=600.0,
            polyline=[[41.8, -87.6], [40.0, -89.0], [38.0, -90.0]],
            cumulative_miles=[0.0, 300.0, 610.0],
            current_loc=self.chicago,
            pickup_loc=self.gary,
            dropoff_loc=self.chicago
        )
        events, stops = engine.run()
        restarts = [s for s in stops if s["stop_type"] == "RESTART_34"]
        self.assertGreaterEqual(len(restarts), 1)

    def test_api_plan_trip_endpoint(self):
        payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "Gary, IN",
            "dropoff_location": "Los Angeles, CA",
            "current_cycle_used": 15.0,
            "carrier_name": "Spotter Logistics LLC",
            "driver_name": "Kavankumar"
        }
        response = self.client.post("/api/plan-trip/", data=payload, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("summary", data)
        self.assertIn("route_geometry", data)
        self.assertIn("stops", data)
        self.assertIn("daily_logs", data)
        self.assertGreater(data["summary"]["total_distance_miles"], 1500)
