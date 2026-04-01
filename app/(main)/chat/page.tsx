"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageBubble, type ChatMessage } from "@/components/chat/message-bubble";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/chat/chat-input";
import { PaymentSheet } from "@/components/chat/payment-sheet";

function genId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── DEMO DATA ───
const DEMO_TRAINS = [
  { name: "Telangana Express", number: "12723", departure: "06:00", arrival: "22:30", duration: "16h 30m", price: 580, class: "Sleeper", seats: 42 },
  { name: "AP Express", number: "12724", departure: "17:30", arrival: "10:15", duration: "16h 45m", price: 620, class: "Sleeper", seats: 28, recommended: true },
  { name: "GT Express", number: "12615", departure: "19:00", arrival: "12:00", duration: "17h", price: 600, class: "Sleeper", seats: 8 },
];

const DEMO_BUSES = [
  { name: "APSRTC Garuda", number: "AP-3421", departure: "22:00", arrival: "06:30", duration: "8h 30m", price: 850, class: "AC Sleeper", seats: 12, recommended: true },
  { name: "Orange Travels", number: "OT-1190", departure: "21:00", arrival: "05:45", duration: "8h 45m", price: 750, class: "Semi-Sleeper", seats: 22 },
  { name: "SRS Travels", number: "SRS-445", departure: "23:30", arrival: "08:00", duration: "8h 30m", price: 650, class: "Non-AC Sleeper", seats: 30 },
];

const DEMO_FLIGHTS = [
  { name: "IndiGo", number: "6E-2345", departure: "06:15", arrival: "08:30", duration: "2h 15m", price: 3450, class: "Economy", seats: 45, recommended: true },
  { name: "Air India", number: "AI-542", departure: "10:00", arrival: "12:20", duration: "2h 20m", price: 4200, class: "Economy", seats: 18 },
  { name: "SpiceJet", number: "SG-8821", departure: "14:30", arrival: "16:50", duration: "2h 20m", price: 2980, class: "Economy", seats: 32 },
];

const DEMO_BOOKING = {
  status: "confirmed" as const, pnr: "4521678901", trainName: "AP Express", trainNumber: "12724",
  date: "7 April 2026", departure: "17:30", arrival: "10:15", class: "Sleeper",
  passenger: "Lakshmi Devi, 65, F", berth: "S4-32 (Lower)", price: 620,
};

const DEMO_STAYS = [
  { name: "Gurudwara Bangla Sahib", type: "Dharamshala", price: "Free", distance: "2.1 km from station", rating: 4 },
  { name: "Railway Retiring Room", type: "Retiring Room", price: "\u20B9350/night", distance: "Platform 1", rating: 3 },
  { name: "OYO Connaught Place", type: "Hotel", price: "\u20B9899/night", distance: "3.5 km", rating: 4 },
];

const WELCOME: ChatMessage[] = [
  { id: "w1", role: "assistant", content: "\u{1F64F} Namaste! I'm YatraAI \u2014 your AI travel assistant.\n\nTell me where you want to go and I'll handle everything. I speak Hindi, Telugu, and English!", type: "text" },
  { id: "w2", role: "assistant", content: null, type: "chips", metadata: { chips: ["\u{1F686} Book a train", "\u{1F68C} Find a bus", "\u2708\uFE0F Search flights", "\u{1F3E8} Need a hotel"] } },
];

// ─── SMART DEMO FLOW ───
type DemoStep = { delay: number; typing?: string; messages: ChatMessage[] };

function detectIntent(text: string): "train" | "bus" | "flight" | "hotel" | "greeting" | "help" | "unknown" {
  const l = text.toLowerCase();
  if (l.includes("train") || l.includes("\u{1F686}") || l.includes("rail")) return "train";
  if (l.includes("bus") || l.includes("\u{1F68C}")) return "bus";
  if (l.includes("flight") || l.includes("\u2708") || l.includes("fly") || l.includes("plane")) return "flight";
  if (l.includes("hotel") || l.includes("stay") || l.includes("dharamshala") || l.includes("\u{1F3E8}")) return "hotel";
  if (l.includes("hi") || l.includes("hello") || l.includes("namaste") || l.includes("hey")) return "greeting";
  if (l.includes("help") || l.includes("what can") || l.includes("how")) return "help";
  return "unknown";
}

function buildSearchFlow(intent: "train" | "bus" | "flight"): DemoStep[] {
  const labels = { train: "trains", bus: "buses", flight: "flights" };
  const data = { train: DEMO_TRAINS, bus: DEMO_BUSES, flight: DEMO_FLIGHTS };
  const resultType = { train: "train_results" as const, bus: "train_results" as const, flight: "train_results" as const };
  const best = data[intent][0];

  return [
    { delay: 500, typing: "Understanding your request...", messages: [] },
    { delay: 1000, typing: `Searching ${labels[intent]}...`, messages: [
      { id: genId(), role: "assistant", content: `Got it! Let me search for available ${labels[intent]}...`, type: "text" },
    ]},
    { delay: 1500, messages: [
      { id: genId(), role: "assistant", content: null, type: resultType[intent], metadata: { results: data[intent] } },
    ]},
    { delay: 300, messages: [
      { id: genId(), role: "assistant", content: `\u2B50 ${best.name} is the best option \u2014 ${best.departure} departure, \u20B9${best.price}. Want to book this one?`, type: "text" },
      { id: genId(), role: "assistant", content: null, type: "chips", metadata: { chips: [`\u2705 Book ${best.name}`, "\u{1F504} Change date", "\u274C Cancel"] } },
    ]},
  ];
}

function buildConfirmFlow(): DemoStep[] {
  return [
    { delay: 400, typing: "Preparing your booking...", messages: [] },
    { delay: 1000, messages: [
      { id: genId(), role: "assistant", content: "Booking confirmed! Here are your details:", type: "text" },
      { id: genId(), role: "assistant", content: null, type: "booking_status", metadata: { booking: DEMO_BOOKING } },
    ]},
    { delay: 500, messages: [
      { id: genId(), role: "assistant", content: "Since you're heading to Delhi, here are some stay options near the station:", type: "text" },
      { id: genId(), role: "assistant", content: null, type: "stay_suggestions", metadata: { stays: DEMO_STAYS } },
    ]},
    { delay: 300, messages: [
      { id: genId(), role: "assistant", content: null, type: "chips", metadata: { chips: ["\u{1F3E8} Book a stay", "\u{1F686} Book another trip", "\u{1F4AC} Start over"] } },
    ]},
  ];
}

function buildGreetingFlow(): DemoStep[] {
  return [{ delay: 500, messages: [
    { id: genId(), role: "assistant", content: "Hello! \u{1F64F} Great to see you! I can help you with:\n\n\u2022 \u{1F686} Train tickets across India\n\u2022 \u{1F68C} Bus bookings (APSRTC, RedBus, etc.)\n\u2022 \u2708\uFE0F Domestic flights\n\u2022 \u{1F3E8} Hotels & dharamshalas\n\nJust tell me where you want to go!", type: "text" },
    { id: genId(), role: "assistant", content: null, type: "chips", metadata: { chips: ["\u{1F686} Book a train", "\u{1F68C} Find a bus", "\u2708\uFE0F Search flights"] } },
  ]}];
}

function buildHotelFlow(): DemoStep[] {
  return [
    { delay: 500, typing: "Finding stays near your destination...", messages: [] },
    { delay: 1200, messages: [
      { id: genId(), role: "assistant", content: "Here are some accommodation options:", type: "text" },
      { id: genId(), role: "assistant", content: null, type: "stay_suggestions", metadata: { stays: DEMO_STAYS } },
    ]},
    { delay: 300, messages: [
      { id: genId(), role: "assistant", content: null, type: "chips", metadata: { chips: ["\u{1F3E8} Book Gurudwara stay", "\u{1F686} Book transport too", "\u{1F4AC} Start over"] } },
    ]},
  ];
}

function buildUnknownFlow(text: string): DemoStep[] {
  // Treat unknown as a booking request
  return [
    { delay: 500, typing: "Understanding your request...", messages: [] },
    { delay: 1000, messages: [
      { id: genId(), role: "assistant", content: `I'd love to help! To find the best options, could you tell me:\n\n\u2022 \u{1F686} Train, \u{1F68C} bus, or \u2708\uFE0F flight?\n\u2022 From where to where?\n\u2022 When do you want to travel?\n\nOr just pick one below:`, type: "text" },
      { id: genId(), role: "assistant", content: null, type: "chips", metadata: { chips: ["\u{1F686} Book a train", "\u{1F68C} Find a bus", "\u2708\uFE0F Search flights", "\u{1F3E8} Need a hotel"] } },
    ]},
  ];
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted">Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME);
  const [isLoading, setIsLoading] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "results" | "confirmed">("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const initialSent = useRef(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingLabel]);

  // Handle ?q= param from home page
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialSent.current) {
      initialSent.current = true;
      setTimeout(() => handleSend(q), 500);
    }
  }, [searchParams]);

  // Cleanup
  useEffect(() => {
    return () => flowRef.current.forEach(clearTimeout);
  }, []);

  const runFlow = useCallback((steps: DemoStep[]) => {
    let elapsed = 0;
    setIsLoading(true);

    steps.forEach((step) => {
      elapsed += step.delay;

      if (step.typing) {
        const t1 = setTimeout(() => setTypingLabel(step.typing!), elapsed - step.delay);
        flowRef.current.push(t1);
      }

      const t2 = setTimeout(() => {
        setTypingLabel(null);
        if (step.messages.length > 0) {
          setMessages((prev) => [...prev, ...step.messages]);
        }
      }, elapsed);
      flowRef.current.push(t2);
    });

    const t3 = setTimeout(() => {
      setIsLoading(false);
      setTypingLabel(null);
    }, elapsed + 100);
    flowRef.current.push(t3);
  }, []);

  const handleSend = useCallback((text: string) => {
    // Clear pending timeouts
    flowRef.current.forEach(clearTimeout);
    flowRef.current = [];

    // Add user message
    setMessages((prev) => [...prev, { id: genId(), role: "user", content: text, type: "text" }]);

    const lower = text.toLowerCase();

    // Handle booking confirmation
    const isConfirm = lower.includes("book ") || lower.includes("\u2705") || lower.includes("confirm") || lower.includes("yes");
    if (isConfirm && phase === "results") {
      setPaymentOpen(true);
      return;
    }

    // Handle start over
    if (lower.includes("start over") || lower.includes("cancel") || lower.includes("\u274C")) {
      setPhase("idle");
      runFlow([{ delay: 300, messages: [
        { id: genId(), role: "assistant", content: "No problem! What would you like to do?", type: "text" },
        { id: genId(), role: "assistant", content: null, type: "chips", metadata: { chips: ["\u{1F686} Book a train", "\u{1F68C} Find a bus", "\u2708\uFE0F Search flights", "\u{1F3E8} Need a hotel"] } },
      ]}]);
      return;
    }

    // Detect intent and run appropriate flow
    const intent = detectIntent(text);

    switch (intent) {
      case "train":
      case "bus":
      case "flight":
        setPhase("results");
        runFlow(buildSearchFlow(intent));
        break;
      case "hotel":
        runFlow(buildHotelFlow());
        break;
      case "greeting":
        runFlow(buildGreetingFlow());
        break;
      default:
        runFlow(buildUnknownFlow(text));
        break;
    }
  }, [phase, runFlow]);

  const handleChipClick = useCallback((chip: string) => handleSend(chip), [handleSend]);

  const handlePay = useCallback(() => {
    setPaymentOpen(false);
    setPhase("confirmed");
    // Add user message for payment
    setMessages((prev) => [...prev, { id: genId(), role: "user", content: "Payment completed \u2705", type: "text" }]);
    runFlow(buildConfirmFlow());
  }, [runFlow]);

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
                const results = msg.metadata?.results as Array<{ name: string }> | undefined;
                if (results?.[i]) handleSend(`\u2705 Book ${results[i].name}`);
              }}
            />
          ))}
          {typingLabel && <TypingIndicator label={typingLabel} />}
        </div>
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />

      {/* Payment */}
      <PaymentSheet
        amount={620}
        description="AP Express \u00B7 Sleeper \u00B7 7 Apr"
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onPay={handlePay}
      />
    </div>
  );
}
