import torch
from ariautils.midi import MidiDict
from transformers import AutoTokenizer
from pathlib import Path
from typing import Generator, Optional, Literal
import json
from queue import Queue
from threading import Thread
from src.model.model import MidiAria


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


class AriaVariantsService:
    """Service for ARIA variant models (harmony and style/chopin)"""

    def __init__(self):
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        # Monkey patch cuda to use MPS on Mac
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        self.tokenizer = None
        self.harmony_model = None
        self.style_model = None
        
        # Checkpoint paths
        self.checkpoints_dir = Path("/Users/kevin/PycharmProjects/symbolic-music-generation/checkpoints/aria")
        self.harmony_checkpoint = self.checkpoints_dir / "aria-harmony-epoch=02-val_loss=4.2002.ckpt"
        self.style_checkpoint = self.checkpoints_dir / "aria-style-epoch=06-val_loss=2.0712.ckpt"
        
        self._load_tokenizer()

    def _load_tokenizer(self):
        """Load the tokenizer once (shared between models)"""
        print("Loading ARIA tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
            add_eos_token=True,
            add_dim_token=False
        )
        print("Tokenizer loaded successfully")

    def _load_harmony_model(self):
        """Load the harmony model on demand"""
        if self.harmony_model is None:
            print(f"Loading ARIA harmony model on device: {self.device}")
            
            self.harmony_model = MidiAria(self.tokenizer, None)
            self.harmony_model.to_lora()
            
            # Load checkpoint
            state_dict = torch.load(
                self.harmony_checkpoint, 
                map_location=torch.device('cpu')
            )['state_dict']
            self.harmony_model.load_state_dict(state_dict)
            self.harmony_model.to(self.device)
            
            print("ARIA harmony model loaded successfully")
        return self.harmony_model

    def _load_style_model(self):
        """Load the style/chopin model on demand"""
        if self.style_model is None:
            print(f"Loading ARIA style (Chopin) model on device: {self.device}")
            
            self.style_model = MidiAria(self.tokenizer, None)
            self.style_model.to_lora()
            
            # Load checkpoint
            state_dict = torch.load(
                self.style_checkpoint, 
                map_location=torch.device('cpu')
            )['state_dict']
            self.style_model.load_state_dict(state_dict)
            self.style_model.to(self.device)
            
            print("ARIA style (Chopin) model loaded successfully")
        return self.style_model

    def generate_harmony_stream(
        self,
        prompt_midi_path: str,
        output_midi_path: str,
        max_length: int = 1024,
        temperature: float = 0.97,
        top_p: float = 0.95,
        ignore_prompt: bool = True
    ) -> Generator[str, None, None]:
        """
        Generate a harmonic continuation with streaming progress updates

        Args:
            prompt_midi_path: Path to input MIDI file
            output_midi_path: Path to save output MIDI file
            max_length: Maximum length of generated sequence
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            ignore_prompt: Whether to ignore the prompt (generate from scratch)

        Yields:
            SSE-formatted progress updates
        """
        try:
            # Load model
            model = self._load_harmony_model()
            
            # Load and tokenize the prompt MIDI
            yield f"data: {json.dumps({'type': 'status', 'message': 'Loading MIDI file...'})}\n\n"

            midi_dict = MidiDict.from_midi(prompt_midi_path)
            tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=True, add_dim_token=True)
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            prompt_input_ids = torch.tensor([token_ids], device=self.device)
            prompt_length = len(token_ids)

            yield f"data: {json.dumps({'type': 'status', 'message': f'Starting harmony generation with {prompt_length} prompt tokens...'})}\n\n"

            # Create progress streamer
            streamer = ProgressStreamer(prompt_length, max_length)

            # Store result from generation
            generation_result = [None]

            # Run generation in a separate thread
            def generate_with_result():
                result = model.model.generate(
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

            # Decode - optionally ignore prompt
            if ignore_prompt:
                prompt_len = prompt_input_ids.shape[1]  # Use the actual prompt length
                generated_tokens = continuation[0][prompt_len:]  # only the new part
                midi_dict = self.tokenizer.decode(generated_tokens.tolist())
            else:
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
                "model": "aria-harmony",
                "max_length": max_length,
                "temperature": temperature,
                "top_p": top_p,
                "prompt_tokens": prompt_length,
                "generated_tokens": len(continuation[0]) - prompt_length,
                "ignore_prompt": ignore_prompt
            }
            
            sample = sample_service.add_generated_sample(
                file_path=str(output_path),
                prompt_name=f"{prompt_name}_harmony",
                generation_params=generation_params
            )

            yield f"data: {json.dumps({'type': 'complete', 'message': 'Successfully generated harmony', 'filename': output_path.name, 'sample_id': sample['id']})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    def generate_style_stream(
        self,
        prompt_midi_path: str,
        output_midi_path: str,
        max_length: int = 1024,
        temperature: float = 0.97,
        top_p: float = 0.95,
        ignore_prompt: bool = False
    ) -> Generator[str, None, None]:
        """
        Generate a style (Chopin) continuation with streaming progress updates

        Args:
            prompt_midi_path: Path to input MIDI file
            output_midi_path: Path to save output MIDI file
            max_length: Maximum length of generated sequence
            temperature: Sampling temperature
            top_p: Top-p sampling parameter
            ignore_prompt: Whether to ignore the prompt (generate from scratch)

        Yields:
            SSE-formatted progress updates
        """
        try:
            # Load model
            model = self._load_style_model()
            
            # Load and tokenize the prompt MIDI
            yield f"data: {json.dumps({'type': 'status', 'message': 'Loading MIDI file...'})}\n\n"

            midi_dict = MidiDict.from_midi(prompt_midi_path)
            tokens = self.tokenizer.tokenize(midi_dict, add_eos_token=True, add_dim_token=True)
            token_ids = self.tokenizer._tokenizer.encode(tokens)
            prompt_input_ids = torch.tensor([token_ids], device=self.device)
            prompt_length = len(token_ids)

            yield f"data: {json.dumps({'type': 'status', 'message': f'Starting Chopin-style generation with {prompt_length} prompt tokens...'})}\n\n"

            # Create progress streamer
            streamer = ProgressStreamer(prompt_length, max_length)

            # Store result from generation
            generation_result = [None]

            # Run generation in a separate thread
            def generate_with_result():
                result = model.model.generate(
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

            # Decode - optionally ignore prompt
            if ignore_prompt:
                prompt_len = prompt_input_ids.shape[1]  # Use the actual prompt length
                generated_tokens = continuation[0][prompt_len:]  # only the new part
                midi_dict = self.tokenizer.decode(generated_tokens.tolist())
            else:
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
                "model": "aria-style-chopin",
                "max_length": max_length,
                "temperature": temperature,
                "top_p": top_p,
                "prompt_tokens": prompt_length,
                "generated_tokens": len(continuation[0]) - prompt_length,
                "ignore_prompt": ignore_prompt
            }
            
            sample = sample_service.add_generated_sample(
                file_path=str(output_path),
                prompt_name=f"{prompt_name}_chopin",
                generation_params=generation_params
            )

            yield f"data: {json.dumps({'type': 'complete', 'message': 'Successfully generated Chopin-style continuation', 'filename': output_path.name, 'sample_id': sample['id']})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


# Global instance
_aria_variants_service = None


def get_aria_variants_service() -> AriaVariantsService:
    """Get or create the global AriaVariantsService instance"""
    global _aria_variants_service
    if _aria_variants_service is None:
        _aria_variants_service = AriaVariantsService()
    return _aria_variants_service