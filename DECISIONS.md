# DECISIONS
## 1. Which option did I choose and why?

I chose **Option A: Investment Research Dashboard**.

I picked this option because it was the best fit for demonstrating applied AI inside a real product workflow. It allowed me to combine authentication, multi tenant data isolation, external APIs, structured UI rendering, and LLM tool orchestration in one end to end system. I also liked that the problem naturally required AI to act as a feature inside the product rather than just a chatbot interface.

---

## 2. Why this tech stack?

### Backend — FastAPI
I chose FastAPI because it is fast to develop with, easy to structure, and works well for AI oriented backend services. It also gives automatic API documentation through Swagger, which helped during development and testing.

### Frontend — Next.js + React
I used Next.js with React because it provides a clean modern frontend stack with good developer ergonomics, simple routing, and flexible UI composition. Since the assessment required a real product interface rather than just API endpoints, React made it easy to build structured, component like dashboard views.

### Database — SQLite
I chose SQLite for speed and simplicity. Since the assessment timeline was 5 days, SQLite let me focus on product features instead of database setup and deployment complexity. For a production system, I would move this to PostgreSQL.

### AI / LLM — Groq (Llama 3.3 70B)
I used Groq because it offered a free and fast inference option with tool calling support. That made it possible to build an agentic workflow without adding significant cost during development. The main tradeoff is free tier rate limits.

### Vector Store — ChromaDB
I chose ChromaDB because it runs locally, is easy to integrate with Python, and fits well for a demo RAG workflow. It allowed me to build document search without needing a hosted vector database.

### External Data Sources
- **Yahoo Finance / yfinance** for stock and market data
- **NewsAPI** for recent news and sentiment
- **ChromaDB document search** for earnings reports and filing-style content

These sources were selected because they were fast to integrate and sufficient for a working prototype.

---

## 3. How did I approach multi-tenancy?

I used a simple and explicit **shared database, row level tenant isolation** pattern.

Each organization has an `id`, and tenant owned data is associated with an `org_id`. The authenticated user carries organization context through the JWT and through the resolved `current_user` object. Protected routes then scope database reads and writes to `current_user.org_id`.

### Why I chose this pattern
I chose this because it is the simplest correct multi-tenant pattern for a project of this size and timeline. It is easy to reason about, easy to demonstrate, and directly shows that I understand how tenant isolation works in product systems.

### How it is enforced
- Users belong to an organization
- Reports are saved with `org_id`
- Watchlist items are saved with `org_id`
- Queries for reports and watchlist filter by `current_user.org_id`
- Invite codes allow multiple users to join the same organization and share the same workspace

### Tradeoff
This is not the most advanced tenant architecture, but it is appropriate for a small to medium product and works well for a demo. In a larger production environment, I would consider stronger auditing, stricter backend RBAC, and possibly schema level isolation depending on scale and compliance needs.

---

## 4. How did I design the AI integration?

The AI is designed as a **tool using research agent**, not as a plain prompt-response chatbot.

The flow is:
1. User submits a natural-language research query
2. The backend sends the query and tool definitions to the model
3. The model decides which tools it needs
4. The backend executes those tools
5. Tool results are sent back to the model
6. The model returns structured JSON
7. The frontend renders that JSON as cards, charts, metrics, and sentiment sections

### Why I did it this way
This design aligns directly with the assessment’s requirement that AI should act as an integrated product feature and should orchestrate external tools depending on user intent.

### Prompt engineering decisions
I explicitly instructed the model to:
- use the relevant tools before answering
- output only valid JSON
- return a fixed structured schema
- include summaries, company objects, news highlights, risks, recommendations, and sources

This helped reduce hallucinated formatting and made the frontend rendering predictable.

### Fallback behavior
I also added fallback behavior for failure scenarios such as rate limits or tool-calling issues. The goal was to degrade gracefully instead of crashing the app.

---

## 5. What tradeoffs did I make given the 5-day timeline?

The biggest tradeoff was optimizing for a **working end to end product** instead of production grade completeness.

### Examples of deliberate tradeoffs
- Used SQLite instead of PostgreSQL
- Used lightweight keyword based sentiment instead of a dedicated sentiment model
- Used synthetic/sample financial documents instead of a large real ingestion pipeline
- Focused on core flows before advanced CRUD/search polish
- Prioritized local setup over deployment and infrastructure automation
- Kept backend architecture simple and readable rather than over-engineered

### Why
Given the assessment constraints, I believed a strong working application with clear architecture would be more valuable than partially implemented ambitious features.

---

## 6. What would I improve with 2 more weeks?

If I had more time, I would focus on:

1. **Stronger report management**
   - add report editing, search, and filtering
   - improve report detail views

2. **Better source attribution**
   - attach visible source references closer to each displayed metric or insight
   - improve citation clarity in the UI

3. **Production-grade persistence**
   - migrate to PostgreSQL
   - add migrations and indexing strategy

4. **Stronger backend RBAC**
   - move more permission rules from UI assumptions into explicit backend enforcement

5. **Testing**
   - unit tests for auth, tenant isolation, and tool functions
   - API integration tests

6. **Performance and reliability**
   - caching repeated requests
   - handling API quotas more gracefully
   - adding retry and timeout strategies

7. **Deployment**
   - deploy frontend and backend
   - add environment specific configuration
   - optionally containerize with Docker Compose

---

## 7. What was the hardest part and how did I solve it?

The hardest part was making the AI output reliably structured and useful while integrating multiple data sources with a limited timeline.

There were two challenges:
1. Ensuring the model used tools instead of answering generically
2. Ensuring the frontend received structured output it could render consistently

I solved this by:
- defining clear tool schemas
- explicitly instructing the model to call tools first
- forcing a strict JSON output structure
- adding fallback behavior when tool calling or rate limits caused failures
- keeping the rendered frontend structure tightly aligned with the backend response shape

Another practical challenge was balancing product quality with speed. I solved that by prioritizing the core user workflow first: authentication, research query, structured result rendering, tenant isolation, persistence, and dashboard usability.

---

## 8. Final reflection

My main goal was to build something that feels like a real product rather than a demo script. The result is a working AI-powered research dashboard with authentication, multi-tenancy, persistence, tool orchestration, watchlists, charts, and structured output. If I continued this project, the next step would be to strengthen production readiness and documentation while preserving the simplicity of the current design.
