from django.contrib import admin
from .models import TripPlanRecord

@admin.register(TripPlanRecord)
class TripPlanRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'pickup_location', 'dropoff_location', 'total_distance_miles', 'total_days', 'driver_name', 'created_at')
    list_filter = ('carrier_name', 'created_at')
    search_fields = ('pickup_location', 'dropoff_location', 'driver_name', 'carrier_name')
