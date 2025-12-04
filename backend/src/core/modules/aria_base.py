import tempfile
import os
from typing import Any, override, Optional

import torch
from ariautils.midi import MidiDict
from transformers import AutoModelForCausalLM, AutoTokenizer
from symusic import Score

from src.core.domain.midi_track import MidiTrack
from src.core.modules.midi_seq2seq import MidiSeq2Seq


class AriaBase(MidiSeq2Seq):
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

    @override
    def _get_model(self) -> Any:
        return self.model

    @override
    def _get_tokenizer(self) -> Any:
        return self.tokenizer

    @override
    def _get_device(self) -> str:
        return self.device

    @override
    def _get_input_sequence_ids(self, input_track: Optional[MidiTrack]) -> torch.Tensor:
        if input_track is None:
            token_ids = self.tokenizer._tokenizer.encode([self.tokenizer._tokenizer.bos_tok])
            return torch.tensor([token_ids], device=self.device)
        with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as input_temp:
            score = Score()
            score.tracks.append(input_track.track)
            if input_track.tempos:
                score.tempos = input_track.tempos
            if input_track.ticks_per_quarter:
                score.ticks_per_quarter = input_track.ticks_per_quarter
            score.dump_midi(input_temp.name)

            # Load MIDI using MidiDict
            midi_dict = MidiDict.from_midi(input_temp.name)
            tokens = self.tokenizer.tokenize(
                midi_dict, add_eos_token=False, add_dim_token=False
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            try:
                os.unlink(input_temp.name)
            except OSError:
                pass  # Ignore cleanup errors

            return torch.tensor([token_ids], device=self.device)
