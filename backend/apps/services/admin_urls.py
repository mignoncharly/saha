from django.urls import path
from . import views

urlpatterns = [
    path('', views.AdminServiceTypeListCreateView.as_view(), name='admin-service-list'),
    path('<int:pk>/', views.AdminServiceTypeDetailView.as_view(), name='admin-service-detail'),
]