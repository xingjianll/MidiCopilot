import tempfile
import os
from typing import override, Optional, Literal

import torch
from ariautils.midi import MidiDict
from peft import PeftModel
from symusic.core import TrackTick
from transformers import AutoTokenizer, AutoModelForCausalLM
from symusic import Score

from src.core.modules.aria_base import MidiTrack, AriaBase
from src.core.model.model import MidiAria
from src.core.modules.midi_seq2seq import MidiPostProcessor, MidiTrackOutput
from src.utils import PROJECT_ROOT


class HarmonizerPostProcessor(MidiPostProcessor):
    def __init__(self, size: int):
        print(f"post porcessor size {size}")
        self.size = size

    @override
    def post_process(self, i: torch.Tensor) -> torch.Tensor:
        generated_tokens = i[0][self.size:]
        return [generated_tokens]


class Harmonizer(AriaBase):
    def __init__(self):
        self.peft = True
        # Set up device
        self.device = "cpu" if torch.backends.mps.is_available() else "cpu"
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        # Load model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
            add_eos_token=True,
            add_dim_token=True,
        )
        model = MidiAria(self.tokenizer, None).to(self.device)

        # checkpoint_path = PROJECT_ROOT / 'checkpoints' / 'aria-harmony-epoch=00-val_loss=0.1606.ckpt'
        # ckpt = torch.load(checkpoint_path, map_location="cpu")["state_dict"]
        # model.load_state_dict(ckpt, strict=True)
        # model.eval().to(self.device)
        # self.model = model.model

        p = PROJECT_ROOT / "checkpoints" / "harmonizer"
        model = PeftModel.from_pretrained(model.model, p, "harmonizer")
        model.set_adapter("harmonizer")
        self.model = model

    @classmethod
    def description(cls) -> str:
        return "Generate harmony from melody"

    @override
    def _get_input_sequence_ids(self, input_track: Optional[MidiTrack]) -> torch.Tensor:
        if input_track is None:
            stub = MidiDict.from_midi(PROJECT_ROOT / "stub.mid")
            tokens = self.tokenizer.tokenize(
                stub, add_eos_token=False, add_dim_token=False
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            return torch.tensor([token_ids[:2]], device=self.device)
        with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as input_temp:
            score = input_track.to_score()
            score.dump_midi(input_temp.name)
            # Load MIDI using MidiDict
            midi_dict = MidiDict.from_midi(input_temp.name)
            tokens = self.tokenizer.tokenize(
                midi_dict, add_eos_token=True, add_dim_token=True
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)

        return torch.tensor([token_ids], device=self.device)

    async def run(self,
            input_track: Optional[MidiTrack] = None,
            max_length: Optional[int] = None,
            style: Optional[Literal['pop', 'chopin']] = None
            ) -> MidiTrackOutput:
        prompt_input_ids = self._get_input_sequence_ids(input_track)
        return await self._run(prompt_input_ids, max_length, style, force_diminish=False, pp=HarmonizerPostProcessor(prompt_input_ids.shape[1]))