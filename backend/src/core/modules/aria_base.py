import tempfile
from typing import Any, override, Optional, Literal

import torch
from ariautils.midi import MidiDict
from transformers import AutoModelForCausalLM, AutoTokenizer
from symusic import Score

from src.core.domain.midi_track import MidiTrack
from src.core.module import Module
from src.core.modules.midi_seq2seq import MidiSeq2SeqMixin, MidiTrackOutput, MidiPostProcessor
from src.utils import PROJECT_ROOT


class AriaBase(Module[[Optional[MidiTrack]], MidiTrackOutput], MidiSeq2SeqMixin):
    def __init__(self):
        self.peft = False
        # Set up device
        self.device = "cpu" if torch.backends.mps.is_available() else "cpu"
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
    def _set_model(self, model) -> None:
        self.mode = model

    @override
    def _get_tokenizer(self) -> Any:
        return self.tokenizer

    @override
    def _get_device(self) -> str:
        return self.device

    @override
    def _get_midi_postprocessor(self) -> MidiPostProcessor:
        return MidiPostProcessor()

    def _get_input_sequence_ids(self, input_track: Optional[MidiTrack]) -> torch.Tensor:
        if input_track is None:
            stub = MidiDict.from_midi(PROJECT_ROOT / "stub.mid")
            tokens = self.tokenizer.tokenize(
                stub, add_eos_token=False, add_dim_token=False
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            return torch.tensor([token_ids[:2]], device=self.device)
        with tempfile.NamedTemporaryFile(suffix=".mid", delete=True) as input_temp:
            score = input_track.to_score()
            score.dump_midi(input_temp.name)

            # Load MIDI using MidiDict
            midi_dict = MidiDict.from_midi(input_temp.name)
            tokens = self.tokenizer.tokenize(
                midi_dict, add_eos_token=False, add_dim_token=False
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)

            return torch.tensor([token_ids], device=self.device)

    def run(self,
            input_track: Optional[MidiTrack] = None,
            max_length: Optional[int] = None,
            style: Optional[Literal['pop', 'chopin']] = None
            ) -> MidiTrackOutput:
        prompt_input_ids = self._get_input_sequence_ids(input_track)
        return self._run(prompt_input_ids, max_length, style)