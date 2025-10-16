from fastapi import FastAPI
from src.workflow import router

app = FastAPI()
app.include_router(router)