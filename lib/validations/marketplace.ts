import { z } from "zod";

const phone = z
  .string()
  .trim()
  .max(20, "Use 20 characters or fewer")
  .regex(/^\+?[\d ()-]+$/, "Use digits, spaces, dashes, and an optional leading +")
  .refine((v) => {
    const digits = v.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
  }, "Contact number must have 7 to 15 digits");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use ${max} characters or fewer`)
    .optional()
    .transform((v) => (v ? v : undefined));

/** "2026-10-20T15:30" from <input type="datetime-local">. */
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a date and time");

// ---------------- vendor ----------------

export const shopSchema = z.object({
  name: z.string().trim().min(2, "Shop name is required").max(80),
  tagline: optionalText(120),
  description: optionalText(2000),
  city: optionalText(80),
  contactNumber: phone.optional().or(z.literal("").transform(() => undefined)),
  deliveryFee: z.coerce.number({ error: "Enter an amount" }).min(0, "Can't be negative").max(100000),
  offers: z.array(z.enum(["gift", "surprise", "service"])).min(1, "Choose at least one thing you offer"),
  isOpen: z.boolean(),
});

export const listingSchema = z
  .object({
    kind: z.enum(["gift", "surprise", "service"]),
    title: z.string().trim().min(3, "Give it a title").max(100),
    description: z.string().trim().min(10, "Describe it in at least 10 characters").max(2000),
    price: z.coerce.number({ error: "Enter a price" }).min(0, "Can't be negative").max(10_000_000),
    serviceCategory: z
      .enum(["package", "venue", "catering", "photo_video", "decorations", "host", "sound_lights", "cake_desserts", "flowers", "entertainment"])
      .optional(),
    eventTypes: z.array(z.enum(["corporate", "social", "cultural"])).default([]),
    inclusions: z.array(z.string().trim().min(1).max(120)).max(20, "Up to 20 inclusions").default([]),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.kind !== "service" || v.serviceCategory, {
    message: "Choose a service category",
    path: ["serviceCategory"],
  })
  .refine((v) => v.serviceCategory !== "package" || v.inclusions.length > 0, {
    message: "List what the package includes",
    path: ["inclusions"],
  });

export type ListingInput = z.input<typeof listingSchema>;

// ---------------- customer ----------------

export const deliverySchema = z.object({
  recipientName: z.string().trim().min(2, "Who should receive it?").max(100),
  recipientPhone: phone,
  address: z.string().trim().min(5, "Enter the delivery address").max(300),
  notes: optionalText(500),
  giftMessage: optionalText(500),
});

export const surpriseSchema = deliverySchema.extend({
  listingId: z.uuid("Choose a surprise"),
  scheduledFor: localDateTime,
});

export const eventBookingSchema = z.object({
  eventType: z.enum(["corporate", "social", "cultural"]),
  mode: z.enum(["package", "custom"]),
  eventAt: localDateTime,
  place: z.string().trim().min(3, "Where is the event?").max(200),
  guestCount: z.coerce.number().int().min(1).max(100000).optional(),
  notes: optionalText(1000),
  listingIds: z.array(z.uuid()).min(1, "Choose at least one service").max(15),
});

export const paymentSchema = z.object({
  target: z.discriminatedUnion("type", [
    z.object({ type: z.literal("order"), id: z.uuid() }),
    z.object({ type: z.literal("booking"), id: z.uuid() }),
  ]),
  method: z.enum(["gcash", "maya", "card"]),
  cardNumber: z.string().trim().max(23).optional(),
});

export const reportSchema = z.object({
  orderId: z.uuid(),
  reason: z.enum(["not_delivered", "damaged", "wrong_item", "late", "service_issue", "other"]),
  details: z.string().trim().min(10, "Tell us what happened (at least 10 characters)").max(1000),
});

export const reviewSchema = z.object({
  orderId: z.uuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  comment: optionalText(1000),
});

export const appointmentSchema = z.object({
  bookingId: z.uuid(),
  at: localDateTime,
  note: optionalText(500),
});
