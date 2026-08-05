from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    filename: Mapped[str] = mapped_column(String(255), nullable=False)

    file_path: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    uploaded_at: Mapped[date] = mapped_column(DateTime, default=datetime.now)

    analyses = relationship(
        "Analysis", back_populates="document", cascade="all, delete-orphan"
    )
