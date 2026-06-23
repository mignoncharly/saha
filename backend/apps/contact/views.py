from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings
from .serializers import ContactSerializer
from apps.core.throttles import ContactRateThrottle

class ContactCreateView(generics.CreateAPIView):
    throttle_classes = [ContactRateThrottle]
    permission_classes = [AllowAny]
    serializer_class = ContactSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        # Send email to admin
        subject = f"STL Contact – {data['name']}"
        message = f"Nom: {data['name']}\nEmail: {data['email']}\nMessage:\n{data['message']}"
        from_email = data['email']
        recipient_list = [settings.DEFAULT_FROM_EMAIL]  # admin email
        send_mail(subject, message, from_email, recipient_list, fail_silently=True)
        return Response({'detail': 'Message envoyé avec succès.'}, status=status.HTTP_201_CREATED)