from fastapi import APIRouter, UploadFile, File
from sqlalchemy.orm import Session
from app.services.pdf_service import PDFService
from app.db.session import get_db
from fastapi import Depends

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    document = await PDFService.upload_pdf(
        file=file,
        db=db,
    )

    return {
        "id": document.id,
        "filename": document.original_filename,
    }
