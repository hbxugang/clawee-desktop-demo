import pytest

from app.services.openclaw_client import fetch_time


@pytest.mark.asyncio
async def test_fetch_time_uses_expected_request_contract(monkeypatch):
    captured: dict[str, object] = {}

    class FakeResponse:
        def raise_for_status(self) -> None:
            captured["raise_for_status_called"] = True

        def json(self) -> dict[str, str]:
            return {"time": "2026-04-16T02:00:00.000Z"}

    class FakeAsyncClient:
        def __init__(self, *, timeout: float) -> None:
            captured["timeout"] = timeout

        async def __aenter__(self) -> "FakeAsyncClient":
            captured["entered"] = True
            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            captured["exited"] = True

        async def get(self, url: str) -> FakeResponse:
            captured["url"] = url
            return FakeResponse()

    monkeypatch.setattr("app.services.openclaw_client.httpx.AsyncClient", FakeAsyncClient)

    result = await fetch_time("http://127.0.0.1:43120")

    assert result == "2026-04-16T02:00:00.000Z"
    assert captured["timeout"] == 5.0
    assert captured["url"] == "http://127.0.0.1:43120/time"
    assert captured["raise_for_status_called"] is True
