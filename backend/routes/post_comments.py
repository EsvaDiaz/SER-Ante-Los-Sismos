from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from backend.models import PostComment, UserInDB, UserRole
from backend.database import database
from backend.routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class CommentCreate(BaseModel):
    content: str

@router.post("/{post_id}")
async def create_comment(post_id: str, comment: CommentCreate, current_user: UserInDB = Depends(get_current_user)):
    new_comment = PostComment(
        post_id=post_id,
        user_id=current_user.email,
        username=current_user.full_name or current_user.email,
        content=comment.content
    )
    result = await database.post_comments.insert_one(new_comment.model_dump())
    new_comment_dict = new_comment.model_dump()
    new_comment_dict["_id"] = str(result.inserted_id)
    return new_comment_dict

@router.get("/{post_id}")
async def get_comments(post_id: str):
    cursor = database.post_comments.find({"post_id": post_id}).sort("timestamp", -1)
    comments = await cursor.to_list(length=100)
    for comment in comments:
        comment["_id"] = str(comment["_id"])
        
        # Obtener avatar del usuario si es posible
        user = await database.users.find_one({"username": comment.get("user_id")})
        if user and user.get("avatar_url"):
            comment["avatar_url"] = user.get("avatar_url")
            
    return comments

@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, current_user: UserInDB = Depends(get_current_user)):
    from bson.objectid import ObjectId
    try:
        obj_id = ObjectId(comment_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid comment ID")
        
    comment = await database.post_comments.find_one({"_id": obj_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    if comment["user_id"] != current_user.email and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    await database.post_comments.delete_one({"_id": obj_id})
    return {"status": "deleted"}
