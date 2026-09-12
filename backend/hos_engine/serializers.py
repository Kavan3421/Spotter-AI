from rest_framework import serializers

class PlanTripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField(required=False, default="Chicago, IL")
    pickup_location = serializers.CharField(required=False, default="Gary, IN")
    dropoff_location = serializers.CharField(required=False, default="Los Angeles, CA")
    current_cycle_used = serializers.FloatField(required=False, default=0.0, min_value=0.0, max_value=70.0)
    
    # Metadata fields
    carrier_name = serializers.CharField(required=False, default="Spotter Logistics LLC")
    main_office = serializers.CharField(required=False, default="500 W Madison St, Chicago, IL 60661")
    driver_name = serializers.CharField(required=False, default="Kavankumar")
    driver_signature = serializers.CharField(required=False, default="Kavankumar")
    tractor_number = serializers.CharField(required=False, default="TRK-408")
    trailer_number = serializers.CharField(required=False, default="TRL-992")
    shipping_doc = serializers.CharField(required=False, default="BOL #48291-SP")
    commodity = serializers.CharField(required=False, default="General Freight #48291")
    trip_start_time = serializers.CharField(required=False, default="", allow_blank=True)
