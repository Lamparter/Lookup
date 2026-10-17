"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Accepts a bare ID or any Slack link containing one (…/team/U0A9B38F413, …/client/T…/U…).
const ID_IN_TEXT = /\b([UW][A-Z0-9]{6,15})\b/;

export default function Lookup() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const id = value.trim().toUpperCase().match(ID_IN_TEXT)?.[1];
        if (!id) return setError(true);
        router.push(`/${id}`);
      }}
    >
      <div className="lookup">
        <input
          aria-label="Member ID or profile link"
          placeholder="U0A9B38F413"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button className="btn" type="submit">
          View profile
        </button>
      </div>
      {error && <div className="error-text">That doesn’t look like a Slack member ID.</div>}
    </form>
  );
}
