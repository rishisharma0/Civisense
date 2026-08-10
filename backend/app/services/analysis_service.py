from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.analysis import Analysis
from app.models.document import Document
from app.services.extraction_service import ExtractionService
from app.services.llm_service import LLMService
from app.services.comment_service import CommentService


class AnalysisService:
	@staticmethod
	async def analyze_document(document_id: UUID, db: Session) -> dict:
		document = db.query(Document).filter(Document.id == document_id).first()
		if not document:
			raise HTTPException(status_code=404, detail="Document not found")

		# 1. Extract text and split into chunks
		chunks = await ExtractionService.extract_text(document.file_path)

		# 2. Use LLM to extract structured comments
		comments = await LLMService.extract_comments(chunks)

		# 3. Persist comments
		created_comments = CommentService.create_comments(comments, document.id, db)

		# 4. High-level analysis
		overall = await LLMService.generate_summary(comments)
		stakeholder_summary = await LLMService.generate_stakeholder_summary(comments)
		consensus = await LLMService.generate_consensus(comments)

		# 5. Save Analysis record (one-to-one with document)
		analysis = Analysis(
			document_id=document.id,
			overall_summary=overall or "",
			stakeholder_summary=stakeholder_summary or {},
			consensus=consensus or {},
		)

		try:
			db.add(analysis)
			db.commit()
			db.refresh(analysis)
		except Exception:
			db.rollback()
			raise HTTPException(status_code=500, detail="Failed to save analysis")

		return {"document_id": document.id, "status": "analysis_completed"}
