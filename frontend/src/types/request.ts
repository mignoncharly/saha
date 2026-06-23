// Shape returned by list endpoints (admin requests list, customer "my requests").
// Mirrors apps.logistics.serializers.TransportRequestListSerializer.
export interface TransportRequestListItem {
  id: number;
  reference_code: string;
  customer_name: string;
  pickup_city: string;
  destination_name: string | null;
  status: string;
  created_at: string;
  preferred_pickup_date: string | null;
}

// Full detail shape (apps.logistics.serializers.TransportRequestDetailSerializer).
export interface TransportRequest {
  id: number;
  reference_code: string;
  customer: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
  };
  service_type: {
    id: number;
    name: string;
  } | null;
  pickup_city: string;
  pickup_address: string;
  preferred_pickup_date: string;
  destination_city: {
    id: number;
    name: string;
  } | null;
  quantity: number;
  dimensions: string;
  estimated_weight: string;
  description: string;
  status: string;
  internal_notes: string;
  customer_notes: string;
  estimated_price: string | null;
  final_price: string | null;
  photos: Array<{ id: number; image: string; uploaded_at: string }>;
  created_at: string;
  updated_at: string;
}