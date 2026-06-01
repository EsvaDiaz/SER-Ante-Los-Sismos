from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from backend.services.bot_service import start_bot, stop_bot
from backend.services.scraper_service import scrape_latest_earthquakes

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicio
    await start_bot()
    
    # Programador para el scrapping:
    async def scheduler():
        while True:
            await scrape_latest_earthquakes()
            await asyncio.sleep(300) # Cada 5 minutos
    
    task = asyncio.create_task(scheduler())
    yield
    # Apagado
    await stop_bot()
    task.cancel()

app = FastAPI(title="Seismic Event Reporter API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # No Cambiar
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.routes import auth, posts, earthquakes, comments, ai, reactions, post_comments, surveys, media

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(posts.router, prefix="/posts", tags=["posts"])
app.include_router(earthquakes.router, prefix="/earthquakes", tags=["earthquakes"])
app.include_router(comments.router, prefix="/comments", tags=["comments"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(reactions.router, prefix="/reactions", tags=["reactions"])
app.include_router(post_comments.router, prefix="/post-comments", tags=["post_comments"])
app.include_router(surveys.router, prefix="/surveys", tags=["surveys"])
app.include_router(media.router, prefix="/media", tags=["media"])

# Montar la carpeta estática para servir imágenes y videos locales (Fase 3)
from fastapi.staticfiles import StaticFiles
import os

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

@app.get("/")
async def root():
    return {"message": "Welcome to SER API"}

# Chequear Estado
@app.get("/health")
async def health_check():
    return {"status": "ok"}
