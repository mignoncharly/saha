from django.urls import path
from . import views

urlpatterns = [
    path('', views.AdminPriceRuleListCreateView.as_view(), name='admin-price-list'),
    path('<int:pk>/', views.AdminPriceRuleDetailView.as_view(), name='admin-price-detail'),
]