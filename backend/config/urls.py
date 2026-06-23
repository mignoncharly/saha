from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/prices/', include('apps.pricing.urls')),
    path('api/pickup-schedules/', include('apps.schedules.urls')),
    path('api/loading-dates/', include('apps.schedules.urls_loading')),
    path('api/destination-cities/', include('apps.destinations.urls')),
    path('api/transport-requests/', include('apps.logistics.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/contact/', include('apps.contact.urls')),
    path('api/admin/', include('apps.admin_api.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)