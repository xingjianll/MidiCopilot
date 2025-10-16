from fastapi import FastAPI
from src.api.workflow import router

app = FastAPI()
app.include_router(router)