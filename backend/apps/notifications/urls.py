from django.urls import path
from . import views

urlpatterns = [
    path('subscribe/', views.PushSubscriptionCreateView.as_view(), name='push-subscribe'),
    path('vapid-public-key/', views.VapidPublicKeyView.as_view(), name='vapid-public-key'),
    # Customer notification center
    path('me/', views.CustomerNotificationListView.as_view(), name='customer-notifications'),
    path('me/unread-count/', views.CustomerNotificationUnreadCountView.as_view(), name='customer-notifications-unread'),
    path('me/read/', views.CustomerNotificationMarkReadView.as_view(), name='customer-notifications-read'),
    path('preferences/', views.NotificationPreferenceView.as_view(), name='customer-notification-preferences'),
]
