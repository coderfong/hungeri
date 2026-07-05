"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  MapPin,
  LocateFixed,
  Search,
  ArrowLeft,
  ArrowUpDown,
  Navigation,
} from "lucide-react";
import { clientEnv } from "@/lib/env";
import type { NearDeal } from "@/lib/deals/near";
import { SG_AREAS, SG_CENTER, type Area } from "@/lib/geo/areas";
import { formatDistance } from "@/lib/geo/format";
import { dealBadge, savingsLabel, shouldCountdown } from "@/lib/deals/format";
import { DealImage } from "@/components/deal-image";
import { Countdown } from "@/components/countdown";
import { Button } from "@/components/ui/button";

// mapbox-gl touches `window` on load — load the map only on the client.
const DealsMap = dynamic(
  () => import("@/components/map/deals-map").then((m) => m.DealsMap),
  { ssr: false, loading: () => <div className="size-full bg-[#DDEAE2]" /> },
);

type Loc = { lat: number; lng: number; label: string };
type View = "prompt" | "manual" | "results";
const STORAGE_KEY = "hungeri_loc";
const RADII = [1000, 3000, 5000];

export function NearMeClient() {
  const token = clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [view, setView] = useState<View>("prompt");
  const [loc, setLoc] = useState<Loc | null>(null);
  const [usingDeviceLoc, setUsingDeviceLoc] = useState(false);
  const [radius, setRadius] = useState(3000);
  const [deals, setDeals] = useState<NearDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Restore a previously chosen location.
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Loc;
        setLoc(parsed);
        setView("results");
      } catch {
        /* ignore */
      }
    }
  }, []);

  const fetchNear = useCallback(async (l: Loc, r: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/near?lat=${l.lat}&lng=${l.lng}&radius=${r}`);
      const json = await res.json();
      setDeals(res.ok ? (json.deals ?? []) : []);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loc) fetchNear(loc, radius);
  }, [loc, radius, fetchNear]);

  function chooseLocation(next: Loc, fromDevice = false) {
    setLoc(next);
    setUsingDeviceLoc(fromDevice);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setView("results");
  }

  function requestDeviceLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't available — pick an area instead.");
      setView("manual");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        chooseLocation(
          { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Current location" },
          true,
        ),
      () => {
        setGeoError("We couldn't get your location. Pick an area instead.");
        setView("manual");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  if (view === "prompt" && !loc) {
    return <PermissionPrompt onAllow={requestDeviceLocation} onManual={() => setView("manual")} />;
  }
  if (view === "manual" && !loc) {
    return (
      <ManualPicker
        error={geoError}
        onUseDevice={requestDeviceLocation}
        onPick={(a) => chooseLocation({ lat: a.lat, lng: a.lng, label: a.name })}
      />
    );
  }

  const center = loc ?? { ...SG_CENTER, label: "Singapore" };

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-65px)]">
      {/* List panel: a rounded sheet overlapping the map on mobile; a left rail on desktop. */}
      <aside className="relative z-10 order-2 -mt-4 flex flex-col rounded-t-3xl border-line-soft bg-surface shadow-[0_-8px_28px_rgba(0,0,0,0.08)] md:order-1 md:mt-0 md:w-[380px] md:shrink-0 md:rounded-none md:border-r md:shadow-none">
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line md:hidden" aria-hidden />
        <div className="border-b border-line-soft px-5 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="size-[18px] text-persimmon-500" aria-hidden />
            <span className="font-bold">{center.label}</span>
            <button
              onClick={() => {
                setLoc(null);
                localStorage.removeItem(STORAGE_KEY);
                setView("manual");
              }}
              className="ml-auto text-xs font-bold text-persimmon-500"
            >
              Change
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                aria-pressed={radius === r}
                className={
                  radius === r
                    ? "rounded-pill bg-ink-900 px-3 py-1.5 text-xs font-bold text-white"
                    : "rounded-pill border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-500"
                }
              >
                {formatDistance(r)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 pb-2 pt-3">
          <h1 className="font-display text-lg font-extrabold">
            {loading ? "Finding deals…" : `${deals.length} deal${deals.length === 1 ? "" : "s"} near you`}
          </h1>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-muted">
            <ArrowUpDown className="size-3" aria-hidden /> Nearest
          </span>
        </div>

        <div className="max-h-[48vh] flex-1 overflow-y-auto px-5 pb-24 md:max-h-none md:pb-5">
          {!loading && deals.length === 0 ? (
            <p className="rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-ink-500">
              No deals within {formatDistance(radius)} — try a wider radius.
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <NearRow
                    deal={deal}
                    active={deal.id === selectedId}
                    onHover={() => setSelectedId(deal.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="relative order-1 h-[42vh] md:order-2 md:h-auto md:flex-1">
        {token ? (
          <DealsMap
            deals={deals}
            center={center}
            userLocation={usingDeviceLoc && loc ? { lat: loc.lat, lng: loc.lng } : null}
            selectedId={selectedId}
            onSelect={setSelectedId}
            token={token}
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-[#DDEAE2] p-6 text-center">
            <LocateFixed className="mb-3 size-8 text-persimmon-500" aria-hidden />
            <p className="max-w-xs text-sm font-semibold text-ink-700">
              Add a Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN) to see the map. The list still
              works.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NearRow({
  deal,
  active,
  onHover,
}: {
  deal: NearDeal;
  active: boolean;
  onHover: () => void;
}) {
  const savings = savingsLabel(deal);
  return (
    <Link
      href={`/deals/${deal.id}`}
      onMouseEnter={onHover}
      className={`flex items-center gap-3 py-3 ${active ? "rounded-xl bg-persimmon-50" : ""}`}
    >
      <span className="relative size-[60px] shrink-0 overflow-hidden rounded-xl">
        <DealImage src={deal.image_url} alt={deal.title} sizes="60px" />
        <span className="absolute bottom-1 left-1 rounded-[5px] bg-persimmon-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white">
          {dealBadge(deal)}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{deal.businesses?.name}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
          {deal.businesses?.cuisine_tags[0] ?? "F&B"} · {formatDistance(deal.distance_m)}
          {shouldCountdown(deal.end_at) && <Countdown endAt={deal.end_at} withIcon={false} prefix="· " />}
        </span>
      </span>
      {savings && (
        <span className="shrink-0 rounded-[7px] bg-savings-bg px-2 py-1 text-xs font-extrabold text-savings">
          {savings}
        </span>
      )}
    </Link>
  );
}

function PermissionPrompt({
  onAllow,
  onManual,
}: {
  onAllow: () => void;
  onManual: () => void;
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#DDEAE2] p-5">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 text-center shadow-e2">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[20px] bg-persimmon-50">
          <MapPin className="size-8 text-persimmon-500" strokeWidth={2.2} aria-hidden />
        </div>
        <h1 className="mb-2 font-display text-[23px] font-extrabold leading-tight">
          See deals around you
        </h1>
        <p className="mb-5 text-sm leading-relaxed text-ink-500">
          Turn on location to find the freshest deals within walking distance. We never
          track you in the background.
        </p>
        <Button size="lg" className="mb-2.5 w-full" onClick={onAllow}>
          Allow location
        </Button>
        <button onClick={onManual} className="w-full py-1.5 text-sm font-bold text-ink-500">
          Enter location manually
        </button>
      </div>
    </div>
  );
}

function ManualPicker({
  error,
  onUseDevice,
  onPick,
}: {
  error: string | null;
  onUseDevice: () => void;
  onPick: (a: Area) => void;
}) {
  const [q, setQ] = useState("");
  const results = SG_AREAS.filter(
    (a) =>
      a.name.toLowerCase().includes(q.toLowerCase()) ||
      a.sub.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-4">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/" aria-label="Back">
          <ArrowLeft className="size-[22px]" aria-hidden />
        </Link>
        <h1 className="font-display text-xl font-extrabold">Set your location</h1>
      </div>

      {error && (
        <p className="mb-3 rounded-btn bg-urgent-bg px-3.5 py-2.5 text-sm font-semibold text-urgent">
          {error}
        </p>
      )}

      <div className="mb-3 flex items-center gap-2.5 rounded-[13px] border-[1.5px] border-persimmon-500 bg-surface px-3.5 py-3 shadow-[0_0_0_4px_var(--color-persimmon-200)]">
        <Search className="size-[18px] text-persimmon-500" aria-hidden />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search an area or neighbourhood"
          className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-muted"
        />
      </div>

      <button
        onClick={onUseDevice}
        className="flex w-full items-center gap-2.5 border-b border-line-soft py-3.5 text-left"
      >
        <LocateFixed className="size-5 text-persimmon-500" aria-hidden />
        <span className="font-bold text-persimmon-500">Use my current location</span>
      </button>

      <ul>
        {results.map((a) => (
          <li key={a.name}>
            <button
              onClick={() => onPick(a)}
              className="flex w-full items-center gap-2.5 border-b border-line-soft py-3.5 text-left"
            >
              <Navigation className="size-5 text-muted" aria-hidden />
              <span>
                <span className="block text-sm font-bold">{a.name}</span>
                <span className="block text-xs text-muted">{a.sub}, Singapore</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
