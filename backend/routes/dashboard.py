from flask import Blueprint, jsonify
from datetime import datetime
from models.meeting import get_all_meetings
from models.task import get_all_tasks
from routes.auth import token_required

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/api/reminders", methods=["GET"])
@token_required
def get_reminders(current_user):
    user_id = current_user.get("_id")
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    tasks = list(get_all_tasks(user_id))
    meetings = list(get_all_meetings(user_id))
    
    reminders = []
    
    # 1. Check for upcoming meetings today
    todays_meetings = [m for m in meetings if m.get("date") == today or not m.get("date")]
    for m in todays_meetings:
        reminders.append({
            "icon": '<i class="ph ph-video-camera"></i>', 
            "iconClass": 'blue', 
            "title": f"Meeting: {m['title']}", 
            "time": m.get("time", "Today")
        })
        
    # 2. Check for overdue tasks
    overdue_tasks = [t for t in tasks if t.get("due_date") and t["due_date"] < today and t.get("status") != "Done"]
    for t in overdue_tasks:
        reminders.append({
            "icon": '<i class="ph-fill ph-warning-circle"></i>', 
            "iconClass": 'error', 
            "title": f"Overdue: {t.get('title')}", 
            "time": "Past Due"
        })

    # 3. Check for tasks due today
    due_today = [t for t in tasks if t.get("due_date") == today and t.get("status") != "Done"]
    for t in due_today:
        reminders.append({
            "icon": '<i class="ph ph-calendar-blank"></i>', 
            "iconClass": 'purple', 
            "title": f"Due Today: {t.get('title')}", 
            "time": "Today"
        })

    # Fallback to general reminder if nothing is urgent
    if not reminders:
        reminders.append({
            "icon": '<i class="ph-fill ph-sparkle"></i>', 
            "iconClass": 'green', 
            "title": 'All caught up! No urgent deadlines.', 
            "time": 'Now'
        })
        
    return jsonify(reminders), 200
