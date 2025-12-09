import tempfile
from typing import Any, Optional, override, Literal

import torch
from ariautils.midi import MidiDict
from symusic import Score
from transformers import AutoModelForCausalLM, AutoTokenizer

from src.core.domain.midi_track import MidiTrack
from src.core.model.model import MidiAria
from src.core.module import Module
from src.core.modules.harmonizer import HarmonizerPostProcessor
from src.core.modules.midi_seq2seq import (
    MidiTrackOutput,
    MidiSeq2SeqMixin,
)
from src.utils import PROJECT_ROOT


class Infill(Module[[Optional[MidiTrack]], MidiTrackOutput], MidiSeq2SeqMixin):
    def __init__(self):
        super().__init__()
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
            add_dim_token=False,
        )
        checkpoint = "/Users/kevin/Downloads/aria-infill-epoch=11-val_loss=2.5880.ckpt"
        # checkpoint = PROJECT_ROOT / 'checkpoints' / 'aria-infill-epoch=03-val_loss=2.2568.ckpt'
        ckpt = torch.load(checkpoint, map_location=self.device)
        clean = {k.replace("model.", "", 1): v for k, v in ckpt.items()}
        print(clean)
        self.model.load_state_dict(clean)

    @classmethod
    def description(cls) -> str:
        return "Infill."

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
    def _get_midi_postprocessor(self):
        return self.post_processor

    def _get_ids(self,
                 input_track: Optional[MidiTrack],
                 add_eos: bool,
                 add_dim: bool
                 ) -> torch.Tensor:
        if input_track is None:
            return torch.tensor([], device=self.device)

        with tempfile.NamedTemporaryFile(suffix=".mid", delete=True) as input_temp:
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
                midi_dict, add_eos_token=add_eos, add_dim_token=add_dim
            )
            token_ids = self.tokenizer._tokenizer.encode(tokens)

            return token_ids

    async def run(self,
            prefix: MidiTrack,
            suffix: MidiTrack,
            max_length: int,
            style: Optional[Literal['pop', 'chopin']] = None
            ) -> MidiTrackOutput:
        """
        Generate MIDI continuation from input track using Aria model.

        Args:
            input_track: Input MidiTrack with track and tempo information

        Returns:
            AriaBaseOutput containing the generated MidiTrack
        """
        prefix_ids = self._get_ids(prefix, False, False)
        suffix_ids = self._get_ids(suffix, True, True)
        self.post_processor = HarmonizerPostProcessor(len(prefix_ids))
        prompt_input_ids = torch.tensor([suffix_ids + prefix_ids], device=self.device)
        return await self._run(prompt_input_ids, max_length, style)

        # with tempfile.NamedTemporaryFile(suffix=".mid", delete=True) as output_temp:
        #     continuation = self.model.generate(
        #         prompt_input_ids.to(self.device),
        #         max_length=len(suffix_ids)+len(prefix_ids)+max_length,
        #         do_sample=True,
        #         temperature=0.97,
        #         top_p=0.95,
        #         use_cache=True,
        #     )
        #
        #     # Decode back into MIDI
        #     prompt_len = len(suffix_ids)
        #     generated_tokens = continuation[0][prompt_len:]
        #     midi_dict_output = self.tokenizer.decode(generated_tokens.tolist())
        #     midi_dict_output.to_midi().save(output_temp.name)
        #
        #     # Load the generated MIDI back as Score and extract track and tempos
        #     output_score = Score.from_file(output_temp.name)
        #     output_track = output_score.tracks[0] if output_score.tracks else TrackTick()
        #     output_tempos = output_score.tempos if output_score.tempos else None
        #     output_ticks_per_quarter = output_score.ticks_per_quarter if hasattr(output_score, 'ticks_per_quarter') else None
        #
        #     midi_track = MidiTrack(
        #         track=output_track,
        #         tempos=output_tempos,
        #         ticks_per_quarter=output_ticks_per_quarter
        #     )
        #
        #     return MidiTrackOutput(output_track=midi_track)
