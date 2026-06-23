from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='api-login'),
    path('register/', views.RegisterView.as_view(), name='api-register'),
    path('me/', views.UserDetailView.as_view(), name='api-user-detail'),
    path('verify-email/', views.VerifyEmailView.as_view(), name='api-verify-email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='api-resend-verification'),
    path('password-reset/', views.PasswordResetView.as_view(), name='api-password-reset'),
    path('password-reset/confirm/', views.PasswordResetConfirmView.as_view(), name='api-password-reset-confirm'),
]