import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.tools.vector_tool import add_document

documents = [
    {
        "id": "aapl-q4-2024",
        "text": """Apple Inc Q4 2024 Earnings Report Summary.
        Apple reported quarterly revenue of $94.9 billion, up 6% year over year.
        iPhone revenue was $46.2 billion, Services revenue reached a record $24.2 billion.
        CEO Tim Cook highlighted strong growth in emerging markets especially India.
        Gross margin was 46.2%, the highest in company history.
        Apple Intelligence AI features drove significant upgrade cycles.
        The company returned over $29 billion to shareholders through dividends and buybacks.
        EPS came in at $1.64, beating analyst estimates of $1.60.""",
        "metadata": {"company": "Apple", "symbol": "AAPL", "type": "earnings", "period": "Q4 2024", "source": "SEC Filing"}
    },
    {
        "id": "nvda-q3-2024",
        "text": """NVIDIA Corporation Q3 2024 Earnings Report Summary.
        NVIDIA reported record revenue of $35.1 billion, up 94% year over year.
        Data center revenue was $30.8 billion, driven by massive AI chip demand.
        CEO Jensen Huang said demand for Blackwell GPUs far exceeds supply.
        Gaming revenue was $3.3 billion, up 15% year over year.
        Net income was $19.3 billion with operating margin of 62%.
        NVIDIA announced next generation Blackwell Ultra architecture.
        The company expects Q4 revenue of approximately $37.5 billion.""",
        "metadata": {"company": "NVIDIA", "symbol": "NVDA", "type": "earnings", "period": "Q3 2024", "source": "SEC Filing"}
    },
    {
        "id": "tsla-q3-2024",
        "text": """Tesla Inc Q3 2024 Earnings Report Summary.
        Tesla reported revenue of $25.2 billion, up 8% year over year.
        Vehicle deliveries reached 462,890 units, a new quarterly record.
        Energy generation and storage revenue was $2.4 billion, up 52%.
        CEO Elon Musk emphasized progress on Full Self Driving technology.
        Gross margin improved to 19.8% from 17.9% in the previous quarter.
        Tesla announced Cybercab robotaxi will begin production in 2026.
        The company ended the quarter with $33.6 billion in cash reserves.""",
        "metadata": {"company": "Tesla", "symbol": "TSLA", "type": "earnings", "period": "Q3 2024", "source": "SEC Filing"}
    },
    {
        "id": "msft-q1-2025",
        "text": """Microsoft Corporation Q1 2025 Earnings Report Summary.
        Microsoft reported revenue of $65.6 billion, up 16% year over year.
        Azure cloud revenue grew 33%, driven by AI services adoption.
        CEO Satya Nadella said Microsoft Copilot has 70,000 enterprise customers.
        Office 365 commercial revenue grew 13% with strong seat growth.
        Net income was $24.7 billion with earnings per share of $3.30.
        Microsoft invested $14.9 billion in capital expenditure for AI infrastructure.
        LinkedIn revenue grew 10% with record engagement metrics.""",
        "metadata": {"company": "Microsoft", "symbol": "MSFT", "type": "earnings", "period": "Q1 2025", "source": "SEC Filing"}
    },
    {
        "id": "googl-q3-2024",
        "text": """Alphabet Inc Q3 2024 Earnings Report Summary.
        Alphabet reported revenue of $88.3 billion, up 15% year over year.
        Google Search revenue was $49.4 billion, growing despite AI competition.
        YouTube advertising revenue reached $8.9 billion, up 12%.
        Google Cloud revenue was $11.4 billion, up 35% year over year.
        CEO Sundar Pichai highlighted Gemini AI integration across all products.
        Operating income was $28.5 billion with operating margin of 32%.
        Alphabet announced a $70 billion share buyback program.""",
        "metadata": {"company": "Alphabet", "symbol": "GOOGL", "type": "earnings", "period": "Q3 2024", "source": "SEC Filing"}
    }
]

def ingest_documents():
    print("Starting document ingestion into ChromaDB...")
    for doc in documents:
        result = add_document(doc["id"], doc["text"], doc["metadata"])
        if "error" in result:
            print(f"Error adding {doc['id']}: {result['error']}")
        else:
            print(f"Added: {doc['id']} - {doc['metadata']['company']} {doc['metadata']['period']}")
    print(f"\nDone! {len(documents)} documents added to ChromaDB.")
    print("The AI agent can now search through earnings reports.")

if __name__ == "__main__":
    ingest_documents()