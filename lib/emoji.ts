import "server-only";
import emojiData from "emoji-datasource/emoji.json";
import { getEmojiMap } from "./slack";

const SLACK_EMOJI_CDN = "https://a.slack-edge.com/production-standard-emoji-assets/15.0/apple-large/";

const standard = new Map<string, string>();
for (const e of emojiData as { short_names: string[]; image: string }[]) {
  for (const name of e.short_names) standard.set(name, e.image);
}

export type Segment = { type: "text"; text: string } | { type: "emoji"; name: string; url: string };

export type EmojiResolver = (name: string) => string | null;

export async function getEmojiResolver(): Promise<EmojiResolver> {
  const custom = await getEmojiMap();

  function resolve(name: string, depth = 0): string | null {
    const base = name.replace(/::skin-tone-\d$/, "");
    const url = custom[base];
    if (url?.startsWith("alias:")) return depth < 5 ? resolve(url.slice(6), depth + 1) : null;
    if (url) return url;
    const image = standard.get(base);
    return image ? SLACK_EMOJI_CDN + image : null;
  }

  return (name) => resolve(name);
}

/** Split Slack text into plain text and `:emoji:` segments. Unknown shortcodes stay as text. */
export function parseEmoji(text: string, resolve: EmojiResolver): Segment[] {
  const out: Segment[] = [];
  const re = /:([a-z0-9_+'-]+(?:::skin-tone-\d)?):/gi;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const url = resolve(m[1].toLowerCase());
    if (!url) continue;
    if (m.index! > last) out.push({ type: "text", text: text.slice(last, m.index) });
    out.push({ type: "emoji", name: m[1], url });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ type: "text", text: text.slice(last) });
  return out;
}
