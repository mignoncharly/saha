from rest_framework import generics, permissions
from .models import PriceRule
from .serializers import PriceRuleSerializer
from apps.core.permissions import IsStaffOrAdmin
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils.translation import gettext as _
from apps.core.i18n import translate_database_value


class PriceRuleListView(generics.ListAPIView):
    queryset = PriceRule.objects.filter(active=True).select_related('service_type')
    serializer_class = PriceRuleSerializer
    permission_classes = []

# Admin views
class AdminPriceRuleListCreateView(generics.ListCreateAPIView):
    queryset = PriceRule.objects.select_related('service_type').all()
    serializer_class = PriceRuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class AdminPriceRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PriceRule.objects.all()
    serializer_class = PriceRuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]

class PriceEstimateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        service_type_id = request.query_params.get('service_type_id')
        quantity = int(request.query_params.get('quantity', 1))
        destination_city_id = request.query_params.get('destination_city_id')

        if not service_type_id:
            return Response({'detail': _('Service type is required.')}, status=400)

        try:
            price_rule = PriceRule.objects.filter(
                service_type_id=service_type_id,
                active=True
            ).order_by('price_amount').first()  # take cheapest matching

            if not price_rule:
                return Response({'estimated_price': None, 'detail': _('No price found.')})

            estimated = price_rule.price_amount * quantity
            return Response({
                'estimated_price': float(estimated),
                'currency': price_rule.currency,
                'unit': translate_database_value(price_rule.unit),
                'label': translate_database_value(price_rule.label),
            })
        except (TypeError, ValueError):
            return Response({'detail': _('Invalid request.')}, status=400)
