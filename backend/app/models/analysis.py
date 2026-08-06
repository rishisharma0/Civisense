from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    document_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "documents.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,  # one analysis per document
    )

    overall_summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    stakeholder_summary: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    consensus: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    document = relationship(
        "Document",
        back_populates="analysis",
    )