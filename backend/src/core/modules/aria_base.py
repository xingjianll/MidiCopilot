import tempfile
import os
from typing import TypedDict
from pathlib import Path

import torch
from ariautils.midi import MidiDict
from transformers import AutoModelForCausalLM, AutoTokenizer
from symusic import Score
from symusic.core import TrackTick, TempoTick
from pydantic import BaseModel, Field

from src.core.module import Module


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


class AriaBaseOutput(TypedDict):
    output_track: MidiTrack


class AriaBase(Module[[MidiTrack], AriaBaseOutput]):
    def __init__(self):
        # Set up device
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        # Load model and tokenizer
        self.model = AutoModelForCausalLM.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
        ).to(self.device)

        self.tokenizer = AutoTokenizer.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
            add_eos_token=True,
            add_dim_token=False
        )

    @classmethod
    def description(cls) -> str:
        return "Generate MIDI continuation using Aria model from input track"

    def run(self, input_track: MidiTrack) -> AriaBaseOutput:
        """
        Generate MIDI continuation from input track using Aria model.

        Args:
            input_track: Input MidiTrack with track and tempo information

        Returns:
            AriaBaseOutput containing the generated MidiTrack
        """
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as input_temp:
            with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as output_temp:
                try:
                    # Convert MidiTrack to Score and save to temp file
                    score = Score()
                    score.tracks.append(input_track.track)
                    if input_track.tempos:
                        score.tempos = input_track.tempos
                    if input_track.ticks_per_quarter:
                        score.ticks_per_quarter = input_track.ticks_per_quarter
                    score.dump_midi(input_temp.name)
                    score.dump_midi("./test1.mid")

                    # Load MIDI using MidiDict
                    midi_dict = MidiDict.from_midi(input_temp.name)
                    midi_dict.to_midi().save("./test2.mid")
                    tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=False, add_dim_token=False)
                    token_ids = self.tokenizer._tokenizer.encode(tokens)
                    prompt_input_ids = torch.tensor([token_ids], device=self.device)

                    # Generate continuation
                    continuation = self.model.generate(
                        prompt_input_ids.to(self.device),
                        max_length=512,
                        do_sample=True,
                        temperature=0.97,
                        top_p=0.95,
                        use_cache=True,
                    )

                    # Decode back into MIDI
                    midi_dict_output = self.tokenizer.decode(continuation[0].tolist())
                    midi_dict_output.to_midi().save(output_temp.name)
                    midi_dict_output.to_midi().save("./test3.mid")

                    # Load the generated MIDI back as Score and extract track and tempos
                    output_score = Score.from_file(output_temp.name)

                    # Create MidiTrack with track and timing information
                    output_track = output_score.tracks[0] if output_score.tracks else TrackTick()
                    output_tempos = output_score.tempos if output_score.tempos else None
                    output_ticks_per_quarter = output_score.ticks_per_quarter if hasattr(output_score, 'ticks_per_quarter') else None

                    midi_track = MidiTrack(
                        track=output_track,
                        tempos=output_tempos,
                        ticks_per_quarter=output_ticks_per_quarter
                    )

                    return AriaBaseOutput(output_track=midi_track)

                finally:
                    # Clean up temporary files
                    try:
                        os.unlink(input_temp.name)
                        os.unlink(output_temp.name)
                    except OSError:
                        pass  # Ignore cleanup errors