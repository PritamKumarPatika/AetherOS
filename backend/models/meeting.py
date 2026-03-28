from db import get_collection

meetings = get_collection("meetings")

def create_meeting(data, user_id):
    meeting = {
        "user_id": user_id,
        "title": data.get("title", ""),
        "date": data.get("date", ""),
        "time": data.get("time", ""),
        "end_time": data.get("end_time", ""),
        "priority": data.get("priority", "Medium"),
        "status": data.get("status", "Scheduled"),
        "notes": data.get("notes", ""),
        "link": data.get("link", ""),
        "platform": data.get("platform", "Google Meet"),
        "attendees": data.get("attendees", []),
        "type": data.get("type", "Meeting"),
    }
    return meetings.insert_one(meeting)

def get_all_meetings(user_id):
    return meetings.find({"user_id": user_id})

def get_meetings_by_date(date_str, user_id):
    return meetings.find({"date": date_str, "user_id": user_id})

def get_meeting(meeting_id, user_id):
    return meetings.find_one({"_id": meeting_id, "user_id": user_id})

def update_meeting(meeting_id, user_id, data):
    return meetings.update_one({"_id": meeting_id, "user_id": user_id}, {"$set": data})

def delete_meeting(meeting_id, user_id):
    return meetings.delete_one({"_id": meeting_id, "user_id": user_id})
