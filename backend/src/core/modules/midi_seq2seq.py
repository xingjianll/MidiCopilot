import tempfile
from abc import abstractmethod
from typing import TypedDict, Any, Optional, Literal
import asyncio

import torch
from peft import PeftModel
from symusic import Score
from symusic.core import TrackTick
import asyncio
import time
from src.core.domain.midi_track import MidiTrack
from src.core.model.model import MidiAria2
from src.core.module import Module
from src.utils import PROJECT_ROOT, ForceTokenProcessor


class MidiTrackOutput(TypedDict):
    output_track: MidiTrack


class MidiPostProcessor:
    def post_process(self, i: torch.Tensor) -> torch.Tensor:
        return i

class ProgressCallback:
    """Callback for tracking generation progress"""
    def __init__(self, run_id: int, websocket_manager=None):
        self.run_id = run_id
        self.websocket_manager = websocket_manager
        self.current_tokens = 0
        self.max_tokens = 0
        
    def set_max_tokens(self, max_tokens: int):
        self.max_tokens = max_tokens
        
    async def update_progress(self, current: int):
        self.current_tokens = current
        if self.websocket_manager and self.max_tokens > 0:
            percentage = min((current / self.max_tokens) * 100, 100)
            await self.websocket_manager.notify_run_progress(
                self.run_id, current, self.max_tokens, percentage
            )


class MidiSeq2SeqMixin:

    def __init__(self):
        self.progress_callback = None

    def set_progress_callback(self, callback: ProgressCallback):
        self.progress_callback = callback

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

    async def _run(self,
            input_ids: torch.Tensor,
            max_length: Optional[int] = None,
            style: Optional[Literal['pop', 'chopin']] = None,
            force_diminish: bool = True,
            pp: Optional[MidiPostProcessor] = None
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
                p = PROJECT_ROOT / "checkpoints" / "chopin"

            elif style == 'pop':
                p = PROJECT_ROOT / "checkpoints" / "pop"

            if not self.peft:
                model = PeftModel.from_pretrained(self._get_model(), p, "style")
                model.set_adapter("style")
                self._set_model(model)
            else:
                model = self._get_model()
                model.load_adapter(p, adapter_name="style")
                model.add_weighted_adapter(
                    adapters=["harmonizer", "style"],
                    weights=[0.65, 0.35],
                    adapter_name="merged",
                    combination_type="linear",
                )
                model.set_adapter("merged")
                print(model.active_adapter)

        with tempfile.NamedTemporaryFile(suffix=".mid", delete=True) as output_temp:
            # Generate continuation with progress tracking
            total_length = len(input_ids[0]) + max_length
            print(f"total length {total_length}")
            print(f"prefix length{len(input_ids[0])}")

            processors = None
            if force_diminish:
                dim_tok = self._get_tokenizer()._tokenizer.dim_tok
                dim_id = self._get_tokenizer()._convert_token_to_id(dim_tok)
                processor = ForceTokenProcessor(
                    dim_id, step=max(total_length-100, len(input_ids[0])), tokenizer=self._get_tokenizer()._tokenizer
                )
                processors = [processor]

            if self.progress_callback:
                self.progress_callback.set_max_tokens(max_length)
                
            continuation = await self._generate_with_progress(
                input_ids.to(self._get_device()),
                total_length,
                processors
            )
            if pp:
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

    async def _generate_with_progress(self, input_ids: torch.Tensor, max_length: int, processors: Optional[list]) -> torch.Tensor:
        """Generate with progress tracking"""
        model = self._get_model()
        
        # For now, simulate progress with the original generate call
        # In a real implementation, you'd need to use a streaming approach
        # or implement token-by-token generation

        # Start progress tracking
        await self.progress_callback.update_progress(0)

        # Simulate progress updates during generation
        # Since we can't easily hook into the transformer's generate method,
        # we'll simulate progress with time-based updates

        start_time = time.time()

        # Run generation in a separate thread to avoid blocking
        def run_generation():
            if processors:
                return model.generate(
                    input_ids,
                    max_length=max_length,
                    do_sample=True,
                    temperature=1,
                    top_p=0.95,
                    use_cache=True,
                    logits_processor=processors,
                )
            else:
                return model.generate(
                    input_ids,
                    max_length=max_length,
                    do_sample=True,
                    temperature=1,
                    top_p=0.95,
                    use_cache=True,
                )

        # Start generation in background
        loop = asyncio.get_event_loop()
        generation_task = loop.run_in_executor(None, run_generation)

        # Simulate progress updates while generation is running
        tokens_generated = 0
        target_tokens = max_length - len(input_ids[0])

        while not generation_task.done():
            await asyncio.sleep(0.5)  # Update every 500ms
            elapsed = time.time() - start_time
            # Estimate progress based on elapsed time (rough approximation)
            estimated_progress = min(
                elapsed / (target_tokens * 0.1), 1.0
            )  # ~0.1s per token estimate
            tokens_generated = int(estimated_progress * target_tokens)
            await self.progress_callback.update_progress(tokens_generated)

        # Final progress update
        await self.progress_callback.update_progress(target_tokens)

        return await generation_task