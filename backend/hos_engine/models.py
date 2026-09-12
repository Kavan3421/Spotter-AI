from django.db import models

class TripPlanRecord(models.Model):
    """Stores calculated FMCSA trip plans in Supabase PostgreSQL / SQLite."""
    created_at = models.DateTimeField(auto_now_add=True)
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    
    total_distance_miles = models.FloatField(default=0.0)
    total_driving_hours = models.FloatField(default=0.0)
    total_trip_duration_hours = models.FloatField(default=0.0)
    total_days = models.IntegerField(default=1)
    
    carrier_name = models.CharField(max_length=255, default="Spotter Logistics LLC")
    driver_name = models.CharField(max_length=255, default="Kavankumar")
    current_cycle_used = models.FloatField(default=0.0)
    remaining_cycle_hours = models.FloatField(default=70.0)
    
    summary_data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Trip Plan Record"
        verbose_name_plural = "Trip Plan Records"

    def __str__(self):
        return f"Trip {self.pickup_location} -> {self.dropoff_location} ({self.total_distance_miles:.1f} mi) on {self.created_at.strftime('%Y-%m-%d %H:%M')}"
