from symusic.core import TrackTick, TempoTick
from pydantic import BaseModel

class MidiTrack(BaseModel):
    """
    MIDI track with timing information.

    Attributes:
        track: The actual MIDI track containing notes and events
        tempos: List of tempo changes throughout the track (optional)
        ticks_per_quarter: MIDI timing resolution (optional)
    """
    track: TrackTick
    tempos: list[TempoTick] | None = None
    ticks_per_quarter: int | None = None

    class Config:
        # Allow arbitrary types (needed for TrackTick and TempoTick)
        arbitrary_types_allowed = True