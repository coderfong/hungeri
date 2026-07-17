import { z } from "zod";

/** Shared zod schemas for merchant forms + server actions. */

export const outletInput = z.object({
  address: z.string().min(3, "Address is required"),
  postal_code: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  phone: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
});

export const businessInput = z.object({
  name: z.string().min(2, "Business name is required"),
  description: z.string().max(600).optional(),
  cuisine_tags: z.array(z.string()).default([]),
  price_level: z.coerce.number().min(1).max(4).optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  cover_url: z.string().url().optional().or(z.literal("")),
});

export const onboardingInput = z.object({
  business: businessInput,
  outlets: z.array(outletInput).min(1, "Add at least one outlet"),
  uen: z.string().optional(),
});

export const dealInput = z
  .object({
    title: z.string().min(3, "Headline is required").max(120),
    description: z.string().max(600).optional(),
    deal_type: z.enum([
      "percentage",
      "fixed_amount",
      "bogo",
      "set_menu",
      "freebie",
      "happy_hour",
      "loyalty",
    ]),
    discount_value: z.coerce.number().nonnegative().optional(),
    terms: z.string().max(600).optional(),
    fine_print: z.string().max(600).optional(),
    image_url: z.string().url().optional().or(z.literal("")),
    channels: z.array(z.enum(["dine_in", "takeaway", "delivery"])).default([]),
    dietary_tags: z.array(z.string()).default([]),
    start_at: z.string().min(1, "Start date is required"),
    end_at: z.string().min(1, "End date is required"),
    recurring: z.boolean().default(false),
    recurring_rule: z.any().optional(),
    // Single redemption method: diners show the "Redeemed!" screen in-store after
    // scanning the shop QR. Codes / links / auto-apply were removed.
    redemption_method: z.literal("show_screen").default("show_screen"),
  })
  .refine((d) => new Date(d.end_at) > new Date(d.start_at), {
    message: "End must be after start",
    path: ["end_at"],
  });

export type OutletInput = z.infer<typeof outletInput>;
export type BusinessInput = z.infer<typeof businessInput>;
export type OnboardingInput = z.infer<typeof onboardingInput>;
export type DealInput = z.infer<typeof dealInput>;
