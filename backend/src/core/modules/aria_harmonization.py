import tempfile
import os
from typing import TypedDict

import torch
from ariautils.midi import MidiDict
from transformers import AutoTokenizer
from symusic import Score
from symusic.core import TrackTick, TempoTick
from pydantic import BaseModel

from src.core.module import Module
from src.core.modules.aria_base import MidiTrack
from src.core.model.model import MidiAria


class AriaHarmonizationOutput(TypedDict):
    output_track: MidiTrack


class AriaHarmonization(Module[MidiTrack, AriaHarmonizationOutput]):
    def __init__(self):
        # Set up device
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        # Load tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
            add_eos_token=True,
            add_dim_token=False
        )

        # Load model
        checkpoint_path = "/Users/kevin/PycharmProjects/symbolic-music-generation/checkpoints/aria/aria-harmony-epoch=02-val_loss=4.2002.ckpt"
        self.model = MidiAria(self.tokenizer, None)
        self.model.to_lora()
        state_dict = torch.load(checkpoint_path, map_location=torch.device('cpu'))['state_dict']
        self.model.load_state_dict(state_dict)

    @classmethod
    def description(cls) -> str:
        return "Generate MIDI harmonization using Aria style model from input melody"

    def run(self, input_track: MidiTrack) -> AriaHarmonizationOutput:
        """
        Generate MIDI harmonization from input track using Aria style model.

        Args:
            input_track: Input MidiTrack with track and tempo information

        Returns:
            AriaHarmonizationOutput containing the harmonized MidiTrack
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

                    # Load MIDI using MidiDict
                    midi_dict = MidiDict.from_midi(input_temp.name)
                    tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=True, add_dim_token=True)
                    token_ids = self.tokenizer._tokenizer.encode(tokens)
                    prompt_input_ids = torch.tensor([token_ids], device='cpu')

                    # Generate harmonization
                    continuation = self.model.model.generate(
                        prompt_input_ids.to('cpu'),
                        max_length=2048,
                        do_sample=True,
                        temperature=0.97,
                        top_p=0.95,
                        use_cache=True,
                    ) 

                    # Extract only the generated part (harmonization)
                    prompt_len = prompt_input_ids.shape[1]
                    generated_tokens = continuation[0][prompt_len:]  # only the new part

                    # Decode just the harmonization
                    midi_dict_output = self.tokenizer.decode(generated_tokens.tolist())
                    midi_dict_output.to_midi().save(output_temp.name)

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

                    return AriaHarmonizationOutput(output_track=midi_track)

                finally:
                    # Clean up temporary files
                    try:
                        os.unlink(input_temp.name)
                        os.unlink(output_temp.name)
                    except OSError:
                        pass  # Ignore cleanup errors