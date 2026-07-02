/**
 * Curated featured banners for the homepage spotlight carousel. These are
 * hand-picked listings (e.g. mall directory partners) shown ahead of the
 * ranking-driven picks. Keep the shape lightweight — a banner is just an image,
 * a name, and where it links.
 */
export type FeaturedBanner = {
  /** Stable key. */
  slug: string;
  name: string;
  /** Banner image; null falls back to the warm placeholder. */
  image: string | null;
  href: string;
  /** External links open in a new tab and render as a plain anchor. */
  external?: boolean;
  verified?: boolean;
  /** Paid/curated placements get the gold "Featured" label. */
  featured?: boolean;
  /** Live deal count, when known. */
  deals?: number | null;
  /** Small overlay detail, e.g. cuisine. */
  cuisine?: string | null;
  /** Green savings badge text, e.g. "30% off". */
  savings?: string | null;
};

export const featuredBanners: FeaturedBanner[] = [
  {
    slug: "zhous-claypot-rice-noodles",
    name: "Zhou's Claypot Rice Noodles",
    image:
      "https://s3.amazonaws.com/fileservice.in/intouch_creative_assets/dc0344a3-9365-4ed0-b7b3-65086351.jpg",
    href: "http://quickguide.sunteccity.com.sg/",
    external: true,
    featured: true,
  },
  {
    slug: "chopstix-and-rice",
    name: "Chopstix & Rice",
    // Logo-only asset skipped — falls back to the placeholder banner.
    image: null,
    href: "http://quickguide.sunteccity.com.sg/",
    external: true,
    featured: true,
  },
];
