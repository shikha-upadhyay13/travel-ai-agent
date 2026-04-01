# TravelAI Agent

An AI-powered travel assistant that helps users book flights, trains, and buses through natural language conversation. Supports voice input in English, Hindi, Telugu, and Marathi with real-time streaming responses.

## Features

- **Multi-turn booking** — Conversational slot-filling for flight, train, and bus bookings
- **RAG-powered Q&A** — Answers travel questions from a FAISS-indexed knowledge base (50+ facts)
- **Multilingual** — Accepts text/voice in Hindi, Telugu, Marathi (auto-translates to English)
- **Voice input** — Browser-based speech recognition via Web Speech API
- **Streaming responses** — Real-time token-by-token output via Server-Sent Events
- **Modern UI** — Dark/light theme, responsive design, chat persistence, streaming cursor
- **Booking management** — Search, select, confirm, and cancel bookings with reference tracking
- **Booking history** — Side panel showing all past bookings with status badges
- **SQLite persistence** — Conversations, bookings, and sessions survive server restarts
- **Knowledge base hot-reload** — Update travel facts without restarting the server
- **Groq fallback** — Cloud LLM backup when Ollama is unavailable
- **Docker support** — One-command deployment with docker-compose

## Architecture

```
User (Text/Voice) --> Frontend (HTML/JS/SSE) --> FastAPI Backend
                                                      |
                      +-------------------------------+
                      v                               v
                Translation                  Intent Classification
                (Ollama)                       (Ollama + Context)
                      |                               |
                      v                               v
              +---------------+--------------+----------------+
              | Booking Flow  | RAG Query    | Chat / Support |
              | (Slot Fill +  | (FAISS +     | (LLM-powered   |
              |  Confirm +    |  Ollama)     |  responses)    |
              |  DB Save)     |              |                |
              +-------+-------+------+-------+----------------+
                      v              v
               Mock Services   Knowledge Base       SQLite DB
               (Flight/Train   (50+ facts,        (Conversations,
                /Bus search)    hot-reloadable)     Bookings,
                                                    Sessions)
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | FastAPI (Python 3.10) | Async web framework |
| LLM | Ollama (llama3, local) | Intent classification, entity extraction, chat |
| LLM Fallback | Groq API (free tier) | Cloud backup when Ollama is down |
| Embeddings | all-MiniLM-L6-v2 | 384-dim semantic search |
| Vector DB | FAISS (IndexFlatL2) | In-memory similarity search |
| Database | SQLite (WAL mode) | Persistent storage |
| Frontend | Vanilla HTML/CSS/JS | No build step required |
| Voice | Web Speech API | Browser-native speech recognition |
| Streaming | Server-Sent Events | Real-time response streaming |
| Container | Docker + Compose | Production deployment |

All core tools are free and open-source.

## Setup

### Prerequisites
- Python 3.10+
- [Ollama](https://ollama.com) installed and running

### Install

```bash
# Clone and enter project
cd travel-ai-agent

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Pull the LLM model
ollama pull llama3
```

### Run

```bash
# Start Ollama (if not running)
ollama serve

# Start the app
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000 in your browser.

### Docker

```bash
# Start everything (app + Ollama)
docker-compose up -d

# Pull the model into the Ollama container
docker exec travel-ollama ollama pull llama3

# Open http://localhost:8000
```

### Run Tests

```bash
pytest tests/ -v
```

82 tests covering slot management, services, database, state, and API endpoints.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434/api/generate` | Ollama API endpoint |
| `OLLAMA_MODEL` | `llama3` | Model name |
| `LLM_TIMEOUT` | `60` | Request timeout (seconds) |
| `LLM_MAX_RETRIES` | `2` | Retry count on failure |
| `GROQ_API_KEY` | *(empty)* | Optional Groq fallback key |
| `DB_PATH` | `travel_agent.db` | SQLite database path |
| `CORS_ORIGINS` | `http://localhost:8000` | Allowed CORS origins |
| `RATE_LIMIT_MAX` | `20` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `60` | Rate limit window (seconds) |
| `LOG_LEVEL` | `INFO` | Logging level |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serves the chat UI |
| POST | `/chat` | Standard chat endpoint |
| POST | `/chat/stream` | Streaming chat (SSE) |
| GET | `/health` | Health check (API, Ollama, RAG) |
| GET | `/bookings/{user_id}` | List user's bookings |
| GET | `/bookings/detail/{ref}` | Booking details |
| POST | `/bookings/confirm` | Confirm a booking |
| POST | `/bookings/cancel` | Cancel a booking |
| GET | `/quick-actions` | Dynamic quick actions |
| POST | `/admin/reload-kb` | Hot-reload knowledge base |
| GET | `/admin/kb-stats` | Knowledge base statistics |

### POST /chat

```json
// Request
{
  "user_id": "user_abc123",
  "message": "Book a flight from Delhi to Mumbai tomorrow"
}

// Response (slot filling)
{
  "reply": "I'll search for flights from Delhi to Mumbai on 2026-03-31. Shall I proceed? (yes/no)"
}

// Response (with results)
{
  "reply": "Here are the available flight options:",
  "data": {
    "mode": "flight",
    "source": "Delhi",
    "destination": "Mumbai",
    "date": "2026-03-31",
    "results": [...],
    "booking_ref": "BK-FL-20260330-A1B2C3"
  }
}
```

## Project Structure

```
travel-ai-agent/
├── app/
│   ├── main.py                    # FastAPI app, lifespan (DB + RAG init)
│   ├── config.py                  # Centralized config
│   ├── api/
│   │   ├── chat.py                # POST /chat
│   │   ├── stream.py              # POST /chat/stream (SSE)
│   │   ├── health.py              # GET /health
│   │   ├── bookings.py            # Booking CRUD
│   │   └── actions.py             # Quick actions + KB admin
│   ├── core/
│   │   ├── intent_router.py       # Intent classification
│   │   ├── slot_manager.py        # Slot extraction + validation
│   │   ├── state_manager.py       # In-memory conversation state
│   │   └── rate_limiter.py        # Rate limiting
│   ├── services/
│   │   ├── llm_service.py         # LLM extraction + chat generation
│   │   ├── translation_service.py # Multilingual translation
│   │   ├── groq_service.py        # Groq API fallback
│   │   ├── flight_service.py      # Mock flight search
│   │   ├── train_service.py       # Mock train search
│   │   └── bus_service.py         # Mock bus search
│   ├── db/
│   │   └── database.py            # SQLite operations
│   └── rag/
│       └── knowledge_base/
│           ├── embedding_service.py
│           ├── vector_store.py
│           ├── rag_pipeline.py
│           └── travel_docs.txt
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       └── voice.js
├── tests/                         # 82 tests
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── .gitignore
```
