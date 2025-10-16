from functools import wraps
from contextlib import contextmanager
from typing import Generator, ParamSpec, TypeVar, Concatenate

from collections.abc import Callable

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

# Database configuration
# Use absolute path to store the database file in the backend directory
import os

# Get the backend directory path
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BACKEND_DIR, "app.db")

# SQLite URL with absolute path
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Context manager for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


P = ParamSpec('P')
T = TypeVar('T')

def with_session(func: Callable[Concatenate[Session, P], T]) -> Callable[P, T]:
    """Decorator that injects a database session into the function."""
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        with get_db() as db:
            return func(db, *args, **kwargs)
    return wrapper