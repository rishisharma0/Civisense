from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        unique=True,
    )

    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    comments = relationship(
        "Comment",
        back_populates="document",
        cascade="all, delete-orphan",
    )

    analysis = relationship(
        "Analysis",
        back_populates="document",
        uselist=False,
        cascade="all, delete-orphan",
    )