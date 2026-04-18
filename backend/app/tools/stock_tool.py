import yfinance as yf
from datetime import datetime, timedelta

def get_stock_data(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get last 30 days of price history
        end = datetime.now()
        start = end - timedelta(days=30)
        history = ticker.history(start=start, end=end)
        
        # Build price history list
        price_history = []
        for date, row in history.iterrows():
            price_history.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })

        return {
            "symbol": symbol.upper(),
            "company_name": info.get("longName", symbol),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "revenue": info.get("totalRevenue"),
            "eps": info.get("trailingEps"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "price_history": price_history[-14:],  # last 14 days
            "source": "Yahoo Finance"
        }
    except Exception as e:
        return {"error": str(e), "symbol": symbol}