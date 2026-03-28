// AetherOS — AI Assistant Page
function renderAIPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="ai-page">
      <div class="page-header" style="flex-shrink:0">
        <h2><i class="ph ph-robot"></i> AI Assistant</h2>
      </div>
      <div class="card" style="flex:1;display:flex;flex-direction:column;overflow:hidden">
        <div class="chat-messages" id="ai-messages">
          <div class="chat-bubble ai">
            <i class="ph ph-hand-waving"></i> Hello! I'm your AetherOS AI assistant. I can help you manage your platform and boost your productivity.
            <div class="ai-quick-chips">
              <button class="ai-chip" onclick="fillAndSend('What are my top priorities today?')">🎯 My Priorities</button>
              <button class="ai-chip" onclick="fillAndSend('Create a new High priority task to Review Q3 metrics')">✨ Create Task</button>
              <button class="ai-chip" onclick="fillAndSend('Create a project called Alpha Centauri')">🚀 Create Project</button>
              <button class="ai-chip" onclick="fillAndSend('Schedule a meeting called Team Sync for tomorrow at 2 pm')">📅 Schedule Meeting</button>
              <button class="ai-chip" onclick="fillAndSend('Complete project Alpha')">✅ Complete Project</button>
              <button class="ai-chip" onclick="fillAndSend('Show my meeting insights')">📊 Meeting Insights</button>
            </div>
          </div>
        </div>
        <div class="chat-input-area">
          <input type="text" id="ai-input" placeholder="Ask AI anything..." onkeypress="if(event.key==='Enter')sendAIMessage()">
          <button class="btn btn-primary" onclick="sendAIMessage()">Send <i class="ph ph-paper-plane-right"></i></button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('ai-input')?.focus();
}

window.fillAndSend = function(text) {
  const input = document.getElementById('ai-input');
  if(input) {
    input.value = text;
    sendAIMessage();
  }
}

async function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const messages = document.getElementById('ai-messages');
  const query = input.value.trim();
  if (!query) return;

  // Add user bubble
  messages.innerHTML += `<div class="chat-bubble user">${escapeHtml(query)}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Show fluid typing indicator
  const typingId = 'typing-' + Date.now();
  const typingHtml = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  messages.innerHTML += `<div class="chat-bubble ai" id="${typingId}">${typingHtml}</div>`;
  messages.scrollTop = messages.scrollHeight;

  try {
    const data = await apiRequest('/api/ai/ask', 'POST', { query, context: "general" });
    
    // Remove typing indicator
    document.getElementById(typingId)?.remove();

    if (data && data.type === 'safety_auth') {
      const match = data.message.match(/\[UI_ACTION: CONFIRM \| message="([^"]+)"\]/);
      const warningText = match ? match[1] : "The AI Agent needs confirmation to proceed.";
      messages.innerHTML += `
        <div class="chat-bubble ai" style="border: 1px solid var(--danger-color); background: rgba(255, 59, 48, 0.05);">
          <i class="ph ph-warning-circle" style="color: var(--danger-color);"></i> <strong>Safety Authorization Required</strong><br><br>
          ${warningText}<br><br>
          <em>Reply with "Yes" to approve, or "No" to cancel.</em>
        </div>
      `;
    }
    else if (data && data.message) {
      messages.innerHTML += `<div class="chat-bubble ai">${formatAIResponse(data.message)}</div>`;
      
      // Execute UI actions pushed by the Agent Core
      if (data.ui_action && data.ui_action.type === 'NAVIGATE') {
        setTimeout(() => {
          window.location.hash = data.ui_action.target;
        }, 1200); // Small delay to let user read the navigation message
      }
    } else {
      // Handle cases where data or data.message is missing but no error occurred
      messages.innerHTML += `<div class="chat-bubble ai">Sorry, I couldn't process that request.</div>`;
    }
  } catch (e) {
    // If an error occurs, remove the typing indicator and show an error message
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `<div class="chat-bubble ai"><i class="ph ph-x-circle"></i> Sorry, something went wrong. Please try again.</div>`;
  }
  messages.scrollTop = messages.scrollHeight;
}

function formatAIResponse(text) {
  if (!text) return '';
  
  // Basic markdown parsing
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Clean up explicit newlines/bullet points to look good in HTML
  text = text.replace(/(?:\r\n|\r|\n)/g, '<br>');
  // Convert - or * lists implicitly via bullet formatting to prevent br breakage
  text = text.replace(/<br>\s*-\s+/g, '<br>• ');
  text = text.replace(/^-\s+/g, '• ');

  return text;
}
