import { NextResponse } from "next/server";
import { addSession } from "@/lib/data";

export async function POST(request) {
  try {
    const body = await request.json();
    const { session: sessionPayload, tab_logs: tabLogsPayload } = body;

    if (!sessionPayload || !sessionPayload.start_time || !sessionPayload.end_time) {
      return NextResponse.json(
        { error: "Missing session start_time or end_time" },
        { status: 400 }
      );
    }

    const sessionId = await addSession(sessionPayload, tabLogsPayload);
    return NextResponse.json({ success: true, session_id: sessionId });
  } catch (err) {
    console.error("sync-session error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
