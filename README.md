# Klypup Research Dashboard 🚀

An AI-powered investment research platform that lets analysts research any company in seconds. Built for the Klypup Applied AI Intern Assessment.

![Dashboard Preview](screenshots/dashboard.png)

## What it does

Type any research query like *"Analyze NVIDIA's stock and recent news"* and the AI agent automatically:
- Fetches real-time stock data from Yahoo Finance
- Gets latest news articles with sentiment analysis
- Searches through earnings reports and SEC filings
- Synthesizes everything into a structured analysis with insights, risks, and recommendations

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | FastAPI (Python) | Fast, async, great for AI workloads |
| Database | SQLite | Zero setup, file-based, perfect for demo |
| Frontend | Next.js + React | Modern, fast, great developer experience |
| AI/LLM | Groq (Llama 3.3 70B) | Free, extremely fast, supports tool calling |
| Vector DB | ChromaDB | Local RAG, no external service needed |
| Stock Data | Yahoo Finance (yfinance) | Free, no API key required |
| News | NewsAPI | Free tier, 100 req/day |

## Features

- ✅ JWT Authentication (signup, login, logout)
- ✅ Multi-tenant architecture (org isolation via org_id)
- ✅ Role-based access control (Admin / Analyst)
- ✅ AI agent with 3 tools (stock, news, document search)
- ✅ Real-time stock data (price, market cap, P/E, EPS)
- ✅ News sentiment analysis (positive/negative/neutral)
- ✅ RAG document search (ChromaDB vector store)
- ✅ Saved research reports (full CRUD)
- ✅ Company watchlist
- ✅ Organization invite code system
- ✅ Source attribution on every AI insight
- ✅ Structured UI output (cards, badges, metrics)

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at console.groq.com)
- NewsAPI key (free at newsapi.org)

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
pip install -r requirements.txt
```

Create `.env` file:

GROQ_API_KEY=your_groq_key_here
NEWS_API_KEY=your_newsapi_key_here
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./research.db

Ingest sample documents:
```bash
python data/sample_docs.py
```

Start the backend:
```bash
uvicorn app.main:app --reload
```

Backend runs at http://127.0.0.1:8000
API docs at http://127.0.0.1:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Demo Workflows

### 1. AI Research Query
- Sign up and create an organization
- Type any company query in the search bar
- Watch the AI agent fetch real data and return structured analysis

### 2. Multi-Tenant Isolation
- Create two accounts with different organization names
- Run queries in each — reports are completely separate
- The invite code lets teammates join the same workspace

### 3. Role-Based Access
- Sign up as Admin to manage the workspace
- Sign up as Analyst to create and view research

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account + org |
| POST | /api/auth/login | Login and get JWT token |
| POST | /api/research/query | Run AI research query |
| GET | /api/research/reports | Get all saved reports |
| DELETE | /api/research/reports/{id} | Delete a report |
| GET | /api/watchlist/ | Get watchlist |
| POST | /api/watchlist/ | Add to watchlist |
| DELETE | /api/watchlist/{id} | Remove from watchlist |

## Known Limitations

- SQLite used instead of PostgreSQL (fine for demo, not for production)
- Sentiment analysis is keyword-based, not ML-based
- No real-time streaming of AI responses
- Sample financial documents are synthetic, not real SEC filings
- NewsAPI free tier limited to 100 requests/day

## Author

Innam Ul Haq — innamhaq7@gmail.com
