import uuid
from sqlalchemy import String, Float, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin

class Person(TimestampMixin, Base):
    __tablename__ = "people"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    original_name: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_path: Mapped[str | None] = mapped_column(String, nullable=True)
    known_for_department: Mapped[str | None] = mapped_column(String, nullable=True)
    popularity: Mapped[float | None] = mapped_column(Float, nullable=True)

class ContentPerson(Base):
    __tablename__ = "content_people"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content.id"), nullable=False)
    person_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    character_name: Mapped[str | None] = mapped_column(String, nullable=True)
    display_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    __table_args__ = (
        UniqueConstraint("content_id", "person_id", "role", name="uq_content_person_role"),
    )
