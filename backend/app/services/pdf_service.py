from datetime import datetime
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.document import Document

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class PDFService:
    @staticmethod
    async def upload_pdf(file: UploadFile, db: Session) -> Document:

        filename = f"{uuid4()}.pdf"
        filepath = UPLOAD_DIR / filename

        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF format allowed")

        content = await file.read()

        with open(filepath, "wb") as f:
            f.write(content)

        document = Document(
            filename=filename,
            original_filename=file.filename,
            file_path=str(filepath),
            uploaded_at=datetime.now(),
        )

        try:
            db.add(document)
            db.commit()
            db.refresh(document)
        except Exception:
            db.rollback()

            if filepath.exists():
                filepath.unlink()

        return document

    @staticmethod
    def get_all_documents(db: Session) -> list[dict]:
        documents = db.query(Document).all()
        return [
            {
                "document_id": document.id,
                "filename": document.filename,
                "uploaded_at": document.uploaded_at,
            }
            for document in documents
        ]

    @staticmethod
    async def get_document(document_id: UUID, db: Session) -> dict:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return {
            "document_id": document.id,
            "filename": document.filename,
            "uploaded_at": document.uploaded_at,
        }

    @staticmethod
    async def delete_document(document_id: UUID, db: Session) -> dict:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        file_path = Path(document.file_path)

        if file_path.exists():
            file_path.unlink()

        stmt = delete(Document).where(Document.id == document_id)
        db.execute(stmt)
        db.commit()
        return {"document_id": document.id, "filename": document.filename}
