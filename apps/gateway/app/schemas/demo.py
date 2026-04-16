from pydantic import BaseModel


class DemoSnapshot(BaseModel):
    time: str
    random: int
