from flask import Blueprint, request, jsonify
from routes.auth import token_required
from models.meeting import (
    create_meeting, get_all_meetings, get_meetings_by_date,
    get_meeting, update_meeting, delete_meeting
)

meetings_bp = Blueprint("meetings", __name__)

@meetings_bp.route("/api/meetings", methods=["GET"])
@token_required
def list_meetings(current_user):
    date = request.args.get("date")
    if date:
        return jsonify(get_meetings_by_date(date, current_user["_id"])), 200
    return jsonify(get_all_meetings(current_user["_id"])), 200

@meetings_bp.route("/api/meetings", methods=["POST"])
@token_required
def add_meeting(current_user):
    data = request.get_json()
    meeting = create_meeting(data, current_user["_id"])
    return jsonify(meeting), 201

@meetings_bp.route("/api/meetings/<mid>", methods=["GET"])
@token_required
def get_single_meeting(current_user, mid):
    meeting = get_meeting(mid, current_user["_id"])
    if not meeting:
        return jsonify({"error": "Not found"}), 404
    return jsonify(meeting), 200

@meetings_bp.route("/api/meetings/<mid>", methods=["PUT"])
@token_required
def edit_meeting(current_user, mid):
    data = request.get_json()
    success = update_meeting(mid, current_user["_id"], data)
    if not success:
        return jsonify({"error": "Not found"}), 404
    return jsonify(get_meeting(mid, current_user["_id"])), 200

@meetings_bp.route("/api/meetings/<mid>", methods=["DELETE"])
@token_required
def remove_meeting(current_user, mid):
    success = delete_meeting(mid, current_user["_id"])
    if not success:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True}), 200
