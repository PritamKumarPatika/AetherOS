from db import get_collection

analytics = get_collection("analytics")

def save_snapshot(data, user_id):
    snapshot = {
        "user_id": user_id,
        "date": data.get("date", ""),
        "period": data.get("period", "daily"),
        "tasks_completed": data.get("tasks_completed", 0),
        "tasks_missed": data.get("tasks_missed", 0),
        "meetings_attended": data.get("meetings_attended", 0),
        "productivity_score": data.get("productivity_score", 0),
        "study_time": data.get("study_time", 0),
        "focus_time": data.get("focus_time", 0),
    }
    return analytics.insert_one(snapshot)

def get_snapshots(user_id, period=None):
    query = {"user_id": user_id}
    if period:
        query["period"] = period
    return analytics.find(query)

def get_snapshot_by_date(date_str, user_id):
    return analytics.find_one({"date": date_str, "user_id": user_id})
