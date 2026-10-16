import type {
  EventType,
  ListingKind,
  OrderStatus,
  PaymentStatus,
  ServiceCategory,
} from "@/lib/marketplace/constants";

export interface Shop {
  id: string;
  vendor_id: string;
  slug: string;
  name: string;
  owner_name: string | null;
  tagline: string | null;
  description: string | null;
  city: string | null;
  contact_number: string | null;
  delivery_fee: number;
  offers: ListingKind[];
  logo_path: string | null;
  is_open: boolean;
  created_at: string;
}

export type ListingStatus = "pending_review" | "approved" | "rejected";

export interface Listing {
  id: string;
  shop_id: string;
  kind: ListingKind;
  service_category: ServiceCategory | null;
  event_types: EventType[];
  title: string;
  description: string;
  price: number;
  inclusions: string[];
  image_path: string | null;
  status: ListingStatus;
  review_notes: string | null;
  reviewed_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ListingWithShop = Listing & { shop: Pick<Shop, "id" | "slug" | "name" | "owner_name" | "city"> };

/** A choosable listing in the surprise and event flows (safe to send to the browser). */
export type FlowOption = Pick<
  Listing,
  "id" | "kind" | "title" | "description" | "price" | "image_path" | "service_category" | "event_types" | "inclusions"
> & { shop: Pick<Shop, "id" | "slug" | "name" | "city" | "delivery_fee"> };

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  shop_id: string;
  booking_id: string | null;
  kind: ListingKind;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  paid_at: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  gift_message: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  listing_id: string | null;
  title: string;
  kind: ListingKind;
  service_category: ServiceCategory | null;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_path: string | null;
}

export interface OrderEvent {
  id: number;
  order_id: string;
  status: string;
  message: string;
  actor_role: "customer" | "vendor" | "admin" | "system";
  created_at: string;
}

export interface EventBooking {
  id: string;
  booking_number: string;
  customer_id: string;
  event_type: EventType;
  mode: "package" | "custom";
  event_at: string;
  place: string;
  guest_count: number | null;
  notes: string | null;
  appointment_status: "none" | "requested" | "skipped";
  appointment_at: string | null;
  appointment_note: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  shop_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  details: string;
  status: "open" | "resolved";
  resolution: "refund" | "release" | null;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
}
