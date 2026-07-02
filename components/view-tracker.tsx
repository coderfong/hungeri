"use client";

import { useEffect, useRef } from "react";
import type { ViewSource } from "@/types/database";

/** Fire-and-forget deal-view beacon, once per mount. Feeds merchant analytics. */
export function ViewTracker({
  dealId,
  source = "feed",
}: {
  dealId: string;
  source?: ViewSource;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    fetch("/api/deal-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId, source }),
      keepalive: true,
    }).catch(() => {});
  }, [dealId, source]);
  return null;
}
