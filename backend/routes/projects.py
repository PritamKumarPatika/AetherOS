import os, uuid
from flask import Blueprint, request, jsonify, send_from_directory
from routes.auth import token_required
from models.project import (
    create_project, get_all_projects, get_project, update_project, delete_project,
    get_sub_projects, create_project_note, get_project_notes, get_project_note,
    update_project_note, delete_project_note, add_attachment, get_project_attachments,
    delete_attachment
)
from models.task import get_tasks_by_project

projects_bp = Blueprint("projects", __name__)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---- Projects CRUD ----
@projects_bp.route("/api/projects", methods=["GET"])
@token_required
def list_projects(current_user):
    return jsonify(get_all_projects(current_user["_id"])), 200

@projects_bp.route("/api/projects", methods=["POST"])
@token_required
def add_project(current_user):
    data = request.get_json()
    project = create_project(data, current_user["_id"])
    return jsonify(project), 201

@projects_bp.route("/api/projects/<pid>", methods=["GET"])
@token_required
def get_single_project(current_user, pid):
    project = get_project(pid, current_user["_id"])
    if not project:
        return jsonify({"error": "Not found"}), 404
    return jsonify(project), 200

@projects_bp.route("/api/projects/<pid>", methods=["PUT"])
@token_required
def edit_project(current_user, pid):
    data = request.get_json()
    success = update_project(pid, current_user["_id"], data)
    if not success:
        return jsonify({"error": "Not found"}), 404
    return jsonify(get_project(pid, current_user["_id"])), 200

@projects_bp.route("/api/projects/<pid>", methods=["DELETE"])
@token_required
def remove_project(current_user, pid):
    success = delete_project(pid, current_user["_id"])
    if not success:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True}), 200

# ---- Sub-projects ----
@projects_bp.route("/api/projects/<pid>/subprojects", methods=["GET"])
@token_required
def list_sub_projects(current_user, pid):
    return jsonify(get_sub_projects(pid, current_user["_id"])), 200

@projects_bp.route("/api/projects/<pid>/subprojects", methods=["POST"])
@token_required
def add_sub_project(current_user, pid):
    data = request.get_json()
    data["parent_id"] = pid
    sub = create_project(data, current_user["_id"])
    return jsonify(sub), 201

# ---- Project Tasks ----
@projects_bp.route("/api/projects/<pid>/tasks", methods=["GET"])
@token_required
def list_project_tasks(current_user, pid):
    return jsonify(get_tasks_by_project(pid, current_user["_id"])), 200

# ---- Project Notes ----
@projects_bp.route("/api/projects/<pid>/notes", methods=["GET"])
@token_required
def list_proj_notes(current_user, pid):
    return jsonify(get_project_notes(pid, current_user["_id"])), 200

@projects_bp.route("/api/projects/<pid>/notes", methods=["POST"])
@token_required
def add_proj_note(current_user, pid):
    data = request.get_json()
    data["project_id"] = pid
    return jsonify(create_project_note(data, current_user["_id"])), 201

@projects_bp.route("/api/projects/notes/<nid>", methods=["GET"])
@token_required
def get_proj_note(current_user, nid):
    note = get_project_note(nid, current_user["_id"])
    if not note:
        return jsonify({"error": "Not found"}), 404
    return jsonify(note), 200

@projects_bp.route("/api/projects/notes/<nid>", methods=["PUT"])
@token_required
def edit_proj_note(current_user, nid):
    data = request.get_json()
    update_project_note(nid, current_user["_id"], data)
    return jsonify(get_project_note(nid, current_user["_id"])), 200

@projects_bp.route("/api/projects/notes/<nid>", methods=["DELETE"])
@token_required
def remove_proj_note(current_user, nid):
    delete_project_note(nid, current_user["_id"])
    return jsonify({"success": True}), 200

# ---- Attachments ----
@projects_bp.route("/api/projects/<pid>/attachments", methods=["GET"])
@token_required
def list_attachments(current_user, pid):
    return jsonify(get_project_attachments(pid, current_user["_id"])), 200

@projects_bp.route("/api/projects/<pid>/attachments", methods=["POST"])
@token_required
def upload_attachment(current_user, pid):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400
    ext = os.path.splitext(f.filename)[1]
    saved_name = f"{uuid.uuid4().hex}{ext}"
    f.save(os.path.join(UPLOAD_DIR, saved_name))
    att = add_attachment({
        "project_id": pid,
        "filename": saved_name,
        "original_name": f.filename,
        "size": f.content_length or 0,
        "type": f.content_type or "",
    }, current_user["_id"])
    return jsonify(att), 201

@projects_bp.route("/api/projects/attachments/<aid>", methods=["DELETE"])
@token_required
def remove_attachment(current_user, aid):
    delete_attachment(aid, current_user["_id"])
    return jsonify({"success": True}), 200

@projects_bp.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)
