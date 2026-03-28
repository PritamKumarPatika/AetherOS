"""
AetherOS Backend — Flask Application Entry Point
Serves both the API and the frontend static files.
"""
import os
import sys

# Ensure backend/ is on the Python path so model/service imports work
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory
from flask_cors import CORS

from routes.auth import auth_bp
from routes.tasks import tasks_bp
from routes.projects import projects_bp
from routes.meetings import meetings_bp
from routes.study import study_bp
from routes.analytics import analytics_bp
from routes.ai import ai_bp
from routes.export import export_bp
from routes.dashboard import dashboard_bp

app = Flask(__name__, static_folder=None)
CORS(app)

# Initialize badges collection with default badges
def init_badges():
    from models.study import badges, get_all_badges
    existing = list(get_all_badges())
    if not existing:
        from datetime import datetime
        default_badges = [
            {"name": "First Note", "icon": "📝", "description": "Create your first study note", "criteria": {"type": "first_note", "count": 1}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Note Master", "icon": "📚", "description": "Create 10 study notes", "criteria": {"type": "notes_created", "count": 10}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Topic Starter", "icon": "🎯", "description": "Complete your first topic", "criteria": {"type": "topics_completed", "count": 1}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Topic Expert", "icon": "🏆", "description": "Complete 5 topics", "criteria": {"type": "topics_completed", "count": 5}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Learning Master", "icon": "👑", "description": "Complete 10 topics", "criteria": {"type": "topics_completed", "count": 10}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Path Pursuer", "icon": "🛤️", "description": "Complete your first learning path", "criteria": {"type": "paths_completed", "count": 1}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Study Warrior", "icon": "⚔️", "description": "Study for 10 hours", "criteria": {"type": "study_hours", "count": 10}, "created_at": datetime.utcnow().isoformat()},
            {"name": "Perfect Streak", "icon": "🔥", "description": "Maintain a 7-day study streak", "criteria": {"type": "study_streak_days", "count": 7}, "created_at": datetime.utcnow().isoformat()},
        ]
        for badge_data in default_badges:
            badges.insert_one(badge_data)

init_badges()

# Register Blueprints under /api for Vercel Serverless routing compatibility
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
app.register_blueprint(projects_bp, url_prefix='/api/projects')
app.register_blueprint(meetings_bp, url_prefix='/api/meetings')
app.register_blueprint(study_bp, url_prefix='/api/study')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(ai_bp, url_prefix='/api/ai')
app.register_blueprint(export_bp, url_prefix='/api/export')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

# Serve frontend
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>")
def serve_static(path):
    # Try serving from frontend directory
    full = os.path.join(FRONTEND_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(FRONTEND_DIR, path)
    # Fallback to index.html for SPA routing
    return send_from_directory(FRONTEND_DIR, "index.html")


# Seed demo data on first run
def seed_data():
    from models.user import get_or_create_default_user
    from models.task import create_task, get_all_tasks
    from models.project import create_project, get_all_projects
    from models.meeting import create_meeting, get_all_meetings
    from models.study import create_subject, create_topic, get_all_subjects

    user_id = get_or_create_default_user()

    if not get_all_tasks(user_id):
        tasks_data = [
            {"title": "Design System Architecture", "priority": "High", "status": "In Progress", "due_date": "2026-03-24", "tags": ["design", "architecture"]},
            {"title": "Implement Authentication Flow", "priority": "Critical", "status": "Todo", "due_date": "2026-03-25", "tags": ["backend", "auth"]},
            {"title": "Write API Documentation", "priority": "Medium", "status": "Todo", "due_date": "2026-03-26", "tags": ["docs"]},
            {"title": "Setup CI/CD Pipeline", "priority": "High", "status": "In Progress", "due_date": "2026-03-23", "tags": ["devops"]},
            {"title": "User Testing Session", "priority": "Low", "status": "Todo", "due_date": "2026-03-28", "tags": ["testing"]},
            {"title": "Database Optimization", "priority": "Medium", "status": "Done", "due_date": "2026-03-20", "tags": ["backend", "performance"]},
            {"title": "Frontend Component Library", "priority": "High", "status": "In Progress", "due_date": "2026-03-24", "tags": ["frontend"]},
        ]
        for t in tasks_data:
            create_task(t, user_id)

    if not get_all_projects(user_id):
        projects_data = [
            {"name": "AetherOS Platform", "status": "Active", "priority": "Critical", "deadline": "2026-04-15", "progress": 45, "team": ["Alex", "Sara", "Mike"]},
            {"name": "Mobile App Redesign", "status": "Active", "priority": "High", "deadline": "2026-04-01", "progress": 72, "team": ["Alex", "Emma"]},
            {"name": "Data Analytics Engine", "status": "Planning", "priority": "Medium", "deadline": "2026-05-01", "progress": 15, "team": ["Alex"]},
        ]
        for p in projects_data:
            create_project(p, user_id)

    if not get_all_meetings(user_id):
        from datetime import datetime
        today = datetime.utcnow().strftime("%Y-%m-%d")
        meetings_data = [
            {"title": "Sprint Planning", "date": today, "time": "09:00", "end_time": "10:00", "priority": "High", "platform": "Google Meet", "link": "https://meet.google.com/abc-defg-hij", "status": "Scheduled"},
            {"title": "Design Review", "date": today, "time": "14:00", "end_time": "15:00", "priority": "Medium", "platform": "Microsoft Teams", "link": "https://teams.microsoft.com/meeting123", "status": "Scheduled"},
            {"title": "1:1 with Manager", "date": today, "time": "16:00", "end_time": "16:30", "priority": "High", "platform": "Google Meet", "link": "https://meet.google.com/xyz", "status": "Scheduled"},
        ]
        for m in meetings_data:
            create_meeting(m, user_id)

    if not get_all_subjects(user_id):
        subj1 = create_subject({"name": "Machine Learning", "exam_date": "2026-04-20", "progress": 35, "color": "#6C5CE7"}, user_id)
        subj2 = create_subject({"name": "Data Structures", "exam_date": "2026-04-10", "progress": 60, "color": "#00B894"}, user_id)

        create_topic({"subject_id": subj1["_id"], "name": "Neural Networks", "status": "In Progress", "difficulty": "Hard"}, user_id)
        create_topic({"subject_id": subj1["_id"], "name": "Linear Regression", "status": "Completed", "difficulty": "Medium"}, user_id)
        create_topic({"subject_id": subj1["_id"], "name": "Decision Trees", "status": "Not Started", "difficulty": "Easy"}, user_id)
        create_topic({"subject_id": subj2["_id"], "name": "Binary Trees", "status": "Completed", "difficulty": "Medium"}, user_id)
        create_topic({"subject_id": subj2["_id"], "name": "Graph Algorithms", "status": "In Progress", "difficulty": "Hard"}, user_id)
        create_topic({"subject_id": subj2["_id"], "name": "Hash Tables", "status": "Not Started", "difficulty": "Easy"}, user_id)


if __name__ == "__main__":
    seed_data()
    print("🚀 AetherOS Backend running at http://localhost:5000")
    app.run(debug=True, port=5000)
