from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import get_db
from app.models.models import Watchlist, User
from app.api.routes.deps import get_current_user

router = APIRouter()

class WatchlistRequest(BaseModel):
    symbol: str
    company_name: str

@router.post("/")
def add_to_watchlist(
    request: WatchlistRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(Watchlist).filter(
        Watchlist.symbol == request.symbol.upper(),
        Watchlist.org_id == current_user.org_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")

    item = Watchlist(
        symbol=request.symbol.upper(),
        company_name=request.company_name,
        user_id=current_user.id,
        org_id=current_user.org_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Added to watchlist", "item": {"id": item.id, "symbol": item.symbol}}

@router.get("/")
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(Watchlist).filter(
        Watchlist.org_id == current_user.org_id
    ).all()

    return [
        {"id": i.id, "symbol": i.symbol, "company_name": i.company_name}
        for i in items
    ]

@router.delete("/{item_id}")
def remove_from_watchlist(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(Watchlist).filter(
        Watchlist.id == item_id,
        Watchlist.org_id == current_user.org_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}