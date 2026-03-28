import json
import inspect
from functools import wraps

class MemorySystem:
    def __init__(self, user_id):
        self.user_id = user_id
        self.short_term = []
        self.context = {}

    def add_message(self, role, content):
        self.short_term.append({"role": role, "content": content})
        if len(self.short_term) > 15:
            self.short_term.pop(0)

    def get_history(self):
        return "\n".join([f"{m['role'].upper()}: {m['content']}" for m in self.short_term])


class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name, description, parameters):
        def decorator(func):
            self.tools[name] = {
                "name": name,
                "description": description,
                "parameters": parameters,
                "func": func
            }
            @wraps(func)
            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            return wrapper
        return decorator

    def get_tool_schemas(self):
        return [{"name": t["name"], "description": t["description"], "parameters": t["parameters"]} for t in self.tools.values()]

    def execute(self, name, kwargs):
        if name in self.tools:
            return self.tools[name]["func"](**kwargs)
        raise ValueError(f"Tool '{name}' is not registered.")


class SafetyLayer:
    def __init__(self):
        self.pending_confirmations = {}

    def request_confirmation(self, user_id, action_name, action_kwargs, reason):
        # We store the pending action in memory
        self.pending_confirmations[user_id] = {
            "action_name": action_name,
            "action_kwargs": action_kwargs,
            "reason": reason
        }
        return f"[UI_ACTION: CONFIRM | message=\"{reason}\"]"

    def approve_action(self, user_id):
        return self.pending_confirmations.pop(user_id, None)

    def reject_action(self, user_id):
        if user_id in self.pending_confirmations:
            del self.pending_confirmations[user_id]


class AgentCore:
    def __init__(self, user_id):
        self.user_id = str(user_id)
        self.memory = MemorySystem(self.user_id)
        self.registry = ToolRegistry()
        self.safety = SafetyLayer()

    def generate_system_prompt(self, context_data):
        schemas = json.dumps(self.registry.get_tool_schemas(), indent=2)
        return f"""You are AetherOS AI, a state-of-the-art Autonomous System Operator.
You have the ability to execute actions on behalf of the user using Tools.

PLATFORM CONTEXT:
- Pending Tasks: {context_data['tasks']}
- Upcoming Meetings: {context_data['meetings']}
- Active Projects: {context_data['projects']}

CHAT HISTORY:
{self.memory.get_history()}

=== TOOL USAGE ===
You have access to the following tools:
{schemas}

To use a tool, you MUST output a JSON block exactly like this:
[TOOL_CALL]
{{"name": "tool_name", "kwargs": {{"param1": "value1"}}}}
[/TOOL_CALL]

You can only call one tool at a time. After calling a tool, the system will reply with [TOOL_RESULT]. You can then evaluate the result and call another tool if needed, or provide your final response to the user.
If a tool requires user confirmation, the system will wait for their approval.
If you are asked to navigate or show a page, use the `navigate_ui` tool.

Provide direct, helpful responses. Think step-by-step."""
