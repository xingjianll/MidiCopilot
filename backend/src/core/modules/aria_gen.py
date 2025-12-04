import torch
from transformers import AutoTokenizer, AutoConfig, AutoModelForCausalLM

from src.core.modules.aria_base import AriaBase


class AriaGen(AriaBase):
    def __init__(self):
        # Set up device
        self.device = "mps" if torch.backends.mps.is_available() else "cpu"
        torch.Tensor.cuda = lambda self, *args, **kwargs: self.to(self.device)

        # Load model and tokenizer
        self.config = AutoConfig.from_pretrained(
            "loubb/aria-medium-base", trust_remote_code=True
        )
        checkpoint_path = ""
        self.model = AutoModelForCausalLM.from_config(self.config)
        state_dict = torch.load(checkpoint_path, map_location=torch.device("cpu"))[
            "state_dict"
        ]
        self.model.load_state_dict(state_dict)

        self.tokenizer = AutoTokenizer.from_pretrained(
            "loubb/aria-medium-base",
            trust_remote_code=True,
            add_eos_token=True,
            add_dim_token=False,
        )