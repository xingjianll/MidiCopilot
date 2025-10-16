from sqlalchemy.orm.session import Session

from src.core.workflow import WorkflowVo
from src.database import with_session
from src.api.workflow.table.workflow import Workflow


@with_session
def create_workflow(db: Session, workflow: WorkflowVo) -> Workflow:
    workflow_json = workflow.model_dump_json()

    db_workflow = Workflow(name=workflow.name, json=workflow_json)
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)

    return db_workflow


@with_session
def get_workflow(db: Session, workflow_id: int) -> Workflow | None:
    return db.query(Workflow).filter(Workflow.id == workflow_id).first()


@with_session
def get_workflows(db: Session, skip: int = 0, limit: int = 100) -> list[Workflow]:
    return db.query(Workflow).offset(skip).limit(limit).all()


@with_session
def update_workflow(db: Session, workflow_id: int, workflow: WorkflowVo) -> Workflow | None:
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow is None:
        return None

    workflow_json = workflow.model_dump_json()
    db_workflow.name = workflow.name
    db_workflow.json = workflow_json
    db.commit()
    db.refresh(db_workflow)

    return db_workflow


@with_session
def delete_workflow(db: Session, workflow_id: int) -> bool:
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if db_workflow is None:
        return False

    db.delete(db_workflow)
    db.commit()

    return True