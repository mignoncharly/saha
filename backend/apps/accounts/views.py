from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.utils.translation import gettext as _
from .serializers import AuthTokenSerializer, UserSerializer, RegisterSerializer
from .models import User
from apps.core.throttles import AuthRateThrottle
from apps.notifications.tasks import send_password_reset_email, send_verification_email

UserModel = get_user_model()

class LoginView(ObtainAuthToken):
    serializer_class = AuthTokenSerializer
    throttle_classes = [AuthRateThrottle]
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })

class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'user': UserSerializer(request.user).data})

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []
    throttle_classes = [AuthRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = []
    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'detail': _('Missing token')}, status=400)
        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response({'detail': _('Invalid token')}, status=400)
        # Token expiry (24h)
        if user.email_verification_token_created_at:
            if (timezone.now() - user.email_verification_token_created_at).total_seconds() > 86400:
                return Response({'detail': _('Expired token')}, status=400)
        user.email_verified = True
        user.email_verification_token = None
        user.email_verification_token_created_at = None
        user.save()
        return Response({'detail': _('Email address verified successfully.')})

class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({'detail': _('Email address already verified.')})
        import uuid
        token = uuid.uuid4().hex
        user.email_verification_token = token
        user.email_verification_token_created_at = timezone.now()
        user.save()
        send_verification_email.delay(user.id, token)
        return Response({'detail': _('Verification email sent again.')})

class PasswordResetView(APIView):
    permission_classes = []
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'detail': _('Email address is required.')}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': _('If this email address exists, a password reset link has been sent.')})
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        # Build reset link (frontend URL)
        reset_url = f"{settings.FRONTEND_URL}/compte/reset-password?uid={uid}&token={token}"
        # Send email asynchronously
        send_password_reset_email.delay(user.id, reset_url)
        return Response({'detail': _('If this email address exists, a password reset link has been sent.')})

class PasswordResetConfirmView(APIView):
    permission_classes = []
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not all([uid, token, new_password]):
            return Response({'detail': _('Missing parameters.')}, status=400)
        try:
            pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'detail': _('Invalid link.')}, status=400)
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'detail': _('Invalid or expired link.')}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({'detail': _('Password reset successfully.')})
