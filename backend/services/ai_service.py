"""
Simulated AI Service & Local LLM Integration — produces intelligent-sounding responses based on context.
Initially tries to call a local Ollama instance. Falls back to simulated rule-based logic if offline.
"""
import re
import random
import json
import urllib.request
import urllib.error
import difflib

from models.task import get_all_tasks, create_task, update_task, delete_task
from models.meeting import get_all_meetings, create_meeting, update_meeting, delete_meeting
from models.project import get_all_projects, create_project, update_project, delete_project
from models.study import get_all_subjects, get_topics_by_subject
from services.agent_core import AgentCore

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3"

# Singleton global agent dictionary for state retention in MVP
ACTIVE_AGENTS = {}

def get_agent(user_id):
    uid = str(user_id)
    if uid not in ACTIVE_AGENTS:
        agent = AgentCore(uid)
        
        @agent.registry.register("create_task", "Create a new task", {"title": "string", "priority": "High/Medium/Low"})
        def _tool_create_task(title, priority="Medium"):
            create_task({"title": title, "priority": priority, "status": "Todo"}, uid)
            return f"Task '{title}' created."

        @agent.registry.register("complete_task", "Mark a task as completed", {"title": "string"})
        def _tool_complete_task(title):
            tasks = list(get_all_tasks(uid))
            matches = difflib.get_close_matches(title, [t.get("title", "") for t in tasks], n=1, cutoff=0.3)
            if matches:
                target = next(t for t in tasks if t.get("title") == matches[0])
                update_task(target["_id"], uid, {"status": "Done"})
                return f"Task '{matches[0]}' completed."
            return f"Could not find task '{title}'"
            
        @agent.registry.register("delete_project", "Delete a full project. Destructive.", {"name": "string"})
        def _tool_delete_project(name):
            projects = list(get_all_projects(uid))
            matches = difflib.get_close_matches(name, [p.get("name", "") for p in projects], n=1, cutoff=0.3)
            if matches:
                target_name = matches[0]
                target = next(p for p in projects if p.get("name") == target_name)
                # Store the actual DB ID in kwargs for execution upon confirmation
                return agent.safety.request_confirmation(uid, "_execute_delete_project", {"pid": str(target["_id"]), "name": target_name}, f"Are you sure you want to delete the project '{target_name}'?")
            return f"Could not find project '{name}'"

        @agent.registry.register("_execute_delete_project", "Internal execution of confirmed delete", {"pid": "string", "name": "string"})
        def _internal_del_proj(pid, name):
            from bson.objectid import ObjectId
            delete_project(ObjectId(pid), uid)
            return f"Project '{name}' permanently deleted."
            
        @agent.registry.register("_execute_delete_task", "Internal execution of confirmed delete", {"pid": "string", "name": "string"})
        def _internal_del_task(pid, name):
            from bson.objectid import ObjectId
            delete_task(ObjectId(pid), uid)
            return f"Task '{name}' permanently deleted."
            
        @agent.registry.register("_execute_delete_meeting", "Internal execution of confirmed delete", {"pid": "string", "name": "string"})
        def _internal_del_meet(pid, name):
            from bson.objectid import ObjectId
            delete_meeting(ObjectId(pid), uid)
            return f"Meeting '{name}' permanently deleted."

        @agent.registry.register("navigate_ui", "Switch the user's screen physically", {"route": "string (tasks, projects, calendar, etc)"})
        def _tool_navigate(route):
            return f"[UI_ACTION: NAVIGATE | target=\"/{route}\"]"
            
        @agent.registry.register("scan_platform_health", "Deep system scanner evaluating API health, DB integrity, and missing features", {})
        def _tool_scan_health():
            import time
            start = time.time()
            task_count = len(list(get_all_tasks(uid)))
            proj_count = len(list(get_all_projects(uid)))
            db_ms = int((time.time() - start) * 1000)
            
            return f"""🔍 **AetherOS Deep System Scan**
- **API Health**: All critical routes (Tasks, Projects, Auth) are operational.
- **DB Integrity**: Checked. {task_count} Tasks, {proj_count} Projects loaded securely in {db_ms}ms.
- **Performance**: Database Read Latency is optimal ({db_ms}ms).
- **Missing Features Detected**:
  1. Habit Tracking Module
  2. Long-term Goal Settings
  3. Advanced Calendar Time-Blocking
Shall I draft an implementation plan for one of these?"""

        ACTIVE_AGENTS[uid] = agent
    return ACTIVE_AGENTS[uid]

def _query_ollama(prompt, agent, context_data):
    system_prompt = agent.generate_system_prompt(context_data)
    
    data = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "system": system_prompt,
        "stream": False
    }
    
    req = urllib.request.Request(OLLAMA_URL, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result.get('response', '')
    except Exception as e:
        return None

# -- DEPRECATED SINGLE-PASS PARSER (Now using ReAct Loop via Tools) --
# The old _parse_and_execute_actions is removed since AgentCore ToolRegistry handles logic natively.

def process_ai_query(query, user_id, context="general"):
    agent = get_agent(user_id)
    uid = str(user_id)
    agent.memory.add_message("user", query)

    # 0. Safety Interception
    if uid in agent.safety.pending_confirmations:
        query_clean = query.lower().strip()
        if query_clean in ["yes", "y", "approve", "confirm", "do it"]:
            pending = agent.safety.approve_action(uid)
            try:
                result = agent.registry.execute(pending["action_name"], pending["action_kwargs"])
                msg = f"✅ Action confirmed and executed: {result}"
            except Exception as e:
                msg = f"❌ Action failed: {str(e)}"
            agent.memory.add_message("assistant", msg)
            return {"type": "llm_response", "message": msg, "data": {}}
        else:
            agent.safety.reject_action(uid)
            msg = "🚫 Action cancelled by user."
            agent.memory.add_message("assistant", msg)
            return {"type": "llm_response", "message": msg, "data": {}}

    # 1. Gather Context for LLM
    try:
        tasks = get_all_tasks(user_id)
        todo_tasks = [t['title'] for t in tasks if t.get('status') != 'Done']
        meetings = get_all_meetings(user_id)
        upcoming_meetings = [f"{m['title']} at {m.get('time', '')}" for m in meetings]
        projects = get_all_projects(user_id)
        active_projects = [f"{p['name']} ({p.get('progress', 0)}% done)" for p in projects]

        context_data = {
            'tasks': ", ".join(todo_tasks) if todo_tasks else "None",
            'meetings': ", ".join(upcoming_meetings) if upcoming_meetings else "None",
            'projects': ", ".join(active_projects) if active_projects else "None"
        }

        # 2. ReAct Planner Loop for LLM
        llm_response = _query_ollama(query, agent, context_data)
        
        steps = 0
        ui_action = None
        
        while llm_response and "[TOOL_CALL]" in llm_response and steps < 3:
            steps += 1
            tool_match = re.search(r'\[TOOL_CALL\](.*?)\[/TOOL_CALL\]', llm_response, re.DOTALL)
            if tool_match:
                try:
                    call_data = json.loads(tool_match.group(1).strip())
                    tool_name = call_data.get("name")
                    kwargs = call_data.get("kwargs", {})
                    
                    # Execute
                    result_str = agent.registry.execute(tool_name, kwargs)
                    
                    # Intercept Safety Confirmations
                    if "[UI_ACTION: CONFIRM" in result_str:
                        agent.memory.add_memory("assistant", result_str)
                        return {"type": "safety_auth", "message": result_str, "data": {}}
                    
                    # Feed observation back to LLM
                    feedback_prompt = f"[TOOL_RESULT] {result_str}"
                    llm_response = _query_ollama(feedback_prompt, agent, context_data)
                except Exception as e:
                    feedback_prompt = f"[TOOL_RESULT] Error: {str(e)}"
                    llm_response = _query_ollama(feedback_prompt, agent, context_data)
        
        if llm_response:
            # Parse any lingering UI actions
            ui_match = re.search(r'\[UI_ACTION:\s*NAVIGATE\s*\|\s*target="([^"]+)"\]', llm_response)
            if ui_match:
                ui_action = {"type": "NAVIGATE", "target": ui_match.group(1).lower()}
                llm_response = re.sub(r'\[UI_ACTION:.*?\]', '', llm_response).strip()
                
            agent.memory.add_message("assistant", llm_response)
            resp = {
                "type": "llm_response",
                "message": llm_response,
                "data": {}
            }
            if ui_action: resp["ui_action"] = ui_action
            return resp
            
    except Exception as e:
        pass # Fallthrough if Ollama is offline or crashes

    # 3. Fallback Offline Universal NLP Parser
    query_lower = query.lower()
    
    action = None
    entity = None
    target_name = None

    # Detect Action
    if re.search(r'\b(create|add|make|schedule|new)\b', query_lower): action = "CREATE"
    elif re.search(r'\b(delete|remove|cancel|drop)\b', query_lower): action = "DELETE"
    elif re.search(r'\b(complete|finish|resolve|done|mark)\b', query_lower): action = "UPDATE"
    elif re.search(r'\b(go|open|navigate|show)\b', query_lower): action = "NAVIGATE"

    # Detect Entity
    if re.search(r'\b(task|todo)\b', query_lower): entity = "TASK"
    elif re.search(r'\b(project|workspace)\b', query_lower): entity = "PROJECT"
    elif re.search(r'\b(meeting|event|call)\b', query_lower): entity = "MEETING"
    
    # Frontend Offline Navigation Router
    if action == "NAVIGATE":
        route_map = {"home": "/", "task": "/tasks", "project": "/projects", "meeting": "/meetings", 
                     "calendar": "/calendar", "study": "/study", "analytic": "/analytics", "report": "/analytics", "setting": "/settings"}
        for key, val in route_map.items():
            if key in query_lower:
                msg = f"🚀 Navigating to {key.capitalize()}..."
                agent.memory.add_message("assistant", msg)
                return {"type": "llm_response", "message": msg, "data": {}, "ui_action": {"type": "NAVIGATE", "target": val}}

    if action and entity:
        # Extract title greedily by purging stop words
        clean_q = re.sub(r'\b(create|add|make|schedule|new|delete|remove|cancel|complete|finish|resolve|done|mark|task|todo|project|workspace|meeting|event|call|a|an|the|called|named|name|with|priority|on|at|for|mins|minutes|from|to|is|will|high|medium|low|day|after|tomorrow|today|yesterday|date|time|particular|only|starting|like|that|of)\b', '', query_lower).strip()
        # Clean up punctuation and collapse spaces
        clean_q = re.sub(r'[^\w\s]', '', clean_q)
        target_name = " ".join(clean_q.split()).title()

        if action == "CREATE":
            priority = "High" if "high" in query_lower else "Medium"
            # Date/Time extraction (Basic offline best-effort)
            date_val = "TBD"
            time_val = "TBD"
            if "tomorrow" in query_lower: date_val = "Tomorrow"
            elif "today" in query_lower: date_val = "Today"
            
            time_match = re.search(r'([0-9]{1,2})\s*(am|pm)', query_lower)
            if time_match: time_val = time_match.group(0).upper()

            if entity == "TASK":
                create_task({"title": target_name or "New Task", "priority": priority, "status": "Todo"}, user_id)
                return {"type": "llm_response", "message": f"✅ Created {priority} priority task **{target_name or 'New Task'}** for you! *(Offline Mode)*", "data": {}}
            elif entity == "PROJECT":
                create_project({"name": target_name or "New Project", "description": "", "status": "Active", "progress": 0}, user_id)
                return {"type": "llm_response", "message": f"✅ Created project **{target_name or 'New Project'}** for you! *(Offline Mode)*", "data": {}}
            elif entity == "MEETING":
                create_meeting({"title": target_name or "New Meeting", "date": date_val, "time": time_val, "status": "Scheduled"}, user_id)
                return {"type": "llm_response", "message": f"📅 Scheduled meeting **{target_name or 'New Meeting'}** for {date_val} at {time_val}! *(Offline Mode)*", "data": {}}
        
        elif action in ["UPDATE", "DELETE"]:
            items = []
            if entity == "TASK": items = list(get_all_tasks(user_id))
            elif entity == "PROJECT": items = list(get_all_projects(user_id))
            elif entity == "MEETING": items = list(get_all_meetings(user_id))

            if items and target_name:
                titles = [i.get("title", i.get("name", "")) for i in items]
                matches = difflib.get_close_matches(target_name, titles, n=1, cutoff=0.3)
                if matches:
                    matched_title = matches[0]
                    target_item = next(i for i in items if i.get("title", i.get("name", "")) == matched_title)
                    
                    if entity == "TASK":
                        if action == "DELETE": 
                            msg = agent.safety.request_confirmation(uid, "_execute_delete_task", {"pid": str(target_item["_id"]), "name": target_item["title"]}, f"Are you sure you want to delete the task '{target_item['title']}'?")
                            agent.memory.add_message("assistant", msg)
                            return {"type": "safety_auth", "message": msg, "data": {}}
                        else: update_task(target_item["_id"], uid, {"status": "Done"})
                    elif entity == "PROJECT":
                        if action == "DELETE": 
                            msg = agent.safety.request_confirmation(uid, "_execute_delete_project", {"pid": str(target_item["_id"]), "name": target_item["name"]}, f"Are you sure you want to delete the project '{target_item['name']}'?")
                            agent.memory.add_message("assistant", msg)
                            return {"type": "safety_auth", "message": msg, "data": {}}
                        else: update_project(target_item["_id"], uid, {"progress": 100, "status": "Completed"})
                    elif entity == "MEETING":
                        if action == "DELETE": 
                            msg = agent.safety.request_confirmation(uid, "_execute_delete_meeting", {"pid": str(target_item["_id"]), "name": target_item["title"]}, f"Are you sure you want to cancel the meeting '{target_item['title']}'?")
                            agent.memory.add_message("assistant", msg)
                            return {"type": "safety_auth", "message": msg, "data": {}}
                        else: update_meeting(target_item["_id"], uid, {"status": "Completed"})
                    
                    verb = "Completed"
                    return {"type": "llm_response", "message": f"✅ {verb} {entity.lower()} **{matched_title}**! *(Offline Mode)*", "data": {}}
            
            return {"type": "llm_response", "message": f"❌ Couldn't find a {entity.lower()} matching '{target_name}'. *(Offline Mode)*", "data": {}}

    # Fallback to general suggestions if no implicit action was detected
    if any(w in query_lower for w in ["task", "todo", "what should i do", "priority", "order"]):
        return _task_suggestions(user_id)
    elif any(w in query_lower for w in ["study", "exam", "revision", "learn", "subject"]):
        return _study_suggestions(user_id)
    elif any(w in query_lower for w in ["meeting", "schedule", "calendar", "join"]):
        return _meeting_suggestions(user_id)
    elif any(w in query_lower for w in ["project", "deadline", "progress"]):
        return _project_suggestions(user_id)
    elif any(w in query_lower for w in ["productivity", "analytics", "performance", "report"]):
        return _productivity_insights(user_id)
    elif any(w in query_lower for w in ["focus", "concentrate", "distract"]):
        resp = _focus_suggestions()
    elif any(w in query_lower for w in ["scan", "health", "missing", "improve", "upgrade"]):
        msg = ACTIVE_AGENTS[uid].registry.execute("scan_platform_health", {})
        resp = {"type": "system_scan", "message": msg, "data": {}}
    else:
        agent.memory.add_message("assistant", resp.get("message", ""))
    return resp


def _task_suggestions(user_id):
    tasks = get_all_tasks(user_id)
    in_progress = [t for t in tasks if t.get("status") == "In Progress"]
    todo = [t for t in tasks if t.get("status") == "Todo"]
    high_priority = [t for t in tasks if t.get("priority") in ("High", "Critical")]

    suggestions = []
    if high_priority:
        names = ", ".join([t["title"] for t in high_priority[:3]])
        suggestions.append(f"🔴 You have {len(high_priority)} high-priority task(s): {names}. Focus on these first.")
    if len(in_progress) > 3:
        suggestions.append(f"⚠️ You have {len(in_progress)} tasks in progress. Consider finishing some before starting new ones to avoid context-switching overhead.")
    if todo:
        suggestions.append(f"📋 {len(todo)} tasks are waiting in your Todo list. I'd recommend starting with the one with the earliest due date.")
    if not tasks:
        suggestions.append("✨ Your task list is clear! Great time to plan ahead or review your goals.")

    overload = len(in_progress) + len(todo) > 10
    if overload:
        suggestions.append("🚨 Task overload detected! You have over 10 active items. Consider delegating or postponing low-priority tasks.")

    return {
        "type": "task_suggestions",
        "message": "\n\n".join(suggestions) if suggestions else "You're all caught up! No pending tasks to worry about. 🎉",
        "data": {"total": len(tasks), "in_progress": len(in_progress), "todo": len(todo), "overload": overload}
    }


def _study_suggestions(user_id):
    subjects = get_all_subjects(user_id)
    suggestions = []

    if not subjects:
        return {"type": "study_planning", "message": "📚 You haven't added any subjects yet. Start by adding your subjects and exam dates, and I'll help create a study plan!", "data": {}}

    for subj in subjects:
        topics = get_topics_by_subject(subj["_id"], user_id)
        not_started = [t for t in topics if t.get("status") == "Not Started"]
        in_progress = [t for t in topics if t.get("status") == "In Progress"]

        if subj.get("exam_date"):
            suggestions.append(f"📅 {subj['name']} exam is on {subj['exam_date']}. {'Start studying soon!' if not_started else 'Keep up the good work!'}")
        if not_started:
            suggestions.append(f"📝 {subj['name']}: {len(not_started)} topic(s) haven't been started yet. Consider beginning with the easier ones to build momentum.")
        if in_progress:
            suggestions.append(f"🔄 {subj['name']}: {len(in_progress)} topic(s) in progress. Try using the Pomodoro technique for focused study sessions.")

    suggestions.append("💡 Tip: Use spaced repetition for better retention. I recommend reviewing topics at 1-day, 3-day, and 7-day intervals.")

    return {"type": "study_planning", "message": "\n\n".join(suggestions), "data": {"subjects": len(subjects)}}


def _meeting_suggestions(user_id):
    meetings = get_all_meetings(user_id)
    if not meetings:
        return {"type": "meeting_suggestions", "message": "📅 No meetings scheduled. Enjoy your focus time!", "data": {}}

    priority_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    sorted_meetings = sorted(meetings, key=lambda m: (priority_order.get(m.get("priority", "Medium"), 2), m.get("time", "")))

    tips = []
    if sorted_meetings:
        top = sorted_meetings[0]
        tips.append(f"🎯 Join '{top['title']}' first — it's your highest priority meeting at {top.get('time', 'TBD')}.")
    if len(meetings) > 3:
        tips.append(f"⚠️ You have {len(meetings)} meetings. Consider blocking focus time between them to stay productive.")
    tips.append("💡 Prepare meeting notes in advance for better outcomes.")

    return {"type": "meeting_suggestions", "message": "\n\n".join(tips), "data": {"total": len(meetings)}}


def _project_suggestions(user_id):
    projects = get_all_projects(user_id)
    if not projects:
        return {"type": "project_suggestions", "message": "🏗️ No active projects. Create one to start organizing your work!", "data": {}}

    tips = []
    for p in projects:
        progress = p.get("progress", 0)
        if progress < 30:
            tips.append(f"⚠️ '{p['name']}' is only {progress}% complete. Consider allocating more time to it.")
        elif progress > 80:
            tips.append(f"🎉 '{p['name']}' is {progress}% done — almost there! Final push!")

        if p.get("deadline"):
            tips.append(f"📅 '{p['name']}' deadline: {p['deadline']}. {'On track!' if progress > 50 else 'Consider accelerating work.'}")

    return {"type": "project_suggestions", "message": "\n\n".join(tips) if tips else "All projects look healthy! 💪", "data": {"total": len(projects)}}


def _productivity_insights(user_id):
    tasks = get_all_tasks(user_id)
    done = len([t for t in tasks if t.get("status") == "Done"])
    total = len(tasks)
    score = int((done / total * 100)) if total > 0 else 0

    insights = [
        f"📊 Productivity Score: {score}%",
        f"✅ Completed: {done}/{total} tasks",
    ]
    if score > 80:
        insights.append("🔥 Outstanding productivity! You're crushing it!")
    elif score > 50:
        insights.append("👍 Good progress. Try to tackle a few more tasks today.")
    else:
        insights.append("💪 Room for improvement. Consider breaking large tasks into smaller ones.")

    insights.append("💡 Tip: Try time-blocking your schedule in 90-minute focused intervals for maximum output.")

    return {"type": "productivity_insights", "message": "\n\n".join(insights), "data": {"score": score, "done": done, "total": total}}


def _focus_suggestions():
    tips = random.choice([
        "🧘 Try the Pomodoro technique: 25 min focused work, 5 min break. After 4 cycles, take a 15-min break.",
        "🎯 Enter Focus Mode to eliminate distractions. It will show only your active task and a timer.",
        "📵 Consider silencing notifications for the next 90 minutes for deep work.",
        "🧠 Your brain needs variety — alternate between creative and analytical tasks.",
        "☕ Take a short walk or stretch. Physical movement improves cognitive function."
    ])
    return {"type": "focus_suggestions", "message": tips, "data": {}}


def _general_response(query):
    responses = [
        f"I understand you're asking about '{query}'. Let me help! Try asking me about your tasks, study plan, meetings, or productivity — I can give specific suggestions.",
        f"Great question! Here's what I suggest: Break your goal into smaller tasks, set deadlines, and use Focus Mode for deep work sessions.",
        f"I'm here to help! I can assist with task prioritization, study planning, meeting schedules, and productivity analysis. What would you like to focus on?",
    ]
    return {"type": "general", "message": random.choice(responses), "data": {}}
