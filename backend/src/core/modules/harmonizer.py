import tempfile
import os
from typing import override, Optional

import torch
from ariautils.midi import MidiDict
from transformers import AutoTokenizer
from symusic import Score

from src.core.modules.aria_base import MidiTrack, AriaBase
from src.core.model.model import MidiAria
from src.utils import PROJECT_ROOT


class Harmonizer(AriaBase):
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
        midiaria = MidiAria(self.tokenizer, None)
        self.model = midiaria.model
        self.model.to(self.device)

        checkpoint_path = PROJECT_ROOT / 'checkpoints' / 'aria-harmonization-epoch=00-val_loss=0.7306.ckpt'
        ckpt = torch.load(checkpoint_path, map_location=self.device)["state_dict"]
        self.model.load_state_dict(ckpt, strict=False)

    @classmethod
    def description(cls) -> str:
        return "Generate harmony from melody"

    def _post_process(self, i: torch.Tensor, *args, **kwargs) -> torch.Tensor:
        prompt_input_ids = kwargs['prompt_input_ids']
        prompt_len = prompt_input_ids.shape[1]
        generated_tokens = i[0][prompt_len:]
        return [generated_tokens]

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
                midi_dict, add_eos_token=True, add_dim_token=True
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)

        return torch.tensor([token_ids], device=self.device)
