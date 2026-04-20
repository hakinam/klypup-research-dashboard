# Architecture Document — Klypup Research Dashboard

## 1. System Architecture Overview

┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Next.js Frontend (Port 3000)                │   │
│   │                                                          │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │   │
│   │  │  Login   │  │Dashboard │  │ Reports  │  │ Admin  │  │   │
│   │  │  Page    │  │  Home    │  │Watchlist │  │ Panel  │  │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │   │
│   │                    Axios API Client (lib/api.ts)         │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────┘
│ HTTP + JWT Token
▼
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              FastAPI Backend (Port 8000)                 │   │
│   │                                                          │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │   │
│   │  │  /auth   │  │/research │  │     /watchlist        │  │   │
│   │  │ signup   │  │  query   │  │   add/remove/list     │  │   │
│   │  │  login   │  │ reports  │  └──────────────────────┘  │   │
│   │  └──────────┘  │  chart   │                            │   │
│   │                └──────────┘                            │   │
│   │           Auth Middleware (deps.py)                     │   │
│   │         JWT Verification + Tenant Scoping               │   │
│   └─────────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────┬──────────────────────────────┘
│                      │
▼                      ▼
┌──────────────────┐   ┌──────────────────────────────────────────┐
│   DATA LAYER     │   │              AI LAYER                     │
│                  │   │                                           │
│  ┌────────────┐  │   │  ┌────────────────────────────────────┐  │
│  │   SQLite   │  │   │  │         AI Agent (agent.py)        │  │
│  │            │  │   │  │                                    │  │
│  │ users      │  │   │  │  1. Receive user query             │  │
│  │ orgs       │  │   │  │  2. Decide which tools to call     │  │
│  │ reports    │  │   │  │  3. Execute tools in parallel      │  │
│  │ watchlist  │  │   │  │  4. Synthesize structured output   │  │
│  └────────────┘  │   │  └──────────────┬───────────────────┘  │
│                  │   │                 │                        │
│  ┌────────────┐  │   │    ┌────────────┼────────────┐          │
│  │  ChromaDB  │  │   │    ▼            ▼            ▼          │
│  │            │  │   │ ┌──────┐  ┌─────────┐  ┌─────────┐    │
│  │ Earnings   │  │   │ │Stock │  │  News   │  │ Vector  │    │
│  │ Reports    │◄─┼───┼─│ Tool │  │  Tool   │  │  Tool   │    │
│  │ SEC Filings│  │   │ └──┬───┘  └────┬────┘  └────┬────┘    │
│  └────────────┘  │   │    │           │             │          │
└──────────────────┘   │    ▼           ▼             ▼          │
│ Yahoo      NewsAPI        ChromaDB       │
│ Finance    Free Tier      Local RAG      │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │     Groq API (Llama 3.3 70B)     │   │
│  │   Tool Calling + Synthesis        │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘

---

## 2. Data Flow Diagram

Complete journey of a research query from UI to response:
User types query in browser
│
▼
[Next.js Frontend]
handleQuery() called
axios POST /api/research/query
sends: { query, tags } + JWT token in header
│
▼
[FastAPI — Auth Middleware (deps.py)]
reads Authorization header
decodes JWT token
extracts user_id, org_id, role
fetches user from database
injects current_user into route handler
│
▼
[FastAPI — research.py route handler]
receives query + current_user
calls run_agent(query)
│
▼
[AI Agent — Step 1: Tool Planning]
sends query + tool definitions to Groq
Groq reads query and decides:
→ "I need stock data + news for this"
returns list of tool_calls
│
▼
[AI Agent — Step 2: Tool Execution]
for each tool_call from Groq:
┌─────────────────────────────────┐
│  get_stock_data("AAPL")         │
│  → calls yfinance               │
│  → returns price, market cap,   │
│    PE ratio, price history      │
├─────────────────────────────────┤
│  get_news("Apple", "AAPL")      │
│  → calls NewsAPI                │
│  → returns articles             │
│  → runs sentiment analysis      │
├─────────────────────────────────┤
│  search_documents("Apple")      │
│  → queries ChromaDB             │
│  → returns relevant chunks      │
│    from earnings reports        │
└─────────────────────────────────┘
│
▼
[AI Agent — Step 3: Synthesis]
sends all tool results back to Groq
Groq synthesizes into structured JSON:
{ summary, companies, news_highlights,
risk_assessment, recommendation, sources }
│
▼
[FastAPI — Save to Database]
creates ResearchReport record
sets org_id = current_user.org_id  ← tenant isolation
sets user_id = current_user.id
saves to SQLite
│
▼
[FastAPI — Return Response]
returns { report_id, query, result, created_at }
│
▼
[Next.js Frontend]
receives structured JSON result
renders: summary card, company cards,
stock charts, news list, recommendation
calls fetchReports() to update sidebar count

---

## 3. Database Schema
┌─────────────────────────────┐
│        organizations         │
├─────────────────────────────┤
│ id          INTEGER PK       │
│ name        STRING UNIQUE    │
│ invite_code STRING UNIQUE    │
│ created_at  DATETIME         │
└──────────────┬──────────────┘
│ 1
│ has many
│ ∞
┌──────────────▼──────────────┐     ┌─────────────────────────────┐
│           users              │     │      research_reports        │
├─────────────────────────────┤     ├─────────────────────────────┤
│ id             INTEGER PK    │     │ id          INTEGER PK       │
│ email          STRING UNIQUE │     │ title       STRING           │
│ name           STRING        │     │ query       TEXT             │
│ hashed_password STRING       │     │ result      TEXT (JSON)      │
│ role           STRING        │─┐   │ tags        STRING           │
│ org_id         FK → orgs     │ │   │ org_id      FK → orgs        │
│ created_at     DATETIME      │ │   │ user_id     FK → users       │
└─────────────────────────────┘ │   │ created_at  DATETIME         │
│   └─────────────────────────────┘
│
│   ┌─────────────────────────────┐
│   │          watchlist           │
│   ├─────────────────────────────┤
└──►│ id           INTEGER PK      │
│ symbol       STRING          │
│ company_name STRING          │
│ user_id      FK → users      │
│ org_id       FK → orgs       │
│ created_at   DATETIME        │
└─────────────────────────────┘

**Multi-tenancy enforcement:** Every table has `org_id`. Every query filters by `org_id = current_user.org_id`. Org A can never read Org B's data.

---

## 4. AI Agent Orchestration Flow
User Query: "Analyze Apple stock and recent news"
│
▼
┌─────────────────────────────────────────────────────┐
│              FIRST GROQ API CALL                     │
│                                                      │
│  Input:  user query + 3 tool definitions             │
│  Output: tool_calls = [                              │
│    { name: "get_stock_data", args: {symbol: "AAPL"}} │
│    { name: "get_news", args: {                       │
│        company_name: "Apple", symbol: "AAPL"}}       │
│  ]                                                   │
│                                                      │
│  KEY POINT: Agent decides which tools to call        │
│  based on query — NOT hardcoded sequence             │
└──────────────────┬──────────────────────────────────┘
│
┌─────────┴─────────┐
▼                   ▼
get_stock_data()      get_news()
├── yfinance API      ├── NewsAPI call
├── price: $270       ├── 5 articles fetched
├── market cap: 3.9T  ├── sentiment analysis
└── PE ratio: 34      └── overall: positive
│                   │
└─────────┬─────────┘
▼
┌─────────────────────────────────────────────────────┐
│              SECOND GROQ API CALL                    │
│                                                      │
│  Input:  original query + ALL tool results           │
│  Output: structured JSON analysis                    │
│  {                                                   │
│    "summary": "...",                                 │
│    "companies": [{                                   │
│      "name": "Apple",                               │
│      "current_price": 270.23,                       │
│      "sentiment": "positive",                        │
│      "key_insights": [...],                          │
│      "risks": [...]                                  │
│    }],                                               │
│    "recommendation": "Buy ...",                      │
│    "sources": ["Yahoo Finance", "NewsAPI"]           │
│  }                                                   │
└─────────────────────────────────────────────────────┘
│
▼
Rendered as structured UI
(not raw text/markdown)

**Fallback System:** If tool calling fails (Groq rate limit or format error), agent falls back to manual tool execution using keyword matching, then re-synthesizes. App never crashes.

---

## 5. Multi-Tenant Data Flow
HTTP Request arrives:
POST /api/research/query
Authorization: Bearer eyJhbGc...
│
▼
┌────────────────────────────────────────┐
│         deps.py — get_current_user()   │
│                                        │
│  1. Extract token from header          │
│  2. Decode JWT → { user_id: 1,         │
│                    org_id: 2,          │
│                    role: "admin" }     │
│  3. Fetch user from DB by user_id      │
│  4. Return user object                 │
└────────────────────┬───────────────────┘
│
▼
┌────────────────────────────────────────┐
│      research.py — route handler       │
│                                        │
│  current_user.org_id = 2              │
│                                        │
│  # Save report — always scoped to org  │
│  report = ResearchReport(              │
│      org_id = current_user.org_id,    │  ← Org A
│      user_id = current_user.id        │
│  )                                     │
│                                        │
│  # Fetch reports — always filtered     │
│  db.query(ResearchReport).filter(      │
│      org_id == current_user.org_id    │  ← Org A only
│  )                                     │
│                                        │
│  # Org B's data (org_id=3) is NEVER   │
│  # returned — impossible to access    │
└────────────────────────────────────────┘
Result: Org A sees only Org A data.
Org B sees only Org B data.
Same database, complete isolation.

---

## 6. API Design

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/auth/signup | No | Any | Create user + org or join org |
| POST | /api/auth/login | No | Any | Login, returns JWT token |
| POST | /api/research/query | Yes | Any | Run AI research query |
| GET | /api/research/reports | Yes | Any | Get org reports (tenant scoped) |
| GET | /api/research/reports/{id} | Yes | Any | Get single report (tenant check) |
| DELETE | /api/research/reports/{id} | Yes | Admin | Delete report (tenant check) |
| GET | /api/research/stock-chart | Yes | Any | Get price history for chart |
| GET | /api/watchlist/ | Yes | Any | Get watchlist (tenant scoped) |
| POST | /api/watchlist/ | Yes | Any | Add company to watchlist |
| DELETE | /api/watchlist/{id} | Yes | Any | Remove from watchlist |

**Auth:** All protected routes use `Depends(get_current_user)` middleware.
**Tenant scope:** All queries filter by `current_user.org_id`.
**Response format:** Consistent JSON with meaningful HTTP status codes.

---

## 7. Tech Stack Decisions

| Layer | Choice | Alternative Considered | Reason |
|-------|--------|----------------------|--------|
| Backend | FastAPI | Django, Flask | Async support, automatic docs, prior experience |
| Database | SQLite | PostgreSQL | Zero setup for 5-day timeline. PostgreSQL in production. |
| Frontend | Next.js | React CRA, Vue | Industry standard, built-in routing |
| AI | Groq Llama 3.3 70B | OpenAI GPT-4, Gemini | Completely free, 300+ tokens/sec, tool calling support |
| Vector DB | ChromaDB | Pinecone, Weaviate | Runs locally, no API key, easy Python integration |
| Stock Data | yfinance | Alpha Vantage, FMP | Free, no API key, real-time data |
| News | NewsAPI | RSS feeds, GDELT | Clean API, free tier, good documentation |
| Charts | Recharts | Chart.js, D3 | React-native, simple API |