import inspect
from abc import ABC, abstractmethod
from typing import TypedDict, Type, get_type_hints, Any


class Runnable[**P, O: TypedDict](ABC):
    @abstractmethod
    def run(self, args: P.args, kwargs: P.kwargs) -> O:
        ...

    @classmethod
    def get_sig(cls) -> tuple[dict[str, Type], dict[str, Type]]:
        sig = inspect.signature(cls.run)
        hints = get_type_hints(cls.run)

        # --- Collect argument type hints ---
        param_types: dict[str, Type] = {}
        for name, param in sig.parameters.items():
            if name == "self":
                continue
            t = hints.get(name, param.annotation)
            if t is inspect._empty:
                t = Any
            param_types[name] = t

        # --- Process return type ---
        return_annotation = hints.get("return", Any)

        # If it's a TypedDict subclass, extract its annotations
        if isinstance(return_annotation, type) and issubclass(return_annotation, dict):
            # typed dict classes have __annotations__
            return_types = getattr(return_annotation, "__annotations__", {})
        else:
            return_types = {"return": return_annotation}

        return param_types, return_types