import tempfile
from abc import abstractmethod
from typing import TypedDict, Any, Optional

import torch
from symusic import Score
from symusic.core import TrackTick

from src.core.domain.midi_track import MidiTrack
from src.core.module import Module


class MidiTrackOutput(TypedDict):
    output_track: MidiTrack


class MidiSeq2Seq(Module[[Optional[MidiTrack]], MidiTrackOutput]):

    @abstractmethod
    def _get_input_sequence_ids(self, track: Optional[MidiTrack]) -> torch.Tensor:
        raise NotImplementedError

    @abstractmethod
    def _get_model(self) -> Any:
        raise NotImplementedError

    @abstractmethod
    def _get_tokenizer(self) -> Any:
        raise NotImplementedError

    @abstractmethod
    def _get_device(self) -> str:
        raise NotImplementedError

    def run(self, input_track: Optional[MidiTrack] = None) -> MidiTrackOutput:
        """
        Generate MIDI continuation from input track using Aria model.

        Args:
            input_track: Input MidiTrack with track and tempo information

        Returns:
            AriaBaseOutput containing the generated MidiTrack
        """
        prompt_input_ids = self._get_input_sequence_ids(input_track)
        with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as output_temp:
            # Generate continuation
            continuation = self._get_model().generate(
                prompt_input_ids.to(self._get_device()),
                max_length=512,
                do_sample=True,
                temperature=0.97,
                top_p=0.95,
                use_cache=True,
            )

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
