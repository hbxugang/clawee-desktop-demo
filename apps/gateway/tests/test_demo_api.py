from fastapi.testclient import TestClient

from app.main import app


def test_demo_snapshot_returns_time_and_random(monkeypatch):
    async def fake_fetch_time(_: str) -> str:
        return "2026-04-16T02:00:00.000Z"

    monkeypatch.setenv("OPENCLAW_BASE_URL", "http://127.0.0.1:43120")
    monkeypatch.setattr("app.main.fetch_time", fake_fetch_time)
    monkeypatch.setattr("app.main.random.randint", lambda *_: 42)

    client = TestClient(app)
    response = client.get("/api/demo-snapshot")

    assert response.status_code == 200
    assert response.json() == {
        "time": "2026-04-16T02:00:00.000Z",
        "random": 42,
    }
