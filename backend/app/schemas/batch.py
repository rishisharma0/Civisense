from datetime import datetime
from uuid import UUID
from typing import Any
from pydantic import BaseModel, ConfigDict


class BatchUploadResponse(BaseModel):
    job_id: UUID
    status: str
    total_files: int
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BatchStatusResponse(BaseModel):
    job_id: UUID
    status: str
    total_files: int
    processed_files: int
    progress_percentage: float
    current_step: str
    document_ids: list[UUID] = []
    documents: list[dict[str, Any]] = []
    error_message: str | None = None
    batch_summary: dict[str, Any] | None = None
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BatchJobListItem(BaseModel):
    job_id: UUID
    status: str
    total_files: int
    processed_files: int
    current_step: str
    created_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
