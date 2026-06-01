import asyncio
from backend.database import database

async def main():
    # Elimina sismos de magnitud 0.0 (mal parseados)
    result = await database.earthquakes.delete_many({"magnitude": 0.0})
    print(f"Eliminados {result.deleted_count} sismos incompletos de la base de datos.")

if __name__ == "__main__":
    asyncio.run(main())
