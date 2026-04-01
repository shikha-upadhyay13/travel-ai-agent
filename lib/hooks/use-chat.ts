"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage } from "@/components/chat/message-bubble";

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

interface UseChatOptions {
  userId?: string;
  useStreaming?: boolean;
}

interface AgentResponse {
  agent_state: string;
  messages: Array<{
    role: string;
    content: string | null;
    message_type: string;
    metadata?: Record<string, unknown> | null;
  }>;
  session?: Record<string, unknown>;
}

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapAgentMessage(msg: AgentResponse["messages"][0]): ChatMessage {
  return {
    id: generateId(),
    role: msg.role as "user" | "assistant",
    content: msg.content,
    type: msg.message_type as ChatMessage["type"],
    metadata: msg.metadata as ChatMessage["metadata"],
  };
}

export function useChat({ userId = "anonymous", useStreaming = false }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agentState, setAgentState] = useState("IDLE");
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addMessages = useCallback((newMsgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...newMsgs]);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      // Add user message immediately
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text,
        type: "text",
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setTypingLabel("Thinking...");

      try {
        if (useStreaming) {
          await sendStreaming(text, userId);
        } else {
          await sendStandard(text, userId);
        }
      } catch (err) {
        console.error("Chat error:", err);
        const errorMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "Sorry, I couldn't connect to the agent. Please make sure the Python agent is running on port 8000.",
          type: "text",
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setTypingLabel(null);
      }
    },
    [userId, useStreaming],
  );

  const sendStandard = async (text: string, uid: string) => {
    const res = await fetch(`${AGENT_API}/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid, message: text }),
    });

    if (!res.ok) throw new Error(`Agent returned ${res.status}`);

    const data: AgentResponse = await res.json();
    setAgentState(data.agent_state);

    const mapped = data.messages.map(mapAgentMessage);
    addMessages(mapped);
  };

  const sendStreaming = async (text: string, uid: string) => {
    abortRef.current = new AbortController();

    const res = await fetch(`${AGENT_API}/agent/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid, message: text }),
      signal: abortRef.current.signal,
    });

    if (!res.ok) throw new Error(`Agent returned ${res.status}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";
    let streamingContent = "";
    let streamingMsgId: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          const event = line.slice(7).trim();
          // Next line should be data
          continue;
        }

        if (line.startsWith("data: ")) {
          const rawData = line.slice(6);
          try {
            const data = JSON.parse(rawData);

            // Find the most recent event type from buffer context
            if (data.agent_state !== undefined) {
              // State event
              setAgentState(data.agent_state);
              if (data.label) setTypingLabel(data.label);
            } else if (data.content !== undefined && data.message_type === undefined) {
              // Token event — streaming text
              streamingContent += data.content;
              if (!streamingMsgId) {
                streamingMsgId = generateId();
                setMessages((prev) => [
                  ...prev,
                  {
                    id: streamingMsgId!,
                    role: "assistant",
                    content: streamingContent,
                    type: "text",
                  },
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingMsgId
                      ? { ...m, content: streamingContent }
                      : m,
                  ),
                );
              }
            } else if (data.role === "assistant") {
              // Full message event
              const mapped = mapAgentMessage(data);
              setMessages((prev) => [...prev, mapped]);
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    setAgentState("IDLE");
  }, []);

  return {
    messages,
    isLoading,
    agentState,
    typingLabel,
    sendMessage,
    clearMessages,
    addMessages,
  };
}
