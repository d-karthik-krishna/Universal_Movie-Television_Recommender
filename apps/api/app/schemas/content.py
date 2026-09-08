from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from uuid import UUID

class ContentBase(BaseModel):
    id: UUID
    content_type: str
    title: str
    original_title: Optional[str] = None
    overview: Optional[str] = None
    release_date: Optional[date] = None
    popularity: Optional[float] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    original_language: Optional[str] = None
    
    class Config:
        from_attributes = True

class ContentResponse(BaseModel):
    results: List[ContentBase]
    total_results: int
