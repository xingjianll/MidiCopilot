import torch
from transformers import AutoTokenizer

from src.core.model.model import MidiAria
from src.utils import PROJECT_ROOT

device = "mps" if torch.backends.mps.is_available() else "cpu"
torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

# Load model and tokenizer
tokenizer = AutoTokenizer.from_pretrained(
    "loubb/aria-medium-base",
    trust_remote_code=True,
    add_eos_token=True,
    add_dim_token=True,
)
model = MidiAria(tokenizer, None).to(device)
model.to_lora()

checkpoint_path = (
    PROJECT_ROOT / "checkpoints" / "chopin-epoch=06-val_loss=2.0712.ckpt"
)
ckpt = torch.load(checkpoint_path, map_location="cpu")["state_dict"]
model.load_state_dict(ckpt, strict=True)
model.model.save_pretrained("chopin")
