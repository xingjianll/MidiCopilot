from pydantic import BaseModel


class PortResponse(BaseModel):
    name: str
    type: str  # 'input' or 'output'