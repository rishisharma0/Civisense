from typing import List
from sqlalchemy.orm import Session

from app.models.comment import Comment


class CommentService:
    @staticmethod
    def create_comment(data: dict, document_id, db: Session) -> Comment:
        comment = Comment(
            document_id=document_id,
            stakeholder_type=data.get("stakeholder_type") or "Unknown",
            content=data.get("content") or "",
            topic=data.get("topic"),
            raw_issue=data.get("raw_issue"),
            canonical_issue=data.get("canonical_issue"),
            clause=data.get("clause"),
            sentiment=data.get("sentiment") or "neutral",
            recommendation=data.get("recommendation"),
        )

        db.add(comment)
        db.flush()
        return comment

    @staticmethod
    def create_comments(items: List[dict], document_id, db: Session) -> List[Comment]:
        created = []
        for it in items:
            created.append(CommentService.create_comment(it, document_id, db))

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise

        # refresh objects
        for c in created:
            db.refresh(c)

        return created

    @staticmethod
    def get_comments(document_id, db: Session):
        return db.query(Comment).filter(Comment.document_id == document_id).all()
