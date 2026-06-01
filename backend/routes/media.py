from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from backend.routes.auth import get_current_admin
import os
import uuid

router = APIRouter()

# Apunta a project_root/uploads (2 niveles arriba desde backend/routes/)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads")

ALLOWED = {
    "image": {".jpg", ".jpeg", ".png", ".gif", ".webp"},
    "video": {".mp4", ".webm", ".mov", ".avi", ".mkv"},
    "audio": {".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"},
    "file":  {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip"},
}
MAX_SIZE = 100 * 1024 * 1024  # 100 MB


def _detect_type(ext: str) -> str | None:
    for media_type, exts in ALLOWED.items():
        if ext in exts:
            return media_type
    return None


@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_admin=Depends(get_current_admin),
):
    """
    Sube un archivo multimedia (imagen, vídeo o documento) al servidor.
    Solo accesible para administradores.
    Devuelve la URL pública relativa al servidor.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nombre de archivo vacío.")

    ext = os.path.splitext(file.filename)[1].lower()
    media_type = _detect_type(ext)
    if not media_type:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido: '{ext}'. "
                   f"Formatos aceptados: imágenes (jpg, png, gif, webp), "
                   f"vídeos (mp4, webm, mov, avi), audio (mp3, wav, ogg, flac, aac, m4a) "
                   f"y documentos (pdf, doc, pptx, xlsx, zip).",
        )

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Archivo demasiado grande. El límite es 100 MB.",
        )

    subdir = os.path.join(UPLOAD_DIR, media_type)
    os.makedirs(subdir, exist_ok=True)

    unique_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(subdir, unique_name)

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    url = f"/static/{media_type}/{unique_name}"
    return {
        "url": url,
        "type": media_type,
        "original_name": file.filename,
        "size_bytes": len(content),
    }
