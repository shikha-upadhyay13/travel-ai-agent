# Travel AI Agent — Project Plan

## What This Project Does

A conversational AI travel assistant that helps users book **flights, trains, and buses** through
natural language — typed or spoken — in **English, Hindi, Telugu, or Marathi**. It uses a local
LLM (Ollama) for understanding, FAISS for answering travel questions from a knowledge base,
and a modern web UI with voice input.

---

## Current Project State

```
travel-ai-agent/
├── app/
│   ├── main.py                    # FastAPI app, CORS, static files, RAG startup
│   ├── config.py                  # Env vars (OLLAMA_URL, OLLAMA_MODEL) + logging
│   ├── api/
│   │   ├── chat.py                # POST /chat — main conversation endpoint
│   │   └── health.py              # GET /health — Ollama & RAG status
│   ├── core/
│   │   ├── intent_router.py       # Classifies intent via Ollama (booking/travel_query/chat/support)
│   │   ├── slot_manager.py        # Booking slots: mode, source, destination, date, time
│   │   └── state_manager.py       # Thread-safe in-memory conversation state
│   ├── services/
│   │   ├── llm_service.py         # Extracts structured JSON (intent + slots) from messages
│   │   ├── translation_service.py # Detects non-English → translates via Ollama
│   │   ├── flight_service.py      # Mock: returns 3 random flights
│   │   ├── train_service.py       # Mock: returns 3 random trains
│   │   └── bus_service.py         # Mock: returns 3 random buses
│   └── rag/
│       └── knowledge_base/
│           ├── embedding_service.py   # all-MiniLM-L6-v2 sentence embeddings
│           ├── vector_store.py        # FAISS IndexFlatL2 vector search
│           ├── rag_pipeline.py        # Load docs → embed → search → Ollama answer
│           └── travel_docs.txt        # 30+ travel facts (flights, trains, buses)
├── frontend/
│   ├── index.html                 # Chat UI with voice, theme toggle, quick actions
│   ├── css/styles.css             # Dark/light theme, responsive, animations
│   └── js/
│       ├── app.js                 # Chat logic, API calls, result card rendering
│       └── voice.js               # Web Speech API (en-US, hi-IN, te-IN, mr-IN)
├── requirements.txt
├── .env
└── .gitignore
```

### What Already Works
- [x] FastAPI backend with proper package structure (__init__.py files)
- [x] Intent classification via Ollama (booking, travel_query, general_chat, support)
- [x] Multi-turn booking flow with slot filling (mode, source, destination, date)
- [x] Mode normalization ("fly" → flight, "rail" → train, "coach" → bus)
- [x] Mock search services for all 3 transport types
- [x] RAG pipeline: FAISS + sentence-transformers + Ollama answer generation
- [x] Knowledge base with 30+ Indian travel facts (flights, trains, buses)
- [x] Multilingual translation layer (Hindi/Telugu/Marathi → English via Ollama)
- [x] Thread-safe conversation state with 20-message history cap
- [x] Modern chat UI with dark/light theme, responsive design
- [x] Voice input via Web Speech API (4 Indian languages)
- [x] Result cards for booking results (styled flight/train/bus cards)
- [x] Health check endpoint (API + Ollama + RAG status)
- [x] Centralized config with .env support
- [x] Structured logging across all modules
- [x] Input validation (Pydantic validators on ChatRequest)
- [x] Proper error handling with user-friendly messages
- [x] CORS middleware enabled
- [x] .gitignore (venv, __pycache__, .env, etc.)

---

## Issues Found & Improvement Plan

### Phase 1: Critical Fixes (Do First)

| #  | Issue | File | What To Do |
|----|-------|------|------------|
| 1  | `python-dotenv` not installed | requirements.txt | Run `pip install python-dotenv` (currently handled by try/except fallback in config.py, but should be installed) |
| 2  | No version pinning in requirements.txt | requirements.txt | Pin versions to prevent future breakage |
| 3  | Mock services ignore input parameters | flight/train/bus_service.py | Make results deterministic by seeding random with hash of (source, destination, date) so same query = same results |
| 4  | No date validation | slot_manager.py | Add basic date format validation — reject clearly invalid dates |
| 5  | `__pycache__` folders tracked by git | git status | Run `git rm -r --cached` on __pycache__ dirs, already in .gitignore |

### Phase 2: Robustness & Quality

| #  | Issue | File | What To Do |
|----|-------|------|------------|
| 6  | CORS allows all origins | main.py | Restrict to `http://localhost:8000` for dev, make configurable via .env |
| 7  | User IDs are client-generated | app.js / chat.py | Not a security risk for this MVP (no auth), but document the limitation |
| 8  | No retry on Ollama failures | intent_router.py, llm_service.py | Add 1 retry with backoff on timeout errors |
| 9  | RAG has no relevance threshold | rag_pipeline.py | Check FAISS distance score; if too high (>1.5), return "I don't have info on that" instead of hallucinating |
| 10 | Embedding model loads at import time | embedding_service.py | This blocks startup. Move to lazy loading so the model loads on first use |
| 11 | No request rate limiting | main.py | Add simple in-memory rate limiter (e.g., 20 requests/min per user_id) |

### Phase 3: Feature Enhancements

| #  | Issue | File | What To Do |
|----|-------|------|------------|
| 12 | Chat history lost on page refresh | app.js | Persist messages in localStorage, reload on page open |
| 13 | No "typing" response from LLM | chat.py / app.js | Add streaming support — return partial responses as server-sent events (SSE) |
| 14 | Knowledge base is static | travel_docs.txt | Add ability to hot-reload knowledge base without server restart |
| 15 | No booking confirmation step | chat.py | Before searching, confirm with user: "Searching flights from Delhi to Mumbai on March 30. Proceed?" |
| 16 | Quick actions are hardcoded | index.html | Make dynamic — fetch suggested prompts from backend based on popular queries |
| 17 | No conversation export | frontend | Add "Download chat" button to save conversation as text file |

### Phase 4: Production Readiness

| #  | Issue | File | What To Do |
|----|-------|------|------------|
| 18 | In-memory state — lost on restart | state_manager.py | Option A: SQLite (simple, file-based). Option B: Redis (if scaling) |
| 19 | No tests | (new) tests/ | Add pytest tests for slot_manager, services, and chat endpoint |
| 20 | No Docker support | (new) Dockerfile | Create Dockerfile + docker-compose.yml (app + Ollama) |
| 21 | No README | (new) README.md | Setup guide, architecture diagram, API docs |
| 22 | Ollama is single point of failure | config.py | Add Groq API as fallback (free tier, already installed in venv) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ index.html│  │ styles.css│  │ app.js + voice.js │  │
│  │ Chat UI  │  │ Theme    │  │ API + Voice Input │  │
│  └────┬─────┘  └──────────┘  └────────┬──────────┘  │
│       │              Web Speech API    │             │
│       └────────────────────────────────┘             │
└───────────────────────┬─────────────────────────────┘
                        │ POST /chat
                        ▼
┌─────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND                      │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │                  chat.py                         │ │
│  │  1. Translate (if non-English)                   │ │
│  │  2. Track conversation history                   │ │
│  │  3. Classify intent                              │ │
│  │  4. Route to handler                             │ │
│  └──────┬──────────┬──────────────┬────────────────┘ │
│         │          │              │                   │
│         ▼          ▼              ▼                   │
│  ┌──────────┐ ┌─────────┐ ┌──────────────┐          │
│  │ BOOKING  │ │  RAG    │ │ GENERAL/     │          │
│  │ FLOW     │ │ QUERY   │ │ SUPPORT      │          │
│  │          │ │         │ │              │          │
│  │ Extract  │ │ FAISS   │ │ Canned       │          │
│  │ slots →  │ │ search  │ │ responses    │          │
│  │ Fill →   │ │ → Ollama│ │              │          │
│  │ Search   │ │ answer  │ │              │          │
│  └────┬─────┘ └────┬────┘ └──────────────┘          │
│       │             │                                │
│       ▼             ▼                                │
│  ┌──────────────────────────────────┐                │
│  │         OLLAMA (Local LLM)       │                │
│  │  • Intent classification         │                │
│  │  • Entity/slot extraction        │                │
│  │  • Translation (multilingual)    │                │
│  │  • RAG answer generation         │                │
│  └──────────────────────────────────┘                │
│                                                      │
│  ┌──────────────────────────────────┐                │
│  │     SERVICES (Mock Data)         │                │
│  │  • flight_service.py             │                │
│  │  • train_service.py              │                │
│  │  • bus_service.py                │                │
│  └──────────────────────────────────┘                │
│                                                      │
│  ┌──────────────────────────────────┐                │
│  │     STATE MANAGEMENT             │                │
│  │  • Thread-safe in-memory store   │                │
│  │  • Per-user booking slots        │                │
│  │  • 20-message history cap        │                │
│  └──────────────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

---

## Conversation Flow Examples

### Booking Flow (Multi-Turn)
```
User: "I want to travel by train"
  → Intent: booking | Slots filled: mode=train
  → Bot: "I need the following details: departure city, destination city, travel date"

User: "From Hyderabad to Chennai"
  → Slots filled: source=Hyderabad, destination=Chennai
  → Bot: "I need the following details: travel date"

User: "Tomorrow"
  → Slots filled: date=tomorrow
  → Bot: Shows 3 train options (Rajdhani, Shatabdi, etc.) as cards
```

### Travel Query (RAG)
```
User: "What is the baggage limit for flights?"
  → Intent: travel_query
  → RAG: Searches FAISS → finds relevant chunks → Ollama generates answer
  → Bot: "Cabin baggage for domestic flights in India is limited to 7 kg..."
```

### Multilingual (Hindi Voice)
```
User: 🎤 "मुझे दिल्ली से मुंबई की फ्लाइट बुक करनी है"
  → Web Speech API transcribes Hindi
  → Translation service → "I want to book a flight from Delhi to Mumbai"
  → Intent: booking | mode=flight, source=Delhi, destination=Mumbai
  → Bot: "I need the following details: travel date"
```

---

## Tech Stack Summary

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | FastAPI + Python 3.10 | Async, fast, modern Python framework |
| LLM | Ollama (llama3, local) | Free, private, no API key needed |
| Embeddings | all-MiniLM-L6-v2 | Fast, 384-dim, good for semantic search |
| Vector DB | FAISS (IndexFlatL2) | Facebook's similarity search, runs in-memory |
| Frontend | Vanilla HTML/CSS/JS | No build step, fast to iterate |
| Voice | Web Speech API | Free, browser-native, supports Indian languages |
| State | In-memory (threading.Lock) | Simple MVP, upgradeable to SQLite/Redis |

**All tools are 100% free and open-source.**

---

## How To Run

```bash
# 1. Install Ollama (https://ollama.com)
ollama pull llama3

# 2. Activate virtual environment
cd travel-ai-agent
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the server
uvicorn app.main:app --reload --port 8000

# 5. Open browser
# http://localhost:8000
```

---

## Recommended Implementation Order

If starting fresh or continuing development:

```
Phase 1 (Critical)    →  Phase 2 (Robustness)  →  Phase 3 (Features)  →  Phase 4 (Production)
┌─────────────────┐   ┌────────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ • Install deps  │   │ • Retry logic      │   │ • Chat persistence│   │ • SQLite/Redis   │
│ • Pin versions  │   │ • RAG threshold    │   │ • SSE streaming  │   │ • Tests (pytest) │
│ • Seed mock data│   │ • Lazy model load  │   │ • Confirm before │   │ • Docker         │
│ • Date validate │   │ • Rate limiting    │   │   search         │   │ • README         │
│ • Clean __pycache│  │ • CORS restrict    │   │ • KB hot-reload  │   │ • Groq fallback  │
└─────────────────┘   └────────────────────┘   └──────────────────┘   └──────────────────┘
     ~30 min              ~1 hour                  ~2 hours               ~2-3 hours
```
