/**
 * Shape of a homepage spotlight carousel slide. The carousel is driven entirely
 * by real businesses (see the home feed) so every slide links to its own
 * /b/[slug] page, is searchable, and its cover can be edited inline — no
 * hard-coded external/mall-directory banners.
 */
export type FeaturedBanner = {
  /** The business id, so admins/super-merchants can edit the cover inline. */
  businessId?: string;
  /** Stable key + slug for the /b/[slug] link. */
  slug: string;
  name: string;
  /** Banner image (business cover); null falls back to the warm placeholder. */
  image: string | null;
  href: string;
  verified?: boolean;
  /** Paid placements get the gold "Featured" label. */
  featured?: boolean;
  /** Live deal count, when known. */
  deals?: number | null;
  /** Small overlay detail, e.g. cuisine. */
  cuisine?: string | null;
  /** Green savings badge text, e.g. "30% off". */
  savings?: string | null;
};
