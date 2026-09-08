from fastapi import APIRouter
from app.api.v1 import health, content, auth, user_actions, recommendations

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user_actions.router, prefix="/user", tags=["user"])
api_router.include_router(content.router, prefix="/content", tags=["content"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
