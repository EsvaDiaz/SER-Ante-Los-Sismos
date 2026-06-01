from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from backend.models import PostSurvey, UserInDB, UserRole
from backend.database import database
from backend.routes.auth import get_current_user, get_current_admin
from pydantic import BaseModel

router = APIRouter()

class SurveySubmit(BaseModel):
    emoji_rating: Optional[str] = None
    liked_most: Optional[str] = None
    recommendation: Optional[str] = None

@router.post("/{post_id}")
async def submit_survey(post_id: str, survey: SurveySubmit, current_user: UserInDB = Depends(get_current_user)):
    existing_survey = await database.post_surveys.find_one({
        "post_id": post_id,
        "user_id": current_user.email
    })
    
    if existing_survey:
        raise HTTPException(status_code=400, detail="You have already submitted a survey for this post")
        
    new_survey = PostSurvey(
        post_id=post_id,
        user_id=current_user.email,
        emoji_rating=survey.emoji_rating,
        liked_most=survey.liked_most,
        recommendation=survey.recommendation
    )
    
    await database.post_surveys.insert_one(new_survey.model_dump())
    return {"status": "submitted"}

@router.get("/{post_id}/mine")
async def get_my_survey(post_id: str, current_user: UserInDB = Depends(get_current_user)):
    survey = await database.post_surveys.find_one({
        "post_id": post_id,
        "user_id": current_user.email
    })
    
    if not survey:
        return {"submitted": False}
        
    survey["_id"] = str(survey["_id"])
    return {"submitted": True, "survey": survey}

@router.get("/{post_id}/summary")
async def get_survey_summary(post_id: str, current_admin: UserInDB = Depends(get_current_admin)):
    surveys = await database.post_surveys.find({"post_id": post_id}).to_list(length=1000)
    
    ratings_count = {}
    liked_most_responses = []
    recommendation_responses = []
    
    for s in surveys:
        if s.get("emoji_rating"):
            emoji = s["emoji_rating"]
            ratings_count[emoji] = ratings_count.get(emoji, 0) + 1
            
        if s.get("liked_most") and s["liked_most"].strip():
            liked_most_responses.append({
                "user": s["user_id"],
                "text": s["liked_most"]
            })
            
        if s.get("recommendation") and s["recommendation"].strip():
            recommendation_responses.append({
                "user": s["user_id"],
                "text": s["recommendation"]
            })
            
    return {
        "total_responses": len(surveys),
        "ratings_count": ratings_count,
        "liked_most": liked_most_responses,
        "recommendations": recommendation_responses
    }
