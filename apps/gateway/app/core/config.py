from pathlib import Path
import json
import os


def resolve_openclaw_base_url() -> str:
    direct = os.environ.get("OPENCLAW_BASE_URL")
    if direct:
        return direct

    config_path = os.environ.get("CLAWEE_RUNTIME_CONFIG_PATH")
    if not config_path:
        raise RuntimeError("OPENCLAW_BASE_URL or CLAWEE_RUNTIME_CONFIG_PATH is required")

    payload = json.loads(Path(config_path).read_text(encoding="utf-8"))
    return payload["openclawBaseUrl"]
