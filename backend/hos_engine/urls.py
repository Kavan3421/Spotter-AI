from django.urls import path
from .views import PlanTripView, HealthCheckView, CitySearchView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('plan-trip/', PlanTripView.as_view(), name='plan-trip'),
    path('search-cities/', CitySearchView.as_view(), name='search-cities'),
]
