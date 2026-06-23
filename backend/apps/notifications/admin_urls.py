from django.urls import path
from . import views

urlpatterns = [
    path('', views.AdminBroadcastView.as_view(), name='admin-broadcast'),
]