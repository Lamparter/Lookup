import { getPresence } from "@/lib/slack";

const USER_ID = /^[UW][A-Z0-9]{6,15}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const id = (await params).userId.toUpperCase();
  if (!USER_ID.test(id)) return Response.json({ error: "invalid_user" }, { status: 400 });

  try {
    const presence = await getPresence(id);
    return Response.json(presence, {
      // Shared 60s cache on Vercel's edge so a busy profile costs one Slack call a minute.
      headers: { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=30" },
    });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502 });
  }
}
