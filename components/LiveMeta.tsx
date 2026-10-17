"use client";

import { useEffect, useState } from "react";
import { ActiveIcon, AwayIcon, ClockIcon, SnoozedIcon } from "./icons";

type Presence = { active: boolean; dnd: boolean };

function presenceLabel(p: Presence) {
  const base = p.active ? "Active" : "Away";
  return p.dnd ? `${base}, notifications snoozed` : base;
}

function formatTime(tz: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(new Date());
}

/** Presence and local time both depend on "now", so they render client-side only. */
export default function LiveMeta({ userId, tz, showPresence }: { userId: string; tz: string | null; showPresence: boolean }) {
  const [presence, setPresence] = useState<Presence | null>(null);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    if (!showPresence) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/presence/${userId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p) => !cancelled && p && setPresence(p))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId, showPresence]);

  useEffect(() => {
    if (!tz) return;
    const tick = () => {
      try {
        setTime(formatTime(tz));
      } catch {
        setTime(null);
      }
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [tz]);

  return (
    <>
      {showPresence && (
        <div className={`meta-line${presence ? "" : " loading"}`}>
          {presence?.dnd ? <SnoozedIcon active={presence.active} /> : presence?.active ? <ActiveIcon /> : <AwayIcon />}
          <span>{presence ? presenceLabel(presence) : "Away"}</span>
        </div>
      )}
      {tz && (
        <div className={`meta-line${time ? "" : " loading"}`}>
          <ClockIcon />
          <span>{time ?? "00:00"} local time</span>
        </div>
      )}
    </>
  );
}
