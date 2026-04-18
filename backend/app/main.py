from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import engine
from app.models import models
from app.api.routes import auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Klypup Research Dashboard", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Klypup Research Dashboard API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}