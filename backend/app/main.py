from fastapi import FastAPI
from app.api.document import router as document_router

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "running!"}

app.include_router(
    document_router,
    prefix="/api/v1"
)
