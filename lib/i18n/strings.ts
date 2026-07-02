/**
 * Centralised copy strings. Keep all user-facing text here so it can be
 * translated/tuned without hunting through components.
 */
export const strings = {
  app: {
    name: "Hungeri",
    tagline: "The freshest F&B deals near you.",
  },
  feed: {
    title: "Deals near you",
    empty: "No deals here yet — check back soon.",
    featuredBadge: "Featured", // paid placement label (must always be visible)
    adBadge: "Ad",
  },
  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    magicLinkSent: "Check your email for a sign-in link.",
    emailLabel: "Email address",
  },
  deal: {
    save: "Save",
    saved: "Saved",
    report: "Report",
    endsIn: "Ends in",
    expired: "Expired",
    terms: "Terms & conditions",
    finePrint: "Fine print",
    redeem: "How to redeem",
  },
} as const;
