from django.urls import path
from . import views

urlpatterns = [
    path('', views.PublicTransportRequestCreateView.as_view(), name='transport-request-create'),
    path('my-requests/', views.CustomerRequestListView.as_view(), name='customer-request-list'),
    path('<str:reference_code>/', views.PublicTransportRequestDetailView.as_view(), name='transport-request-detail'),
]