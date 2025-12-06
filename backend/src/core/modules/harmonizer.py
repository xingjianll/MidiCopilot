import tempfile
import os
from typing import override, Optional, Literal

import torch
from ariautils.midi import MidiDict
from transformers import AutoTokenizer, AutoModelForCausalLM
from symusic import Score

from src.core.modules.aria_base import MidiTrack, AriaBase
from src.core.model.model import MidiAria
from src.core.modules.midi_seq2seq import MidiPostProcessor, MidiTrackOutput
from src.utils import PROJECT_ROOT


class HarmonizerPostProcessor(MidiPostProcessor):
    def __init__(self, size: int):
        self.size = size

    @override
    def post_process(self, i: torch.Tensor) -> torch.Tensor:
        generated_tokens = i[0][self.size:]
        return [generated_tokens]


class Harmonizer(AriaBase):
    def __init__(self):
        self.peft = True
        # Set up device
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        # Load model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
            add_eos_token=True,
            add_dim_token=False,
        )
        model = MidiAria(self.tokenizer, None).to(self.device)
        model.to_lora()

        # checkpoint_path = '/Users/kevin/Downloads/aria-melody-epoch=00-val_loss=0.9068.ckpt'
        checkpoint_path = PROJECT_ROOT / 'checkpoints' / 'aria-harmony-epoch=02-val_loss=4.2002.ckpt'
        ckpt = torch.load(checkpoint_path, map_location="cpu")["state_dict"]
        model.load_state_dict(ckpt, strict=True)
        self.model = model.model

        self.midi_processor = None

    @classmethod
    def description(cls) -> str:
        return "Generate harmony from melody"

    @override
    def _get_midi_postprocessor(self) -> MidiPostProcessor:
        return self.midi_processor

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

    def run(self,
            input_track: Optional[MidiTrack] = None,
            max_length: Optional[int] = None,
            style: Optional[Literal['pop', 'chopin']] = None
            ) -> MidiTrackOutput:
        prompt_input_ids = self._get_input_sequence_ids(input_track)
        self.midi_processor = HarmonizerPostProcessor(prompt_input_ids.shape[1])
        return self._run(prompt_input_ids, max_length, style)