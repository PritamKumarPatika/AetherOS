from flask import Blueprint, request, jsonify
from services.ai_service import process_ai_query
from routes.auth import token_required

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/api/ai/ask", methods=["POST"])
@token_required
def ask_ai(current_user):
    try:
        data = request.get_json()
        query = data.get("query", "")
        context = data.get("context", "general")
        user_id = str(current_user["_id"])
        response = process_ai_query(query, user_id, context)
        return jsonify(response), 200
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
        return jsonify({"error": "Internal Error", "details": str(e)}), 500
