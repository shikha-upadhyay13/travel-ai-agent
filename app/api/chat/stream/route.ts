import { NextRequest } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${AGENT_URL}/agent/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      return new Response(
        `event: error\ndata: ${JSON.stringify({ content: "Agent unavailable" })}\n\n`,
        {
          status: 502,
          headers: { "Content-Type": "text/event-stream" },
        },
      );
    }

    // Pipe the SSE stream through
    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream proxy error:", error);
    return new Response(
      `event: error\ndata: ${JSON.stringify({ content: "Could not connect to agent" })}\n\nevent: done\ndata: {}\n\n`,
      {
        status: 502,
        headers: { "Content-Type": "text/event-stream" },
      },
    );
  }
}
