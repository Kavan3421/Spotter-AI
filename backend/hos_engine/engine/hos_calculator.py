"""
FMCSA Hours of Service (HOS) Simulation Engine.
Implements 49 CFR Part 395 rules for property-carrying commercial vehicle drivers:
- 11-Hour Driving Limit
- 14-Hour Driving Window
- 30-Minute Rest Break after 8 hours of driving
- 10-Hour Off-Duty/Sleeper Berth Reset
- 70-Hour / 8-Day Rolling Cycle Limit with 34-Hour Restart
- Fueling Stop at least every 1,000 miles (30 min On-Duty)
- 1.0 hr Pickup & 1.0 hr Drop-off (On-Duty Not Driving)
"""
from datetime import datetime, timedelta
from .routing import find_location_at_miles

DUTY_OFF = "OFF_DUTY"
DUTY_SB = "SLEEPER_BERTH"
DUTY_DRIVING = "DRIVING"
DUTY_ON = "ON_DUTY"

TRUCK_SPEED_MPH = 55.0

class HosSimulationEngine:
    def __init__(self,
                 start_time: datetime,
                 current_cycle_used: float,
                 leg1_distance: float,
                 leg2_distance: float,
                 polyline: list,
                 cumulative_miles: list,
                 current_loc: dict,
                 pickup_loc: dict,
                 dropoff_loc: dict):
        self.start_time = start_time
        self.current_time = start_time
        self.cycle_used = float(current_cycle_used)
        self.cycle_limit = 70.0
        
        self.leg1_distance = leg1_distance
        self.leg2_distance = leg2_distance
        self.total_trip_distance = leg1_distance + leg2_distance
        
        self.polyline = polyline
        self.cumulative_miles = cumulative_miles
        
        self.current_loc = current_loc
        self.pickup_loc = pickup_loc
        self.dropoff_loc = dropoff_loc
        
        # State trackers
        self.current_mile = 0.0
        self.miles_since_fuel = 0.0
        self.driving_in_shift = 0.0
        self.window_elapsed = 0.0
        self.driving_since_break = 0.0
        
        self.events = []
        self.stops = []

    def _get_location_at_current_mile(self):
        return find_location_at_miles(self.polyline, self.cumulative_miles, self.current_mile)

    def _record_event(self, duty_status, duration_hours, remarks, is_stop=False, stop_type=None, miles_driven=0.0):
        start_t = self.current_time
        end_t = start_t + timedelta(hours=duration_hours)
        loc = self._get_location_at_current_mile()
        
        # Update cycle hours
        if duty_status in [DUTY_DRIVING, DUTY_ON]:
            self.cycle_used = min(self.cycle_limit, self.cycle_used + duration_hours)
            
        event = {
            "duty_status": duty_status,
            "start_time": start_t.isoformat(),
            "end_time": end_t.isoformat(),
            "duration_hours": round(duration_hours, 2),
            "start_miles": round(self.current_mile, 1),
            "end_miles": round(self.current_mile + miles_driven, 1),
            "miles_driven": round(miles_driven, 1),
            "location": loc,
            "remarks": remarks,
            "cycle_used": round(self.cycle_used, 2),
            "cycle_remaining": round(max(0.0, self.cycle_limit - self.cycle_used), 2),
            "is_stop": is_stop,
            "stop_type": stop_type
        }
        self.events.append(event)
        
        if is_stop:
            self.stops.append({
                "stop_type": stop_type,
                "remarks": remarks,
                "location": loc,
                "arrival_time": start_t.isoformat(),
                "departure_time": end_t.isoformat(),
                "duration_hours": round(duration_hours, 2),
                "cumulative_miles": round(self.current_mile + miles_driven, 1),
                "duty_status": duty_status,
                "cycle_remaining": round(max(0.0, self.cycle_limit - self.cycle_used), 2)
            })

        self.current_time = end_t
        self.current_mile += miles_driven
        return event

    def _take_rest_10hr(self, reason="10-Hour Mandatory Rest"):
        loc = self._get_location_at_current_mile()
        remarks = f"{reason} - {loc['city']}, {loc['state']}"
        self._record_event(DUTY_SB, 10.0, remarks, is_stop=True, stop_type="REST_10")
        
        # Reset shift clocks
        self.driving_in_shift = 0.0
        self.window_elapsed = 0.0
        self.driving_since_break = 0.0

    def _take_restart_34hr(self):
        loc = self._get_location_at_current_mile()
        remarks = f"34-Hour Restart (Cycle Reset) - {loc['city']}, {loc['state']}"
        self._record_event(DUTY_OFF, 34.0, remarks, is_stop=True, stop_type="RESTART_34")
        
        # Reset 70-hour cycle and shift clocks
        self.cycle_used = 0.0
        self.driving_in_shift = 0.0
        self.window_elapsed = 0.0
        self.driving_since_break = 0.0

    def _take_break_30min(self):
        loc = self._get_location_at_current_mile()
        remarks = f"30-Minute Rest Break - {loc['city']}, {loc['state']}"
        self._record_event(DUTY_OFF, 0.5, remarks, is_stop=True, stop_type="REST_30")
        
        self.window_elapsed += 0.5
        self.driving_since_break = 0.0

    def _take_fuel_stop(self):
        loc = self._get_location_at_current_mile()
        remarks = f"Fueling Stop (1,000-mile interval) - {loc['city']}, {loc['state']}"
        self._record_event(DUTY_ON, 0.5, remarks, is_stop=True, stop_type="FUEL")
        
        self.window_elapsed += 0.5
        self.miles_since_fuel = 0.0
        # Fuel stop is on-duty not driving >= 30 min, which satisfies 30-min break rule under 2020 FMCSA rule
        self.driving_since_break = 0.0

    def _simulate_driving_segment(self, target_miles):
        """
        Drive up to target_miles while enforcing:
        - 11-hr driving limit
        - 14-hr window limit
        - 8-hr driving break (30 min)
        - 1,000-mile fueling stop
        - 70-hr cycle capacity
        """
        miles_remaining = target_miles
        
        while miles_remaining > 0.01:
            # 1. Check if cycle limit reached or has less than 1 hour available
            if (self.cycle_limit - self.cycle_used) <= 0.25:
                self._take_restart_34hr()
                continue
                
            # 2. Check if 11-hour driving or 14-hour window exhausted
            if self.driving_in_shift >= 11.0 or self.window_elapsed >= 14.0:
                self._take_rest_10hr("10-Hour Shift Reset (11h drive / 14h window reached)")
                continue

            # 3. Check if 30-minute break needed (>= 8.0 driving hours without break)
            if self.driving_since_break >= 8.0:
                self._take_break_30min()
                continue

            # 4. Check if fuel stop needed (>= 1,000 miles since last fuel)
            if self.miles_since_fuel >= 1000.0:
                self._take_fuel_stop()
                continue

            # Determine maximum driving time allowed before NEXT constraint
            max_drive_by_shift = 11.0 - self.driving_in_shift
            max_drive_by_window = 14.0 - self.window_elapsed
            max_drive_by_break = 8.0 - self.driving_since_break
            max_drive_by_cycle = max(0.0, self.cycle_limit - self.cycle_used)
            
            # Fuel distance remaining
            miles_until_fuel = 1000.0 - self.miles_since_fuel
            max_drive_by_fuel = miles_until_fuel / TRUCK_SPEED_MPH

            # Time needed to finish current target miles
            time_needed_for_target = miles_remaining / TRUCK_SPEED_MPH

            drive_duration = min(
                time_needed_for_target,
                max_drive_by_shift,
                max_drive_by_window,
                max_drive_by_break,
                max_drive_by_cycle,
                max_drive_by_fuel
            )

            # Safeguard to avoid infinite loop
            if drive_duration <= 0.001:
                if self.cycle_limit - self.cycle_used <= 0.25:
                    self._take_restart_34hr()
                elif self.driving_since_break >= 7.99:
                    self._take_break_30min()
                elif self.miles_since_fuel >= 999.0:
                    self._take_fuel_stop()
                else:
                    self._take_rest_10hr()
                continue

            miles_this_step = drive_duration * TRUCK_SPEED_MPH
            
            # Record driving event
            start_loc = self._get_location_at_current_mile()
            self._record_event(
                duty_status=DUTY_DRIVING,
                duration_hours=drive_duration,
                remarks=f"Driving Interstate Route - near {start_loc['city']}, {start_loc['state']}",
                is_stop=False,
                miles_driven=miles_this_step
            )

            # Update clocks
            self.driving_in_shift += drive_duration
            self.window_elapsed += drive_duration
            self.driving_since_break += drive_duration
            self.miles_since_fuel += miles_this_step
            miles_remaining -= miles_this_step

    def run(self):
        """Execute the full trip simulation."""
        # 1. Trip Origin marker
        self.stops.append({
            "stop_type": "ORIGIN",
            "remarks": f"Trip Origin - {self.current_loc['city']}, {self.current_loc['state']}",
            "location": self.current_loc,
            "arrival_time": self.start_time.isoformat(),
            "departure_time": self.start_time.isoformat(),
            "duration_hours": 0.0,
            "cumulative_miles": 0.0,
            "duty_status": DUTY_OFF,
            "cycle_remaining": round(self.cycle_limit - self.cycle_used, 2)
        })

        # Check initial cycle: if user started with >= 70h, do 34h restart first
        if self.cycle_used >= 70.0:
            self._take_restart_34hr()

        # 2. Pre-trip inspection (15 mins on duty)
        self._record_event(
            duty_status=DUTY_ON,
            duration_hours=0.25,
            remarks=f"Pre-Trip Vehicle Inspection - {self.current_loc['city']}, {self.current_loc['state']}",
            is_stop=True,
            stop_type="PRE_TRIP"
        )
        self.window_elapsed += 0.25

        # 3. Leg 1: Current Location -> Pickup Location (deadhead)
        if self.leg1_distance > 0.5:
            self._simulate_driving_segment(self.leg1_distance)

        # 4. Pickup stop: 1.0 hour ON_DUTY
        # If pickup exceeds 14-hr window, driver must take 10h break first
        if self.window_elapsed + 1.0 > 14.0:
            self._take_rest_10hr("10-Hour Rest before Pickup (14-Hour Window limit)")

        loc_pickup = self.pickup_loc
        self._record_event(
            duty_status=DUTY_ON,
            duration_hours=1.0,
            remarks=f"Freight Pickup & Loading (Manifest / Bill of Lading) - {loc_pickup['city']}, {loc_pickup['state']}",
            is_stop=True,
            stop_type="PICKUP"
        )
        self.window_elapsed += 1.0
        # 1.0 hr on-duty not driving satisfies 30-min break
        self.driving_since_break = 0.0

        # 5. Leg 2: Pickup -> Dropoff Location
        if self.leg2_distance > 0.5:
            self._simulate_driving_segment(self.leg2_distance)

        # 6. Dropoff stop: 1.0 hour ON_DUTY
        loc_dropoff = self.dropoff_loc
        self._record_event(
            duty_status=DUTY_ON,
            duration_hours=1.0,
            remarks=f"Freight Delivery & Unloading (Receiver Sign-off) - {loc_dropoff['city']}, {loc_dropoff['state']}",
            is_stop=True,
            stop_type="DROPOFF"
        )
        self.window_elapsed += 1.0

        # 7. Post-trip inspection (15 mins on duty)
        self._record_event(
            duty_status=DUTY_ON,
            duration_hours=0.25,
            remarks=f"Post-Trip Vehicle Inspection - {loc_dropoff['city']}, {loc_dropoff['state']}",
            is_stop=True,
            stop_type="POST_TRIP"
        )

        return self.events, self.stops
