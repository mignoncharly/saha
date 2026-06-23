from django.urls import path
from . import views

urlpatterns = [
    path('', views.ServiceTypeListView.as_view(), name='service-list'),
]