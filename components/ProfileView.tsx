import Link from "next/link";
import type { FieldValue, Profile } from "@/lib/slack";
import { parseEmoji, type EmojiResolver } from "@/lib/emoji";
import RichText from "./RichText";
import LiveMeta from "./LiveMeta";
import Actions from "./Actions";
import { CloseIcon } from "./icons";

const MONTH_DAY_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Slack's "(9 months ago)" suffix on date fields. */
function relative(iso: string) {
  const then = new Date(iso + "T00:00:00Z");
  const now = new Date();
  const future = then > now;
  const [a, b] = future ? [now, then] : [then, now];
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months--;
  const days = Math.floor((b.getTime() - a.getTime()) / 86_400_000);

  let text: string;
  if (days < 1) return "today";
  if (months < 1) text = days === 1 ? "1 day" : `${days} days`;
  else if (months < 12) text = months === 1 ? "1 month" : `${months} months`;
  else {
    const years = Math.floor(months / 12);
    text = years === 1 ? "1 year" : `${years} years`;
  }
  return future ? `in ${text}` : `${text} ago`;
}

function safeHref(href: string) {
  try {
    const url = new URL(href.includes("://") ? href : `https://${href}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function Value({ value, resolve }: { value: FieldValue; resolve: EmojiResolver }) {
  switch (value.kind) {
    case "text":
      return <RichText segments={parseEmoji(value.text, resolve)} />;
    case "link": {
      const href = safeHref(value.href);
      const text = <RichText segments={parseEmoji(value.text, resolve)} />;
      return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ) : (
        text
      );
    }
    case "date":
      return (
        <span className="date">
          {MONTH_DAY_YEAR.format(new Date(value.iso + "T00:00:00Z"))} ({relative(value.iso)})
        </span>
      );
    case "tags":
      return (
        <>
          {value.tags.map((t) => (
            <span className="tag" key={t}>
              <RichText segments={parseEmoji(t, resolve)} />
            </span>
          ))}
        </>
      );
    case "users":
      return (
        <>
          {value.users.map((u) => (
            <Link className="user-card" href={`/${u.id}`} key={u.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u.avatar} alt="" />
              <span>
                <span className="user-card-name">{u.name}</span>
                {u.title && (
                  <span className="user-card-title">
                    <RichText segments={parseEmoji(u.title, resolve)} />
                  </span>
                )}
              </span>
            </Link>
          ))}
        </>
      );
  }
}

export default function ProfileView({ profile, resolve, webUrl }: { profile: Profile; resolve: EmojiResolver; webUrl: string }) {
  const { status } = profile;
  const statusEmoji = status?.emoji ? (status.emojiUrl ?? resolve(status.emoji.replace(/:/g, ""))) : null;

  return (
    <main className="stage">
      <article className="panel" aria-label={`${profile.name}'s profile`}>
        <header className="panel-header">
          <h1>Profile</h1>
          <Link className="icon-btn" href="/" aria-label="Close">
            <CloseIcon />
          </Link>
        </header>

        <section className="identity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="avatar" src={profile.avatar} alt={profile.name} />

          <h2 className="name-row">
            <span>{profile.name}</span>
            {statusEmoji && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="emoji" src={statusEmoji} alt={status!.emoji} title={status!.text || status!.emoji} />
            )}
          </h2>
          {profile.title && (
            <p className="title">
              <RichText segments={parseEmoji(profile.title, resolve)} />
            </p>
          )}
          {profile.pronouns && <p className="pronouns">{profile.pronouns}</p>}

          <div className="meta">
            {status?.text && (
              <div className="meta-line">
                {statusEmoji && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="emoji" src={statusEmoji} alt="" />
                )}
                <span>
                  <RichText segments={parseEmoji(status.text, resolve)} />
                </span>
              </div>
            )}
            <LiveMeta userId={profile.id} tz={profile.tz} showPresence={!profile.isBot} />
          </div>

          <Actions userId={profile.id} teamId={profile.teamId} webUrl={webUrl} />
        </section>

        {profile.sections.map((s) => (
          <section className="section" key={s.id}>
            <h2>{s.label}</h2>
            {s.fields.map((f) => (
              <div className="field" key={f.id}>
                <h3 className="field-label">{f.label}</h3>
                <div className="field-value">
                  <Value value={f.value} resolve={resolve} />
                </div>
              </div>
            ))}
          </section>
        ))}
      </article>
    </main>
  );
}
