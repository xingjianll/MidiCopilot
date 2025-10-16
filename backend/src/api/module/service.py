from src.core.module import Module, ModuleVo


def get_modules() -> list[ModuleVo]:
    """Get all registered module subclasses."""
    return Module.registered_subclasses()