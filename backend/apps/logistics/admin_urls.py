from django.urls import path
from . import views, admin_views

urlpatterns = [
    path('', views.AdminTransportRequestListView.as_view(), name='admin-request-list'),
    path('bulk/', admin_views.BulkStatusUpdateView.as_view(), name='admin-request-bulk-status'),
    path('<int:pk>/', views.AdminTransportRequestDetailView.as_view(), name='admin-request-detail'),
    path('<int:pk>/status/', views.AdminTransportRequestStatusUpdateView.as_view(), name='admin-request-status-update'),
    path('<int:pk>/comments/', admin_views.AdminRequestCommentView.as_view(), name='admin-request-comments'),
    path('export/csv/', views.AdminTransportRequestExportCSVView.as_view(), name='admin-request-export-csv'),
]