import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { name, score } = await req.json();

    const cleanName = String(name ?? "").trim().slice(0, 20);
    const nScore = Number(score);

    if (!cleanName) return NextResponse.json({ error: "Name required" }, { status: 400 });
    if (!Number.isFinite(nScore) || nScore < 0 || nScore > 1_000_000) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("highscores")
      .insert({ name: cleanName, score: nScore });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
