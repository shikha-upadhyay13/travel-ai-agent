# YatraAI — AI Travel Booking Agent

> Book trains, buses & flights through conversation. No forms, no confusion — just tell me where you want to go.

YatraAI is a conversational AI travel booking platform built with **Next.js 15** and a **Python FastAPI** agent service. It supports multilingual conversations (English, Hindi, Telugu), an agentic chat interface with rich UI cards, UPI payment flow, and persistent booking management.

## Features

- **Agentic Chat UI** — Rich message bubbles, train/bus/flight result cards, quick reply chips, typing indicators
- **Smart Demo Mode** — Full interactive booking flow works without any backend
- **Phone OTP Auth** — Login with phone number, JWT sessions, user profiles
- **Booking System** — Create, view, cancel bookings with PNR generation
- **Payment Flow** — Mock UPI payment with Razorpay-ready architecture
- **Multilingual** — English, Hindi (हिंदी), Telugu (తెలుగు) — switchable from header
- **Dark/Light Theme** — Toggle from header or profile settings
- **Responsive** — Desktop sidebar + mobile bottom nav
- **PWA Ready** — Installable on mobile/desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Database | SQLite via Drizzle ORM (PostgreSQL-ready) |
| Auth | Phone OTP + JWT (jose) |
| AI Agent | Python FastAPI + Groq (llama-3.3-70b) |
| RAG | FAISS + sentence-transformers |
| Payments | Mock (Razorpay-ready) |

## Getting Started

### 1. Install & Run (Next.js)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Login with any phone number, OTP is `000000` in dev mode.

### 2. Run Python Agent (Optional)

The app works in demo mode without the agent. To enable live AI responses:

```bash
cd services/agent
pip install -r requirements.txt
# Set your Groq API key
echo "GROQ_API_KEY=gsk_your_key_here" > .env
python -m uvicorn app.main:app --port 8000
```

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Phone OTP login
│   ├── (main)/             # Main app (sidebar + header)
│   │   ├── page.tsx        # Home
│   │   ├── chat/           # Agentic chat interface
│   │   ├── bookings/       # Trip management
│   │   ├── stays/          # Accommodation browser
│   │   └── profile/        # User settings
│   └── api/                # API routes (auth, chat, bookings, payment)
├── components/
│   ├── chat/               # MessageBubble, TrainCard, QuickChips, PaymentSheet
│   ├── layout/             # Sidebar, Header, BottomNav
│   ├── providers/          # Theme, Language contexts
│   └── ui/                 # Button, Card, Badge, ErrorBoundary
├── lib/
│   ├── auth/               # OTP, JWT sessions
│   ├── db/                 # Drizzle schema + SQLite client
│   ├── hooks/              # use-chat, use-user
│   └── i18n/               # Translations (en/hi/te)
├── services/agent/         # Python FastAPI AI agent
│   ├── app/api/            # /agent/chat, /agent/chat/stream
│   ├── app/core/           # Intent router, slot manager, state machine
│   ├── app/services/       # Groq LLM, translation, transport search
│   └── app/rag/            # FAISS knowledge base
└── docs/                   # PRD + UI Design specs
```

## Demo Flow

1. Login with phone → OTP `000000`
2. Chat: "Book a train" → see 3 train cards → select one
3. Payment sheet → Pay → Booking confirmed with PNR
4. Trips tab → view/cancel bookings
5. Switch language → हिंदी or తెలుగు
6. Toggle dark mode
