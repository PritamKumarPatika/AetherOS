import io
from flask import Blueprint, send_file
from openpyxl import Workbook
from models.task import get_all_tasks
from models.project import get_all_projects
from routes.auth import token_required

export_bp = Blueprint("export", __name__)

@export_bp.route("/api/export/tasks", methods=["GET"])
@token_required
def export_tasks(current_user):
    wb = Workbook()
    ws = wb.active
    ws.title = "Tasks"
    ws.append(["Title", "Priority", "Status", "Due Date", "Tags", "Time Tracked (min)", "Completion %"])
    for t in get_all_tasks(current_user["_id"]):
        completion = 100 if t.get("status") == "Done" else (50 if t.get("status") == "In Progress" else 0)
        ws.append([
            t.get("title", ""),
            t.get("priority", ""),
            t.get("status", ""),
            t.get("due_date", ""),
            ", ".join(t.get("tags", [])),
            t.get("time_tracked", 0),
            completion
        ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(buf, download_name="tasks_export.xlsx",
                     mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

@export_bp.route("/api/export/projects", methods=["GET"])
@token_required
def export_projects(current_user):
    wb = Workbook()
    ws = wb.active
    ws.title = "Projects"
    ws.append(["Name", "Priority", "Status", "Deadline", "Progress %"])
    for p in get_all_projects(current_user["_id"]):
        ws.append([
            p.get("name", ""),
            p.get("priority", ""),
            p.get("status", ""),
            p.get("deadline", ""),
            p.get("progress", 0)
        ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(buf, download_name="projects_export.xlsx",
                     mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
