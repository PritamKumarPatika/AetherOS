from flask import Blueprint, request, jsonify
from routes.auth import token_required
from services.analytics_service import compute_daily, compute_weekly, compute_monthly

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/api/analytics/daily", methods=["GET"])
@token_required
def daily(current_user):
    return jsonify(compute_daily(current_user["_id"])), 200

@analytics_bp.route("/api/analytics/weekly", methods=["GET"])
@token_required
def weekly(current_user):
    return jsonify(compute_weekly(current_user["_id"])), 200

@analytics_bp.route("/api/analytics/monthly", methods=["GET"])
@token_required
def monthly(current_user):
    return jsonify(compute_monthly(current_user["_id"])), 200
