from pathlib import Path
from typing import Type

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
                    inner_name = getattr(inner_type, "__name__", str(inner_type))
                    result[k] = f"Optional[{inner_name}]"
                else:
                    # Generic Union, fall back to str representation
                    result[k] = str(v)
            else:
                # Other generic types, fall back to str
                result[k] = str(v)
        else:
            # Regular type, use __name__ if available
            result[k] = getattr(v, "__name__", str(v))
    return result