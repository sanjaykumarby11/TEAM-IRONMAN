import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import initialize_database
from app.routes import dashboard, employees, tasks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Employee Task Management API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(employees.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def startup():
    try:
        initialize_database()
    except Exception:
        logger.exception("Database initialization failed.")
        raise


@app.exception_handler(Exception)
async def unexpected_error_handler(_request: Request, exception: Exception):
    logger.exception("Unexpected API error: %s", exception)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


@app.get("/")
def health_check():
    return {"message": "Employee Task Management API is running."}
