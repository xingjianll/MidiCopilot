from sqlalchemy.orm.session import Session

from src.database import with_session
from src.api.sample.table.sample import Sample
from src.api.sample.dto.sample_dto import SampleCreateRequest


@with_session
def create_sample(db: Session, sample_request: SampleCreateRequest) -> Sample:
    db_sample = Sample(type=sample_request.type, path=sample_request.path)
    db.add(db_sample)
    db.commit()
    db.refresh(db_sample)
    return db_sample


@with_session
def get_sample(db: Session, sample_id: int) -> Sample | None:
    return db.query(Sample).filter(Sample.id == sample_id).first()


@with_session
def get_samples(db: Session, skip: int = 0, limit: int = 100) -> list[Sample]:
    return db.query(Sample).offset(skip).limit(limit).all()


@with_session
def update_sample(db: Session, sample_id: int, sample_request: SampleCreateRequest) -> Sample | None:
    db_sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if db_sample is None:
        return None

    db_sample.type = sample_request.type
    db_sample.path = sample_request.path
    db.commit()
    db.refresh(db_sample)

    return db_sample


@with_session
def delete_sample(db: Session, sample_id: int) -> bool:
    db_sample = db.query(Sample).filter(Sample.id == sample_id).first()
    if db_sample is None:
        return False

    db.delete(db_sample)
    db.commit()

    return True