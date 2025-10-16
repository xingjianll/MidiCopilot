from src.api.sample import repository
from src.api.sample.dto.sample_dto import SampleCreateRequest, Response, DeleteResponse


def create_sample(sample_request: SampleCreateRequest) -> Response:
    db_sample = repository.create_sample(sample_request)

    return Response(
        id=db_sample.id,
        type=db_sample.type,
        path=db_sample.path
    )


def get_sample(sample_id: int) -> Response | None:
    db_sample = repository.get_sample(sample_id)
    if db_sample is None:
        return None

    return Response(
        id=db_sample.id,
        type=db_sample.type,
        path=db_sample.path
    )


def get_samples(skip: int = 0, limit: int = 100) -> list[Response]:
    db_samples = repository.get_samples(skip=skip, limit=limit)

    return [
        Response(
            id=db_sample.id,
            type=db_sample.type,
            path=db_sample.path
        )
        for db_sample in db_samples
    ]


def update_sample(sample_id: int, sample_request: SampleCreateRequest) -> Response | None:
    db_sample = repository.update_sample(sample_id, sample_request)
    if db_sample is None:
        return None

    return Response(
        id=db_sample.id,
        type=db_sample.type,
        path=db_sample.path
    )


def delete_sample(sample_id: int) -> DeleteResponse | None:
    deleted = repository.delete_sample(sample_id)
    if not deleted:
        return None

    return DeleteResponse(message="Sample deleted successfully")