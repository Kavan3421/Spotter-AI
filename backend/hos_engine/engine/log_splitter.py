"""
24-Hour Midnight Boundary Log Partitioning Engine.
Splits continuous HOS events into official FMCSA §395.8 24-hour daily log sheets (00:00 to 24:00).
Guarantees daily line totals sum to EXACTLY 24.0 hours.
"""
from datetime import datetime, timedelta

DUTY_TO_LINE = {
    "OFF_DUTY": 1,
    "SLEEPER_BERTH": 2,
    "DRIVING": 3,
    "ON_DUTY": 4,
}

LINE_NAMES = {
    1: "OFF DUTY",
    2: "SLEEPER BERTH",
    3: "DRIVING",
    4: "ON DUTY (ND)",
}

def parse_iso(dt_str):
    return datetime.fromisoformat(dt_str)

def format_hour_decimal(dt):
    """Convert datetime to decimal hour of the day (0.0 to 24.0)."""
    return dt.hour + dt.minute / 60.0 + dt.second / 3600.0

def split_events_into_daily_logs(events, trip_metadata=None):
    """
    Takes chronological simulation events and partitions them into sequential 24-hour daily log sheets.
    """
    if not events:
        return []

    if trip_metadata is None:
        trip_metadata = {}

    first_event_start = parse_iso(events[0]["start_time"])
    last_event_end = parse_iso(events[-1]["end_time"])

    # First day start: 00:00:00 of the trip start date
    day_cursor = first_event_start.replace(hour=0, minute=0, second=0, microsecond=0)
    # Final day end: 24:00:00 (next day 00:00:00) of the trip end date
    trip_end_calendar_day = last_event_end.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Pre-pad: from midnight 00:00 to first_event_start, driver is OFF_DUTY
    processed_events = []
    if first_event_start > day_cursor:
        origin_loc = events[0].get("location", {"city": "Origin", "state": "US"})
        processed_events.append({
            "duty_status": "OFF_DUTY",
            "start_time": day_cursor.isoformat(),
            "end_time": first_event_start.isoformat(),
            "duration_hours": (first_event_start - day_cursor).total_seconds() / 3600.0,
            "miles_driven": 0.0,
            "location": origin_loc,
            "remarks": f"Off Duty (Prior to Trip Departure) - {origin_loc.get('city', '')}, {origin_loc.get('state', '')}",
            "cycle_used": events[0].get("cycle_used", 0.0),
            "cycle_remaining": events[0].get("cycle_remaining", 70.0)
        })

    processed_events.extend(events)

    # Post-pad: from last_event_end to midnight of final day, driver is OFF_DUTY
    final_day_midnight = trip_end_calendar_day + timedelta(days=1)
    if last_event_end < final_day_midnight:
        dest_loc = events[-1].get("location", {"city": "Destination", "state": "US"})
        processed_events.append({
            "duty_status": "OFF_DUTY",
            "start_time": last_event_end.isoformat(),
            "end_time": final_day_midnight.isoformat(),
            "duration_hours": (final_day_midnight - last_event_end).total_seconds() / 3600.0,
            "miles_driven": 0.0,
            "location": dest_loc,
            "remarks": f"Off Duty (Post-Delivery Rest) - {dest_loc.get('city', '')}, {dest_loc.get('state', '')}",
            "cycle_used": events[-1].get("cycle_used", 0.0),
            "cycle_remaining": events[-1].get("cycle_remaining", 70.0)
        })

    # Now partition events into days
    daily_logs = []
    current_day_start = day_cursor
    day_number = 1

    # Total days
    total_days = (final_day_midnight - day_cursor).days

    while current_day_start < final_day_midnight:
        current_day_end = current_day_start + timedelta(days=1)
        day_date_str = current_day_start.strftime("%Y-%m-%d")
        day_date_formatted = current_day_start.strftime("%B %d, %Y")

        day_segments = []
        duty_transitions = []
        miles_today = 0.0
        
        line_totals = {1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0}
        last_cycle_used = 0.0
        last_cycle_rem = 70.0

        for ev in processed_events:
            ev_start = parse_iso(ev["start_time"])
            ev_end = parse_iso(ev["end_time"])

            # Check overlap with [current_day_start, current_day_end)
            overlap_start = max(ev_start, current_day_start)
            overlap_end = min(ev_end, current_day_end)

            if overlap_start < overlap_end:
                duration_hrs = (overlap_end - overlap_start).total_seconds() / 3600.0
                duty = ev["duty_status"]
                line_num = DUTY_TO_LINE.get(duty, 1)
                
                line_totals[line_num] += duration_hrs

                # Calculate miles driven in this sliced segment
                total_ev_duration = (ev_end - ev_start).total_seconds() / 3600.0
                if total_ev_duration > 0 and ev.get("miles_driven", 0) > 0:
                    fraction = duration_hrs / total_ev_duration
                    miles_in_slice = ev["miles_driven"] * fraction
                else:
                    miles_in_slice = 0.0
                miles_today += miles_in_slice

                start_hour_dec = format_hour_decimal(overlap_start)
                end_hour_dec = format_hour_decimal(overlap_end)
                # If overlap_end is exactly midnight of next day, decimal hour is 24.0
                if overlap_end == current_day_end:
                    end_hour_dec = 24.0

                loc_info = ev.get("location", {})
                loc_str = f"{loc_info.get('city', '')}, {loc_info.get('state', '')}".strip(" ,")

                segment_obj = {
                    "line": line_num,
                    "duty_status": duty,
                    "line_name": LINE_NAMES[line_num],
                    "start_hour": round(start_hour_dec, 3),
                    "end_hour": round(end_hour_dec, 3),
                    "duration_hours": round(duration_hrs, 2),
                    "location": loc_str,
                    "remarks": ev.get("remarks", "")
                }
                day_segments.append(segment_obj)

                # Record transition remark for table below grid
                time_str = overlap_start.strftime("%H:%M")
                duty_transitions.append({
                    "time": time_str,
                    "line": line_num,
                    "duty_status": duty,
                    "line_name": LINE_NAMES[line_num],
                    "location": loc_str,
                    "remarks": ev.get("remarks", "")
                })

                last_cycle_used = ev.get("cycle_used", last_cycle_used)
                last_cycle_rem = ev.get("cycle_remaining", last_cycle_rem)

        # Ensure totals sum to EXACTLY 24.0
        # Round each line total to 2 decimal places, then distribute any rounding delta
        rounded_totals = {k: round(v, 2) for k, v in line_totals.items()}
        sum_rounded = sum(rounded_totals.values())
        diff = round(24.0 - sum_rounded, 2)
        if diff != 0:
            # Add difference to the largest non-zero line
            max_line = max(rounded_totals, key=rounded_totals.get)
            rounded_totals[max_line] = round(rounded_totals[max_line] + diff, 2)

        on_duty_today = round(rounded_totals[3] + rounded_totals[4], 2)

        daily_logs.append({
            "day_number": day_number,
            "total_days": total_days,
            "date": day_date_str,
            "date_formatted": day_date_formatted,
            "header": {
                "carrier_name": trip_metadata.get("carrier_name", "Spotter Logistics LLC"),
                "main_office": trip_metadata.get("main_office", "500 W Madison St, Chicago, IL 60661"),
                "driver_name": trip_metadata.get("driver_name", "Kavankumar"),
                "driver_signature": trip_metadata.get("driver_signature", "Kavankumar"),
                "tractor_number": trip_metadata.get("tractor_number", "TRK-408"),
                "trailer_number": trip_metadata.get("trailer_number", "TRL-992"),
                "shipping_doc": trip_metadata.get("shipping_doc", "BOL #48291-SP"),
                "commodity": trip_metadata.get("commodity", "General Freight"),
                "total_miles_today": round(miles_today, 1)
            },
            "line_totals": {
                "line_1_off_duty": rounded_totals[1],
                "line_2_sleeper_berth": rounded_totals[2],
                "line_3_driving": rounded_totals[3],
                "line_4_on_duty": rounded_totals[4],
                "total_hours": 24.0
            },
            "grid_segments": day_segments,
            "duty_transitions": duty_transitions,
            "recap": {
                "on_duty_today": on_duty_today,
                "cycle_hours_used": round(last_cycle_used, 2),
                "cycle_hours_remaining": round(last_cycle_rem, 2),
                "cycle_limit": 70.0
            }
        })

        current_day_start = current_day_end
        day_number += 1

    return daily_logs
