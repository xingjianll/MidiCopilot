from datetime import datetime
from sqlalchemy.orm.session import Session

from src.database import with_session
from src.api.run.table.run import Run


@with_session
def create_run(db: Session, workflow_id: int | None = None) -> Run:
    db_run = Run(workflow_id=workflow_id, created_at=datetime.utcnow())
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


@with_session
def get_run(db: Session, run_id: int) -> Run | None:
    return db.query(Run).filter(Run.id == run_id).first()


@with_session
def get_runs(db: Session, skip: int = 0, limit: int = 100) -> list[Run]:
    return db.query(Run).offset(skip).limit(limit).all()


@with_session
def update_run_duration(db: Session, run_id: int, duration: float) -> Run | None:
    db_run = db.query(Run).filter(Run.id == run_id).first()
    if db_run is None:
        return None

    db_run.duration = duration
    db.commit()
    db.refresh(db_run)

    return db_run


@with_session
def delete_run(db: Session, run_id: int) -> bool:
    db_run = db.query(Run).filter(Run.id == run_id).first()
    if db_run is None:
        return False

    db.delete(db_run)
    db.commit()

    return True