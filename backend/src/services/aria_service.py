import torch
from ariautils.midi import MidiDict
from transformers import AutoModelForCausalLM, AutoTokenizer
from pathlib import Path
from typing import Generator, Optional
import json
from queue import Queue
from threading import Thread


class ProgressStreamer:
    """Custom streamer to track generation progress"""

    def __init__(self, prompt_length: int, max_length: int):
        self.prompt_length = prompt_length
        self.max_length = max_length
        self.current_length = prompt_length
        self.queue = Queue()

    def put(self, value):
        """Called by the model at each generation step"""
        if value is not None:
            self.current_length += 1
            progress = {
                "type": "progress",
                "current": self.current_length,
                "total": self.max_length,
                "prompt_length": self.prompt_length,
                "generated": self.current_length - self.prompt_length,
                "percentage": min(100, int((self.current_length / self.max_length) * 100))
            }
            self.queue.put(progress)

    def end(self):
        """Called when generation is complete"""
        self.queue.put({"type": "done"})

    def get_updates(self) -> Generator[dict, None, None]:
        """Yield progress updates from the queue"""
        while True:
            update = self.queue.get()
            if update["type"] == "done":
                break
            yield update


class AriaService:
    """Service for ARIA model inference"""

    def __init__(self):
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        # Monkey patch cuda to use MPS on Mac
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        self.model = None
        self.tokenizer = None
        self._load_model()

    def _load_model(self):
        """Load the ARIA model and tokenizer"""
        print(f"Loading ARIA model on device: {self.device}")

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

        print("ARIA model loaded successfully")

    def generate_continuation_stream(
        self,
        prompt_midi_path: str,
        output_midi_path: str,
        max_length: int = 1024,
        temperature: float = 0.97,
        top_p: float = 0.95
    ) -> Generator[str, None, None]:
        """
        Generate a MIDI continuation with streaming progress updates

        Args:
            prompt_midi_path: Path to input MIDI file
            output_midi_path: Path to save output MIDI file
            max_length: Maximum length of generated sequence
            temperature: Sampling temperature
            top_p: Top-p sampling parameter

        Yields:
            SSE-formatted progress updates
        """
        try:
            # Load and tokenize the prompt MIDI
            yield f"data: {json.dumps({'type': 'status', 'message': 'Loading MIDI file...'})}\n\n"

            midi_dict = MidiDict.from_midi(prompt_midi_path)
            tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=False, add_dim_token=False)
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            prompt_input_ids = torch.tensor([token_ids], device=self.device)
            prompt_length = len(token_ids)

            yield f"data: {json.dumps({'type': 'status', 'message': f'Starting generation with {prompt_length} prompt tokens...'})}\n\n"

            # Create progress streamer
            streamer = ProgressStreamer(prompt_length, max_length)

            # Store result from generation
            generation_result = [None]

            # Run generation in a separate thread
            def generate_with_result():
                result = self.model.generate(
                    input_ids=prompt_input_ids.to(self.device),
                    max_length=max_length,
                    do_sample=True,
                    temperature=temperature,
                    top_p=top_p,
                    use_cache=True,
                    streamer=streamer,
                )
                generation_result[0] = result

            thread = Thread(target=generate_with_result)
            thread.start()

            # Stream progress updates
            for progress in streamer.get_updates():
                yield f"data: {json.dumps(progress)}\n\n"

            # Wait for thread to complete
            thread.join()

            # Get the generated output
            continuation = generation_result[0]

            yield f"data: {json.dumps({'type': 'status', 'message': 'Decoding MIDI...'})}\n\n"

            # Decode back into MIDI
            midi_dict = self.tokenizer.decode(continuation[0].tolist())

            # Save the output
            output_path = Path(output_midi_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            midi_dict.to_midi().save(str(output_path))

            # Also save to samples
            from src.services.sample_service import get_sample_service
            sample_service = get_sample_service()
            prompt_name = Path(prompt_midi_path).stem
            
            generation_params = {
                "max_length": max_length,
                "temperature": temperature,
                "top_p": top_p,
                "prompt_tokens": prompt_length,
                "generated_tokens": len(continuation[0]) - prompt_length
            }
            
            sample = sample_service.add_generated_sample(
                file_path=str(output_path),
                prompt_name=prompt_name,
                generation_params=generation_params
            )

            yield f"data: {json.dumps({'type': 'complete', 'message': 'Successfully generated continuation', 'filename': output_path.name, 'sample_id': sample['id']})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    def generate_continuation(
        self,
        prompt_midi_path: str,
        output_midi_path: str,
        max_length: int = 1024,
        temperature: float = 0.97,
        top_p: float = 0.95
    ) -> dict:
        """
        Generate a MIDI continuation from a prompt MIDI file (non-streaming version)

        Args:
            prompt_midi_path: Path to input MIDI file
            output_midi_path: Path to save output MIDI file
            max_length: Maximum length of generated sequence
            temperature: Sampling temperature
            top_p: Top-p sampling parameter

        Returns:
            Dictionary with success status and message
        """
        try:
            # Load and tokenize the prompt MIDI
            midi_dict = MidiDict.from_midi(prompt_midi_path)
            tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=False, add_dim_token=False)
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            prompt_input_ids = torch.tensor([token_ids], device=self.device)

            # Generate continuation
            continuation = self.model.generate(
                prompt_input_ids.to(self.device),
                max_length=max_length,
                do_sample=True,
                temperature=temperature,
                top_p=top_p,
                use_cache=True,
            )

            # Decode back into MIDI
            midi_dict = self.tokenizer.decode(continuation[0].tolist())
            decoded_text = self.tokenizer._tokenizer.decode(continuation[0].tolist())

            # Save the output
            output_path = Path(output_midi_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            midi_dict.to_midi().save(str(output_path))

            # Also save to samples
            from src.services.sample_service import get_sample_service
            sample_service = get_sample_service()
            prompt_name = Path(prompt_midi_path).stem
            prompt_length = len(token_ids)
            
            generation_params = {
                "max_length": max_length,
                "temperature": temperature,
                "top_p": top_p,
                "prompt_tokens": prompt_length,
                "generated_tokens": len(continuation[0]) - prompt_length
            }
            
            sample = sample_service.add_generated_sample(
                file_path=str(output_path),
                prompt_name=prompt_name,
                generation_params=generation_params
            )

            return {
                "success": True,
                "message": f"Successfully generated continuation",
                "decoded_text": decoded_text,
                "output_path": str(output_path),
                "sample_id": sample['id']
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error generating continuation: {str(e)}",
                "error": str(e)
            }


# Global instance
_aria_service = None


def get_aria_service() -> AriaService:
    """Get or create the global AriaService instance"""
    global _aria_service
    if _aria_service is None:
        _aria_service = AriaService()
    return _aria_service
