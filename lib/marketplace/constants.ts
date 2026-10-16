/** Marketplace vocabulary shared by the browser and the server. */

export type ListingKind = "gift" | "surprise" | "service";
export type EventType = "corporate" | "social" | "cultural";
export type ServiceCategory =
  | "package"
  | "venue"
  | "catering"
  | "photo_video"
  | "decorations"
  | "host"
  | "sound_lights"
  | "cake_desserts"
  | "flowers"
  | "entertainment";

export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivery_failed"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

export type PaymentStatus = "unpaid" | "held" | "released" | "refunded";

export const kindMeta: Record<ListingKind, { label: string; plural: string; description: string }> = {
  gift: { label: "Gift", plural: "Gifts", description: "Products delivered to someone you love." },
  surprise: { label: "Surprise", plural: "Surprises", description: "Surprises delivered on the date and time you choose." },
  service: { label: "Event service", plural: "Event services", description: "Packages and services for your event." },
};

export const eventTypes: { value: EventType; label: string; description: string }[] = [
  { value: "corporate", label: "Corporate Events", description: "Launches, conferences, team building and company parties." },
  { value: "social", label: "Special / Social Occasions", description: "Birthdays, weddings, debuts, anniversaries and reunions." },
  { value: "cultural", label: "Cultural / Religious Events", description: "Baptisms, fiestas, cultural and faith celebrations." },
];

export const eventTypeLabel = (value: string) => eventTypes.find((e) => e.value === value)?.label ?? value;

export const serviceCategories: { value: ServiceCategory; label: string }[] = [
  { value: "package", label: "Event package" },
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "photo_video", label: "Photo & Video" },
  { value: "decorations", label: "Styling & Decorations" },
  { value: "host", label: "Host / Emcee" },
  { value: "sound_lights", label: "Sound & Lights" },
  { value: "cake_desserts", label: "Cakes & Desserts" },
  { value: "flowers", label: "Flowers" },
  { value: "entertainment", label: "Entertainment" },
];

/** Categories a customer can tick when customizing an event (everything but packages). */
export const checklistCategories = serviceCategories.filter((c) => c.value !== "package");

export const serviceCategoryLabel = (value: string | null) =>
  serviceCategories.find((c) => c.value === value)?.label ?? "Service";

/** Customer-facing status wording; some steps read differently for each kind. */
export function orderStatusLabel(status: OrderStatus, kind: ListingKind): string {
  switch (status) {
    case "awaiting_payment":
      return "Awaiting payment";
    case "paid":
      return kind === "gift" ? "Pending — shop preparing soon" : kind === "surprise" ? "Surprise booked" : "Booked";
    case "confirmed":
      return "Appointment confirmed";
    case "preparing":
      return "Being prepared";
    case "ready":
      return kind === "service" ? "Ready to serve" : "Out for delivery";
    case "delivery_failed":
      return "Delivery attempt failed";
    case "delivered":
      return kind === "service" ? "Service completed — please confirm" : "Delivered — please confirm";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "disputed":
      return "Reported — under review";
  }
}

export const statusTone: Record<OrderStatus, string> = {
  awaiting_payment: "bg-amber-100 text-amber-900",
  paid: "bg-sky-100 text-sky-900",
  confirmed: "bg-sky-100 text-sky-900",
  preparing: "bg-indigo-100 text-indigo-900",
  ready: "bg-violet-100 text-violet-900",
  delivery_failed: "bg-orange-100 text-orange-900",
  delivered: "bg-teal-100 text-teal-900",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-bond-ink/10 text-bond-ink/70",
  disputed: "bg-red-100 text-red-900",
};

/** The happy-path steps shown in the order progress tracker. */
export function progressSteps(kind: ListingKind): { status: OrderStatus; label: string }[] {
  if (kind === "service") {
    return [
      { status: "paid", label: "Booked" },
      { status: "confirmed", label: "Confirmed" },
      { status: "preparing", label: "Preparing" },
      { status: "ready", label: "Ready to serve" },
      { status: "delivered", label: "Completed" },
      { status: "completed", label: "Confirmed by you" },
    ];
  }
  return [
    { status: "paid", label: kind === "surprise" ? "Booked" : "Paid" },
    { status: "preparing", label: "Preparing" },
    { status: "ready", label: "Out for delivery" },
    { status: "delivered", label: "Delivered" },
    { status: "completed", label: "Received" },
  ];
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: "Not paid yet",
  held: "Paid — held by BOND until you confirm",
  released: "Released to the shop",
  refunded: "Refunded",
};

export const reportReasons: { value: string; label: string }[] = [
  { value: "not_delivered", label: "It wasn't delivered" },
  { value: "damaged", label: "It arrived damaged" },
  { value: "wrong_item", label: "Wrong item or details" },
  { value: "late", label: "It was very late" },
  { value: "service_issue", label: "Problem with the service" },
  { value: "other", label: "Something else" },
];

/** Vendor actions, by order kind and current status. */
export type VendorAction =
  | "start_preparing"
  | "mark_ready"
  | "mark_delivered"
  | "delivery_failed"
  | "retry_delivery"
  | "confirm"
  | "mark_completed"
  | "decline";

export function vendorActionsFor(kind: ListingKind, status: OrderStatus): { action: VendorAction; label: string; tone: "primary" | "secondary" | "danger" }[] {
  const decline = { action: "decline" as const, label: "Decline order", tone: "danger" as const };
  if (kind === "service") {
    switch (status) {
      case "paid":
        return [{ action: "confirm", label: "Confirm booking & appointment", tone: "primary" }, decline];
      case "confirmed":
        return [{ action: "start_preparing", label: "Start preparing", tone: "primary" }];
      case "preparing":
        return [{ action: "mark_ready", label: "Mark as ready to serve", tone: "primary" }];
      case "ready":
        return [{ action: "mark_completed", label: "Mark service as completed", tone: "primary" }];
      default:
        return [];
    }
  }
  switch (status) {
    case "paid":
      return [{ action: "start_preparing", label: "Start preparing", tone: "primary" }, decline];
    case "preparing":
      return [{ action: "mark_ready", label: "Order prepared — ready for delivery", tone: "primary" }];
    case "ready":
      return [
        { action: "mark_delivered", label: "Delivered successfully", tone: "primary" },
        { action: "delivery_failed", label: "Delivery didn't go through", tone: "secondary" },
      ];
    case "delivery_failed":
      return [
        { action: "retry_delivery", label: "Try delivery again", tone: "primary" },
        { action: "mark_delivered", label: "Delivered successfully", tone: "secondary" },
      ];
    default:
      return [];
  }
}

/** Orders a vendor needs to act on. */
export const vendorActionStatuses: OrderStatus[] = ["paid", "confirmed", "preparing", "ready", "delivery_failed"];

/** Philippine time is assumed for date/time pickers. */
export const PH_OFFSET = "+08:00";
export const toPhIso = (localValue: string) => `${localValue}:00${PH_OFFSET}`;

/** A Date as a Philippine-time value for <input type="datetime-local">, e.g. "2026-10-20T15:30". */
export function toPhLocalInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Steps shown along the top of each ordering flow. */
export const giftSteps = ["Choose a store", "Pick gifts", "Checkout", "Pay"];
export const surpriseSteps = ["Date & recipient", "Choose a surprise", "Review", "Pay"];
export const eventSteps = ["Event type", "Date & place", "Services", "Review", "Pay"];

/** datetime-local value `offsetMs` from now, in Philippine time. Call per request (server pages). */
export const phInputFromNow = (offsetMs: number) => toPhLocalInput(new Date(Date.now() + offsetMs));

/** Milliseconds from now until a timestamp (negative when it's past). */
export const msUntil = (timestamp: string) => new Date(timestamp).getTime() - Date.now();
