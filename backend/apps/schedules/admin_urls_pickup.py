from django.urls import path
from . import views, admin_views

urlpatterns = [
    path('', views.AdminPickupScheduleListCreateView.as_view(), name='admin-pickup-schedule-list'),
    path('<int:pk>/', views.AdminPickupScheduleDetailView.as_view(), name='admin-pickup-schedule-detail'),
    path('export/csv/', admin_views.ExportPickupSchedulesCSVView.as_view(), name='admin-schedule-export-csv'),
    path('import/', admin_views.ImportPickupSchedulesView.as_view(), name='admin-schedule-import'),
]