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
        modules: list[ModuleVo] = []

        def stringify(type_map: dict[str, Type]) -> dict[str, str]:
            return {k: getattr(v, "__name__", str(v)) for k, v in type_map.items()}

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
class Thing(TypedDict):
    rt1: float
    rt2: float


class Workflow(Module):
    @classmethod
    def description(cls) -> str:
        return "Workflow"
    def run(self, a: int, b: str) -> Thing:
        ...


if __name__ == "__main__":
    w = Workflow()
    print(Module.registered_subclasses())
