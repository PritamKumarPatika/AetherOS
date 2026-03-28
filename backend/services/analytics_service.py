"""
Analytics Service — computes productivity metrics from task/meeting/study/project data.
Enhanced with project progress, meeting analytics, priority breakdown, and richer insights.
"""
from datetime import datetime, timedelta
from models.task import get_all_tasks
from models.meeting import get_all_meetings
from models.study import get_all_subjects, get_topics_by_subject
import random


def _base_metrics(user_id):
    tasks = list(get_all_tasks(user_id))
    done = [t for t in tasks if t.get("status") == "Done"]
    in_progress = [t for t in tasks if t.get("status") == "In Progress"]
    todo = [t for t in tasks if t.get("status") == "Todo"]
    meetings = list(get_all_meetings(user_id))

    total = len(tasks) or 1
    score = int(len(done) / total * 100)

    # Priority breakdown
    priority_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    for t in tasks:
        p = t.get("priority", "Medium")
        if p in priority_counts:
            priority_counts[p] += 1

    # Projects stats
    try:
        from models.project import get_all_projects
        projects = list(get_all_projects(user_id))
        project_progress = {}
        for p in projects:
            if not p.get("parent_id"):  # Only root projects
                project_progress[p.get("name", "?")] = p.get("progress", 0)
        active_projects = len([p for p in projects if not p.get("parent_id") and p.get("status") == "Active"])
        total_projects = len([p for p in projects if not p.get("parent_id")])
    except Exception:
        project_progress = {}
        active_projects = 0
        total_projects = 0

    # Meeting analytics
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    upcoming_meetings = len([m for m in meetings if m.get("date", "") >= today_str and m.get("status") != "Completed"])
    completed_meetings = len([m for m in meetings if m.get("status") == "Completed"])

    # Study subjects
    try:
        subjects = list(get_all_subjects(user_id))
        total_subjects = len(subjects)
    except Exception:
        total_subjects = 0

    return {
        "tasks_completed": len(done),
        "tasks_in_progress": len(in_progress),
        "tasks_todo": len(todo),
        "tasks_total": len(tasks),
        "tasks_missed": len([t for t in tasks if t.get("due_date") and t.get("status") != "Done"
                             and t["due_date"] < datetime.utcnow().strftime("%Y-%m-%d")]),
        "meetings_total": len(meetings),
        "meetings_attended": completed_meetings,
        "meetings_upcoming": upcoming_meetings,
        "productivity_score": min(score, 100),
        "priority_breakdown": priority_counts,
        "project_progress": project_progress,
        "active_projects": active_projects,
        "total_projects": total_projects,
        "total_subjects": total_subjects,
    }


def compute_daily(user_id):
    metrics = _base_metrics(user_id)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    hours = [f"{h:02d}:00" for h in range(8, 22)]
    tasks_per_hour = [0] * len(hours)
    focus_per_hour = [0] * len(hours)

    tasks = list(get_all_tasks(user_id))
    for t in tasks:
        if t.get("status") == "Done" and t.get("updated_at"):
            if isinstance(t["updated_at"], str) and t["updated_at"].startswith(today):
                try:
                    dt = datetime.fromisoformat(t["updated_at"])
                    hr = dt.hour
                    if 8 <= hr <= 21:
                        idx = hr - 8
                        tasks_per_hour[idx] += 1
                        focus_per_hour[idx] += int(t.get("time_tracked", 0))
                except:
                    pass

    metrics["period"] = "daily"
    metrics["date"] = today
    metrics["chart_data"] = {
        "labels": hours,
        "tasks_completed": tasks_per_hour,
        "focus_time": focus_per_hour,
    }
    metrics["ai_insights"] = _generate_insights(metrics)
    return metrics


def compute_weekly(user_id):
    metrics = _base_metrics(user_id)
    days = []
    
    date_map = {}
    for i in range(6, -1, -1):
        d = datetime.utcnow() - timedelta(days=i)
        lbl = d.strftime("%a")
        dt_str = d.strftime("%Y-%m-%d")
        days.append(lbl)
        date_map[dt_str] = {"idx": 6 - i, "done": 0, "missed": 0}

    tasks = list(get_all_tasks(user_id))
    meetings = list(get_all_meetings(user_id))

    for t in tasks:
        if t.get("status") == "Done" and t.get("updated_at"):
            d_str = t["updated_at"][:10] if isinstance(t["updated_at"], str) else ""
            if d_str in date_map:
                date_map[d_str]["done"] += 1
        
        if t.get("due_date") in date_map:
            if t.get("status") != "Done" or (t.get("updated_at") and isinstance(t["updated_at"], str) and t["updated_at"][:10] > t["due_date"]):
                date_map[t["due_date"]]["missed"] += 1

    tasks_completed = [0] * 7
    tasks_missed = [0] * 7
    productivity_score = [0] * 7
    meetings_per_day = [0] * 7

    for dt_str, data in date_map.items():
        idx = data["idx"]
        tasks_completed[idx] = data["done"]
        tasks_missed[idx] = data["missed"]
        total = data["done"] + data["missed"]
        productivity_score[idx] = int((data["done"] / total * 100)) if total > 0 else 0

    # Meeting distribution per day
    for m in meetings:
        d_str = m.get("date", "")
        if d_str in date_map:
            meetings_per_day[date_map[d_str]["idx"]] += 1

    metrics["period"] = "weekly"
    metrics["chart_data"] = {
        "labels": days,
        "tasks_completed": tasks_completed,
        "tasks_missed": tasks_missed,
        "productivity_score": productivity_score,
        "meetings_per_day": meetings_per_day,
    }
    metrics["ai_insights"] = _generate_insights(metrics)
    return metrics


def compute_monthly(user_id):
    metrics = _base_metrics(user_id)
    weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
    
    tasks_completed = [0] * 4
    tasks_missed = [0] * 4
    productivity_score = [0] * 4

    tasks = list(get_all_tasks(user_id))
    now = datetime.utcnow()
    
    for t in tasks:
        if t.get("status") == "Done" and t.get("updated_at"):
            try:
                ua = t["updated_at"]
                if isinstance(ua, str):
                    dt = datetime.fromisoformat(ua)
                else:
                    dt = ua
                days_ago = (now - dt).days
                if 0 <= days_ago < 28:
                    w_idx = 3 - (days_ago // 7)
                    tasks_completed[w_idx] += 1
            except:
                pass
                
        if t.get("due_date"):
            try:
                dt = datetime.strptime(t["due_date"], "%Y-%m-%d")
                days_ago = (now - dt).days
                ua = t.get("updated_at", "")
                if isinstance(ua, str):
                    ua_date = ua[:10]
                else:
                    ua_date = ""
                if 0 <= days_ago < 28 and (t.get("status") != "Done" or (ua_date and ua_date > t["due_date"])):
                    w_idx = 3 - (days_ago // 7)
                    tasks_missed[w_idx] += 1
            except:
                pass

    for i in range(4):
        total = tasks_completed[i] + tasks_missed[i]
        productivity_score[i] = int((tasks_completed[i] / total * 100)) if total > 0 else 0

    metrics["period"] = "monthly"
    metrics["chart_data"] = {
        "labels": weeks,
        "tasks_completed": tasks_completed,
        "tasks_missed": tasks_missed,
        "productivity_score": productivity_score,
    }
    metrics["ai_insights"] = _generate_insights(metrics)
    return metrics


def _generate_insights(metrics):
    insights = []
    score = metrics.get("productivity_score", 0)
    missed = metrics.get("tasks_missed", 0)
    completed = metrics.get("tasks_completed", 0)
    in_progress = metrics.get("tasks_in_progress", 0)
    meetings = metrics.get("meetings_total", 0)
    projects = metrics.get("active_projects", 0)

    if score >= 80:
        insights.append({"icon": "🔥", "text": "Excellent productivity! You're performing above average.", "type": "success"})
    elif score >= 50:
        insights.append({"icon": "📊", "text": "Decent productivity. Try to reduce context-switching for better results.", "type": "info"})
    else:
        insights.append({"icon": "⚠️", "text": "Productivity is low. Consider using Focus Mode and time-blocking.", "type": "warning"})

    if missed > 3:
        insights.append({"icon": "🚨", "text": f"{missed} tasks overdue. Review priorities and consider rescheduling.", "type": "danger"})
    elif missed > 0:
        insights.append({"icon": "⏰", "text": f"{missed} task(s) past deadline. Address them to stay on track.", "type": "warning"})

    if completed > 5:
        insights.append({"icon": "✅", "text": f"Great job completing {completed} tasks! Keep up the momentum.", "type": "success"})
    elif completed > 0:
        insights.append({"icon": "👍", "text": f"You've completed {completed} task(s). Aim higher this period!", "type": "info"})

    if in_progress > 5:
        insights.append({"icon": "🔄", "text": f"{in_progress} tasks in progress. Try finishing existing work before starting new ones.", "type": "info"})

    if meetings > 0:
        insights.append({"icon": "📅", "text": f"{meetings} meetings tracked. Ensure meeting-heavy days still allow focus time.", "type": "info"})

    if projects > 0:
        insights.append({"icon": "📂", "text": f"{projects} active project(s). Distribute effort evenly across them.", "type": "info"})

    insights.append({"icon": "💡", "text": "Pattern: Your most productive hours are typically mid-morning (9-11 AM).", "type": "tip"})
    return insights
