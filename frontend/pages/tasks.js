// AetherOS — Tasks Page (Premium Overhaul)
let _allTasks = [];
let _expandedTasks = {};
let _createFormPriority = 'High';
let _createFormStatus = 'Todo';
let _createFormTags = [];
let _editFormPriority = '';
let _editFormStatus = '';
let _editFormTags = [];

async function renderTasksPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="tasks-page">
      <div class="page-header">
        <h2><i class="ph ph-check-circle"></i> Tasks</h2>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="downloadBlob(API.exportTasks(),'tasks_export.xlsx');showToast('Exporting tasks...')"><i class="ph ph-download-simple"></i> Export</button>
          <button class="btn btn-primary" onclick="showCreateTaskModal()">+ New Task</button>
        </div>
      </div>
      <div class="task-stats-bar" id="task-stats-bar"></div>
      <div class="filters" id="task-filters">
        <div class="task-search">
          <i class="ph ph-magnifying-glass"></i>
          <input type="text" id="task-search-input" placeholder="Search tasks..." oninput="renderFilteredTasks()">
        </div>
        <select class="form-input" style="width:auto" id="filter-status" onchange="renderFilteredTasks()">
          <option value="">All Status</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>
        <select class="form-input" style="width:auto" id="filter-priority" onchange="renderFilteredTasks()">
          <option value="">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <div class="task-cards-list" id="tasks-list">
        <div class="empty-state"><p>Loading...</p></div>
      </div>
    </div>
  `;
  await loadAllTasks();
}

async function loadAllTasks() {
  let tasks = await API.getTasks('');
  if (!Array.isArray(tasks)) tasks = [];
  _allTasks = tasks;
  renderStatsBar();
  renderFilteredTasks();
}

function renderStatsBar() {
  const bar = document.getElementById('task-stats-bar');
  if (!bar) return;
  const total = _allTasks.length;
  const done = _allTasks.filter(t => t.status === 'Done').length;
  const progress = _allTasks.filter(t => t.status === 'In Progress').length;
  const today = new Date().toISOString().split('T')[0];
  const overdue = _allTasks.filter(t => t.due_date && t.due_date < today && t.status !== 'Done').length;
  bar.innerHTML = `
    <div class="stat-pill"><div class="stat-icon total"><i class="ph ph-list-checks"></i></div><div><div class="stat-num">${total}</div><div class="stat-label">Total Tasks</div></div></div>
    <div class="stat-pill"><div class="stat-icon done"><i class="ph ph-check-circle"></i></div><div><div class="stat-num">${done}</div><div class="stat-label">Completed</div></div></div>
    <div class="stat-pill"><div class="stat-icon progress"><i class="ph ph-spinner"></i></div><div><div class="stat-num">${progress}</div><div class="stat-label">In Progress</div></div></div>
    <div class="stat-pill"><div class="stat-icon overdue"><i class="ph ph-warning"></i></div><div><div class="stat-num">${overdue}</div><div class="stat-label">Overdue</div></div></div>
  `;
}

function renderFilteredTasks() {
  const status = document.getElementById('filter-status')?.value || '';
  const priority = document.getElementById('filter-priority')?.value || '';
  const search = (document.getElementById('task-search-input')?.value || '').toLowerCase();
  let tasks = _allTasks;
  if (status) tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (search) tasks = tasks.filter(t => (t.title || '').toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));

  const container = document.getElementById('tasks-list');
  if (!container) return;

  if (!tasks.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon"><i class="ph-fill ph-clipboard-text" style="font-size:3rem;color:var(--gray-300)"></i></div><h4>No tasks found</h4><p style="color:var(--gray-400)">Create your first task to get started</p></div>`;
    return;
  }

  container.innerHTML = tasks.map(t => {
    const priClass = 'priority-' + (t.priority || 'medium').toLowerCase();
    const statusDone = t.status === 'Done' ? 'status-done' : '';
    const subtasks = t.subtasks || [];
    const subtasksDone = subtasks.filter(s => s.completed).length;
    const isExpanded = _expandedTasks[t._id];
    const statusCycleClass = t.status === 'Done' ? 's-done' : t.status === 'In Progress' ? 's-progress' : 's-todo';

    return `
      <div class="task-card ${priClass} ${statusDone}" id="task-${t._id}">
        <div class="task-card-body">
          <div class="task-card-check ${t.status==='Done'?'checked':''}" onclick="toggleTaskDone('${t._id}','${t.status}')">✓</div>
          <div class="task-card-info">
            <div class="task-card-title">${escapeHtml(t.title || 'Untitled Task')}</div>
            ${t.description ? `<div class="task-card-desc">${escapeHtml(t.description)}</div>` : ''}
            <div class="task-card-meta">
              ${(t.tags||[]).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
              ${t.due_date ? `<span class="text-xs text-muted"><i class="ph ph-calendar-blank"></i> ${formatDate(t.due_date)}</span>` : ''}
              ${t.time_tracked ? `<span class="text-xs" style="color:var(--primary-500)"><i class="ph ph-timer"></i> ${t.time_tracked}m</span>` : ''}
              ${subtasks.length ? `<span class="subtask-toggle" onclick="toggleSubtaskExpand('${t._id}')"><i class="ph ph-caret-${isExpanded?'up':'down'}"></i> ${subtasksDone}/${subtasks.length} subtasks</span>` : ''}
            </div>
          </div>
          <div class="task-card-right">
            <span class="badge ${priorityClass(t.priority)}">${t.priority}</span>
            <button class="status-cycle ${statusCycleClass}" onclick="cycleTaskStatus('${t._id}','${t.status}')">${t.status}</button>
            <div class="task-card-actions">
              <button class="btn btn-sm btn-outline" onclick="showEditTaskModal('${t._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
              <button class="btn btn-sm btn-outline" onclick="confirmDeleteTask('${t._id}')" title="Delete" style="color:var(--error)"><i class="ph ph-trash"></i></button>
            </div>
          </div>
        </div>
        ${isExpanded ? renderSubtaskCascade(t._id, subtasks) : ''}
      </div>
    `;
  }).join('');
}

function renderSubtaskCascade(taskId, subtasks) {
  return `
    <div class="subtask-cascade">
      ${subtasks.map((s, idx) => `
        <div class="subtask-cascade-item">
          <div class="subtask-check ${s.completed ? 'checked' : ''}" onclick="inlineToggleSubtask('${taskId}', ${idx}, ${!s.completed})">✓</div>
          <span class="subtask-text ${s.completed ? 'completed' : ''}">${escapeHtml(s.title)}</span>
        </div>
      `).join('')}
      <div class="subtask-add-row">
        <input type="text" id="inline-sub-${taskId}" placeholder="Add a subtask..." onkeypress="if(event.key==='Enter')inlineAddSubtask('${taskId}')">
        <button class="btn btn-sm btn-secondary" onclick="inlineAddSubtask('${taskId}')">Add</button>
      </div>
    </div>
  `;
}

function toggleSubtaskExpand(taskId) {
  _expandedTasks[taskId] = !_expandedTasks[taskId];
  renderFilteredTasks();
}

async function inlineToggleSubtask(taskId, idx, completed) {
  let task = await (await fetch('/api/tasks/' + taskId, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })).json();
  if (task.subtasks && task.subtasks[idx]) {
    task.subtasks[idx].completed = completed;
    const res = await API.updateTask(taskId, { subtasks: task.subtasks });
    if (res && res.error) return;
    showToast(completed ? 'Subtask completed!' : 'Subtask reopened');
    await loadAllTasks();
  }
}

async function inlineAddSubtask(taskId) {
  const input = document.getElementById('inline-sub-' + taskId);
  const title = input?.value.trim();
  if (!title) return showToast('Subtask title required', 'error');
  const res = await API.addSubtask(taskId, { title });
  if (res && res.error) return;
  showToast('Subtask added!');
  await loadAllTasks();
}

async function cycleTaskStatus(id, current) {
  const cycle = { 'Todo': 'In Progress', 'In Progress': 'Done', 'Done': 'Todo' };
  const next = cycle[current] || 'Todo';
  const res = await API.updateTask(id, { status: next });
  if (res && res.error) return;
  showToast(`Status → ${next}`);
  await loadAllTasks();
  if (typeof loadDashTasks === 'function') loadDashTasks();
}

async function toggleTaskDone(id, currentStatus) {
  const newStatus = currentStatus === 'Done' ? 'Todo' : 'Done';
  const res = await API.updateTask(id, { status: newStatus });
  if (res && res.error) return;
  showToast(newStatus === 'Done' ? 'Task completed! <i class="ph-fill ph-party-popper"></i>' : 'Task reopened');
  await loadAllTasks();
  if (typeof loadDashTasks === 'function') loadDashTasks();
}

function refreshTasksUI() {
  if (document.getElementById('tasks-list')) loadAllTasks();
  if (document.getElementById('dash-tasks-content') && typeof loadDashTasks === 'function') loadDashTasks();
}

// ============ CREATE MODAL ============
function showCreateTaskModal() {
  _createFormPriority = 'High';
  _createFormStatus = 'Todo';
  _createFormTags = [];
  showModal('Create New Task', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Title <span class="required">*</span></label>
          <input type="text" class="form-input" id="new-task-title" placeholder="What needs to be done?" required maxlength="100" autofocus>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="new-task-desc" placeholder="Add some context or details..." maxlength="500"></textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="create-priority-sel">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p==='High'?'selected':''}" onclick="selectCreatePriority('${p}')">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-selector" id="create-status-sel">
            ${['Todo','In Progress'].map(s => `<div class="status-option ${s==='Todo'?'selected':''}" onclick="selectCreateStatus('${s}')">${s}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="new-task-due">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags</label>
          <div class="tag-input-area" id="create-tag-area" onclick="document.getElementById('create-tag-input').focus()">
            <input type="text" id="create-tag-input" placeholder="Type and press Enter..." onkeydown="handleCreateTagKey(event)">
          </div>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createTask()"><i class="ph ph-plus"></i> Create Task</button>`);
}

window.selectCreatePriority = function(p) {
  _createFormPriority = p;
  document.querySelectorAll('#create-priority-sel .priority-option').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#create-priority-sel .p-${p.toLowerCase()}`).classList.add('selected');
}
window.selectCreateStatus = function(s) {
  _createFormStatus = s;
  document.querySelectorAll('#create-status-sel .status-option').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
}
window.handleCreateTagKey = function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(',','');
    if (val && !_createFormTags.includes(val)) {
      _createFormTags.push(val);
      renderCreateTags();
    }
    e.target.value = '';
  }
}
function renderCreateTags() {
  const area = document.getElementById('create-tag-area');
  const input = document.getElementById('create-tag-input');
  if (!area) return;
  area.innerHTML = _createFormTags.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="removeCreateTag(${i})">✕</span></span>`).join('');
  area.appendChild(input || Object.assign(document.createElement('input'), { type:'text', id:'create-tag-input', placeholder:'Type and press Enter...', onkeydown: function(e){handleCreateTagKey(e)} }));
  // Re-bind after re-render
  const newInput = document.getElementById('create-tag-input');
  if (newInput) { newInput.onkeydown = handleCreateTagKey; newInput.focus(); }
}
window.removeCreateTag = function(idx) { _createFormTags.splice(idx, 1); renderCreateTags(); }

async function createTask() {
  const title = document.getElementById('new-task-title').value.trim();
  if (!title) { showToast('Task Title is required', 'error'); document.getElementById('new-task-title').focus(); return; }
  const res = await API.createTask({
    title,
    description: document.getElementById('new-task-desc').value,
    priority: _createFormPriority,
    status: _createFormStatus,
    due_date: document.getElementById('new-task-due').value,
    tags: _createFormTags,
  });
  if (res && res.error) return;
  closeModal();
  showToast('Task created successfully! <i class="ph-fill ph-check-circle"></i>');
  refreshTasksUI();
}

// ============ EDIT MODAL ============
async function showEditTaskModal(id) {
  let taskInfo;
  try {
    taskInfo = await (await fetch('/api/tasks/' + id, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })).json();
  } catch(e) { return showToast('Error loading task','error'); }

  _editFormPriority = taskInfo.priority || 'Medium';
  _editFormStatus = taskInfo.status || 'Todo';
  _editFormTags = [...(taskInfo.tags || [])];

  showModal('Edit Task', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Title <span class="required">*</span></label>
          <input type="text" class="form-input" id="edit-task-title" value="${escapeHtml(taskInfo.title)}" required maxlength="100">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="edit-task-desc" maxlength="500">${escapeHtml(taskInfo.description||'')}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="edit-priority-sel">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p===_editFormPriority?'selected':''}" onclick="selectEditPriority('${p}')">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-selector" id="edit-status-sel">
            ${['Todo','In Progress','Done'].map(s => `<div class="status-option ${s===_editFormStatus?'selected':''}" onclick="selectEditStatus(this,'${s}')">${s}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="edit-task-due" value="${taskInfo.due_date||''}">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Tags</label>
          <div class="tag-input-area" id="edit-tag-area" onclick="document.getElementById('edit-tag-input')?.focus()">
            ${_editFormTags.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="removeEditTag(${i})">✕</span></span>`).join('')}
            <input type="text" id="edit-tag-input" placeholder="Type and press Enter..." onkeydown="handleEditTagKey(event)">
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-top:var(--space-2)">
        <div class="form-group">
          <label class="form-label"><i class="ph ph-list-dashes"></i> Subtasks</label>
          <div class="subtask-edit-list" id="edit-task-subtasks-list">
            ${(taskInfo.subtasks||[]).map((s, idx) => `
              <div class="subtask-edit-item">
                <input type="checkbox" ${s.completed?'checked':''} onchange="toggleSubtask('${id}', ${idx}, this.checked)">
                <span style="${s.completed?'text-decoration:line-through;color:var(--gray-400)':''}">${escapeHtml(s.title)}</span>
              </div>
            `).join('') || '<span class="text-xs text-muted">No subtasks yet</span>'}
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <input class="form-input" id="new-subtask-title" placeholder="New subtask..." style="flex:1;padding:8px 12px;font-size:var(--font-xs)">
            <button class="btn btn-secondary btn-sm" onclick="addNewSubtask('${id}')">Add</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label"><i class="ph ph-timer"></i> Time Tracking</label>
          <div class="time-info" style="margin-bottom:var(--space-3)">
            <span class="badge in-progress">${taskInfo.time_tracked || 0} mins logged</span>
          </div>
          <div style="display:flex;gap:var(--space-2)">
            <input type="number" class="form-input" id="add-time-mins" placeholder="+ Mins" style="width:80px;padding:8px 12px;font-size:var(--font-xs)" min="1">
            <button class="btn btn-secondary btn-sm" onclick="addTrackedTime('${id}')">Log Time</button>
          </div>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveEditTask('${id}')"><i class="ph ph-floppy-disk"></i> Save Changes</button>`);
}

window.selectEditPriority = function(p) {
  _editFormPriority = p;
  document.querySelectorAll('#edit-priority-sel .priority-option').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#edit-priority-sel .p-${p.toLowerCase()}`).classList.add('selected');
}
window.selectEditStatus = function(el, s) {
  _editFormStatus = s;
  document.querySelectorAll('#edit-status-sel .status-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
window.handleEditTagKey = function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(',','');
    if (val && !_editFormTags.includes(val)) {
      _editFormTags.push(val);
      renderEditTags();
    }
    e.target.value = '';
  }
}
function renderEditTags() {
  const area = document.getElementById('edit-tag-area');
  if (!area) return;
  area.innerHTML = _editFormTags.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="removeEditTag(${i})">✕</span></span>`).join('') + `<input type="text" id="edit-tag-input" placeholder="Type and press Enter..." onkeydown="handleEditTagKey(event)">`;
  document.getElementById('edit-tag-input')?.focus();
}
window.removeEditTag = function(idx) { _editFormTags.splice(idx, 1); renderEditTags(); }

async function addNewSubtask(taskId) {
  const title = document.getElementById('new-subtask-title').value.trim();
  if (!title) return showToast('Subtask title required', 'error');
  const res = await API.addSubtask(taskId, { title });
  if (res && res.error) return;
  showToast('Subtask added!');
  await showEditTaskModal(taskId);
  await loadAllTasks();
}

async function toggleSubtask(taskId, subtaskIdx, completed) {
  let taskInfo = await (await fetch('/api/tasks/' + taskId, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })).json();
  taskInfo.subtasks[subtaskIdx].completed = completed;
  const res = await API.updateTask(taskId, { subtasks: taskInfo.subtasks });
  if (res && res.error) return;
  showToast(completed ? 'Subtask completed!' : 'Subtask unchecked');
  await showEditTaskModal(taskId);
  await loadAllTasks();
}

async function addTrackedTime(taskId) {
  const mins = parseInt(document.getElementById('add-time-mins').value);
  if (!mins || mins <= 0) return showToast('Enter valid minutes', 'error');
  const res = await API.trackTime(taskId, mins);
  if (res && res.error) return;
  showToast('Time logged successfully!');
  await showEditTaskModal(taskId);
  await loadAllTasks();
}

async function saveEditTask(id) {
  const title = document.getElementById('edit-task-title').value.trim();
  if (!title) { showToast('Title is required', 'error'); return; }
  const res = await API.updateTask(id, {
    title,
    description: document.getElementById('edit-task-desc').value,
    priority: _editFormPriority,
    status: _editFormStatus,
    due_date: document.getElementById('edit-task-due').value,
    tags: _editFormTags,
  });
  if (res && res.error) return;
  closeModal(); showToast('Task updated! <i class="ph-fill ph-check-circle"></i>'); refreshTasksUI();
}

async function confirmDeleteTask(id) {
  showModal('Delete Task', `
    <div style="text-align:center;padding:var(--space-4) 0">
      <i class="ph ph-trash" style="font-size:3rem;color:var(--error);margin-bottom:var(--space-3);display:block"></i>
      <p style="color:var(--gray-600)">Are you sure you want to <strong>permanently delete</strong> this task?</p>
      <p style="color:var(--gray-400);font-size:var(--font-xs)">This action cannot be undone.</p>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="deleteTaskConfirm('${id}')"><i class="ph ph-trash"></i> Delete Task</button>`);
}

async function deleteTaskConfirm(id) {
  const res = await API.deleteTask(id); 
  if (res && res.error) return;
  closeModal(); showToast('Task deleted successfully'); refreshTasksUI();
}
