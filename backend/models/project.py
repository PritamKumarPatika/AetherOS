from db import get_collection

projects = get_collection("projects")
project_notes = get_collection("project_notes")
project_attachments = get_collection("project_attachments")

def create_project(data, user_id):
    project = {
        "user_id": user_id,
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "status": data.get("status", "Active"),
        "priority": data.get("priority", "Medium"),
        "deadline": data.get("deadline", ""),
        "progress": data.get("progress", 0),
        "tasks": data.get("tasks", []),
        "notes": data.get("notes", []),
        "files": data.get("files", []),
        "team": data.get("team", []),
        "parent_id": data.get("parent_id", ""),
    }
    return projects.insert_one(project)

def get_all_projects(user_id):
    return projects.find({"user_id": user_id})

def get_project(project_id, user_id):
    return projects.find_one({"_id": project_id, "user_id": user_id})

def update_project(project_id, user_id, data):
    return projects.update_one({"_id": project_id, "user_id": user_id}, {"$set": data})

def delete_project(project_id, user_id):
    return projects.delete_one({"_id": project_id, "user_id": user_id})

def get_sub_projects(parent_id, user_id):
    return projects.find({"parent_id": parent_id, "user_id": user_id})

# ---- Project Notes ----
def create_project_note(data, user_id):
    note = {
        "user_id": user_id,
        "project_id": data.get("project_id", ""),
        "title": data.get("title", "Untitled Note"),
        "content": data.get("content", ""),
    }
    return project_notes.insert_one(note)

def get_project_notes(project_id, user_id):
    return project_notes.find({"project_id": project_id, "user_id": user_id})

def get_project_note(note_id, user_id):
    return project_notes.find_one({"_id": note_id, "user_id": user_id})

def update_project_note(note_id, user_id, data):
    return project_notes.update_one({"_id": note_id, "user_id": user_id}, {"$set": data})

def delete_project_note(note_id, user_id):
    return project_notes.delete_one({"_id": note_id, "user_id": user_id})

# ---- Project Attachments ----
def add_attachment(data, user_id):
    attachment = {
        "user_id": user_id,
        "project_id": data.get("project_id", ""),
        "filename": data.get("filename", ""),
        "original_name": data.get("original_name", ""),
        "size": data.get("size", 0),
        "type": data.get("type", ""),
    }
    return project_attachments.insert_one(attachment)

def get_project_attachments(project_id, user_id):
    return project_attachments.find({"project_id": project_id, "user_id": user_id})

def delete_attachment(att_id, user_id):
    return project_attachments.delete_one({"_id": att_id, "user_id": user_id})
