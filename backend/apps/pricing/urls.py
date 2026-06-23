from django.urls import path
from . import views

urlpatterns = [
    path('', views.PriceRuleListView.as_view(), name='price-list'),
    path('estimate/', views.PriceEstimateView.as_view(), name='price-estimate'),
]