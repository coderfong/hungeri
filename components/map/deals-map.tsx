"use client";

import { useRef } from "react";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NearDeal } from "@/lib/deals/near";
import { dealBadge, savingsLabel } from "@/lib/deals/format";
import { formatDistance } from "@/lib/geo/format";
import { DealImage } from "@/components/deal-image";

export function DealsMap({
  deals,
  center,
  userLocation,
  selectedId,
  onSelect,
  token,
}: {
  deals: NearDeal[];
  center: { lat: number; lng: number };
  userLocation: { lat: number; lng: number } | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  token: string;
}) {
  const mapRef = useRef<MapRef>(null);
  const selected = deals.find((d) => d.id === selectedId) ?? null;

  function recenter() {
    const target = userLocation ?? center;
    mapRef.current?.flyTo({ center: [target.lng, target.lat], zoom: 14, duration: 600 });
  }

  return (
    <div className="relative size-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{ longitude: center.lng, latitude: center.lat, zoom: 13.5 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onClick={() => onSelect(null)}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Deal pins */}
        {deals.map((d) => {
          const active = d.id === selectedId;
          return (
            <Marker
              key={d.id}
              longitude={d.location.lng}
              latitude={d.location.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelect(d.id);
              }}
            >
              <button
                type="button"
                aria-label={`${d.businesses?.name}: ${dealBadge(d)}`}
                className="flex flex-col items-center focus:outline-none"
              >
                <span
                  className={cn(
                    "whitespace-nowrap rounded-pill px-2.5 py-1 text-[11px] font-extrabold text-white shadow-e2 transition-transform",
                    active ? "scale-110 bg-ink-900" : "bg-persimmon-500 hover:scale-105",
                  )}
                >
                  {dealBadge(d)}
                </span>
                <span
                  className={cn(
                    "size-0 border-x-[5px] border-t-[6px] border-x-transparent",
                    active ? "border-t-ink-900" : "border-t-persimmon-500",
                  )}
                />
              </button>
            </Marker>
          );
        })}

        {/* Viewer location */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <span className="block size-4 rounded-full border-[3px] border-white bg-[#2A7DE1] shadow-[0_0_0_8px_rgba(42,125,225,.18)]" />
          </Marker>
        )}

        {selected && (
          <Popup
            longitude={selected.location.lng}
            latitude={selected.location.lat}
            anchor="bottom"
            offset={28}
            closeButton={false}
            onClose={() => onSelect(null)}
            maxWidth="300px"
          >
            <MapPopoverCard deal={selected} />
          </Popup>
        )}
      </Map>

      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter map"
        className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-[14px] bg-surface shadow-e2"
      >
        <LocateFixed className="size-[22px] text-persimmon-500" aria-hidden />
      </button>
    </div>
  );
}

function MapPopoverCard({ deal }: { deal: NearDeal }) {
  const savings = savingsLabel(deal);
  return (
    <a href={`/deals/${deal.id}`} className="flex items-center gap-3 font-sans">
      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
        <DealImage src={deal.image_url} alt={deal.title} sizes="56px" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink-900">{deal.businesses?.name}</span>
        <span className="block truncate text-xs text-ink-500">{deal.title}</span>
        <span className="block text-xs font-semibold text-ink-500">
          {formatDistance(deal.distance_m)}
          {savings && <span className="text-savings"> · {savings}</span>}
        </span>
      </span>
    </a>
  );
}
