from django.urls import path
from . import views

urlpatterns = [
    path('', views.AdminLoadingDateListCreateView.as_view(), name='admin-loading-date-list'),
    path('<int:pk>/', views.AdminLoadingDateDetailView.as_view(), name='admin-loading-date-detail'),
]