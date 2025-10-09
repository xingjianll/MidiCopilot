"""
MidiAria model implementation for ARIA variants (harmony and style)
Based on the symbolic_music_generation project
"""
import lightning as pl
import torch
from transformers import AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType


class MidiAria(pl.LightningModule):
    def __init__(self, tokenizer, dataloader, lr=2e-4, warmup_steps=10):
        super().__init__()
        self.tokenizer = tokenizer
        self.model = AutoModelForCausalLM.from_pretrained("loubb/aria-medium-base", trust_remote_code=True)
        self.lr = lr
        self.warmup_steps = warmup_steps
        self.dataloader = dataloader

    def forward(self, input_ids, attention_mask=None, labels=None):
        return self.model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)

    def training_step(self, batch, batch_idx):
        outputs = self(**batch)
        # Handle both tuple and object returns from PEFT models
        if isinstance(outputs, tuple):
            loss = outputs[0]
        else:
            loss = outputs.loss
        self.log("train_loss", loss)
        return loss

    def validation_step(self, batch, batch_idx):
        outputs = self(**batch)
        # Handle both tuple and object returns from PEFT models
        if isinstance(outputs, tuple):
            val_loss = outputs[0]
        else:
            val_loss = outputs.loss
        self.log("val_loss", val_loss, prog_bar=True, sync_dist=True)
        return val_loss

    def configure_optimizers(self):
        # Not needed for inference
        pass

    def to_lora(self):
        # FREEZE WEIGHTS
        for param in self.model.parameters():
            param.requires_grad = False

        # LoRA with the correct target modules for ARIA
        config = LoraConfig(
            r=32,
            lora_alpha=64,
            lora_dropout=0.05,
            bias="none",
            task_type=TaskType.CAUSAL_LM,
            target_modules = [
                "mixed_qkv",
                "att_proj_linear",
                "ff_gate_proj",
                "ff_up_proj",
                "ff_down_proj"
            ]
        )
        self.model = get_peft_model(self.model, config)