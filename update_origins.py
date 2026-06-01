import asyncio
from backend.database import database

async def update_origins():
    print("Updating existing origins...")
    result = await database.earthquakes.update_many(
        {"source": {"$regex": "CENAIS", "$options": "i"}},
        {"$set": {"source": "Base de Datos Histórica"}}
    )
    print(f"Matched {result.matched_count} documents, updated {result.modified_count} documents.")

if __name__ == "__main__":
    asyncio.run(update_origins())
