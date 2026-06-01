from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List
from backend.database import database
from backend.models import Post, PostType
from datetime import datetime
from backend.services.bot_service import broadcast_message

router = APIRouter()

@router.get("/")
async def get_posts(limit: int = 5, type: PostType = None):
    query = {}
    if type:
        query["type"] = type.value
        
    posts_cursor = database.posts.find(query).sort("created_at", -1).limit(limit)
    posts = await posts_cursor.to_list(length=limit)
    
    # Serializar _id de MongoDB a string para el frontend
    for post in posts:
        post['_id'] = str(post['_id'])
    
    return posts

@router.post("/", response_model=Post)
async def create_post(post: Post, background_tasks: BackgroundTasks):
    new_post = post.model_dump()
    result = await database.posts.insert_one(new_post)
    
    # Broadcast a Telegram
    bot_msg = f"📣 *NUEVA PUBLICACIÓN: {post.title}*\n\n{post.content[:300]}{'...' if len(post.content) > 300 else ''}"
    if getattr(post, 'video_url', None):
        bot_msg += f"\n\n🎬 _Esta publicación incluye un video. Ábrela en el bot para verlo._"
    
    background_tasks.add_task(broadcast_message, bot_msg)
    
    return post