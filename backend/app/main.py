from fastapi import FastAPI
from app.api.document import router as document_router
from app.api.analysis import router as analysis_router

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "running!"}


app.include_router(document_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
