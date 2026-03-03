from fastapi import APIRouter, Depends
from database import get_connection
from auth import get_current_user

router = APIRouter()


@router.get("/stats")
def get_stats(user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) as count FROM trips WHERE user_id = %s", (user["id"],))
        total_trips = cursor.fetchone()["count"]

        cursor.execute(
            "SELECT COUNT(*) as count FROM trips WHERE user_id = %s AND start_date >= CURDATE()",
            (user["id"],)
        )
        upcoming_trips = cursor.fetchone()["count"]

        cursor.execute(
            """
            SELECT SUM(e.amount) as total
            FROM expenses e
            JOIN trips t ON e.trip_id = t.id
            WHERE t.user_id = %s
            """,
            (user["id"],)
        )
        row = cursor.fetchone()
        total_spent = float(row["total"]) if row["total"] else 0

        cursor.close()
        return {
            "totalTrips": total_trips,
            "upcomingTrips": upcoming_trips,
            "totalSpent": total_spent
        }
    finally:
        conn.close()
