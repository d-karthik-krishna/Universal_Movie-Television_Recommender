import uuid
from typing import Optional
from pydantic import BaseModel, Field

class WatchlistAdd(BaseModel):
    tmdb_id: int
    media_type: str = Field(pattern="^(movie|tv)$")

class RatingSubmit(BaseModel):
    tmdb_id: int
    media_type: str = Field(pattern="^(movie|tv)$")
    rating: float = Field(ge=0.5, le=10.0, description="Rating from 0.5 to 10.0")
    review_text: Optional[str] = None

class HistoryAdd(BaseModel):
    tmdb_id: int
    media_type: str = Field(pattern="^(movie|tv)$")
    watch_duration: Optional[int] = None

class WatchedMark(BaseModel):
    tmdb_id: int
    media_type: str = Field(pattern="^(movie|tv)$")

class SeasonProgressUpdate(BaseModel):
    tmdb_id: int
    season_number: int
    watched_all: bool = False
    watched_episodes: list[int] = []
    total_episodes: int

class FavoriteMark(BaseModel):
    tmdb_id: int
    media_type: str = Field(pattern="^(movie|tv)$")
