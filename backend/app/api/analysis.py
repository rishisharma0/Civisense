from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.session import get_db
from app.services.analysis_service import AnalysisService
from app.models.analysis import Analysis

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/{document_id}")
async def start_analysis(document_id: UUID, db: Session = Depends(get_db)):
	return await AnalysisService.analyze_document(document_id=document_id, db=db)


@router.get("/{document_id}")
def get_analysis(document_id: UUID, db: Session = Depends(get_db)):
	analysis = db.query(Analysis).filter(Analysis.document_id == document_id).first()
	if not analysis:
		return {"detail": "Analysis not found"}

	return {
		"document_id": analysis.document_id,
		"overall_summary": analysis.overall_summary,
		"stakeholder_summary": analysis.stakeholder_summary,
		"consensus": analysis.consensus,
	}
