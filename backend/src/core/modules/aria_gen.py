from safetensors.torch import load_file

from src.core.modules.aria_base import AriaBase
from src.utils import PROJECT_ROOT


class AriaGen(AriaBase):
    def __init__(self):
        # Set up device
        super().__init__()
        state_dict = load_file(PROJECT_ROOT / 'checkpoints' / 'model-gen.safetensors')
        self.model.load_state_dict(state_dict, strict=False)

    @classmethod
    def description(cls) -> str:
        return "Generate MIDI continuation using Aria model from input track"