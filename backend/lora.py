import torch
import json
import os
from peft import LoraConfig

def save_lora_adapter(lora_state, save_path, r, alpha, dropout, target_modules, task_type="CAUSAL_LM"):
    os.makedirs(save_path, exist_ok=True)

    # 1. Save adapter_model.bin
    torch.save(lora_state, os.path.join(save_path, "adapter_model.bin"))

    # 2. Build adapter_config.json
    config = LoraConfig(
        r=r,
        lora_alpha=alpha,
        lora_dropout=dropout,
        target_modules=target_modules,
        task_type=task_type,
        inference_mode=True,
    )
    config.save_pretrained(save_path)
    print(f"Saved LoRA adapter to: {save_path}")


ckpt = torch.load("/Users/kevin/MidiCopilot/backend/checkpoints/chopin-epoch=06-val_loss=2.0712.ckpt", map_location="cpu")["state_dict"]
lora_state = {k: v for k, v in ckpt.items() if "lora_" in k}

save_lora_adapter(
    lora_state,
    save_path="/Users/kevin/MidiCopilot/backend/checkpoints/lora",
    r=32,
    alpha=64,
    dropout=0.05,
    target_modules=["mixed_qkv", "att_proj_linear", "ff_gate_proj", "ff_up_proj", "ff_down_proj"],
)
if __name__ == "__main__":
    print('hi')