from django.urls import path, include
from . import views

urlpatterns = [
    path('dashboard/', views.DashboardStatsView.as_view(), name='admin-dashboard'),
    path('requests/', include('apps.logistics.admin_urls')),
    path('services/', include('apps.services.admin_urls')),
    path('prices/', include('apps.pricing.admin_urls')),
    path('pickup-schedules/', include('apps.schedules.admin_urls_pickup')),
    path('loading-dates/', include('apps.schedules.admin_urls_loading')),
    path('broadcast/', include('apps.notifications.admin_urls')),
]