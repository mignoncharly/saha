from django.urls import path
from . import views

urlpatterns = [
    path('', views.LoadingDateListView.as_view(), name='loading-date-list'),
]