"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble, type ChatMessage } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/chat/chat-input";
import { PaymentSheet } from "@/components/chat/payment-sheet";

const AGENT_API = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8000";

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "\u{1F64F} Namaste! I'm YatraAI \u2014 your AI travel assistant.\n\nTell me where you want to go, and I'll find the best trains, buses, or flights for you.",
    type: "text",
  },
  {
    id: "welcome-chips",
    role: "assistant",
    content: null,
    type: "chips",
    metadata: {
      chips: [
        "\u{1F686} Book a train",
        "\u{1F68C} Find a bus",
        "\u2708\uFE0F Search flights",
        "\u{1F3E8} Need a hotel",
      ],
    },
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDesc, setPaymentDesc] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef(
    typeof window !== "undefined"
      ? localStorage.getItem("yatraai_user_id") || `user-${Date.now()}`
      : "anonymous",
  );

  // Persist userId
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("yatraai_user_id", userIdRef.current);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingLabel]);

  const sendToAgent = useCallback(async (text: string) => {
    setIsLoading(true);
    setTypingLabel("Thinking...");

    try {
      const res = await fetch(`${AGENT_API}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userIdRef.current,
          message: text,
        }),
      });

      if (!res.ok) throw new Error(`Agent returned ${res.status}`);

      const data = await res.json();

      // Update typing label based on agent state
      if (data.agent_state === "SEARCHING") {
        setTypingLabel("Searching...");
      }

      // Map agent messages to our ChatMessage format
      const agentMessages: ChatMessage[] = data.messages.map(
        (msg: { role: string; content: string | null; message_type: string; metadata?: Record<string, unknown> | null }) => ({
          id: generateId(),
          role: msg.role as "user" | "assistant",
          content: msg.content,
          type: msg.message_type,
          metadata: msg.metadata,
        }),
      );

      setMessages((prev) => [...prev, ...agentMessages]);
    } catch (err) {
      console.error("Agent error:", err);
      // Fallback message when agent is unavailable
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "I couldn't connect to the AI agent right now. Please make sure the Python agent is running:\n\n`cd services/agent && python -m uvicorn app.main:app --port 8000`",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
      setTypingLabel(null);
    }
  }, []);

  const handleSend = useCallback(
    (text: string) => {
      // Add user message immediately
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: text,
        type: "text",
      };
      setMessages((prev) => [...prev, userMsg]);

      // Send to agent
      sendToAgent(text);
    },
    [sendToAgent],
  );

  const handleChipClick = useCallback(
    (chip: string) => {
      handleSend(chip);
    },
    [handleSend],
  );

  const handleTrainSelect = useCallback(
    (index: number, message: ChatMessage) => {
      const results = message.metadata?.results as Array<{ name: string; price: number }> | undefined;
      if (results && results[index]) {
        const train = results[index];
        setPaymentAmount(train.price);
        setPaymentDesc(train.name);
        handleSend(`Book ${train.name}`);
      }
    },
    [handleSend],
  );

  const handlePay = useCallback(() => {
    setPaymentOpen(false);
    // In Phase 6 this will trigger real payment — for now just confirm
    handleSend("Payment confirmed");
  }, [handleSend]);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onChipClick={handleChipClick}
              onTrainSelect={(i) => handleTrainSelect(i, msg)}
            />
          ))}
          {typingLabel && <TypingIndicator label={typingLabel} />}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />

      {/* Payment Sheet */}
      <PaymentSheet
        amount={paymentAmount}
        description={paymentDesc}
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onPay={handlePay}
      />
    </div>
  );
}
