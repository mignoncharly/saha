export interface ServiceType {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface PriceRule {
  id: number;
  service_type: number;
  service_name: string;
  label: string;
  price_amount: string;
  currency: string;
  unit: string;
  description?: string;
  active?: boolean;
}

export interface PickupSchedule {
  id: number;
  region?: number;
  region_name: string;
  cities: string;
  start_date: string;
  end_date: string | null;
  notes: string;
}

export interface LoadingDate {
  id: number;
  date: string;
  title: string;
  description: string;
  active?: boolean;
}

export interface DestinationCity {
  id: number;
  name: string;
  country: string;
}

export interface CustomerNotification {
  id: number;
  title: string;
  body: string;
  reference_code: string;
  read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  language: string;
  regions: string;
  status_updates: boolean;
  pickup_alerts: boolean;
  updated_at: string;
}

export interface DashboardStats {
  total_requests: number;
  new_requests: number;
  confirmed_requests: number;
  by_pickup_city: Array<{ pickup_city: string; count: number }>;
  by_destination_city: Array<{ destination_city__name: string; count: number }>;
  by_status: Array<{ status: string; count: number }>;
  requests_over_time: Array<{ date: string; count: number }>;
}