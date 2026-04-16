import os

import uvicorn

from app.main import app


def main() -> None:
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=int(os.environ.get("CLAWEE_GATEWAY_PORT", "43121")),
    )


if __name__ == "__main__":
    main()
