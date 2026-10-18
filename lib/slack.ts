import "server-only";
import { unstable_cache } from "next/cache";

const API = process.env.SLACK_API_URL ?? "https://slack.com/api/";
const PROFILE_TTL = 300;

export class SlackError extends Error {
  constructor(public method: string, public code: string) {
    super(`${method}: ${code}`);
  }
}

async function call<T>(method: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.SLACK_TOKEN;
  if (!token) throw new SlackError(method, "missing_token");

  const res = await fetch(API + method, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.ok) throw new SlackError(method, data.error ?? `http_${res.status}`);
  return data as T;
}

/* ---------- Raw API shapes (only what we read) ---------- */

type RawUser = {
  id: string;
  team_id?: string;
  name: string;
  deleted?: boolean;
  is_bot?: boolean;
  tz?: string;
  tz_label?: string;
  tz_offset?: number;
  profile: RawProfile;
};

type RawProfile = {
  real_name?: string;
  display_name?: string;
  title?: string;
  pronouns?: string;
  status_text?: string;
  status_emoji?: string;
  status_emoji_display_info?: { emoji_name: string; display_url?: string; unicode?: string }[];
  status_expiration?: number;
  image_original?: string;
  image_1024?: string;
  image_512?: string;
  image_192?: string;
  image_72?: string;
  fields?: Record<string, { value: string; alt?: string }> | null;
};

type RawField = {
  id: string;
  ordering: number;
  label: string;
  type: string;
  field_name?: string;
  section_id?: string;
  is_hidden?: boolean;
  options?: { is_scim?: boolean; is_protected?: boolean } | null;
  possible_values?: string[] | null;
};

type RawSection = {
  id: string;
  section_type: string;
  label: string;
  order: number;
  is_hidden?: boolean;
};

/* ---------- Public shapes handed to the page ---------- */

export type ManagerCard = {
  id: string;
  name: string;
  title: string;
  avatar: string;
};

export type FieldValue =
  | { kind: "text"; text: string }
  | { kind: "link"; href: string; text: string }
  | { kind: "date"; iso: string }
  | { kind: "users"; users: ManagerCard[] }
  | { kind: "tags"; tags: string[] };

export type ProfileField = { id: string; label: string; value: FieldValue };
export type ProfileSection = { id: string; label: string; fields: ProfileField[] };

export type Profile = {
  id: string;
  teamId: string;
  name: string;
  title: string;
  pronouns: string;
  avatar: string;
  status: { text: string; emoji: string; emojiUrl: string | null; expiration: number } | null;
  tz: string | null;
  isBot: boolean;
  sections: ProfileSection[];
};

/* ---------- Cached fetchers ---------- */

const getTeamProfile = unstable_cache(
  async () => {
    const data = await call<{ profile: { fields: RawField[]; sections?: RawSection[] } }>(
      "team.profile.get",
    );
    return data.profile;
  },
  ["team.profile.get"],
  { revalidate: 3600 },
);

const getUser = unstable_cache(
  async (id: string): Promise<RawUser | null> => {
    try {
      const [{ user }, { profile }] = await Promise.all([
        call<{ user: RawUser }>("users.info", { user: id }),
        // users.info omits custom fields; users.profile.get includes them.
        call<{ profile: RawProfile }>("users.profile.get", { user: id, include_labels: "false" }),
      ]);
      return { ...user, profile: { ...user.profile, ...profile } };
    } catch (e) {
      if (e instanceof SlackError && (e.code === "user_not_found" || e.code === "user_not_visible"))
        return null;
      throw e;
    }
  },
  ["user"],
  { revalidate: PROFILE_TTL },
);

const getCustomEmoji = unstable_cache(
  async () => {
    try {
      const data = await call<{ emoji: Record<string, string> }>("emoji.list");
      return data.emoji;
    } catch {
      return {} as Record<string, string>;
    }
  },
  ["emoji.list"],
  { revalidate: 3600 },
);

export async function getEmojiMap() {
  return getCustomEmoji();
}

/* ---------- Assembly ---------- */

// Built-in profile fields that are rendered in the header or deliberately withheld.
const HEADER_FIELDS = new Set(["title", "pronouns", "real_name", "display_name", "name"]);
const PRIVATE_FIELDS = new Set(["email", "phone"]);

function avatarOf(p: RawProfile) {
  return p.image_1024 ?? p.image_512 ?? p.image_original ?? p.image_192 ?? p.image_72 ?? "";
}

function displayName(u: RawUser) {
  return u.profile.display_name || u.profile.real_name || u.name;
}

async function managerCard(id: string): Promise<ManagerCard | null> {
  const u = await getUser(id).catch(() => null);
  if (!u || u.deleted) return null;
  return { id: u.id, name: displayName(u), title: u.profile.title ?? "", avatar: u.profile.image_72 ?? avatarOf(u.profile) };
}

async function toValue(field: RawField, raw: { value: string; alt?: string }): Promise<FieldValue | null> {
  const value = raw.value?.trim();
  if (!value) return null;

  switch (field.type) {
    case "link":
      return { kind: "link", href: value, text: raw.alt?.trim() || value };
    case "date":
      return /^\d{4}-\d{2}-\d{2}/.test(value) ? { kind: "date", iso: value.slice(0, 10) } : { kind: "text", text: value };
    case "user": {
      const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
      const users = (await Promise.all(ids.map(managerCard))).filter((u): u is ManagerCard => !!u);
      return users.length ? { kind: "users", users } : null;
    }
    case "tags":
      return { kind: "tags", tags: value.split(",").map((s) => s.trim()).filter(Boolean) };
    default:
      return { kind: "text", text: value };
  }
}

const DEFAULT_SECTION: RawSection = { id: "_about", section_type: "about_me", label: "About me", order: 999, is_hidden: false };

export async function getProfile(id: string): Promise<Profile | null> {
  const [user, team] = await Promise.all([getUser(id), getTeamProfile()]);
  if (!user || user.deleted) return null;

  const p = user.profile;
  const values = p.fields ?? {};
  const sectionsById = new Map((team.sections ?? []).map((s) => [s.id, s]));
  const grouped = new Map<string, { section: RawSection; fields: { order: number; field: ProfileField }[] }>();

  await Promise.all(
    team.fields.map(async (f) => {
      if (f.is_hidden) return;
      const name = f.field_name?.toLowerCase();
      if (name && (HEADER_FIELDS.has(name) || PRIVATE_FIELDS.has(name))) return;
      const raw = values[f.id];
      if (!raw) return;
      const value = await toValue(f, raw);
      if (!value) return;

      const section = (f.section_id && sectionsById.get(f.section_id)) || DEFAULT_SECTION;
      if (section.is_hidden) return;
      const bucket = grouped.get(section.id) ?? { section, fields: [] };
      bucket.fields.push({ order: f.ordering, field: { id: f.id, label: f.label, value } });
      grouped.set(section.id, bucket);
    }),
  );

  const sections = [...grouped.values()]
    .sort((a, b) => a.section.order - b.section.order)
    .map(({ section, fields }) => ({
      id: section.id,
      label: section.label,
      fields: fields.sort((a, b) => a.order - b.order).map((f) => f.field),
    }));

  const statusEmoji = p.status_emoji ?? "";
  const statusText = p.status_text ?? "";
  const expired = !!p.status_expiration && p.status_expiration * 1000 < Date.now();

  return {
    id: user.id,
    teamId: user.team_id ?? process.env.SLACK_TEAM_ID ?? "",
    name: displayName(user),
    title: p.title ?? "",
    pronouns: p.pronouns ?? "",
    avatar: avatarOf(p),
    status:
      (statusEmoji || statusText) && !expired
        ? {
            text: statusText,
            emoji: statusEmoji,
            emojiUrl: p.status_emoji_display_info?.[0]?.display_url ?? null,
            expiration: p.status_expiration ?? 0,
          }
        : null,
    tz: user.tz ?? null,
    isBot: !!user.is_bot,
    sections,
  };
}

/* ---------- Presence (not cached here; the API route sets its own cache headers) ---------- */

export type Presence = { active: boolean; dnd: boolean };

export async function getPresence(id: string): Promise<Presence> {
  const [presence, dnd] = await Promise.all([
    call<{ presence: string }>("users.getPresence", { user: id }),
    call<{ dnd_enabled?: boolean; snooze_enabled?: boolean; next_dnd_start_ts?: number; next_dnd_end_ts?: number }>(
      "dnd.info",
      { user: id },
    ).catch(() => null),
  ]);

  const now = Date.now() / 1000;
  const inSchedule =
    !!dnd?.dnd_enabled && !!dnd.next_dnd_start_ts && !!dnd.next_dnd_end_ts && dnd.next_dnd_start_ts <= now && now < dnd.next_dnd_end_ts;

  return { active: presence.presence === "active", dnd: !!dnd?.snooze_enabled || inSchedule };
}
