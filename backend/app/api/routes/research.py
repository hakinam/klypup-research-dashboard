import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import get_db
from app.models.models import ResearchReport, User
from app.api.routes.deps import get_current_user
from app.services.agent import run_agent
import yfinance as yf


router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    tags: str = ""

@router.post("/query")
def run_research_query(
    request: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Run the AI agent
    result = run_agent(request.query)

    # Save to database
    report = ResearchReport(
        title=request.query[:100],
        query=request.query,
        result=json.dumps(result),
        tags=request.tags,
        org_id=current_user.org_id,
        user_id=current_user.id
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "report_id": report.id,
        "query": request.query,
        "result": result,
        "created_at": report.created_at
    }

@router.get("/reports")
def get_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only get reports from current user's org - this is multi tenancy!
    reports = db.query(ResearchReport).filter(
        ResearchReport.org_id == current_user.org_id
    ).order_by(ResearchReport.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "query": r.query,
            "tags": r.tags,
            "created_at": r.created_at
        }
        for r in reports
    ]

@router.get("/reports/{report_id}")
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.org_id == current_user.org_id  # tenant check!
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "id": report.id,
        "title": report.title,
        "query": report.query,
        "result": json.loads(report.result),
        "tags": report.tags,
        "created_at": report.created_at
    }

@router.delete("/reports/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(ResearchReport).filter(
        ResearchReport.id == report_id,
        ResearchReport.org_id == current_user.org_id  # tenant check!
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}

@router.get("/stock-chart")
def get_stock_chart(
    ticker: str = Query(..., min_length=1),
    period: str = Query("1mo")
):
    allowed_periods = {"5d", "1mo", "3mo", "6mo", "1y"}
    if period not in allowed_periods:
        raise HTTPException(status_code=400, detail="Invalid period")

    stock = yf.Ticker(ticker.upper())
    history = stock.history(period=period)

    if history.empty:
        raise HTTPException(status_code=404, detail="No stock data found")

    chart_data = []
    for date, row in history.iterrows():
        close_price = row.get("Close")
        if close_price is not None:
            chart_data.append({
                "date": date.strftime("%Y-%m-%d"),
                "close": round(float(close_price), 2)
            })

    return {
        "ticker": ticker.upper(),
        "period": period,
        "data": chart_data
    }
