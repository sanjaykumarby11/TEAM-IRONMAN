from fastapi import APIRouter

from app.database import get_connection

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("")
def list_employees():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, name, email, role FROM employees ORDER BY name"
        ).fetchall()
        return [dict(row) for row in rows]
