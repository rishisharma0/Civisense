from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Text, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Comment(Base):
    __tablename__ = "comments"

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

    stakeholder_type: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    topic: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    raw_issue: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    canonical_issue: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    clause: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    sentiment: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    document = relationship(
        "Document",
        back_populates="comments",
    )