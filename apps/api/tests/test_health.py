import pytest
from app.schemas.health import HealthResponse

@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/api/v1/health/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    
@pytest.mark.asyncio
async def test_health_response_schema(client):
    response = await client.get("/api/v1/health/")
    HealthResponse(**response.json())
