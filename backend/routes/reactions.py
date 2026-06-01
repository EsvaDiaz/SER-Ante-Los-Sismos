from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict
from backend.models import Reaction, UserInDB
from backend.database import database
from backend.routes.auth import get_current_user

router = APIRouter()

@router.post("/{post_id}")
async def toggle_reaction(post_id: str, emoji: str, current_user: UserInDB = Depends(get_current_user)):
    existing_reaction = await database.reactions.find_one({
        "post_id": post_id,
        "user_id": current_user.email
    })
    
    if existing_reaction:
        if existing_reaction["emoji"] == emoji:
            # If same emoji, remove it (toggle off)
            await database.reactions.delete_one({"_id": existing_reaction["_id"]})
            return {"status": "removed"}
        else:
            # Change emoji
            await database.reactions.update_one(
                {"_id": existing_reaction["_id"]},
                {"$set": {"emoji": emoji}}
            )
            return {"status": "updated"}
    else:
        # Add new reaction
        new_reaction = Reaction(post_id=post_id, user_id=current_user.email, emoji=emoji)
        await database.reactions.insert_one(new_reaction.model_dump())
        return {"status": "added"}

@router.get("/{post_id}")
async def get_reactions(post_id: str):
    reactions = await database.reactions.find({"post_id": post_id}).to_list(length=1000)
    
    # Aggregate counts by emoji
    counts: Dict[str, int] = {}
    users: Dict[str, List[str]] = {}
    
    for r in reactions:
        emoji = r.get("emoji")
        if emoji not in counts:
            counts[emoji] = 0
            users[emoji] = []
        counts[emoji] += 1
        users[emoji].append(r.get("user_id"))
        
    return {
        "counts": counts,
        "users": users
    }
