# TravelAI Agent

An AI-powered travel assistant that helps users book flights, trains, and buses through natural language conversation. Supports voice input in English, Hindi, Telugu, and Marathi.

## Features

- **Multi-turn booking** — Conversational slot-filling for flight, train, and bus bookings
- **RAG-powered Q&A** — Answers travel questions from a FAISS-indexed knowledge base
- **Multilingual** — Accepts text/voice in Hindi, Telugu, Marathi (auto-translates to English)
- **Voice input** — Browser-based speech recognition via Web Speech API
- **Modern UI** — Dark/light theme, responsive design, chat persistence
- **Booking confirmation** — Confirms search parameters before showing results

## Architecture

```
User (Text/Voice) → Frontend (HTML/JS) → FastAPI Backend
                                              │
                    ┌─────────────────────────┤
                    ▼                         ▼
              Translation              Intent Classification
              (Ollama)                    (Ollama)
                    │                         │
                    ▼                         ▼
              ┌─────────────┬─────────────┬──────────┐
              │  Booking    │  RAG Query  │  Chat    │
              │  Flow       │  (FAISS +   │  Support │
              │  (Slots)    │   Ollama)   │          │
              └──────┬──────┴──────┬──────┴──────────┘
                     ▼             ▼
              Mock Services   Knowledge Base
              (Flight/Train   (30+ travel facts)
               /Bus search)
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python 3.10) |
| LLM | Ollama (llama3, local) |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Vector DB | FAISS (IndexFlatL2) |
| Frontend | Vanilla HTML/CSS/JS |
| Voice | Web Speech API |

All tools are 100% free and open-source.

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

### Run Tests

```bash
pytest tests/ -v
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serves the chat UI |
| POST | `/chat` | Main conversation endpoint |
| GET | `/health` | Health check (API, Ollama, RAG status) |

### POST /chat

```json
// Request
{
  "user_id": "user_abc123",
  "message": "Book a flight from Delhi to Mumbai"
}

// Response
{
  "reply": "I need the following details: travel date",
  "data": null
}
```

## Project Structure

```
travel-ai-agent/
├── app/
│   ├── main.py              # FastAPI app + CORS + static files
│   ├── config.py             # Environment config + logging
│   ├── api/
│   │   ├── chat.py           # POST /chat endpoint
│   │   └── health.py         # GET /health endpoint
│   ├── core/
│   │   ├── intent_router.py  # Intent classification (Ollama)
│   │   ├── slot_manager.py   # Booking slot extraction + validation
│   │   ├── state_manager.py  # Thread-safe conversation state
│   │   └── rate_limiter.py   # Request rate limiting
│   ├── services/
│   │   ├── llm_service.py    # Structured entity extraction
│   │   ├── translation_service.py  # Multilingual translation
│   │   ├── flight_service.py # Mock flight search
│   │   ├── train_service.py  # Mock train search
│   │   └── bus_service.py    # Mock bus search
│   └── rag/
│       └── knowledge_base/
│           ├── embedding_service.py  # Sentence embeddings
│           ├── vector_store.py       # FAISS vector search
│           ├── rag_pipeline.py       # RAG orchestration
│           └── travel_docs.txt       # Knowledge base
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       └── voice.js
├── tests/
│   ├── test_slot_manager.py
│   ├── test_services.py
│   └── test_state_manager.py
├── docs/
│   └── PROJECT_PLAN.md
├── requirements.txt
├── .env
└── .gitignore
```
