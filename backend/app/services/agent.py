import json
from groq import Groq
from app.core.config import settings
from app.tools.stock_tool import get_stock_data
from app.tools.news_tool import get_news
from app.tools.vector_tool import search_documents

client = Groq(api_key=settings.GROQ_API_KEY)

# These are the tools we tell the AI it can use
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_data",
            "description": "Get real time stock price, market cap, PE ratio, revenue and price history for a company",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": "Stock ticker symbol e.g. AAPL, NVDA, TSLA"
                    }
                },
                "required": ["symbol"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": "Get latest news articles and sentiment analysis for a company",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_name": {
                        "type": "string",
                        "description": "Full company name e.g. Apple, NVIDIA, Tesla"
                    },
                    "symbol": {
                        "type": "string",
                        "description": "Stock ticker symbol e.g. AAPL, NVDA, TSLA"
                    }
                },
                "required": ["company_name", "symbol"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Search through SEC filings, earnings reports and financial documents",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "What to search for in the documents"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

def run_tool(tool_name: str, tool_args: dict) -> str:
    if tool_name == "get_stock_data":
        result = get_stock_data(tool_args["symbol"])
    elif tool_name == "get_news":
        result = get_news(tool_args["company_name"], tool_args["symbol"])
    elif tool_name == "search_documents":
        result = search_documents(tool_args["query"])
    else:
        result = {"error": f"Unknown tool: {tool_name}"}
    return json.dumps(result)

def run_agent(query: str) -> dict:
    messages = [
        {
            "role": "system",
            "content": """You are a financial research assistant with access to tools.
You MUST call the relevant tools to get real data before responding.
- For stock questions: call get_stock_data
- For news questions: call get_news
- For filings/documents: call search_documents
- For general company queries: call both get_stock_data AND get_news

After getting tool results, respond with ONLY a valid JSON object:
{
    "summary": "2-3 sentence overview",
    "companies": [
        {
            "name": "Company Name",
            "symbol": "TICKER",
            "current_price": 123.45,
            "market_cap": "1.2T",
            "pe_ratio": 25.3,
            "price_change_30d": "+5.2%",
            "sentiment": "positive",
            "key_insights": ["insight 1", "insight 2"],
            "risks": ["risk 1", "risk 2"]
        }
    ],
   "news_highlights": [
        {
            "title": "Article title",
            "sentiment": "positive",
            "source": "Source name"
        }
    ],   
    "risk_assessment": "Overall risk paragraph",
    "recommendation": "Buy/Hold/Sell with reasoning",
    "sources": ["Yahoo Finance", "NewsAPI"]
}
Do NOT include any text outside the JSON. No markdown, no backticks."""
        },
        {
            "role": "user",
            "content": query
        }
    ]

    try:
        # First attempt with tool calling
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=tools,
            tool_choice="auto",
            max_tokens=4096
        )

        response_message = response.choices[0].message

        if response_message.tool_calls:
            messages.append({
                "role": "assistant",
                "content": response_message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in response_message.tool_calls
                ]
            })

            for tool_call in response_message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)
                tool_result = run_tool(tool_name, tool_args)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result
                })

        final_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=4096
        )

    except Exception:
        # Fallback — call tools manually based on query keywords
        query_lower = query.lower()
        tool_results = []

        # Extract company symbols from query
        common = {
            "apple": "AAPL", "nvidia": "NVDA", "tesla": "TSLA",
            "microsoft": "MSFT", "google": "GOOGL", "alphabet": "GOOGL",
            "amazon": "AMZN", "meta": "META", "netflix": "NFLX",
            "blackrock": "BLK", "jpmorgan": "JPM", "ford": "F",
            "amd": "AMD", "intel": "INTC", "samsung": "SSNLF"
        }

        symbol = None
        company_name = None
        for name, sym in common.items():
            if name in query_lower:
                symbol = sym
                company_name = name.capitalize()
                break

        if symbol:
            stock_result = run_tool("get_stock_data", {"symbol": symbol})
            tool_results.append(f"Stock data: {stock_result}")
            news_result = run_tool("get_news", {"company_name": company_name, "symbol": symbol})
            tool_results.append(f"News data: {news_result}")

        doc_result = run_tool("search_documents", {"query": query})
        tool_results.append(f"Document data: {doc_result}")

        fallback_messages = [
            {
                "role": "system",
                "content": """Analyze the following financial data and respond with ONLY valid JSON:
{
    "summary": "2-3 sentence overview",
    "companies": [{"name": "...", "symbol": "...", "current_price": 0, "market_cap": "...", "pe_ratio": 0, "price_change_30d": "...", "sentiment": "positive", "key_insights": [], "risks": []}],
    "news_highlights": [{"title": "...", "sentiment": "positive", "source": "..."}],
    "risk_assessment": "...",
    "recommendation": "...",
    "sources": ["Yahoo Finance", "NewsAPI"]
}"""
            },
            {
                "role": "user",
                "content": f"Query: {query}\n\nData:\n" + "\n".join(tool_results)
            }
        ]

        final_response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=fallback_messages,
            max_tokens=4096
        )

    raw = final_response.choices[0].message.content

    try:
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)
    except Exception:
        result = {
            "summary": raw,
            "companies": [],
            "news_highlights": [],
            "sources": []
        }

    return result