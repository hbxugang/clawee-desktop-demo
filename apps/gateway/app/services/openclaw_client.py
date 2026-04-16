import httpx


async def fetch_time(openclaw_base_url: str) -> str:
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(f"{openclaw_base_url}/time")
        response.raise_for_status()
        return response.json()["time"]
