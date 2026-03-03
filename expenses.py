from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_connection
from auth import get_current_user

router = APIRouter()


class ExpenseCreate(BaseModel):
    trip_id: int
    category: str
    amount: float
    description: Optional[str] = None
    date: str


@router.post("")
def add_expense(body: ExpenseCreate, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id FROM trips WHERE id = %s AND user_id = %s", (body.trip_id, user["id"])
        )
        trip = cursor.fetchone()
        if not trip:
            raise HTTPException(status_code=403, detail="Unauthorized")

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO expenses (trip_id, category, amount, description, date) VALUES (%s, %s, %s, %s, %s)",
            (body.trip_id, body.category, body.amount, body.description, body.date)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        return {"id": new_id, **body.model_dump()}
    finally:
        conn.close()
