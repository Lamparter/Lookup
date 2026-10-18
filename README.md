# Slack Lookup

Hack Club Slack profiles on the web, rendered to look like Slack's own profile panel.
Visit `lookup.lamparter.dev/<member ID>`, e.g. [`/U0A9B38F413`](https://lookup.lamparter.dev/U0A9B38F413).

Email and phone are never sent to the browser. Everything else on a profile is public.

## Setup

```bash
pnpm install
cp .env.example .env.local # then fill in SLACK_TOKEN
pnpm run dev
```

The token needs `users:read`, `users.profile:read`, `emoji:read` and `dnd:read`.

## How it works

- `app/[userId]/page.tsx` renders a profile on the server and caches it for 5 minutes.
- `lib/slack.ts` combines `users.info`, `users.profile.get` and `team.profile.get` into ordered sections, dropping email and phone.
- Presence and local time are fetched and ticked client-side (`/api/presence/[userId]`, edge-cached for 60s), so cached pages never show stale presence.
