import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getProfile } from "@/lib/slack";
import { getEmojiResolver } from "@/lib/emoji";
import ProfileView from "@/components/ProfileView";

export const revalidate = 300;

// No profiles are prebuilt; each is rendered on first visit and then cached.
export function generateStaticParams() {
  return [];
}

const USER_ID = /^[UW][A-Z0-9]{6,15}$/;

type Props = { params: Promise<{ userId: string }> };

function webUrl(id: string) {
  return `https://${process.env.SLACK_DOMAIN ?? "hackclub.enterprise.slack.com"}/team/${id}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const id = userId.toUpperCase();
  if (!USER_ID.test(id)) return { title: "Not found" };
  const profile = await getProfile(id);
  if (!profile) return { title: "Not found" };

  const description = [profile.title, profile.pronouns].filter(Boolean).join(" · ");
  return {
    title: profile.name,
    description: description || undefined,
    openGraph: {
      title: profile.name,
      description: description || undefined,
      images: profile.avatar ? [{ url: profile.avatar, width: 512, height: 512 }] : undefined,
      type: "profile",
    },
    twitter: { card: "summary" },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const id = userId.toUpperCase();
  if (!USER_ID.test(id)) notFound();
  if (id !== userId) permanentRedirect(`/${id}`);

  const [profile, resolve] = await Promise.all([getProfile(id), getEmojiResolver()]);
  if (!profile) notFound();

  return <ProfileView profile={profile} resolve={resolve} webUrl={webUrl(profile.id)} />;
}
