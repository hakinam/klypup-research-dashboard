import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.database import get_db
from app.models.models import User, Organization
from app.core.auth import hash_password, verify_password, create_access_token

router = APIRouter()

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    org_name: str
    invite_code: str = None
    role: str = "analyst"

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new org or join existing one
    if request.invite_code:
        org = db.query(Organization).filter(
            Organization.invite_code == request.invite_code
        ).first()
        if not org:
            raise HTTPException(status_code=404, detail="Invalid invite code")
    else:
        org = Organization(
            name=request.org_name,
            invite_code=generate_invite_code()
        )
        db.add(org)
        db.commit()
        db.refresh(org)

    # Create user
    user = User(
        email=request.email,
        name=request.name,
        hashed_password=hash_password(request.password),
        role=request.role,
        org_id=org.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({
        "sub": str(user.id),
        "org_id": org.id,
        "role": user.role
    })

    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        "org": {"id": org.id, "name": org.name, "invite_code": org.invite_code}
    }

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    org = db.query(Organization).filter(Organization.id == user.org_id).first()

    token = create_access_token({
        "sub": str(user.id),
        "org_id": user.org_id,
        "role": user.role
    })

    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        "org": {"id": org.id, "name": org.name, "invite_code": org.invite_code}
    }