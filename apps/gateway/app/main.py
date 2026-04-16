import random

from fastapi import FastAPI

from app.core.config import resolve_openclaw_base_url
from app.schemas.demo import DemoSnapshot
from app.services.openclaw_client import fetch_time

app = FastAPI()


@app.get("/api/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/api/demo-snapshot", response_model=DemoSnapshot)
async def demo_snapshot() -> DemoSnapshot:
    time_value = await fetch_time(resolve_openclaw_base_url())
    return DemoSnapshot(time=time_value, random=random.randint(1, 1000))
