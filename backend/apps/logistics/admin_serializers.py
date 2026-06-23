from rest_framework import serializers

class BulkStatusUpdateSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    status = serializers.ChoiceField(choices=[
        ('new', 'new'), ('contacted', 'contacted'), ('confirmed', 'confirmed'),
        ('pickup_scheduled', 'pickup_scheduled'), ('received', 'received'),
        ('loaded', 'loaded'), ('in_transit', 'in_transit'),
        ('arrived_cameroon', 'arrived_cameroon'), ('delivered', 'delivered'),
        ('cancelled', 'cancelled'),
    ])