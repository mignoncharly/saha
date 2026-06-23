from django.urls import path
from . import views

urlpatterns = [
    path('', views.DestinationCityListView.as_view(), name='destination-list'),
]