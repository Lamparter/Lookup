import Link from "next/link";

export default function NotFound() {
  return (
    <main className="stage">
      <article className="panel simple">
        <h1>We couldn’t find that person</h1>
        <p>They may have left the Hack Club Slack, or the member ID is wrong.</p>
        <Link className="btn" href="/" style={{ display: "inline-flex", width: "auto" }}>
          Look up someone else
        </Link>
      </article>
    </main>
  );
}
