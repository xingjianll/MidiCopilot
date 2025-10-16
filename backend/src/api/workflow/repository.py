from sqlalchemy.orm.session import Session

from src.core.workflow import WorkflowVo
from src.database import with_session
from src.api.workflow.table.workflow import Workflow


@with_session
def create_workflow(db: Session, workflow: WorkflowVo) -> Workflow:
    workflow_json = workflow.model_dump_json()

    db_workflow = Workflow(json=workflow_json)
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)

    return db_workflow