"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Row = { id: number; name: string; score: number; created_at: string };

export default function Scoreboard() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabaseClient
        .from("highscores")
        .select("id,name,score,created_at")
        .order("score", { ascending: false })
        .limit(10);
      if (!error && data) setRows(data as Row[]);
    })();
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: "8px 0" }}>Top 10</h3>
      <ol style={{ paddingLeft: 16 }}>
        {rows.map(r => (
          <li key={r.id}><b>{r.name}</b> — {r.score}</li>
        ))}
      </ol>
    </div>
  );
}
