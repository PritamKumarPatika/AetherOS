import os
import jwt
import datetime
from functools import wraps
from flask import Blueprint, request, jsonify
from models.user import get_or_create_default_user, update_user_settings, get_user, register_user, verify_user

auth_bp = Blueprint("auth", __name__)
JWT_SECRET = "super-secret-aetheros-key-2026"  # In production, use os.environ.get("JWT_SECRET")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split()
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = get_user(data["user_id"])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data or not data.get("email") or not data.get("password") or not data.get("name"):
            return jsonify({"error": "Missing name, email, or password"}), 400
            
        user_result = register_user(data["name"], data["email"], data["password"])
        if not user_result:
            return jsonify({"error": "User with that email already exists"}), 409
            
        return jsonify({"success": True, "message": "User created successfully"}), 201
    except Exception as e:
        print(f"Register error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or not data.get("email") or not data.get("password"):
            # Temporary fallback for development if frontend hasn't updated to send credentials yet
            user = get_or_create_default_user()
            if not user:
                return jsonify({"error": "Could not create default user"}), 500
            token = jwt.encode({
                "user_id": str(user["_id"]),
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, JWT_SECRET, algorithm="HS256")
            user_data = {k: v for k, v in user.items() if k != "password"}
            return jsonify({"success": True, "token": token, "user": user_data}), 200

        user = verify_user(data["email"], data["password"])
        if not user:
            return jsonify({"error": "Invalid credentials"}), 401
            
        token = jwt.encode({
            "user_id": str(user["_id"]),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
        }, JWT_SECRET, algorithm="HS256")
        
        # Remove password hash from response
        user_data = {k: v for k, v in user.items() if k != "password"}
        return jsonify({"success": True, "token": token, "user": user_data}), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@auth_bp.route("/api/auth/user", methods=["GET"])
@token_required
def get_current_user(current_user):
    user_data = {k: v for k, v in current_user.items() if k != "password"}
    return jsonify(user_data), 200

@auth_bp.route("/api/auth/settings", methods=["PUT"])
@token_required
def update_settings(current_user):
    data = request.get_json()
    update_user_settings(current_user["_id"], data.get("settings", {}))
    updated = get_user(current_user["_id"])
    user_data = {k: v for k, v in updated.items() if k != "password"}
    return jsonify(user_data), 200
