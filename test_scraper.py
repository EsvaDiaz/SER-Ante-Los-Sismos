import asyncio
from backend.services.scraper_service import scrape_latest_earthquakes

async def test():
    print("Running scraper test...")
    res = await scrape_latest_earthquakes()
    print("Scraper result:", res)
    if res:
        for eq in res:
            print("Title/Desc:", eq.location, eq.time, eq.magnitude)

if __name__ == "__main__":
    asyncio.run(test())
