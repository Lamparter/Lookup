import Lookup from "@/components/Lookup";

export default function Home() {
  return (
    <main className="stage">
      <article className="panel simple">
        <h1>Contacts</h1>
        <p>Hack Club Slack profiles, on the web. Paste a member ID or profile link.</p>
        <Lookup />
      </article>
    </main>
  );
}
