ALLOWED_STATUS_TRANSITIONS = {
    'new': ['contacted', 'cancelled'],
    'contacted': ['confirmed', 'cancelled'],
    'confirmed': ['pickup_scheduled', 'cancelled'],
    'pickup_scheduled': ['received', 'cancelled'],
    'received': ['loaded', 'cancelled'],
    'loaded': ['in_transit', 'cancelled'],
    'in_transit': ['arrived_cameroon', 'cancelled'],
    'arrived_cameroon': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': [],
}