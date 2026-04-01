"use client";

import { useState, useRef, useEffect } from "react";
import { MessageBubble, type ChatMessage } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/chat/chat-input";
import { PaymentSheet } from "@/components/chat/payment-sheet";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "\u{1F64F} Namaste! I'm YatraAI \u2014 your AI travel assistant.\n\nTell me where you want to go, and I'll find the best trains, buses, or flights for you. I can also help with hotels and dharamshalas near your destination.",
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

// Simulated conversation steps
const DEMO_FLOW: { delay: number; messages: ChatMessage[]; typing?: string }[] = [
  {
    delay: 800,
    typing: "Understanding your request...",
    messages: [],
  },
  {
    delay: 1500,
    typing: "Searching trains from Hyderabad to Delhi...",
    messages: [
      {
        id: "agent-ack",
        role: "assistant",
        content:
          "Hyderabad \u2192 New Delhi, tomorrow (7 April). Let me search for the best trains for you...",
        type: "text",
      },
    ],
  },
  {
    delay: 2000,
    messages: [
      {
        id: "train-results",
        role: "assistant",
        content: null,
        type: "train_results",
        metadata: {
          results: [
            {
              name: "Telangana Express",
              number: "12723",
              departure: "06:00",
              arrival: "22:30",
              duration: "16h 30m",
              price: 580,
              class: "Sleeper",
              seats: 42,
            },
            {
              name: "AP Express",
              number: "12723",
              departure: "17:30",
              arrival: "10:15",
              duration: "16h 45m",
              price: 620,
              class: "Sleeper",
              seats: 28,
              recommended: true,
            },
            {
              name: "GT Express",
              number: "12615",
              departure: "19:00",
              arrival: "12:00",
              duration: "17h",
              price: 600,
              class: "Sleeper",
              seats: 8,
            },
          ],
        },
      },
    ],
  },
  {
    delay: 500,
    messages: [
      {
        id: "recommend",
        role: "assistant",
        content:
          "\u2B50 AP Express is the best option \u2014 overnight journey, arrives early morning. 28 sleeper seats available. Want to book this one?",
        type: "text",
      },
      {
        id: "select-chips",
        role: "assistant",
        content: null,
        type: "chips",
        metadata: {
          chips: [
            "\u2705 Book AP Express",
            "Show other options",
            "\u270F\uFE0F Change date",
            "\u274C Cancel",
          ],
        },
      },
    ],
  },
  // After user selects:
  {
    delay: 1000,
    typing: "Preparing your booking...",
    messages: [],
  },
  {
    delay: 1500,
    messages: [
      {
        id: "confirm-msg",
        role: "assistant",
        content:
          "Here's your booking summary. Please confirm to proceed with payment:",
        type: "text",
      },
      {
        id: "booking-status",
        role: "assistant",
        content: null,
        type: "booking_status",
        metadata: {
          booking: {
            status: "confirmed",
            pnr: "4521678901",
            trainName: "AP Express",
            trainNumber: "12723",
            date: "7 April 2026",
            departure: "17:30",
            arrival: "10:15",
            class: "Sleeper",
            passenger: "Lakshmi Devi, 65, F",
            berth: "S4-32 (Lower)",
            price: 620,
          },
        },
      },
    ],
  },
  {
    delay: 500,
    messages: [
      {
        id: "post-booking",
        role: "assistant",
        content:
          "\u2705 Booking confirmed! E-ticket has been generated.\n\nSince you're heading to Delhi, here are some stay options near the station:",
        type: "text",
      },
      {
        id: "stay-results",
        role: "assistant",
        content: null,
        type: "stay_suggestions",
        metadata: {
          stays: [
            {
              name: "Gurudwara Bangla Sahib \u{1F64F}",
              type: "Dharamshala",
              price: "Free",
              distance: "2.1 km from station",
              rating: 4,
            },
            {
              name: "Railway Retiring Room",
              type: "Retiring Room",
              price: "\u20B9350/night",
              distance: "Platform 1",
              rating: 3,
            },
            {
              name: "OYO Connaught Place",
              type: "Hotel",
              price: "\u20B9899/night",
              distance: "3.5 km · AC",
              rating: 4,
            },
          ],
        },
      },
    ],
  },
  {
    delay: 300,
    messages: [
      {
        id: "final-chips",
        role: "assistant",
        content: null,
        type: "chips",
        metadata: {
          chips: [
            "\u{1F3E8} Book a stay",
            "\u{1F4CB} View my trips",
            "\u{1F4AC} New booking",
          ],
        },
      },
    ],
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [typing, setTyping] = useState<string | null>(null);
  const [demoStep, setDemoStep] = useState(0);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const advanceDemo = (step: number) => {
    if (step >= DEMO_FLOW.length) return;

    const flow = DEMO_FLOW[step];

    if (flow.typing) {
      setTyping(flow.typing);
      setTimeout(() => {
        setTyping(null);
        if (flow.messages.length > 0) {
          setMessages((prev) => [...prev, ...flow.messages]);
        }
        // Auto-advance if no messages (pure typing step)
        if (flow.messages.length === 0) {
          advanceDemo(step + 1);
        } else {
          setDemoStep(step + 1);
        }
      }, flow.delay);
    } else {
      setTimeout(() => {
        setMessages((prev) => [...prev, ...flow.messages]);
        setDemoStep(step + 1);
        // If next step has no user interaction needed, auto-advance
        if (step + 1 < DEMO_FLOW.length && DEMO_FLOW[step + 1]?.typing) {
          advanceDemo(step + 1);
        }
      }, flow.delay);
    }
  };

  const handleSend = (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      type: "text",
    };
    setMessages((prev) => [...prev, userMsg]);

    // Trigger demo flow
    if (demoStep === 0) {
      advanceDemo(0);
    } else if (demoStep === 4) {
      // After train selection, show payment then booking
      setPaymentOpen(true);
    }
  };

  const handleChipClick = (chip: string) => {
    handleSend(chip);
  };

  const handlePay = () => {
    setPaymentOpen(false);
    // Continue demo with booking confirmation
    advanceDemo(4);
  };

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
              onTrainSelect={(i) => {
                const train = msg.metadata?.results?.[i];
                if (train) {
                  handleSend(`\u2705 Book ${train.name}`);
                }
              }}
            />
          ))}
          {typing && <TypingIndicator label={typing} />}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={!!typing} />

      {/* Payment */}
      <PaymentSheet
        amount={620}
        description="AP Express · Sleeper · 7 Apr"
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onPay={handlePay}
      />
    </div>
  );
}
