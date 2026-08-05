from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analysis"

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
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    sentiment: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    keywords: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
    )

    clauses: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    consensus: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now,
        nullable=False,
    )

    document = relationship(
        "Document",
        back_populates="analyses",
    )
