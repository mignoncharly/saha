from django.urls import path
from . import views

urlpatterns = [
    path('', views.PickupScheduleListView.as_view(), name='pickup-schedule-list'),
]