from flask import Blueprint, request, jsonify
from routes.auth import token_required
from db import get_collection
from datetime import datetime
from models.study import (
    create_subject, get_all_subjects, get_subject, update_subject, delete_subject,
    create_topic, get_topics_by_subject, get_topic, update_topic, delete_topic,
    create_note, get_notes_by_subject, get_all_notes, get_note, update_note, delete_note,
    create_revision, get_revisions_by_date, get_revisions_by_topic, update_revision,
    create_goal, get_all_goals, get_goals_by_subject, get_goal, update_goal, delete_goal,
    log_streak, get_streaks, get_current_streak,
    create_learning_path, get_all_paths, get_path, update_path, delete_path, complete_checkpoint,
    award_user_badge, get_user_badges, get_all_badges
)
from models.task import get_study_tasks, create_task
from models.user import update_study_profile, get_user
from utils.helpers import serialize_docs, serialize_doc
from bson import ObjectId
from bson.errors import InvalidId

study_bp = Blueprint("study", __name__)

# Error handlers
def validate_object_id(id_string):
    """Validate and convert string to ObjectId, or return as-is if valid UUID"""
    if not id_string:
        raise ValueError("ID is required")
    # Try ObjectId first (24-char hex)
    try:
        return ObjectId(id_string)
    except (InvalidId, TypeError):
        pass
    # Accept UUID-style strings (common in some inserts)
    id_str = str(id_string).strip()
    if len(id_str) >= 8 and id_str.replace('-', '').replace('_', '').isalnum():
        return id_str
    raise ValueError(f"Invalid ID format: {id_string}")

# ---- Subjects ----
@study_bp.route("/api/study/subjects", methods=["GET"])
@token_required
def list_subjects(current_user):
    try:
        subjects = list(get_all_subjects(current_user["_id"]))
        return jsonify(serialize_docs(subjects)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/subjects", methods=["POST"])
@token_required
def add_subject(current_user):
    try:
        data = request.get_json()
        if not data or not data.get("name"):
            return jsonify({"error": "Subject name is required"}), 400
        
        data["user_id"] = current_user["_id"]
        result = create_subject(data, current_user["_id"])
        return jsonify({"_id": str(result.inserted_id), "success": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/subjects/<sid>", methods=["GET"])
@token_required
def get_subj(current_user, sid):
    try:
        subject_id = validate_object_id(sid)
        subject = get_subject(subject_id, current_user["_id"])
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        return jsonify(serialize_doc(subject)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/subjects/<sid>", methods=["PUT"])
@token_required
def edit_subject(current_user, sid):
    try:
        subject_id = validate_object_id(sid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        update_subject(subject_id, current_user["_id"], data)
        subject = get_subject(subject_id, current_user["_id"])
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        return jsonify(serialize_doc(subject)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/subjects/<sid>", methods=["DELETE"])
@token_required
def remove_subject(current_user, sid):
    try:
        subject_id = validate_object_id(sid)
        delete_subject(subject_id, current_user["_id"])
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Topics ----
@study_bp.route("/api/study/topics", methods=["GET"])
@token_required
def list_all_topics(current_user):
    """Get all topics across all subjects for the current user"""
    try:
        from models.study import topics as topics_col
        from utils.helpers import serialize_docs
        all_topics = list(topics_col.find({"user_id": current_user["_id"]}))
        return jsonify(serialize_docs(all_topics)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/subjects/<sid>/topics", methods=["GET"])
@token_required
def list_topics(current_user, sid):
    try:
        subject_id = validate_object_id(sid)
        topics = list(get_topics_by_subject(subject_id, current_user["_id"]))
        return jsonify(serialize_docs(topics)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics/<tid>", methods=["GET"])
@token_required
def get_single_topic(current_user, tid):
    try:
        topic_id = validate_object_id(tid)
        topic = get_topic(topic_id, current_user["_id"])
        if not topic:
            return jsonify({"error": "Topic not found"}), 404
        return jsonify(serialize_doc(topic)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics", methods=["POST"])
@token_required
def add_topic(current_user):
    try:
        data = request.get_json()
        if not data or not data.get("name"):
            return jsonify({"error": "Topic name is required"}), 400
        if not data.get("subject_id"):
            return jsonify({"error": "Subject ID is required"}), 400
        
        data["subject_id"] = validate_object_id(data["subject_id"])
        result = create_topic(data, current_user["_id"])
        return jsonify({"_id": str(result.inserted_id), "success": True}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics/<tid>", methods=["PUT"])
@token_required
def edit_topic(current_user, tid):
    try:
        topic_id = validate_object_id(tid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        update_topic(topic_id, current_user["_id"], data)
        topic = get_topic(topic_id, current_user["_id"])
        if not topic:
            return jsonify({"error": "Topic not found"}), 404
        return jsonify(serialize_doc(topic)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics/<tid>", methods=["DELETE"])
@token_required
def remove_topic(current_user, tid):
    try:
        topic_id = validate_object_id(tid)
        delete_topic(topic_id, current_user["_id"])
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Subtopics (embedded in topic) ----
@study_bp.route("/api/study/topics/<tid>/subtopics", methods=["POST"])
@token_required
def add_subtopic(current_user, tid):
    try:
        import uuid
        topic_id = validate_object_id(tid)
        data = request.get_json()
        if not data or not data.get("name"):
            return jsonify({"error": "Subtopic name is required"}), 400
        subtopic = {
            "id": str(uuid.uuid4())[:8],
            "name": data.get("name", ""),
            "description": data.get("description", ""),
            "status": data.get("status", "Not Started"),
            "difficulty": data.get("difficulty", "Medium"),
            "notes_content": data.get("notes_content", ""),
            "created_at": datetime.utcnow().isoformat(),
        }
        topics_col = get_collection("topics")
        topics_col.update_one({"_id": topic_id, "user_id": current_user["_id"]}, {"$push": {"subtopics": subtopic}})
        return jsonify({"success": True, "subtopic": subtopic}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics/<tid>/subtopics/<sid>", methods=["PUT"])
@token_required
def update_subtopic(current_user, tid, sid):
    try:
        topic_id = validate_object_id(tid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        update_fields = {}
        for key in ["name", "description", "status", "difficulty", "notes_content"]:
            if key in data:
                update_fields[f"subtopics.$.{key}"] = data[key]
        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400
        topics_col = get_collection("topics")
        topics_col.update_one({"_id": topic_id, "user_id": current_user["_id"], "subtopics.id": sid}, {"$set": update_fields})
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics/<tid>/subtopics/<sid>", methods=["DELETE"])
@token_required
def delete_subtopic(current_user, tid, sid):
    try:
        topic_id = validate_object_id(tid)
        topics_col = get_collection("topics")
        topics_col.update_one({"_id": topic_id, "user_id": current_user["_id"]}, {"$pull": {"subtopics": {"id": sid}}})
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/topics/<tid>/notes", methods=["PUT"])
@token_required
def save_topic_notes(current_user, tid):
    try:
        topic_id = validate_object_id(tid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        update_topic(topic_id, current_user["_id"], {"notes_content": data.get("notes_content", "")})
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Notes ----
@study_bp.route("/api/study/notes", methods=["GET"])
@token_required
def list_all_notes(current_user):
    try:
        notes = list(get_all_notes(current_user["_id"]))
        return jsonify(serialize_docs(notes)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/notes/<nid>", methods=["GET"])
@token_required
def get_single_note(current_user, nid):
    try:
        note_id = validate_object_id(nid)
        note = get_note(note_id, current_user["_id"])
        if not note:
            return jsonify({"error": "Note not found"}), 404
        return jsonify(serialize_doc(note)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/subjects/<sid>/notes", methods=["GET"])
@token_required
def list_notes(current_user, sid):
    try:
        subject_id = validate_object_id(sid)
        notes = list(get_notes_by_subject(subject_id, current_user["_id"]))
        return jsonify(serialize_docs(notes)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/notes", methods=["POST"])
@token_required
def add_note(current_user):
    try:
        data = request.get_json()
        if not data or not data.get("title"):
            return jsonify({"error": "Note title is required"}), 400
        
        if data.get("subject_id"):
            data["subject_id"] = validate_object_id(data["subject_id"])
        if data.get("topic_id"):
            data["topic_id"] = validate_object_id(data["topic_id"])
        
        result = create_note(data, current_user["_id"])
        return jsonify({"_id": str(result.inserted_id), "success": True}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/notes/<nid>", methods=["PUT"])
@token_required
def edit_note(current_user, nid):
    try:
        note_id = validate_object_id(nid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        update_note(note_id, current_user["_id"], data)
        note = get_note(note_id, current_user["_id"])
        if not note:
            return jsonify({"error": "Note not found"}), 404
        return jsonify(serialize_doc(note)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/notes/<nid>", methods=["DELETE"])
@token_required
def remove_note(current_user, nid):
    try:
        note_id = validate_object_id(nid)
        delete_note(note_id, current_user["_id"])
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/notes/<nid>/pin", methods=["PATCH"])
@token_required
def toggle_note_pin(current_user, nid):
    try:
        note_id = validate_object_id(nid)
        note = get_note(note_id, current_user["_id"])
        if not note:
            return jsonify({"error": "Note not found"}), 404
        new_pin = not note.get("is_pinned", False)
        update_note(note_id, current_user["_id"], {"is_pinned": new_pin})
        return jsonify({"success": True, "is_pinned": new_pin}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Goals ----
@study_bp.route("/api/study/goals", methods=["GET"])
@token_required
def list_goals(current_user):
    try:
        sid = request.args.get("subject_id")
        if sid:
            subject_id = validate_object_id(sid)
            goals = list(get_goals_by_subject(subject_id, current_user["_id"]))
        else:
            goals = list(get_all_goals(current_user["_id"]))
        return jsonify(serialize_docs(goals)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/goals/<gid>", methods=["GET"])
@token_required
def get_single_goal(current_user, gid):
    try:
        goal_id = validate_object_id(gid)
        goal = get_goal(goal_id, current_user["_id"])
        if not goal:
            return jsonify({"error": "Goal not found"}), 404
        return jsonify(serialize_doc(goal)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/goals", methods=["POST"])
@token_required
def add_goal(current_user):
    try:
        data = request.get_json()
        if not data or not data.get("title"):
            return jsonify({"error": "Goal title is required"}), 400
        
        if data.get("subject_id"):
            data["subject_id"] = validate_object_id(data["subject_id"])
        
        result = create_goal(data, current_user["_id"])
        return jsonify({"_id": str(result.inserted_id), "success": True}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/goals/<gid>", methods=["PUT"])
@token_required
def edit_goal(current_user, gid):
    try:
        goal_id = validate_object_id(gid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        update_goal(goal_id, current_user["_id"], data)
        goal = get_goal(goal_id, current_user["_id"])
        if not goal:
            return jsonify({"error": "Goal not found"}), 404
        return jsonify(serialize_doc(goal)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/goals/<gid>", methods=["DELETE"])
@token_required
def remove_goal(current_user, gid):
    try:
        goal_id = validate_object_id(gid)
        delete_goal(goal_id, current_user["_id"])
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Streaks ----
@study_bp.route("/api/study/streaks", methods=["GET"])
@token_required
def get_streak_data(current_user):
    try:
        streak_data = get_streaks(current_user["_id"], 30)
        current = get_current_streak(current_user["_id"])
        total_minutes = sum(s.get("minutes", 0) for s in streak_data)
        return jsonify({
            "days": streak_data,
            "current_streak": current,
            "total_minutes": total_minutes,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/streaks", methods=["POST"])
@token_required
def add_streak(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        minutes = data.get("minutes", 0)
        if not isinstance(minutes, (int, float)) or minutes < 0:
            return jsonify({"error": "Minutes must be a non-negative number"}), 400
        
        log_streak(current_user["_id"], minutes)
        return jsonify({"success": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Revisions ----
@study_bp.route("/api/study/revisions", methods=["GET"])
@token_required
def list_revisions(current_user):
    try:
        date = request.args.get("date")
        topic_id = request.args.get("topic_id")
        
        if date:
            revisions = list(get_revisions_by_date(date, current_user["_id"]))
            return jsonify(serialize_docs(revisions)), 200
        
        if topic_id:
            tid = validate_object_id(topic_id)
            revisions = list(get_revisions_by_topic(tid, current_user["_id"]))
            return jsonify(serialize_docs(revisions)), 200
        
        return jsonify([]), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/revisions", methods=["POST"])
@token_required
def add_revision(current_user):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        if data.get("topic_id"):
            data["topic_id"] = validate_object_id(data["topic_id"])
        if data.get("subject_id"):
            data["subject_id"] = validate_object_id(data["subject_id"])
        
        result = create_revision(data, current_user["_id"])
        return jsonify({"_id": str(result.inserted_id), "success": True}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/revisions/<rid>", methods=["PUT"])
@token_required
def complete_revision(current_user, rid):
    try:
        revision_id = validate_object_id(rid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        update_revision(revision_id, current_user["_id"], data)
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/revisions/<rid>", methods=["DELETE"])
@token_required
def remove_revision(current_user, rid):
    try:
        revision_id = validate_object_id(rid)
        # Delete revision from database
        from db import db
        result = db.revisions.delete_one({"_id": revision_id, "user_id": current_user["_id"]})
        if result.deleted_count == 0:
            return jsonify({"error": "Revision not found"}), 404
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Study Tasks ----
@study_bp.route("/api/study/tasks", methods=["GET"])
@token_required
def list_study_tasks(current_user):
    try:
        sid = request.args.get("subject_id")
        tasks = get_study_tasks(current_user["_id"], sid)
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/tasks", methods=["POST"])
@token_required
def add_study_task(current_user):
    try:
        data = request.get_json()
        if not data or not data.get("title"):
            return jsonify({"error": "Task title is required"}), 400
        
        data["is_study_task"] = True
        result = create_task(data, current_user["_id"])
        return jsonify(result), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Learning Paths ----
@study_bp.route("/api/study/paths", methods=["GET"])
@token_required
def list_paths(current_user):
    try:
        paths = get_all_paths(current_user["_id"])
        return jsonify(serialize_docs(paths)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/paths", methods=["POST"])
@token_required
def add_path(current_user):
    try:
        data = request.get_json()
        if not data or not (data.get("title") or data.get("name")):
            return jsonify({"error": "Path title is required"}), 400
        
        # Normalise: frontend sends 'title'
        if not data.get("title") and data.get("name"):
            data["title"] = data["name"]
        
        if data.get("subject_id"):
            data["subject_id"] = validate_object_id(data["subject_id"])
        
        result = create_learning_path(data, current_user["_id"])
        return jsonify({"_id": str(result.inserted_id), "success": True}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/paths/<pid>", methods=["GET"])
@token_required
def get_single_path(current_user, pid):
    try:
        path_id = validate_object_id(pid)
        path = get_path(path_id, current_user["_id"])
        if not path:
            return jsonify({"error": "Learning path not found"}), 404
        return jsonify(serialize_doc(path)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/paths/<pid>", methods=["PUT"])
@token_required
def edit_path(current_user, pid):
    try:
        path_id = validate_object_id(pid)
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        update_path(path_id, current_user["_id"], data)
        path = get_path(path_id, current_user["_id"])
        if not path:
            return jsonify({"error": "Learning path not found"}), 404
        return jsonify(serialize_doc(path)), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/paths/<pid>", methods=["DELETE"])
@token_required
def remove_path(current_user, pid):
    try:
        path_id = validate_object_id(pid)
        delete_path(path_id, current_user["_id"])
        return jsonify({"success": True}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/paths/<pid>/checkpoint/<int:idx>", methods=["POST"])
@token_required
def claim_checkpoint(current_user, pid, idx):
    try:
        path_id = validate_object_id(pid)
        if idx < 0:
            return jsonify({"error": "Invalid checkpoint index"}), 400
        
        result = complete_checkpoint(path_id, current_user["_id"], idx)
        if not result:
            return jsonify({"error": "Invalid checkpoint"}), 400
        
        # Update user study profile with XP
        if result.get("xp_earned", 0) > 0:
            update_study_profile(current_user["_id"], xp_earned=result.get("xp_earned", 0))
        
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Badges & Rewards ----
@study_bp.route("/api/study/badges/all", methods=["GET"])
@token_required
def list_all_badges(current_user):
    try:
        """Get all available badge definitions"""
        badges = get_all_badges()
        badge_list = [{
            "_id": str(b["_id"]),
            "name": b["name"],
            "icon": b["icon"],
            "description": b["description"],
            "criteria": b.get("criteria", {})
        } for b in badges]
        return jsonify(badge_list), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/badges/earned", methods=["GET"])
@token_required
def get_earned_badges(current_user):
    try:
        """Get badges earned by current user"""
        earned = get_user_badges(current_user["_id"])
        user = get_user(current_user["_id"])
        study_profile = user.get("study_profile", {})
        
        return jsonify({
            "badges": serialize_docs(earned),
            "total_xp": study_profile.get("total_xp", 0),
            "study_level": study_profile.get("study_level", 1),
            "total_study_time": study_profile.get("total_study_time", 0),
            "topics_completed": study_profile.get("topics_completed", 0),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- Study Profile & XP ----
@study_bp.route("/api/study/profile", methods=["GET"])
@token_required
def get_study_profile(current_user):
    try:
        user = get_user(current_user["_id"])
        sp = user.get("study_profile", {})
        earned = get_user_badges(current_user["_id"])
        streak = get_current_streak(current_user["_id"])
        sp["current_streak"] = streak
        return jsonify({
            "total_xp": sp.get("total_xp", 0),
            "study_level": sp.get("study_level", 1),
            "total_study_time": sp.get("total_study_time", 0),
            "topics_completed": sp.get("topics_completed", 0),
            "current_streak": streak,
            "xp_to_next": 500 - (sp.get("total_xp", 0) % 500),
            "badges_earned": len(earned) if isinstance(earned, list) else 0,
            "badges": serialize_docs(earned) if isinstance(earned, list) else [],
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@study_bp.route("/api/study/xp", methods=["POST"])
@token_required
def award_xp(current_user):
    try:
        data = request.get_json()
        amount = data.get("amount", 0)
        reason = data.get("reason", "action")
        if amount > 0:
            update_study_profile(current_user["_id"], xp_earned=amount)
        user = get_user(current_user["_id"])
        sp = user.get("study_profile", {})
        return jsonify({
            "success": True,
            "total_xp": sp.get("total_xp", 0),
            "study_level": sp.get("study_level", 1),
            "reason": reason,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
