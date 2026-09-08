import uuid
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class Language(Base):
    __tablename__ = "languages"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    iso_639_1: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    english_name: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str | None] = mapped_column(String, nullable=True)

class ContentLanguage(Base):
    __tablename__ = "content_languages"
    
    content_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content.id"), primary_key=True)
    language_id: Mapped[int] = mapped_column(Integer, ForeignKey("languages.id"), primary_key=True)
