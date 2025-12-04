from pathlib import Path
from typing import Type

from peft import LoraConfig, TaskType, get_peft_model

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def stringify(type_map: dict[str, Type]) -> dict[str, str]:
    result = {}
    for k, v in type_map.items():
        # Handle Optional types by checking for Union origin
        if hasattr(v, "__origin__"):
            import typing

            # Check if it's a Union type
            if v.__origin__ is typing.Union:
                args = getattr(v, "__args__", ())
                if len(args) == 2 and type(None) in args:
                    # It's Optional[T], extract T
                    inner_type = args[0] if args[1] is type(None) else args[1]
                    inner_str = stringify_type(inner_type)
                    result[k] = f"Optional[{inner_str}]"
                else:
                    # Generic Union, fall back to str representation
                    result[k] = str(v)
            else:
                # Other generic types
                result[k] = stringify_type(v)
        else:
            # Regular type, use __name__ if available
            result[k] = getattr(v, "__name__", str(v))
    return result


def stringify_type(t: Type) -> str:
    """Convert a single type to string, handling special cases like Literal."""
    if hasattr(t, "__origin__"):
        import typing
        
        # Handle Literal types
        if hasattr(typing, "Literal") and t.__origin__ is getattr(typing, "Literal", None):
            args = getattr(t, "__args__", ())
            # Format as Literal['a', 'b', 'c']
            literal_values = ", ".join(repr(arg) for arg in args)
            return f"Literal[{literal_values}]"
        
        # Handle other generic types
        origin = getattr(t.__origin__, "__name__", str(t.__origin__))
        args = getattr(t, "__args__", ())
        if args:
            arg_strs = [stringify_type(arg) for arg in args]
            return f"{origin}[{', '.join(arg_strs)}]"
        return origin
    
    # Regular type, use __name__ if available
    return getattr(t, "__name__", str(t))


def to_lora(self):
    # FREEZE WEIGHTS
    for param in self.model.parameters():
        param.requires_grad = False

    # LoRa
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
    return get_peft_model(self.model, config)