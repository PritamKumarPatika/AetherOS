from db import get_collection
from datetime import datetime

subjects = get_collection("subjects")
topics = get_collection("topics")
notes = get_collection("study_notes")
revisions = get_collection("revisions")
goals = get_collection("study_goals")
streaks = get_collection("study_streaks")
learning_paths = get_collection("learning_paths")
badges = get_collection("badges")

# ---- Subjects ----
def create_subject(data, user_id):
    subject = {
        "user_id": user_id,
        "name": data.get("name", ""),
        "exam_date": data.get("exam_date", ""),
        "progress": data.get("progress", 0),
        "color": data.get("color", "#6C5CE7"),
        "description": data.get("description", ""),
        "alerts": data.get("alerts", []),
        "created_at": datetime.utcnow().isoformat(),
    }
    return subjects.insert_one(subject)

def get_all_subjects(user_id):
    return subjects.find({"user_id": user_id})

def get_subject(sid, user_id):
    return subjects.find_one({"_id": sid, "user_id": user_id})

def update_subject(sid, user_id, data):
    return subjects.update_one({"_id": sid, "user_id": user_id}, {"$set": data})

def delete_subject(sid, user_id):
    # Also delete related topics, notes, goals
    topics.delete_many({"subject_id": sid, "user_id": user_id})
    notes.delete_many({"subject_id": sid, "user_id": user_id})
    goals.delete_many({"subject_id": sid, "user_id": user_id})
    return subjects.delete_one({"_id": sid, "user_id": user_id})

# ---- Topics ----
def create_topic(data, user_id):
    topic = {
        "user_id": user_id,
        "subject_id": data.get("subject_id", ""),
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "status": data.get("status", "Not Started"),
        "difficulty": data.get("difficulty", "Medium"),
        "resources": data.get("resources", []),
        "notes_content": data.get("notes_content", ""),
        "subtopics": data.get("subtopics", []),
        "revision_count": data.get("revision_count", 0),
        "last_revised": data.get("last_revised", ""),
        "next_revision": data.get("next_revision", ""),
        "created_at": datetime.utcnow().isoformat(),
    }
    return topics.insert_one(topic)

def get_topics_by_subject(subject_id, user_id):
    return topics.find({"subject_id": subject_id, "user_id": user_id})

def get_topic(tid, user_id):
    return topics.find_one({"_id": tid, "user_id": user_id})

def update_topic(tid, user_id, data):
    return topics.update_one({"_id": tid, "user_id": user_id}, {"$set": data})

def delete_topic(tid, user_id):
    notes.delete_many({"topic_id": tid, "user_id": user_id})
    return topics.delete_one({"_id": tid, "user_id": user_id})

# ---- Notes ----
def create_note(data, user_id):
    note = {
        "user_id": user_id,
        "subject_id": data.get("subject_id", ""),
        "topic_id": data.get("topic_id", ""),
        "title": data.get("title", ""),
        "content": data.get("content", ""),
        "is_pinned": data.get("is_pinned", False),
        "tags": data.get("tags", []),
        "attachments": data.get("attachments", []),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    return notes.insert_one(note)

def get_notes_by_subject(subject_id, user_id):
    return notes.find({"subject_id": subject_id, "user_id": user_id})

def get_all_notes(user_id):
    return notes.find({"user_id": user_id})

def get_note(nid, user_id):
    return notes.find_one({"_id": nid, "user_id": user_id})

def update_note(nid, user_id, data):
    data["updated_at"] = datetime.utcnow().isoformat()
    return notes.update_one({"_id": nid, "user_id": user_id}, {"$set": data})

def delete_note(nid, user_id):
    return notes.delete_one({"_id": nid, "user_id": user_id})

# ---- Goals ----
def create_goal(data, user_id):
    goal = {
        "user_id": user_id,
        "subject_id": data.get("subject_id", ""),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "status": data.get("status", "Pending"),
        "priority": data.get("priority", "normal"),
        "due_date": data.get("due_date", ""),
        "created_at": datetime.utcnow().isoformat(),
    }
    return goals.insert_one(goal)

def get_all_goals(user_id):
    return goals.find({"user_id": user_id})

def get_goals_by_subject(subject_id, user_id):
    return goals.find({"subject_id": subject_id, "user_id": user_id})

def get_goal(gid, user_id):
    return goals.find_one({"_id": gid, "user_id": user_id})

def update_goal(gid, user_id, data):
    return goals.update_one({"_id": gid, "user_id": user_id}, {"$set": data})

def delete_goal(gid, user_id):
    return goals.delete_one({"_id": gid, "user_id": user_id})

# ---- Streaks ----
def log_streak(user_id, minutes):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    existing = streaks.find_one({"user_id": user_id, "date": today})
    if existing:
        new_minutes = existing.get("minutes", 0) + minutes
        streaks.update_one({"_id": existing["_id"]}, {"$set": {"minutes": new_minutes}})
    else:
        streaks.insert_one({"user_id": user_id, "date": today, "minutes": minutes})
    return True

def get_streaks(user_id, days=30):
    from datetime import timedelta
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    all_streaks = streaks.find({"user_id": user_id})
    return [s for s in all_streaks if s.get("date", "") >= cutoff]

def get_current_streak(user_id):
    from datetime import timedelta
    streak_count = 0
    check_date = datetime.utcnow()
    for _ in range(365):
        d_str = check_date.strftime("%Y-%m-%d")
        entry = streaks.find_one({"user_id": user_id, "date": d_str})
        if entry and entry.get("minutes", 0) > 0:
            streak_count += 1
            check_date -= timedelta(days=1)
        else:
            break
    return streak_count

# ---- Revisions (spaced repetition) ----
def create_revision(data, user_id):
    revision = {
        "user_id": user_id,
        "topic_id": data.get("topic_id", ""),
        "subject_id": data.get("subject_id", ""),
        "scheduled_date": data.get("scheduled_date", ""),
        "completed": data.get("completed", False),
        "quality": data.get("quality", 3),
        "interval_days": data.get("interval_days", 1),
    }
    return revisions.insert_one(revision)

def get_revisions_by_date(date_str, user_id):
    return revisions.find({"scheduled_date": date_str, "user_id": user_id})

def get_revisions_by_topic(topic_id, user_id):
    return revisions.find({"topic_id": topic_id, "user_id": user_id})

def update_revision(rid, user_id, data):
    return revisions.update_one({"_id": rid, "user_id": user_id}, {"$set": data})

# ---- Awards/Badges System ----
def get_all_badges():
    """Get all badge definitions"""
    return list(badges.find({}))

def award_user_badge(user_id, badge_id):
    """Award a badge to a user"""
    from models.user import users
    badge = badges.find_one({"_id": badge_id})
    if not badge:
        return None
    
    user = users.find_one({"_id": user_id})
    earned_badges = user.get("earned_badges", [])
    
    # Don't award duplicate
    if any(b["badge_id"] == badge_id for b in earned_badges):
        return {"duplicate": True}
    
    earned_badges.append({
        "badge_id": str(badge_id),
        "badge_name": badge["name"],
        "badge_icon": badge["icon"],
        "earned_at": datetime.utcnow().isoformat(),
    })
    
    users.update_one({"_id": user_id}, {"$set": {"earned_badges": earned_badges}})
    return {"success": True, "badge": badge["name"]}

def get_user_badges(user_id):
    """Get all badges earned by a user"""
    from models.user import users
    user = users.find_one({"_id": user_id})
    return user.get("earned_badges", []) if user else []

def untracked_badges(user_id):
    """Get untracked badges for a user"""
    user_badges = get_user_badges(user_id)
    earned_badge_ids = {b["badge_id"] for b in user_badges}
    
    pending = []
    
    # Check topics completed badge
    all_notes = list(notes.find({"user_id": user_id}))
    completed_topics = list(topics.find({"user_id": user_id, "status": "Completed"}))
    
    badge_defs = get_all_badges()
    for badge in badge_defs:
        if str(badge["_id"]) in earned_badge_ids:
            continue
            
        criteria = badge.get("criteria", {})
        badge_type = criteria.get("type")
        
        if badge_type == "first_note" and all_notes:
            pending.append(badge)
        elif badge_type == "topics_completed" and len(completed_topics) >= criteria.get("count", 5):
            pending.append(badge)
        elif badge_type == "study_streak" and len(all_notes) >= criteria.get("count", 10):
            pending.append(badge)
    
    return pending

# ---- Learning Paths ----
def create_learning_path(data, user_id):
    checkpoints = data.get("checkpoints", [])
    for i, cp in enumerate(checkpoints):
        cp["order"] = i
        cp["completed"] = cp.get("completed", False)
        cp["reward_xp"] = cp.get("reward_xp", 50)
    path = {
        "user_id": user_id,
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "subject_id": data.get("subject_id", ""),
        "checkpoints": checkpoints,
        "resources": data.get("resources", []),
        "total_xp": 0,
        "status": "Not Started",
        "created_at": datetime.utcnow().isoformat(),
    }
    return learning_paths.insert_one(path)

def get_all_paths(user_id):
    return list(learning_paths.find({"user_id": user_id}))

def get_path(pid, user_id):
    return learning_paths.find_one({"_id": pid, "user_id": user_id})

def update_path(pid, user_id, data):
    return learning_paths.update_one({"_id": pid, "user_id": user_id}, {"$set": data})

def delete_path(pid, user_id):
    return learning_paths.delete_one({"_id": pid, "user_id": user_id})

def complete_checkpoint(pid, user_id, cp_index):
    path = learning_paths.find_one({"_id": pid, "user_id": user_id})
    if not path:
        return None
    cps = path.get("checkpoints", [])
    if 0 <= cp_index < len(cps) and not cps[cp_index].get("completed"):
        cps[cp_index]["completed"] = True
        xp_earned = cps[cp_index].get("reward_xp", 50)
        total_xp = path.get("total_xp", 0) + xp_earned
        all_done = all(c.get("completed") for c in cps)
        status = "Completed" if all_done else "In Progress"
        learning_paths.update_one({"_id": pid}, {"$set": {"checkpoints": cps, "total_xp": total_xp, "status": status}})
        return {"xp_earned": xp_earned, "total_xp": total_xp, "status": status, "all_done": all_done}
    return None
