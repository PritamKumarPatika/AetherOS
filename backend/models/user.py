from db import get_collection
from werkzeug.security import generate_password_hash, check_password_hash

users = get_collection("users")

DEFAULT_USER = {
    "name": "Alex Johnson",
    "email": "alex@aetheros.io",
    "password": generate_password_hash("password123"), # Default password
    "avatar": "",
    "status": "online",
    "settings": {
        "focus_mode": False,
        "daily_review": True,
        "notifications": True,
        "theme": "light"
    },
    "study_profile": {
        "total_xp": 0,
        "study_level": 1,
        "total_study_time": 0,
        "topics_completed": 0,
        "current_streak": 0,
    },
    "earned_badges": []
}

def get_or_create_default_user():
    user = users.find_one({"email": DEFAULT_USER["email"]})
    if not user:
        res = users.insert_one(DEFAULT_USER.copy())
        return str(res["_id"])
    return str(user["_id"])

def register_user(name, email, password):
    if users.find_one({"email": email}):
        return None  # Email already exists
    
    new_user = {
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "avatar": "",
        "status": "online",
        "settings": {
            "focus_mode": False,
            "daily_review": True,
            "notifications": True,
            "theme": "light"
        },
        "study_profile": {
            "total_xp": 0,
            "study_level": 1,
            "total_study_time": 0,
            "topics_completed": 0,
            "current_streak": 0,
        },
        "earned_badges": []
    }
    return users.insert_one(new_user)

def verify_user(email, password):
    user = users.find_one({"email": email})
    if user and check_password_hash(user.get("password", ""), password):
        return user
    return None

def update_user_settings(user_id, settings):
    return users.update_one({"_id": user_id}, {"$set": {"settings": settings}})

def get_user(user_id):
    return users.find_one({"_id": user_id})

def update_study_profile(user_id, xp_earned=0, topics_completed=0, study_time_minutes=0):
    """Update user's study profile stats"""
    user = get_user(user_id)
    if not user:
        return None
    
    study_profile = user.get("study_profile", {})
    study_profile["total_xp"] = study_profile.get("total_xp", 0) + xp_earned
    study_profile["total_study_time"] = study_profile.get("total_study_time", 0) + study_time_minutes
    study_profile["topics_completed"] = study_profile.get("topics_completed", 0) + topics_completed
    
    # Calculate study level based on XP (every 500 XP = 1 level)
    study_profile["study_level"] = max(1, study_profile["total_xp"] // 500 + 1)
    
    return users.update_one({"_id": user_id}, {"$set": {"study_profile": study_profile}})
