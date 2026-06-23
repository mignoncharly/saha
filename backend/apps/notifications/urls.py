from django.urls import path
from . import views

urlpatterns = [
    path('subscribe/', views.PushSubscriptionCreateView.as_view(), name='push-subscribe'),
    path('vapid-public-key/', views.VapidPublicKeyView.as_view(), name='vapid-public-key'),
]