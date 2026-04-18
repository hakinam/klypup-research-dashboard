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
            "content": """You are a financial research assistant. 
            When given a query, use the available tools to gather data.
            Always call the relevant tools first before writing your analysis.
            After gathering data, return a JSON response with this exact structure:
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
                        "sentiment": "positive/negative/neutral",
                        "key_insights": ["insight 1", "insight 2"],
                        "risks": ["risk 1", "risk 2"]
                    }
                ],
                "news_highlights": [
                    {
                        "title": "Article title",
                        "sentiment": "positive/negative/neutral",
                        "source": "Source name"
                    }
                ],
                "risk_assessment": "Overall risk paragraph",
                "recommendation": "Buy/Hold/Sell with reasoning",
                "sources": ["Yahoo Finance", "NewsAPI"]
            }
            Return ONLY the JSON, no extra text."""
        },
        {
            "role": "user",
            "content": query
        }
    ]

    # Step 1 — First call: agent decides which tools to use
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        max_tokens=4096
    )

    response_message = response.choices[0].message

    # Step 2 — Run all the tools the agent asked for
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

        # Run each tool and add results to messages
        for tool_call in response_message.tool_calls:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)
            tool_result = run_tool(tool_name, tool_args)

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": tool_result
            })

    # Step 3 — Final call: agent synthesizes everything into structured output
    final_response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=4096
    )

    raw = final_response.choices[0].message.content

    # Parse JSON response
    try:
        # Clean up if model adds markdown backticks
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        result = json.loads(raw)
    except Exception:
        result = {"summary": raw, "companies": [], "news_highlights": [], "sources": []}

    return result