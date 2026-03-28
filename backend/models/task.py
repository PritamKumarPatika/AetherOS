from db import get_collection
from datetime import datetime

tasks = get_collection("tasks")

def create_task(data, user_id):
    task = {
        "user_id": user_id,
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "priority": data.get("priority", "Medium"),
        "status": data.get("status", "Todo"),
        "due_date": data.get("due_date", ""),
        "tags": data.get("tags", []),
        "subtasks": data.get("subtasks", []),
        "recurring": data.get("recurring", False),
        "recurring_interval": data.get("recurring_interval", ""),
        "time_tracked": data.get("time_tracked", 0),
        "project_id": data.get("project_id", ""),
        "is_study_task": data.get("is_study_task", False),
        "subject_id": data.get("subject_id", ""),
        "topic_id": data.get("topic_id", ""),
    }
    return tasks.insert_one(task)

def get_all_tasks(user_id, status=None, priority=None):
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    return tasks.find(query)

def get_task(task_id, user_id):
    return tasks.find_one({"_id": task_id, "user_id": user_id})

def update_task(task_id, user_id, data):
    return tasks.update_one({"_id": task_id, "user_id": user_id}, {"$set": data})

def delete_task(task_id, user_id):
    return tasks.delete_one({"_id": task_id, "user_id": user_id})

def get_tasks_by_project(project_id, user_id):
    return tasks.find({"project_id": project_id, "user_id": user_id})

def get_study_tasks(user_id, subject_id=None):
    query = {"is_study_task": True, "user_id": user_id}
    if subject_id:
        query["subject_id"] = subject_id
    return tasks.find(query)
