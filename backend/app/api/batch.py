from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.batch import BatchJobListItem, BatchStatusResponse, BatchUploadResponse
from app.services.batch_service import BatchService

router = APIRouter(prefix="/batch", tags=["batch"])


@router.post("/upload", response_model=BatchUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_batch(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Accepts multiple PDF consultation documents (e.g. 2-5 PDFs).
    Immediately creates a BatchJob and dispatches background processing,
    avoiding HTTP gateway timeouts and respecting free-tier API limits.
    """
    batch_job = await BatchService.create_batch_job(files=files, db=db)

    # Dispatch asynchronous background worker
    background_tasks.add_task(BatchService.process_batch_job, batch_job.id)

    return {
        "job_id": batch_job.id,
        "status": batch_job.status,
        "total_files": batch_job.total_files,
        "message": f"Successfully queued {batch_job.total_files} files for batch analysis",
        "created_at": batch_job.created_at,
    }


@router.post("/process-pending", response_model=BatchUploadResponse, status_code=status.HTTP_202_ACCEPTED)
async def process_pending_submissions(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Government official batch trigger:
    Gathers all citizen/stakeholder submissions stored in DB that have not yet been analyzed,
    creates a BatchJob, and runs throttled batch processing in the background.
    """
    batch_job = BatchService.create_batch_from_pending(db=db)

    # Dispatch asynchronous background worker
    background_tasks.add_task(BatchService.process_batch_job, batch_job.id)

    return {
        "job_id": batch_job.id,
        "status": batch_job.status,
        "total_files": batch_job.total_files,
        "message": f"Successfully initiated batch processing for {batch_job.total_files} pending citizen submissions",
        "created_at": batch_job.created_at,
    }


@router.get("/pending")
def get_pending_submissions(db: Session = Depends(get_db)):
    """Fetch count and list of unanalyzed citizen submissions waiting for official review."""
    pending_docs = BatchService.get_pending_documents(db=db)
    return {
        "pending_count": len(pending_docs),
        "documents": [
            {
                "document_id": d.id,
                "filename": d.original_filename,
                "status": d.status,
                "uploaded_at": d.uploaded_at,
            }
            for d in pending_docs
        ],
    }


@router.get("/{job_id}/status", response_model=BatchStatusResponse)
def get_batch_status(job_id: UUID, db: Session = Depends(get_db)):
    """Check the real-time processing progress of a batch job."""
    return BatchService.get_batch_status(batch_id=job_id, db=db)


@router.get("/", response_model=list[BatchJobListItem])
def list_batches(db: Session = Depends(get_db)):
    """List recent batch analysis jobs."""
    return BatchService.list_batches(db=db)
