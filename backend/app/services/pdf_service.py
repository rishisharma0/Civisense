from uuid import uuid4
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.document import Document
from fastapi import Depends, UploadFile, File

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

class PDFService:

    @staticmethod
    async def upload_pdf(file: UploadFile, db: Session) -> Document:

        filename=f"{uuid4()}.pdf"
        filepath=UPLOAD_DIR/filename
        content = await file.read()

        with open(filepath, "wb") as f:
            f.write(content)

        document = Document(
            filename=filename,
            original_filename=file.filename,
            file_path=str(filepath),
            uploaded_at=datetime.now(),
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return document
