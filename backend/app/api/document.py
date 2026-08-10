from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.services.pdf_service import PDFService
from app.db.session import get_db

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    document = await PDFService.upload_pdf(file=file, db=db)

    return {"id": document.id, "filename": document.original_filename}


@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    return PDFService.get_all_documents(db=db)


@router.get("/{document_id}")
async def get_document(document_id: UUID, db: Session = Depends(get_db)):
    return await PDFService.get_document(document_id=document_id, db=db)


@router.delete("/{document_id}")
async def delete_document(document_id: UUID, db: Session = Depends(get_db)):
    return await PDFService.delete_document(document_id=document_id, db=db)
