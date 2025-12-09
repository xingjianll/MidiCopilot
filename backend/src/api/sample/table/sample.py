from sqlalchemy import Column, Integer, String, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from src.database import Base


class SampleType(enum.Enum):
    MIDI = "midi"
    AUDIO = "audio"


class Sample(Base):
    __tablename__ = "sample"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[SampleType] = mapped_column(Enum(SampleType))
    path: Mapped[str] = mapped_column(String, unique=True)