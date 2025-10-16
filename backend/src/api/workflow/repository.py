from sqlalchemy.orm.session import Session

from core.workflow import WorkflowVo
from database import with_session


@with_session
def create_workflow(db: Session, workflow: WorkflowVo):
    ...