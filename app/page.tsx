"use client";

import { useState } from "react";
import Game from "@/components/Game";

export default function Page() {
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    setStatus("Submitting...");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score: pendingScore })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setStatus("Saved!");
      setPendingScore(null);
      setName("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      setStatus(msg);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "#000",
        color: "#fff"
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: "relative",
          paddingTop: 32,
          paddingBottom: 8
        }}
      >
        {/* Title centered, a bit down from the very top */}
        <h1
          style={{
            margin: 0,
            textAlign: "center",
            fontSize: 32,
            letterSpacing: "0.06em"
          }}
        >
          h3lo
        </h1>

        {/* X/Twitter icon in top-right */}
        <a
          href="https://x.com/h3l0_hl"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="h3lo on X"
          style={{
            position: "absolute",
            right: 16,
            top: 16,
            opacity: 0.9
          }}
        >
          {/* Simple X logo as inline SVG (white) */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="currentColor"
            style={{ color: "#fff" }}
          >
            <path d="M18.244 2H21l-6.53 7.46L22 22h-6.78l-4.73-6.2L4.88 22H2.12l7.04-8.04L2 2h6.78l4.37 5.73L18.244 2Zm-1.19 18.46h1.87L7.1 3.54H5.23l11.82 16.92Z" />
          </svg>
        </a>
      </header>

      {/* CONTENT (game centered) */}
      <div
        style={{
          display: "grid",
          placeItems: "center",
          padding: "16px 0"
        }}
      >
        <div style={{ width: "auto" }}>
          <Game onGameOver={(s) => setPendingScore(s)} />

          {/* Name + submit only when a run ends */}
          {pendingScore !== null && (
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: "#111",
                  color: "#fff"
                }}
              />
              <button
                onClick={submit}
                disabled={!name.trim()}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fff",
                  color: "#000",
                  border: 0,
                  cursor: "pointer"
                }}
              >
                Submit {pendingScore}
              </button>
            </div>
          )}
          {status && <p style={{ marginTop: 8 }}>{status}</p>}
        </div>
      </div>

      {/* FOOTER (privacy at the very bottom) */}
      <footer
        style={{
          fontSize: 12,
          opacity: 0.7,
          textAlign: "center",
          padding: "10px 16px"
        }}
      >
        Privacy: We store only the name you enter and your score, plus a timestamp.
      </footer>
    </main>
  );
}
