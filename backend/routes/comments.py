from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from backend.database import database
from bson import ObjectId

router = APIRouter()

# Modelo de Respuesta Simple
class CommentModel(BaseModel):
    id: str
    user: str
    text: str
    time: datetime

class CreateComment(BaseModel):
    user: str
    text: str

@router.get("/", response_model=List[CommentModel])
async def get_comments(limit: int = 50):
    cursor = database.comments.find({}).sort("time", -1).limit(limit)
    rows = await cursor.to_list(length=limit)
    
    comments = []
    for r in rows:
        r['id'] = str(r['_id'])
        del r['_id']
        comments.append(CommentModel(**r))
    return comments

@router.post("/", response_model=CommentModel)
async def create_comment(comment: CreateComment):
    new_comment = {
        "user": comment.user,
        "text": comment.text,
        "time": datetime.now()
    }
    result = await database.comments.insert_one(new_comment)
    new_comment['id'] = str(result.inserted_id)
    return CommentModel(**new_comment)

@router.delete("/{comment_id}")
async def delete_comment(comment_id: str):
    result = await database.comments.delete_one({"_id": ObjectId(comment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Deleted successfully"}
