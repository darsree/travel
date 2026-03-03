from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import os
import json
from database import get_connection
from auth import get_current_user

router = APIRouter()


class TripCreate(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget: Optional[float] = None
    travelers: int = 1
    style: str = "Budget"


@router.get("")
def list_trips(user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM trips WHERE user_id = %s ORDER BY start_date DESC",
            (user["id"],)
        )
        rows = cursor.fetchall()
        cursor.close()
        return rows
    finally:
        conn.close()


@router.post("")
def create_trip(body: TripCreate, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO trips (user_id, destination, start_date, end_date, budget, travelers, style) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (user["id"], body.destination, body.start_date, body.end_date, body.budget, body.travelers, body.style)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        return {"id": new_id, **body.model_dump()}
    finally:
        conn.close()


@router.get("/{trip_id}")
def get_trip(trip_id: int, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM trips WHERE id = %s AND user_id = %s", (trip_id, user["id"]))
        trip = cursor.fetchone()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        cursor.execute("SELECT * FROM itineraries WHERE trip_id = %s", (trip_id,))
        itineraries = cursor.fetchall()

        cursor.execute("SELECT * FROM expenses WHERE trip_id = %s", (trip_id,))
        expenses = cursor.fetchall()

        cursor.execute("SELECT * FROM saved_places WHERE trip_id = %s", (trip_id,))
        places = cursor.fetchall()

        cursor.close()
        trip["itineraries"] = itineraries
        trip["expenses"] = expenses
        trip["places"] = places
        return trip
    finally:
        conn.close()


@router.delete("/{trip_id}")
def delete_trip(trip_id: int, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trips WHERE id = %s AND user_id = %s", (trip_id, user["id"]))
        conn.commit()
        affected = cursor.rowcount
        cursor.close()
        if affected == 0:
            raise HTTPException(status_code=404, detail="Trip not found")
        return {"success": True}
    finally:
        conn.close()


@router.post("/{trip_id}/generate-itinerary")
def generate_itinerary(trip_id: int, user=Depends(get_current_user)):
    conn = get_connection()
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM trips WHERE id = %s AND user_id = %s", (trip_id, user["id"])
        )
        trip = cursor.fetchone()
        cursor.close()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

        prompt = f"""Generate a detailed day-wise travel itinerary for a trip to {trip['destination']}.
Duration: {trip['start_date']} to {trip['end_date']}.
Budget: {trip['budget']}. Travelers: {trip['travelers']}. Style: {trip['style']}.
Respond ONLY with a valid JSON array. Each element must have:
- day_number (integer)
- activities (array of strings)
- food_suggestions (array of strings)
- transport_tips (string)
No markdown, no explanation, just the JSON array."""

        import time
        response = None
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                break
            except Exception as e:
                if "503" in str(e) and attempt < 2:
                    time.sleep(10)
                    continue
                raise
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("```", 1)[0]

        itinerary_data = json.loads(raw)

        cursor = conn.cursor()
        cursor.execute("DELETE FROM itineraries WHERE trip_id = %s", (trip_id,))
        for day in itinerary_data:
            cursor.execute(
                "INSERT INTO itineraries (trip_id, day_number, activities) VALUES (%s, %s, %s)",
                (trip_id, day["day_number"], json.dumps(day))
            )
        conn.commit()
        cursor.close()
        return itinerary_data

    except json.JSONDecodeError as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate itinerary: {str(e)}")
    finally:
        conn.close()