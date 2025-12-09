import symusic
from symusic.core import TrackTick, TempoTick
from pydantic import BaseModel
from symusic.types import Score
from src.utils import merge_score_tracks


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

    def to_score(self) -> Score:
        score = symusic.Score()
        score.tracks.append(self.track)
        if self.tempos:
            score.tempos = self.tempos
        if self.ticks_per_quarter:
            score.ticks_per_quarter = self.ticks_per_quarter
        merge_score_tracks(score)

        # Set all tracks to piano (program 0)
        for track in score.tracks:
            track.program = 0

        return score