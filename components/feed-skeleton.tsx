/** Loading skeletons for the feed (matches the design's shimmer cards). */
export function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="skeleton h-[148px] rounded-card" />
      {[0, 1].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-card-lg border border-line-soft bg-surface"
        >
          <div className="skeleton h-[158px]" />
          <div className="space-y-2.5 p-[15px]">
            <div className="skeleton h-3.5 w-1/2 rounded" />
            <div className="skeleton h-5 w-4/5 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="flex gap-2">
              <div className="skeleton h-6 w-20 rounded-lg" />
              <div className="skeleton h-6 w-12 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
