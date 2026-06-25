import uuid

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.conf import settings
from .models import User
from apps.customers.models import Customer
from apps.notifications.tasks import send_verification_email

class AuthTokenSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                msg = _('Unable to log in with provided credentials.')
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = _('Must include "email" and "password".')
            raise serializers.ValidationError(msg, code='authorization')
        attrs['user'] = user
        return attrs

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'role', 'is_active', 'email_verified', 'created_at', 'full_name')

    def get_full_name(self, obj):
        profile = getattr(obj, 'customer_profile', None)
        return profile.full_name if profile else ''

class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=50, required=False)
    password = serializers.CharField(write_only=True)
    language = serializers.ChoiceField(choices=('fr', 'de'), default='fr', write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'phone', 'language')

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(_('Un compte avec cet email existe déjà.'))
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        phone = validated_data.pop('phone', '')
        language = validated_data.pop('language', 'fr')
        user = User.objects.create_user(**validated_data, role='customer')
        Customer.objects.create(
            user=user,
            full_name=full_name,
            phone=phone,
            email=validated_data['email'],
            preferred_language=language,
        )
        # Generate email verification token
        token = uuid.uuid4().hex
        user.email_verification_token = token
        user.email_verification_token_created_at = timezone.now()
        user.save(update_fields=['email_verification_token', 'email_verification_token_created_at'])
        # Send verification email asynchronously
        send_verification_email.delay(user.id, token)
        return user
