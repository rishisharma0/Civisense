from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Integer, String, Text, func, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BatchJob(Base):
    __tablename__ = "batch_jobs"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="queued",  # queued, processing, completed, failed
    )

    total_files: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    processed_files: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    current_step: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Job queued",
    )

    document_ids: Mapped[list] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    batch_summary: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    documents = relationship(
        "Document",
        back_populates="batch_job",
    )
