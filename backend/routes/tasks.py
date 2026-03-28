from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models.task import (
    create_task, get_all_tasks, get_task, update_task, delete_task, get_tasks_by_project
)

tasks_bp = Blueprint("tasks", __name__)

@tasks_bp.route("/api/tasks", methods=["GET"])
@token_required
def list_tasks(current_user):
    status = request.args.get("status")
    priority = request.args.get("priority")
    result = get_all_tasks(current_user["_id"], status=status, priority=priority)
    return jsonify(result), 200

@tasks_bp.route("/api/tasks", methods=["POST"])
@token_required
def add_task(current_user):
    data = request.get_json()
    task = create_task(data, current_user["_id"])
    return jsonify(task), 201

@tasks_bp.route("/api/tasks/<task_id>", methods=["GET"])
@token_required
def get_single_task(current_user, task_id):
    task = get_task(task_id, current_user["_id"])
    if not task:
        return jsonify({"error": "Not found"}), 404
    return jsonify(task), 200

@tasks_bp.route("/api/tasks/<task_id>", methods=["PUT"])
@token_required
def edit_task(current_user, task_id):
    data = request.get_json()
    success = update_task(task_id, current_user["_id"], data)
    if not success:
        return jsonify({"error": "Not found"}), 404
    return jsonify(get_task(task_id, current_user["_id"])), 200

@tasks_bp.route("/api/tasks/<task_id>", methods=["DELETE"])
@token_required
def remove_task(current_user, task_id):
    success = delete_task(task_id, current_user["_id"])
    if not success:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True}), 200

@tasks_bp.route("/api/tasks/project/<project_id>", methods=["GET"])
@token_required
def project_tasks(current_user, project_id):
    result = get_tasks_by_project(project_id, current_user["_id"])
    return jsonify(result), 200

@tasks_bp.route("/api/tasks/<task_id>/subtask", methods=["POST"])
@token_required
def add_subtask(current_user, task_id):
    task = get_task(task_id, current_user["_id"])
    if not task:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    subtask = {
        "title": data.get("title", ""),
        "completed": False
    }
    subtasks = task.get("subtasks", [])
    subtasks.append(subtask)
    update_task(task_id, current_user["_id"], {"subtasks": subtasks})
    return jsonify(get_task(task_id, current_user["_id"])), 201

@tasks_bp.route("/api/tasks/<task_id>/time", methods=["PUT"])
@token_required
def track_time(current_user, task_id):
    task = get_task(task_id, current_user["_id"])
    if not task:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json()
    minutes = data.get("minutes", 0)
    current = task.get("time_tracked", 0)
    update_task(task_id, current_user["_id"], {"time_tracked": current + minutes})
    return jsonify(get_task(task_id, current_user["_id"])), 200

@tasks_bp.route("/api/tasks/<task_id>/subtask/<int:idx>/toggle", methods=["PUT"])
@token_required
def toggle_subtask(current_user, task_id, idx):
    task = get_task(task_id, current_user["_id"])
    if not task:
        return jsonify({"error": "Not found"}), 404
    subtasks = task.get("subtasks", [])
    if idx < 0 or idx >= len(subtasks):
        return jsonify({"error": "Invalid subtask index"}), 400
    subtasks[idx]["completed"] = not subtasks[idx].get("completed", False)
    update_task(task_id, current_user["_id"], {"subtasks": subtasks})
    return jsonify(get_task(task_id, current_user["_id"])), 200
