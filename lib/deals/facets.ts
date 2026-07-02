import type { DealType, DealChannel } from "@/types/database";

/** Filterable facets. Cuisine list mirrors the seeded Singapore F&B tags. */

export const CUISINES = [
  "Local",
  "Hainanese",
  "Malay",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "Italian",
  "Western",
  "Cafe",
  "Dessert",
  "Hawker",
] as const;

export const DEAL_TYPES: { value: DealType; label: string }[] = [
  { value: "bogo", label: "1-for-1" },
  { value: "percentage", label: "% off" },
  { value: "fixed_amount", label: "$ off" },
  { value: "freebie", label: "Free item" },
  { value: "set_menu", label: "Set menu" },
  { value: "happy_hour", label: "Happy hour" },
  { value: "loyalty", label: "Loyalty" },
];

export const CHANNELS: { value: DealChannel; label: string }[] = [
  { value: "dine_in", label: "Dine-in" },
  { value: "takeaway", label: "Takeaway" },
  { value: "delivery", label: "Delivery" },
];

export const DIETARY = [
  "halal",
  "vegetarian",
  "vegan",
  "gluten-free",
] as const;

export const PRICE_LEVELS = [1, 2, 3, 4] as const;
