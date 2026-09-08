from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str

class ServiceHealthResponse(BaseModel):
    status: str
    service: str
    latency_ms: float | None
    error: str | None
