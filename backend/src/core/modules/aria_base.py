import tempfile
import os
from typing import TypedDict
from pathlib import Path

import torch
from ariautils.midi import MidiDict
from transformers import AutoModelForCausalLM, AutoTokenizer
from symusic import Score
from symusic.core import TrackTick

from src.core.module import Module

# Create type alias for cleaner API
MidiTrack = TrackTick
MidiTrack.__name__ = "MidiTrack"


class AriaBaseOutput(TypedDict):
    output_track: MidiTrack


class AriaBase(Module[MidiTrack, AriaBaseOutput]):
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
            input_track: Input symusic Track

        Returns:
            AriaBaseOutput containing the generated Track
        """
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as input_temp:
            with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as output_temp:
                try:
                    # Convert Track to Score and save to temp file
                    score = Score()
                    score.tracks.append(input_track)
                    score.dump_midi(input_temp.name)

                    # Load MIDI using MidiDict
                    midi_dict = MidiDict.from_midi(input_temp.name)
                    tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=False, add_dim_token=False)
                    token_ids = self.tokenizer._tokenizer.encode(tokens)
                    prompt_input_ids = torch.tensor([token_ids], device=self.device)

                    # Generate continuation
                    continuation = self.model.generate(
                        prompt_input_ids.to(self.device),
                        max_length=1024,
                        do_sample=True,
                        temperature=0.97,
                        top_p=0.95,
                        use_cache=True,
                    )

                    # Decode back into MIDI
                    midi_dict_output = self.tokenizer.decode(continuation[0].tolist())
                    midi_dict_output.to_midi().save(output_temp.name)

                    # Load the generated MIDI back as Score and extract the track
                    output_score = Score.from_file(output_temp.name)

                    # Return the first track (assuming single track output)
                    output_track = output_score.tracks[0] if output_score.tracks else Track()

                    return AriaBaseOutput(output_track=output_track)

                finally:
                    # Clean up temporary files
                    try:
                        os.unlink(input_temp.name)
                        os.unlink(output_temp.name)
                    except OSError:
                        pass  # Ignore cleanup errors