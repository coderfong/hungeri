/**
 * Hungeri seed script.
 *
 * Creates demo auth accounts (admin, merchant, consumer), a handful of real-ish
 * Singapore F&B businesses with outlets, and ~30 live deals across cuisines so
 * the UI is never empty. Idempotent: re-running upserts businesses by slug and
 * replaces their deals.
 *
 * Run with:  npm run db:seed
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database, DealType, DealChannel } from "../types/database";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const db = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();
const iso = (ms: number) => new Date(ms).toISOString();

/** Create (or fetch existing) an auth user with a given role. */
async function ensureUser(email: string, role: string, display_name: string) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role, display_name },
  });
  if (data?.user) return data.user.id;

  if (error && /already.*registered|exists/i.test(error.message)) {
    // Fall back to lookup (paginate a little in case the project has users).
    for (let page = 1; page <= 5; page++) {
      const { data: list } = await db.auth.admin.listUsers({ page, perPage: 200 });
      const found = list?.users.find((u) => u.email === email);
      if (found) return found.id;
      if (!list?.users.length) break;
    }
  }
  throw new Error(`Could not create or find user ${email}: ${error?.message}`);
}

type SeedBusiness = {
  slug: string;
  name: string;
  description: string;
  cuisine_tags: string[];
  price_level: number;
  outlets: { address: string; postal_code: string; lat: number; lng: number; phone?: string }[];
  deals: {
    title: string;
    description: string;
    deal_type: DealType;
    discount_value?: number;
    channels: DealChannel[];
    dietary_tags?: string[];
    endsInDays: number;
  }[];
};

// A spread of Singapore neighbourhoods & cuisines.
const BUSINESSES: SeedBusiness[] = [
  {
    slug: "tian-tian-hainanese",
    name: "Tian Tian Hainanese Chicken Rice",
    description: "Maxwell hawker legend serving silky poached chicken over fragrant rice.",
    cuisine_tags: ["Hainanese", "Local", "Hawker"],
    price_level: 1,
    outlets: [{ address: "1 Kadayanallur St, Maxwell Food Centre #01-10", postal_code: "069184", lat: 1.2803, lng: 103.8447 }],
    deals: [
      { title: "Lunch set: chicken rice + drink $6", description: "Weekday lunch combo, dine-in only.", deal_type: "set_menu", channels: ["dine_in"], endsInDays: 14 },
      { title: "10% off takeaway over $20", description: "Feed the office. Min spend $20.", deal_type: "percentage", discount_value: 10, channels: ["takeaway", "delivery"], endsInDays: 3 },
    ],
  },
  {
    slug: "the-coconut-club",
    name: "The Coconut Club",
    description: "Elevated nasi lemak with house-made sambal and premium coconut rice.",
    cuisine_tags: ["Malay", "Nasi Lemak", "Local"],
    price_level: 2,
    outlets: [{ address: "6 Ann Siang Hill", postal_code: "069787", lat: 1.2808, lng: 103.8462 }],
    deals: [
      { title: "1-for-1 Nasi Lemak (weekdays)", description: "Buy one signature nasi lemak, get one free, 2.30–5pm.", deal_type: "bogo", channels: ["dine_in"], endsInDays: 7 },
      { title: "Free kueh with any main", description: "Complimentary kueh dessert with every main course.", deal_type: "freebie", channels: ["dine_in"], endsInDays: 21 },
    ],
  },
  {
    slug: "sushi-tei",
    name: "Sushi Tei",
    description: "Popular Japanese chain for conveyor-belt sushi and à la carte donburi.",
    cuisine_tags: ["Japanese", "Sushi"],
    price_level: 2,
    outlets: [
      { address: "391 Orchard Rd, Takashimaya B2-01", postal_code: "238872", lat: 1.3030, lng: 103.8342 },
      { address: "23 Serangoon Central, NEX #02-11", postal_code: "556083", lat: 1.3506, lng: 103.8720 },
    ],
    deals: [
      { title: "15% off à la carte (dinner)", description: "After 6pm, dine-in. Excludes set menus.", deal_type: "percentage", discount_value: 15, channels: ["dine_in"], endsInDays: 2 },
      { title: "Set lunch from $12.80", description: "Weekday bento sets incl. miso soup.", deal_type: "set_menu", channels: ["dine_in"], endsInDays: 30 },
    ],
  },
  {
    slug: "pizza-express-sg",
    name: "PizzaExpress",
    description: "Hand-stretched Romana pizzas and Italian classics.",
    cuisine_tags: ["Italian", "Pizza", "Western"],
    price_level: 2,
    outlets: [{ address: "2 Bayfront Ave, Marina Bay Sands B1-01", postal_code: "018972", lat: 1.2834, lng: 103.8607 }],
    deals: [
      { title: "$10 lunch pizza + drink", description: "Choose any Classic pizza. Mon–Fri till 3pm.", deal_type: "set_menu", channels: ["dine_in"], dietary_tags: ["vegetarian-option"], endsInDays: 5 },
      { title: "20% off delivery orders", description: "Order direct for 20% off. Min $35.", deal_type: "percentage", discount_value: 20, channels: ["delivery"], endsInDays: 1 },
    ],
  },
  {
    slug: "ya-kun-kaya-toast",
    name: "Ya Kun Kaya Toast",
    description: "Heritage kopitiam: charcoal-toasted kaya toast, soft-boiled eggs, kopi.",
    cuisine_tags: ["Local", "Breakfast", "Cafe"],
    price_level: 1,
    outlets: [{ address: "18 China St, Far East Square #01-01", postal_code: "049560", lat: 1.2846, lng: 103.8479 }],
    deals: [
      { title: "Breakfast set $5.30", description: "Kaya toast + 2 eggs + kopi/teh. All day.", deal_type: "set_menu", channels: ["dine_in", "takeaway"], endsInDays: 45 },
      { title: "Loyalty: 10th kopi free", description: "Collect a stamp per drink. 10th on us.", deal_type: "loyalty", channels: ["dine_in", "takeaway"], endsInDays: 60 },
    ],
  },
  {
    slug: "swee-choon",
    name: "Swee Choon Tim Sum",
    description: "Beloved late-night dim sum institution in Jalan Besar.",
    cuisine_tags: ["Chinese", "Dim Sum", "Supper"],
    price_level: 2,
    outlets: [{ address: "183-191 Jln Besar", postal_code: "208882", lat: 1.3097, lng: 103.8568 }],
    deals: [
      { title: "Supper happy hour: 20% off (11pm–6am)", description: "Late-night dim sum discount on the whole menu.", deal_type: "happy_hour", discount_value: 20, channels: ["dine_in"], endsInDays: 10 },
      { title: "Free mee suah with $40 spend", description: "Signature mee suah kueh on the house.", deal_type: "freebie", channels: ["dine_in"], endsInDays: 4 },
    ],
  },
  {
    slug: "afterglow-cafe",
    name: "Afterglow by Anglow",
    description: "Plant-based wholefood café with raw and gluten-free options.",
    cuisine_tags: ["Vegan", "Cafe", "Healthy", "Western"],
    price_level: 3,
    outlets: [{ address: "24 Keong Saik Rd", postal_code: "089131", lat: 1.2797, lng: 103.8413 }],
    deals: [
      { title: "$3 off plant-based bowls", description: "Any signature grain bowl. Dine-in or takeaway.", deal_type: "fixed_amount", discount_value: 3, channels: ["dine_in", "takeaway"], dietary_tags: ["vegan", "gluten-free"], endsInDays: 8 },
      { title: "Free kombucha with weekday lunch", description: "House-brewed kombucha with any lunch main.", deal_type: "freebie", channels: ["dine_in"], dietary_tags: ["vegan"], endsInDays: 2 },
    ],
  },
  {
    slug: "birds-of-paradise",
    name: "Birds of Paradise Gelato",
    description: "Botanical gelato in flavours like white chrysanthemum and strawberry basil.",
    cuisine_tags: ["Dessert", "Gelato", "Cafe"],
    price_level: 2,
    outlets: [
      { address: "63 East Coast Rd #01-05", postal_code: "428776", lat: 1.3057, lng: 103.9050 },
      { address: "33 Jln Pisang", postal_code: "199070", lat: 1.3013, lng: 103.8585 },
    ],
    deals: [
      { title: "Double scoop for the price of one", description: "Mon–Thu, dine-in. Any two botanical flavours.", deal_type: "bogo", channels: ["dine_in"], dietary_tags: ["vegetarian"], endsInDays: 6 },
      { title: "15% off pints to go", description: "Takeaway pints only. While stocks last.", deal_type: "percentage", discount_value: 15, channels: ["takeaway"], endsInDays: 1 },
    ],
  },
  {
    slug: "zaffron-kitchen",
    name: "Zaffron Kitchen",
    description: "North Indian tandoor, biryani and butter chicken in East Coast.",
    cuisine_tags: ["Indian", "North Indian", "Halal"],
    price_level: 2,
    outlets: [{ address: "135/137 East Coast Rd", postal_code: "428820", lat: 1.3076, lng: 103.9095, phone: "+65 6440 6786" }],
    deals: [
      { title: "Family biryani set 25% off", description: "Serves 4. Includes raita and papadum.", deal_type: "percentage", discount_value: 25, channels: ["dine_in", "takeaway"], dietary_tags: ["halal"], endsInDays: 12 },
      { title: "Free mango lassi with mains x2", description: "Two complimentary lassi with any two mains.", deal_type: "freebie", channels: ["dine_in"], dietary_tags: ["halal", "vegetarian-option"], endsInDays: 3 },
    ],
  },
  {
    slug: "haidilao-sg",
    name: "Haidilao Hot Pot",
    description: "Hot pot chain famous for service, fresh slices and DIY sauce bar.",
    cuisine_tags: ["Chinese", "Hot Pot", "Sichuan"],
    price_level: 3,
    outlets: [{ address: "313 Orchard Rd, 313@Somerset #04-23", postal_code: "238895", lat: 1.3009, lng: 103.8384 }],
    deals: [
      { title: "Student lunch 20% off (weekdays)", description: "Show student ID. Mon–Fri 11am–4pm.", deal_type: "percentage", discount_value: 20, channels: ["dine_in"], endsInDays: 20 },
      { title: "Free pumpkin congee for supper", description: "Complimentary congee after 10pm.", deal_type: "freebie", channels: ["dine_in"], endsInDays: 9 },
    ],
  },
  {
    slug: "common-man-coffee",
    name: "Common Man Coffee Roasters",
    description: "Specialty coffee roaster and all-day brunch on Martin Road.",
    cuisine_tags: ["Cafe", "Coffee", "Brunch", "Western"],
    price_level: 3,
    outlets: [{ address: "22 Martin Rd #01-00", postal_code: "239058", lat: 1.2929, lng: 103.8390 }],
    deals: [
      { title: "Happy hour flat whites $4 (3–5pm)", description: "Weekday afternoon coffee pick-me-up.", deal_type: "happy_hour", discount_value: 4, channels: ["dine_in", "takeaway"], endsInDays: 11 },
      { title: "$5 off brunch for two", description: "Min 2 brunch mains, weekends till noon.", deal_type: "fixed_amount", discount_value: 5, channels: ["dine_in"], dietary_tags: ["vegetarian-option"], endsInDays: 2 },
    ],
  },
  {
    slug: "old-chang-kee",
    name: "Old Chang Kee",
    description: "Iconic curry puffs and deep-fried snacks on the go.",
    cuisine_tags: ["Local", "Snacks", "Halal"],
    price_level: 1,
    outlets: [{ address: "Bugis Junction #B1-K6", postal_code: "188021", lat: 1.2996, lng: 103.8559 }],
    deals: [
      { title: "5 curry puffs for $7", description: "Mix and match any curry puffs.", deal_type: "set_menu", channels: ["takeaway"], dietary_tags: ["halal"], endsInDays: 4 },
      { title: "Free drink with $12 spend", description: "Any canned drink on us.", deal_type: "freebie", channels: ["takeaway"], dietary_tags: ["halal"], endsInDays: 1 },
    ],
  },
  {
    slug: "lerk-thai",
    name: "Lerk Thai",
    description: "Casual Thai favourites — tom yum, green curry, mango sticky rice.",
    cuisine_tags: ["Thai", "Asian"],
    price_level: 2,
    outlets: [{ address: "68 Orchard Rd, Plaza Singapura #03-78", postal_code: "238839", lat: 1.3008, lng: 103.8454 }],
    deals: [
      { title: "Set lunch $13.90 + free Thai tea", description: "Main + soup + Thai milk tea, weekdays.", deal_type: "set_menu", channels: ["dine_in"], endsInDays: 16 },
      { title: "30% off mango sticky rice", description: "Dessert special, all day.", deal_type: "percentage", discount_value: 30, channels: ["dine_in", "takeaway"], dietary_tags: ["vegetarian"], endsInDays: 2 },
    ],
  },
  {
    slug: "two-mens-bagel",
    name: "Two Men Bagel House",
    description: "New York–style bagels, hand-rolled and kettle-boiled daily.",
    cuisine_tags: ["Cafe", "Bagels", "Western", "Breakfast"],
    price_level: 2,
    outlets: [{ address: "16 Enggor St, Icon Village #01-12", postal_code: "079717", lat: 1.2756, lng: 103.8443 }],
    deals: [
      { title: "Buy 6 bagels, get 6 free", description: "Half-dozen on us when you buy half-dozen.", deal_type: "bogo", channels: ["takeaway"], dietary_tags: ["vegetarian-option"], endsInDays: 5 },
      { title: "$2 off breakfast bagels (before 10am)", description: "Early bird special on filled bagels.", deal_type: "fixed_amount", discount_value: 2, channels: ["dine_in", "takeaway"], endsInDays: 3 },
    ],
  },
  {
    slug: "shake-shack-sg",
    name: "Shake Shack",
    description: "Cult-favourite burgers, crinkle-cut fries and frozen custard.",
    cuisine_tags: ["Western", "Burgers", "American"],
    price_level: 2,
    outlets: [{ address: "2 Bayfront Ave, The Shoppes at MBS #01-80", postal_code: "018972", lat: 1.2839, lng: 103.8595 }],
    deals: [
      { title: "Free fries with any ShackBurger", description: "Crinkle-cut fries on us, dine-in.", deal_type: "freebie", channels: ["dine_in"], endsInDays: 6 },
      { title: "15% off concretes (happy hour 3–5pm)", description: "Frozen custard concretes, weekdays.", deal_type: "happy_hour", discount_value: 15, channels: ["dine_in", "takeaway"], dietary_tags: ["vegetarian"], endsInDays: 8 },
    ],
  },
];

async function main() {
  console.log("→ Creating demo accounts…");
  const adminId = await ensureUser("admin@hungeri.test", "admin", "Hungeri Admin");
  const merchantId = await ensureUser("merchant@hungeri.test", "merchant", "Demo Merchant");
  await ensureUser("consumer@hungeri.test", "consumer", "Demo Consumer");
  console.log(`   admin=${adminId.slice(0, 8)}… merchant=${merchantId.slice(0, 8)}…`);

  let dealCount = 0;
  for (const b of BUSINESSES) {
    // Upsert business by slug, owned by the demo merchant.
    const { data: biz, error: bizErr } = await db
      .from("businesses")
      .upsert(
        {
          owner_user_id: merchantId,
          name: b.name,
          slug: b.slug,
          description: b.description,
          cuisine_tags: b.cuisine_tags,
          price_level: b.price_level,
          verified: true,
          status: "live",
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (bizErr || !biz) throw new Error(`business ${b.slug}: ${bizErr?.message}`);

    // Replace outlets + deals for a clean idempotent re-run.
    await db.from("locations").delete().eq("business_id", biz.id);
    await db.from("deals").delete().eq("business_id", biz.id);

    await db.from("locations").insert(
      b.outlets.map((o) => ({
        business_id: biz.id,
        address: o.address,
        city: "Singapore",
        postal_code: o.postal_code,
        lat: o.lat,
        lng: o.lng,
        phone: o.phone ?? null,
        opening_hours: { mon_sun: "11:00-21:00" },
      })),
    );

    const { error: dealErr } = await db.from("deals").insert(
      b.deals.map((d) => ({
        business_id: biz.id,
        title: d.title,
        description: d.description,
        deal_type: d.deal_type,
        discount_value: d.discount_value ?? null,
        channels: d.channels,
        dietary_tags: d.dietary_tags ?? [],
        terms: "Valid at participating outlets. Not valid with other promotions.",
        fine_print: "Subject to availability. Management reserves all rights.",
        start_at: iso(now - 2 * DAY),
        end_at: iso(now + d.endsInDays * DAY),
        redemption_method: "show_screen" as const,
        status: "live" as const,
        source: "curated" as const,
      })),
    );
    if (dealErr) throw new Error(`deals for ${b.slug}: ${dealErr.message}`);
    dealCount += b.deals.length;
    console.log(`   ✓ ${b.name} (${b.deals.length} deals)`);
  }

  console.log(`\n✅ Seed complete: ${BUSINESSES.length} businesses, ${dealCount} live deals.`);
  console.log("   Demo logins (magic link to these inboxes, or use the Supabase dashboard):");
  console.log("     admin@hungeri.test · merchant@hungeri.test · consumer@hungeri.test");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  process.exit(1);
});
