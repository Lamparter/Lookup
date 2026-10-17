import type { Segment } from "@/lib/emoji";

export default function RichText({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.type === "text" ? (
          s.text
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} className="emoji" src={s.url} alt={`:${s.name}:`} title={`:${s.name}:`} draggable={false} />
        ),
      )}
    </>
  );
}
