import { NextRequest, NextResponse } from "next/server";

const AGENT_URL = process.env.AGENT_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${AGENT_URL}/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Agent service error" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat proxy error:", error);
    return NextResponse.json(
      {
        agent_state: "ERROR",
        messages: [
          {
            role: "assistant",
            content:
              "Could not connect to the AI agent. Please ensure the Python agent is running on port 8000.",
            message_type: "text",
            metadata: null,
          },
        ],
        session: {},
      },
      { status: 502 },
    );
  }
}
