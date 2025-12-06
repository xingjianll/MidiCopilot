import tempfile
from abc import abstractmethod
from typing import TypedDict, Any, Optional, Literal

import torch
from peft import PeftModel
from symusic import Score
from symusic.core import TrackTick

from src.core.domain.midi_track import MidiTrack
from src.core.model.model import MidiAria2
from src.core.module import Module
from src.utils import PROJECT_ROOT, ForceTokenProcessor


class MidiTrackOutput(TypedDict):
    output_track: MidiTrack


class MidiPostProcessor:
    def post_process(self, i: torch.Tensor) -> torch.Tensor:
        return i

class MidiSeq2SeqMixin:

    @abstractmethod
    def _get_model(self) -> Any:
        raise NotImplementedError

    @abstractmethod
    def _set_model(self, model) -> None:
        raise NotImplementedError

    @abstractmethod
    def _get_tokenizer(self) -> Any:
        raise NotImplementedError

    @abstractmethod
    def _get_device(self) -> str:
        raise NotImplementedError

    @abstractmethod
    def _get_midi_postprocessor(self) -> MidiPostProcessor:
        raise NotImplementedError

    def _run(self,
            input_ids: torch.Tensor,
            max_length: Optional[int] = None,
            style: Optional[Literal['pop', 'chopin']] = None
            ) -> MidiTrackOutput:
        """
        Generate MIDI continuation from input track using Aria model.

        Args:
            input_track: Input MidiTrack with track and tempo information

        Returns:
            AriaBaseOutput containing the generated MidiTrack
        """
        if not max_length:
            max_length = 256

        if style is not None:
            if style == 'chopin':
                p = PROJECT_ROOT / "checkpoints" / "chopin-epoch=06-val_loss=2.0712.ckpt"
            elif style == 'pop':
                p = PROJECT_ROOT / "checkpoints" / "pop-epoch=03-val_loss=1.2997.ckpt"

            if not self.peft:
                model = MidiAria2(self._get_model())
                model.to_lora()
                ckpt = torch.load(p, map_location="cpu")["state_dict"]
                # ckpt = {k: v for k, v in ckpt.items() if "lora_" in k}
                model.load_state_dict(ckpt)
                self._set_model(model.model)
            else:
                model = self._get_model()
                model.load_adapter(PROJECT_ROOT / 'checkpoints' / 'lora', adapter_name="lora2")
                model.add_weighted_adapter(
                    adapters=["default", "lora2"],
                    weights=[0.5, 0.5],
                    adapter_name="merged",
                    combination_type="linear",
                )
                model.set_adapter("merged")


        dim_tok = self._get_tokenizer()._tokenizer.dim_tok
        dim_id = self._get_tokenizer()._convert_token_to_id(dim_tok)
        processor = ForceTokenProcessor(dim_id, step=max_length, tokenizer=self._get_tokenizer()._tokenizer)

        with tempfile.NamedTemporaryFile(suffix=".mid", delete=True) as output_temp:
            # Generate continuation
            continuation = self._get_model().generate(
                input_ids.to(self._get_device()),
                max_length=len(input_ids[0])+max_length+200,
                do_sample=True,
                temperature=0.97,
                top_p=0.95,
                use_cache=True,
                logits_processor=[processor]
            )
            pp = self._get_midi_postprocessor()
            continuation = pp.post_process(continuation)

            # Decode back into MIDI
            midi_dict_output = self._get_tokenizer().decode(continuation[0].tolist())
            midi_dict_output.to_midi().save(output_temp.name)

            # Load the generated MIDI back as Score and extract track and tempos
            output_score = Score.from_file(output_temp.name)
            output_track = output_score.tracks[0] if output_score.tracks else TrackTick()
            output_tempos = output_score.tempos if output_score.tempos else None
            output_ticks_per_quarter = output_score.ticks_per_quarter if hasattr(output_score, 'ticks_per_quarter') else None

            midi_track = MidiTrack(
                track=output_track,
                tempos=output_tempos,
                ticks_per_quarter=output_ticks_per_quarter
            )

            return MidiTrackOutput(output_track=midi_track)
