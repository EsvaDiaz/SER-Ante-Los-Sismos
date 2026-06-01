from fastapi import APIRouter
from typing import List
from backend.database import database
from backend.models import Earthquake

from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[Earthquake])
async def get_earthquakes(limit: int = 20, year: int = None, min_mag: float = None):
    query = {}
    if year:
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31, 23, 59, 59)
        query["time"] = {"$gte": start_date, "$lte": end_date}
    if min_mag is not None:
        query["magnitude"] = {"$gte": min_mag}
        
    cursor = database.earthquakes.find(query).sort("time", -1).limit(limit)
    earthquakes = await cursor.to_list(length=limit)
    return earthquakes
