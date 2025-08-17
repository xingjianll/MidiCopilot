from pydantic import BaseModel, SerializeAsAny
import uvicorn

from pydantic import BaseModel, model_serializer, model_validator, ValidatorFunctionWrapHandler
from typing import Any, Dict, List, Type, TypeVar

T = TypeVar('T')


def get_subclasses_recursive(cls: Type[T]) -> List[Type[T]]:
    """
    Returns all the subclasses of a given class.
    """
    subclasses = []
    for subclass in cls.__subclasses__():
        subclasses.append(subclass)
        subclasses.extend(get_subclasses_recursive(subclass))
    return subclasses


def get_subclass_recursive(cls: Type[T], name: str, allow_same_class: bool = False) -> Type[T]:
    # I oversimplified this to keep it short (there are checks for 0 or more than 1 subclasses
    # and we did not even use parameter `allow_same_class` to also match the parent class)
    return next(c for c in get_subclasses_recursive(cls=cls) if c.__name__ == name)


class TypeConservingModel(BaseModel):
    """
    Preserves the types of objects passed in pydantic models during serialization and de-serialization.
    This is achieved by injecting a field called "type" upon serialization.
    """

    @model_serializer(mode='wrap')
    def inject_type_on_serialization(self, handler: ValidatorFunctionWrapHandler) -> Dict[str, Any]:
        result: Dict[str, Any] = handler(self)
        if 'type' in result:
            raise ValueError('Cannot use field "type". It is reserved.')
        result['type'] = f'{self.__class__.__name__}'
        return result

    @model_validator(mode='wrap')  # noqa  # the decorator position is correct
    @classmethod
    def retrieve_type_on_deserialization(cls, value: Any,
                                         handler: ValidatorFunctionWrapHandler) -> 'TypeConservingModel':
        if isinstance(value, dict):
            # WARNING: we do not want to modify `value` which will come from the outer scope
            # WARNING2: `sub_cls(**modified_value)` will trigger a recursion, and thus we need to remove `type`
            modified_value = value.copy()
            sub_cls_name = modified_value.pop('type', None)
            if sub_cls_name is not None:
                sub_cls = get_subclass_recursive(cls=TypeConservingModel, name=sub_cls_name, allow_same_class=True)
                return sub_cls(**modified_value)
            else:
                return handler(value)
        return handler(value)

class Test1(TypeConservingModel):
    name: str
    age: int


class Test2(Test1):
    address: str
    phone: str


from fastapi import FastAPI
from typing import List

app = FastAPI()

@app.post("/test")
async def create_items(items: List[Test1 | Test2]):
    print(items)
    return items

@app.get("/item")
async def get() -> List[SerializeAsAny[Test1]]:
    i1 = Test1(name="Alice", age=30)
    i2 = Test2(name="Bob", age=25, address="123 Street", phone="123-456-7890")
    return [i1, i2]

if __name__ == "__main__":
    uvicorn.run(app)