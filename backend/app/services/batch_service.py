import asyncio
from collections import Counter
from datetime import datetime
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.batch import BatchJob
from app.models.comment import Comment
from app.models.document import Document
from app.models.analysis import Analysis
from app.services.analysis_service import AnalysisService
from app.services.clustering_service import ClusteringService
from app.services.llm_service import LLMService


class BatchService:
    @staticmethod
    async def create_batch_job(files: list[UploadFile], db: Session) -> BatchJob:
        """Saves uploaded PDFs, creates Document records, and initializes a BatchJob."""
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files uploaded")

        if len(files) > 10:
            raise HTTPException(
                status_code=400, 
                detail="Batch size limited to 10 files to respect free-tier API rate limits",
            )

        # 1. Initialize BatchJob
        batch_job = BatchJob(
            id=uuid4(),
            status="queued",
            total_files=len(files),
            processed_files=0,
            current_step=f"Queued {len(files)} consultation documents for batch analysis",
            document_ids=[],
            created_at=datetime.utcnow(),
        )
        db.add(batch_job)
        db.flush()

        saved_doc_ids = []

        # 2. Save each uploaded file and associate with batch
        for file in files:
            if not file.filename or not file.filename.lower().endswith(".pdf"):
                continue

            unique_name = f"{uuid4()}.pdf"
            filepath = settings.UPLOAD_DIR / unique_name

            content = await file.read()
            if not content:
                continue

            with open(filepath, "wb") as f:
                f.write(content)

            doc = Document(
                id=uuid4(),
                batch_id=batch_job.id,
                filename=unique_name,
                original_filename=file.filename,
                file_path=str(filepath),
                uploaded_at=datetime.utcnow(),
            )
            db.add(doc)
            db.flush()
            saved_doc_ids.append(str(doc.id))

        if not saved_doc_ids:
            db.rollback()
            raise HTTPException(status_code=400, detail="No valid, readable PDF files were found in the upload")

        batch_job.document_ids = saved_doc_ids
        batch_job.total_files = len(saved_doc_ids)
        batch_job.current_step = f"{len(saved_doc_ids)} documents uploaded. Ready for processing."
        db.commit()
        db.refresh(batch_job)

        return batch_job

    @staticmethod
    def get_pending_documents(db: Session) -> list[Document]:
        """Finds all uploaded documents that have not yet been analyzed."""
        return (
            db.query(Document)
            .outerjoin(Analysis, Document.id == Analysis.document_id)
            .filter((Document.status == "pending") | (Analysis.id.is_(None)))
            .all()
        )

    @staticmethod
    def create_batch_from_pending(db: Session) -> BatchJob:
        """
        Collects all unprocessed citizen submissions stored in DB,
        and initializes a BatchJob for the government official to process.
        """
        pending_docs = BatchService.get_pending_documents(db)
        if not pending_docs:
            raise HTTPException(
                status_code=400,
                detail="No pending citizen consultation submissions to process",
            )

        batch_job = BatchJob(
            id=uuid4(),
            status="queued",
            total_files=len(pending_docs),
            processed_files=0,
            current_step=f"Queued {len(pending_docs)} pending citizen submissions for batch review",
            document_ids=[str(d.id) for d in pending_docs],
            created_at=datetime.utcnow(),
        )
        db.add(batch_job)
        db.flush()

        for doc in pending_docs:
            doc.batch_id = batch_job.id
            doc.status = "queued"

        db.commit()
        db.refresh(batch_job)
        return batch_job

    @staticmethod
    async def process_batch_job(batch_id: UUID):
        """
        Background task that sequentially processes each document in the batch,
        respecting Groq/HuggingFace free-tier rate limits with safety throttling.
        """
        db = SessionLocal()
        try:
            batch_job = db.query(BatchJob).filter(BatchJob.id == batch_id).first()
            if not batch_job:
                return

            batch_job.status = "processing"
            batch_job.current_step = "Starting batch processing pipeline..."
            db.commit()

            doc_uuids = [UUID(did) for did in batch_job.document_ids]
            total_docs = len(doc_uuids)

            for idx, doc_id in enumerate(doc_uuids, start=1):
                doc = db.query(Document).filter(Document.id == doc_id).first()
                doc_name = doc.original_filename if doc else f"Document {idx}"

                # Update progress state
                batch_job.current_step = (
                    f"Processing document {idx} of {total_docs}: '{doc_name}' "
                    f"(Extracting clauses & comments)..."
                )
                db.commit()

                # Run complete document analysis
                try:
                    await AnalysisService.analyze_document(document_id=doc_id, db=db)
                except Exception as doc_err:
                    # In batch mode, one failed document shouldn't crash the whole batch
                    print(f"Warning: Failed to process document {doc_id}: {doc_err}")

                batch_job.processed_files = idx
                batch_job.current_step = f"Completed analysis for '{doc_name}' ({idx}/{total_docs})."
                db.commit()

                # Free-tier rate limit guard: 1.5s delay between Groq/HuggingFace calls
                if idx < total_docs:
                    await asyncio.sleep(1.5)

            # --- Cross-Document Synthesis & Consensus Aggregation ---
            batch_job.current_step = "Synthesizing cross-document consensus and stakeholder insights..."
            db.commit()

            comments = db.query(Comment).filter(Comment.document_id.in_(doc_uuids)).all()

            if comments:
                # 1. Topic & Canonical Issue aggregation
                comment_dicts = [
                    {
                        "content": c.content,
                        "stakeholder_type": c.stakeholder_type,
                        "raw_issue": c.raw_issue,
                        "canonical_issue": c.canonical_issue,
                        "topic": c.topic,
                        "clause": c.clause,
                        "recommendation": c.recommendation,
                    }
                    for c in comments
                ]

                top_topics = ClusteringService.get_top_topics(comment_dicts, top_n=6)

                # 2. Stakeholder Breakdown
                stakeholder_counts = Counter(c.stakeholder_type for c in comments)
                stakeholder_breakdown = {
                    stype: count for stype, count in stakeholder_counts.most_common()
                }

                # 3. Sentiment Breakdown
                sentiment_counts = Counter(c.sentiment or "neutral" for c in comments)

                # 4. Canonical Issue Breakdown
                issue_counts = Counter(c.canonical_issue or "General Issue" for c in comments)
                top_issues = [
                    {"issue": issue, "count": count}
                    for issue, count in issue_counts.most_common(5)
                ]

                # 5. Consolidated consensus across all batch documents
                consensus_data = await LLMService.generate_consensus(comment_dicts)

                batch_job.batch_summary = {
                    "total_comments": len(comments),
                    "total_documents": total_docs,
                    "sentiment_distribution": dict(sentiment_counts),
                    "stakeholder_breakdown": stakeholder_breakdown,
                    "top_topics": top_topics,
                    "top_canonical_issues": top_issues,
                    "consensus": consensus_data,
                }
            else:
                batch_job.batch_summary = {
                    "total_comments": 0,
                    "total_documents": total_docs,
                    "sentiment_distribution": {},
                    "stakeholder_breakdown": {},
                    "top_topics": [],
                    "top_canonical_issues": [],
                    "consensus": {"agreements": [], "disagreements": [], "recommendations": []},
                }

            batch_job.status = "completed"
            batch_job.current_step = "Batch processing completed successfully!"
            batch_job.completed_at = datetime.utcnow()
            db.commit()

        except Exception as e:
            if batch_job:
                batch_job.status = "failed"
                batch_job.error_message = str(e)
                batch_job.current_step = f"Batch processing failed: {str(e)}"
                db.commit()
            print(f"Batch processing error: {e}")
        finally:
            db.close()

    @staticmethod
    def get_batch_status(batch_id: UUID, db: Session) -> dict:
        batch_job = db.query(BatchJob).filter(BatchJob.id == batch_id).first()
        if not batch_job:
            raise HTTPException(status_code=404, detail="Batch job not found")

        total = batch_job.total_files or 1
        pct = round((batch_job.processed_files / total) * 100.0, 1)

        doc_uuids = [UUID(did) for did in (batch_job.document_ids or [])]
        docs = db.query(Document).filter(Document.id.in_(doc_uuids)).all() if doc_uuids else []
        documents_list = [
            {
                "document_id": str(d.id),
                "filename": d.original_filename,
                "status": d.status,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in docs
        ]

        return {
            "job_id": batch_job.id,
            "status": batch_job.status,
            "total_files": batch_job.total_files,
            "processed_files": batch_job.processed_files,
            "progress_percentage": min(100.0, pct) if batch_job.status == "completed" else pct,
            "current_step": batch_job.current_step,
            "document_ids": doc_uuids,
            "documents": documents_list,
            "error_message": batch_job.error_message,
            "batch_summary": batch_job.batch_summary,
            "created_at": batch_job.created_at,
            "completed_at": batch_job.completed_at,
        }

    @staticmethod
    def list_batches(db: Session) -> list[dict]:
        batches = db.query(BatchJob).order_by(BatchJob.created_at.desc()).limit(20).all()
        return [
            {
                "job_id": b.id,
                "status": b.status,
                "total_files": b.total_files,
                "processed_files": b.processed_files,
                "current_step": b.current_step,
                "created_at": b.created_at,
                "completed_at": b.completed_at,
            }
            for b in batches
        ]
