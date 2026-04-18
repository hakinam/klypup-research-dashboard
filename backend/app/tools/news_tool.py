import httpx
from app.core.config import settings

POSITIVE_WORDS = ["surge", "record", "beat", "growth", "profit", "gain", "rise", "up", "strong", "exceed"]
NEGATIVE_WORDS = ["fall", "drop", "miss", "loss", "decline", "down", "weak", "cut", "layoff", "crash"]

def analyze_sentiment(text: str) -> str:
    text_lower = text.lower()
    positive_count = sum(1 for word in POSITIVE_WORDS if word in text_lower)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in text_lower)
    
    if positive_count > negative_count:
        return "positive"
    elif negative_count > positive_count:
        return "negative"
    else:
        return "neutral"

def get_news(company_name: str, symbol: str) -> dict:
    try:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": f"{company_name} OR {symbol}",
            "sortBy": "publishedAt",
            "pageSize": 5,
            "language": "en",
            "apiKey": settings.NEWS_API_KEY
        }
        
        response = httpx.get(url, params=params, timeout=10)
        data = response.json()
        
        articles = []
        for article in data.get("articles", []):
            title = article.get("title", "")
            description = article.get("description", "")
            sentiment = analyze_sentiment(f"{title} {description}")
            
            articles.append({
                "title": title,
                "description": description,
                "url": article.get("url"),
                "published_at": article.get("publishedAt"),
                "source": article.get("source", {}).get("name"),
                "sentiment": sentiment
            })
        
        overall_sentiments = [a["sentiment"] for a in articles]
        positive = overall_sentiments.count("positive")
        negative = overall_sentiments.count("negative")
        
        if positive > negative:
            overall = "positive"
        elif negative > positive:
            overall = "negative"
        else:
            overall = "neutral"

        return {
            "company": company_name,
            "articles": articles,
            "overall_sentiment": overall,
            "total_articles": len(articles),
            "source": "NewsAPI"
        }
    except Exception as e:
        return {"error": str(e), "company": company_name}