import inspect
from abc import ABC, abstractmethod
from typing import TypedDict, Type, get_type_hints, Any
from pydantic import BaseModel

from src.core.runnable import Runnable

class ModuleVo(BaseModel):
    name: str
    description: str
    inputs: dict[str, str]
    outputs: dict[str, str]

class Module[**P, O: TypedDict](Runnable[P, O]):
    @classmethod
    def register(cls) -> bool:
        return True

    @classmethod
    def name(cls) -> str:
        return str(cls.__name__)

    @classmethod
    @abstractmethod
    def description(cls) -> str:
        raise NotImplementedError()

    @classmethod
    def registered_subclasses(cls) -> list[ModuleVo]:
        """Return all non-abstract subclasses with their type signatures (as strings)."""
        from src.core.modules.aria_base import AriaBase
        from src.core.modules.aria_chopin import AriaChopin
        from src.core.modules.aria_harmonization import Harmonizer
        from src.core.modules.aria_gen import AriaGen

        modules: list[ModuleVo] = []

        def stringify(type_map: dict[str, Type]) -> dict[str, str]:
            result = {}
            for k, v in type_map.items():
                # Handle Optional types by checking for Union origin
                if hasattr(v, '__origin__'):
                    import typing
                    # Check if it's a Union type
                    if v.__origin__ is typing.Union:
                        args = getattr(v, '__args__', ())
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

        def walk(subclass: Type["Module"]) -> list[ModuleVo]:
            if not inspect.isabstract(subclass):
                try:
                    params, returns = subclass.get_sig()
                    vo = ModuleVo(name=subclass.__name__, description=subclass.description(), inputs=stringify(params), outputs=stringify(returns))
                    modules.append(vo)
                except Exception as e:
                    raise e

            for child in subclass.__subclasses__():
                walk(child)

        for child in cls.__subclasses__():
            walk(child)

        return modules


# example
# class Thing(TypedDict):
#     rt1: float
#     rt2: float
#
#
# class Workflow(Module):
#     @classmethod
#     def description(cls) -> str:
#         return "Workflow"
#     def run(self, a: int, b: str) -> Thing:
#         ...
#
#
# if __name__ == "__main__":
#     w = Workflow()
#     print(Module.registered_subclasses())
