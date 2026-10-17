"use client";

import { useEffect, useRef, useState } from "react";
import { HeadphonesIcon, KebabIcon, MessageIcon } from "./icons";

type Props = { userId: string; teamId: string; webUrl: string };

/** Try the desktop app first; if the page never loses focus, fall back to Slack on the web. */
function openInSlack(appUrl: string, webUrl: string) {
  let left = false;
  const onBlur = () => (left = true);
  window.addEventListener("blur", onBlur, { once: true });
  document.addEventListener("visibilitychange", onBlur, { once: true });
  window.location.href = appUrl;
  setTimeout(() => {
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onBlur);
    if (!left) window.location.href = webUrl;
  }, 1500);
}

export default function Actions({ userId, teamId, webUrl }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const appUrl = `slack://user?team=${teamId}&id=${userId}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    openInSlack(appUrl, webUrl);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
    setOpen(false);
  };

  return (
    <div className="actions">
      <a className="btn" href={webUrl} onClick={go}>
        <MessageIcon />
        Message
      </a>
      <a className="btn" href={webUrl} onClick={go}>
        <HeadphonesIcon />
        Huddle
      </a>
      <div className="menu-wrap" ref={wrap}>
        <button
          type="button"
          className="btn square"
          aria-label={copied ? "Member ID copied" : "More actions"}
          aria-haspopup="menu"
          aria-expanded={open}
          title={copied ? "Copied!" : undefined}
          onClick={() => setOpen((o) => !o)}
        >
          <KebabIcon />
        </button>
        {open && (
          <div className="menu" role="menu">
            <button type="button" role="menuitem" onClick={copyId}>
              Copy member ID
            </button>
            <a role="menuitem" href={webUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              Open in Slack
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
