"use client";

import { Heart } from "lucide-react";
import type { DealType } from "@/types/database";
import { dealBadge, savingsLabel } from "@/lib/deals/format";
import { DealImage } from "@/components/deal-image";

/**
 * Consumer-eye live preview of a deal-in-progress, in a phone frame. Mirrors the
 * StandardDealCard so merchants see exactly what diners will see before publishing.
 */
export function DealPreview({
  title,
  description,
  dealType,
  discountValue,
  imageUrl,
  businessName,
}: {
  title: string;
  description: string;
  dealType: DealType;
  discountValue: number | null;
  imageUrl: string;
  businessName: string;
}) {
  const badge = dealBadge({ deal_type: dealType, discount_value: discountValue });
  const savings = savingsLabel({ deal_type: dealType, discount_value: discountValue });

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted">
        Live preview · what diners see
      </div>
      <div className="w-[300px] rounded-[36px] bg-ink-900 p-1.5 shadow-e2">
        <div className="overflow-hidden rounded-[30px] bg-bg p-3.5">
          <div className="overflow-hidden rounded-card border border-line-soft bg-surface shadow-card">
            <div className="relative h-[140px]">
              <DealImage src={imageUrl || null} alt={title || "Deal"} sizes="280px" />
              <span className="absolute left-2.5 top-2.5 rounded-[7px] bg-persimmon-500 px-2 py-1 text-[10px] font-extrabold text-white">
                {badge}
              </span>
              <span className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-white/90">
                <Heart className="size-4 text-urgent" aria-hidden />
              </span>
            </div>
            <div className="p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-[7px] bg-ink-900 font-display text-[11px] font-extrabold text-white">
                  {(businessName || "H").charAt(0)}
                </span>
                <span className="text-xs font-bold">{businessName || "Your business"}</span>
              </div>
              <div className="font-display text-[19px] font-extrabold leading-tight">
                {title || "Your deal headline"}
              </div>
              {description && (
                <p className="my-1 line-clamp-2 text-[11px] text-ink-500">{description}</p>
              )}
              {savings && (
                <span className="mt-1.5 inline-block rounded-[7px] bg-savings-bg px-2 py-1 text-xs font-extrabold text-savings">
                  {savings}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted">Updates as you type.</p>
    </div>
  );
}
