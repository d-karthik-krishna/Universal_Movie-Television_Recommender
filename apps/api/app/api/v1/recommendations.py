from typing import Annotated, Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.services.recommender import RecommendationEngine

router = APIRouter()

@router.get("/for-me")
async def get_for_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> Any:
    """
    Get highly personalized recommendations based on the user's
    watch history, ratings, and watchlist.
    """
    engine = RecommendationEngine(db)
    recommendations = await engine.get_personalized_recommendations(current_user.id)
    return {
        "results": recommendations,
        "total_results": len(recommendations)
    }
