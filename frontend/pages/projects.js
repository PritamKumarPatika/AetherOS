// AetherOS — Projects Page (Premium Overhaul)
let _currentProjectId = null;
let _projFormPriority = 'Medium';
let _projFormStatus = 'Active';
let _projFormTeam = [];

async function renderProjectsPage() {
  _currentProjectId = null;
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="projects-page">
      <div class="page-header">
        <h2><i class="ph ph-folder"></i> Projects</h2>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="downloadBlob(API.exportProjects(),'projects_export.xlsx');showToast('Exporting...')"><i class="ph ph-download-simple"></i> Export</button>
          <button class="btn btn-primary" onclick="showCreateProjectModal()">+ New Project</button>
        </div>
      </div>
      <div class="project-grid" id="projects-grid"><div class="empty-state"><p>Loading...</p></div></div>
    </div>
  `;
  loadProjects();
}

async function loadProjects() {
  let projects = await API.getProjects();
  if (!Array.isArray(projects)) projects = [];
  const topLevel = projects.filter(p => !p.parent_id);
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = topLevel.map(p => {
    const priClass = 'priority-' + (p.priority || 'medium').toLowerCase();
    const statusDot = p.status === 'Completed' ? 'dot-done' : p.status === 'Active' ? 'dot-active' : p.status === 'On Hold' ? 'dot-hold' : 'dot-planning';
    return `
    <div class="proj-card ${priClass}" onclick="openProjectDetail('${p._id}')">
      <div class="proj-header">
        <div>
          <div class="proj-name">${escapeHtml(p.name || 'Untitled Project')}</div>
          <div class="proj-badges">
            <span class="badge ${priorityClass(p.priority)}">${p.priority}</span>
            <span class="proj-status-dot ${statusDot}"></span>
            <span class="text-xs" style="color:var(--gray-500)">${p.status}</span>
          </div>
        </div>
        <div class="proj-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-outline" onclick="showEditProjectModal('${p._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
          <button class="btn btn-sm btn-outline" onclick="confirmDeleteProject('${p._id}')" title="Delete" style="color:var(--error)"><i class="ph ph-trash"></i></button>
        </div>
      </div>
      <div class="proj-desc">${escapeHtml(p.description || 'No description')}</div>
      <div class="proj-progress">
        <div class="goal-info"><span class="goal-name text-xs">Progress</span><span class="goal-percent text-xs">${p.progress}%</span></div>
        <div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      </div>
      <div class="proj-meta">
        <span><i class="ph ph-calendar-blank"></i> ${formatDate(p.deadline) || 'No deadline'}</span>
        ${(p.team||[]).length ? `<div class="project-avatars">${(p.team||[]).slice(0,3).map(m => `<div class="avatr">${getInitials(m)}</div>`).join('')}${(p.team||[]).length > 3 ? `<span class="text-xs text-muted">+${(p.team||[]).length - 3}</span>` : ''}</div>` : ''}
      </div>
    </div>
  `}).join('') + `
    <div class="proj-card proj-card-new" onclick="showCreateProjectModal()">
      <div style="font-size:2.5rem;margin-bottom:8px;color:var(--gray-300)"><i class="ph ph-plus"></i></div>
      <div class="font-medium" style="color:var(--gray-400)">New Project</div>
    </div>
  `;
}

// ===== PROJECT DETAIL VIEW =====
async function openProjectDetail(pid) {
  _currentProjectId = pid;
  const p = await API.getProject(pid);
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="projects-page">
      <div class="page-header">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-outline btn-sm" onclick="renderProjectsPage()"><i class="ph ph-arrow-left"></i> Back</button>
          <div>
            <h2 style="margin-bottom:2px">${escapeHtml(p.name)}</h2>
            <div style="display:flex;gap:8px;align-items:center">
              <span class="badge ${priorityClass(p.priority)}">${p.priority}</span>
              <span class="proj-status-dot ${p.status==='Completed'?'dot-done':p.status==='Active'?'dot-active':p.status==='On Hold'?'dot-hold':'dot-planning'}"></span>
              <span class="text-sm" style="color:var(--gray-500)">${p.status}</span>
              ${p.deadline ? `<span class="text-sm text-muted"><i class="ph ph-calendar-blank"></i> ${formatDate(p.deadline)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="showEditProjectModal('${pid}')"><i class="ph ph-pencil-simple"></i> Edit</button>
        </div>
      </div>

      <div style="margin-bottom:20px">
        <div class="goal-info"><span class="goal-name">Overall Progress</span><span class="goal-percent">${p.progress}%</span></div>
        <div class="progress-bar" style="height:8px"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      </div>

      <div class="st-tabs" id="proj-tabs" style="margin-bottom: 32px;">
        <div class="st-tab active proj-detail-tab" data-tab="overview" onclick="switchProjTab('overview',this)"><i class="ph ph-clipboard-text"></i> Overview</div>
        <div class="st-tab proj-detail-tab" data-tab="tasks" onclick="switchProjTab('tasks',this)"><i class="ph ph-check-circle"></i> Tasks</div>
        <div class="st-tab proj-detail-tab" data-tab="notes" onclick="switchProjTab('notes',this)"><i class="ph ph-notebook"></i> Notes</div>
        <div class="st-tab proj-detail-tab" data-tab="attachments" onclick="switchProjTab('attachments',this)"><i class="ph ph-paperclip"></i> Attachments</div>
        <div class="st-tab proj-detail-tab" data-tab="subprojects" onclick="switchProjTab('subprojects',this)"><i class="ph ph-tree-structure"></i> Sub-Projects</div>
      </div>

      <div id="proj-tab-content"></div>
    </div>
  `;
  switchProjTab('overview');
}

function switchProjTab(tab, el) {
  document.querySelectorAll('.proj-detail-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  else document.querySelector(`.proj-detail-tab[data-tab="${tab}"]`)?.classList.add('active');
  const pid = _currentProjectId;
  switch(tab) {
    case 'overview': loadProjOverview(pid); break;
    case 'tasks': loadProjTasks(pid); break;
    case 'notes': loadProjNotes(pid); break;
    case 'attachments': loadProjAttachments(pid); break;
    case 'subprojects': loadProjSubprojects(pid); break;
  }
}

async function loadProjOverview(pid) {
  const p = await API.getProject(pid);
  let tasks = await API.getProjectTasks(pid);
  if (!Array.isArray(tasks)) tasks = [];
  let notes = await API.getProjectNotes(pid);
  if (!Array.isArray(notes)) notes = [];
  let atts = await API.getProjectAttachments(pid);
  if (!Array.isArray(atts)) atts = [];
  let subs = await API.getSubProjects(pid);
  if (!Array.isArray(subs)) subs = [];
  const container = document.getElementById('proj-tab-content');
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProg = tasks.filter(t => t.status === 'In Progress').length;

  container.innerHTML = `
    <div class="proj-stats-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">
      <div class="proj-detail-card stat-card" onclick="switchProjTab('tasks')" style="padding:20px;display:flex;align-items:center;gap:16px;">
        <div class="stat-icon" style="width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--primary-50);color:var(--primary-500)"><i class="ph ph-list-checks"></i></div>
        <div><div style="font-size:1.5rem;font-weight:800;color:var(--gray-800);line-height:1">${tasks.length}</div><div style="font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-top:4px">Total Tasks</div></div>
      </div>
      <div class="proj-detail-card stat-card" style="padding:20px;display:flex;align-items:center;gap:16px;">
        <div class="stat-icon" style="width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--success-light);color:var(--success)"><i class="ph ph-check-circle"></i></div>
        <div><div style="font-size:1.5rem;font-weight:800;color:var(--gray-800);line-height:1">${done}</div><div style="font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-top:4px">Completed</div></div>
      </div>
      <div class="proj-detail-card stat-card" onclick="switchProjTab('notes')" style="padding:20px;display:flex;align-items:center;gap:16px;">
        <div class="stat-icon" style="width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--accent-100);color:var(--accent-500)"><i class="ph ph-notebook"></i></div>
        <div><div style="font-size:1.5rem;font-weight:800;color:var(--gray-800);line-height:1">${notes.length}</div><div style="font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-top:4px">Notes</div></div>
      </div>
      <div class="proj-detail-card stat-card" onclick="switchProjTab('attachments')" style="padding:20px;display:flex;align-items:center;gap:16px;">
        <div class="stat-icon" style="width:48px;height:48px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--warning-light, rgba(245,158,11,0.1));color:var(--warning)"><i class="ph ph-paperclip"></i></div>
        <div><div style="font-size:1.5rem;font-weight:800;color:var(--gray-800);line-height:1">${atts.length + subs.length}</div><div style="font-size:0.75rem;font-weight:600;color:var(--gray-500);margin-top:4px">Resources</div></div>
      </div>
    </div>

    <div class="proj-detail-card" style="margin-bottom:20px; padding: 24px;">
      <div class="dash-card-head" style="margin-bottom:12px;">
        <h4 class="dash-card-title"><i class="ph-fill ph-text-align-left"></i> Project Description</h4>
      </div>
      <p style="font-size:0.82rem;color:var(--gray-600);line-height:1.7">${escapeHtml(p.description || 'No description provided.')}</p>
    </div>

    ${tasks.length ? `
    <div class="proj-detail-card" style="margin-bottom:20px; padding: 24px;">
      <div class="dash-card-head" style="margin-bottom:16px;">
        <h4 class="dash-card-title"><i class="ph-fill ph-chart-pie-slice"></i> Task Breakdown</h4>
      </div>
      <div style="display:flex;gap:16px;align-items:center">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;font-weight:700;color:var(--gray-600);margin-bottom:8px"><span>Done ${done}/${tasks.length}</span><span style="color:var(--primary-500)">In Progress ${inProg}</span></div>
          <div class="projects-page"><div class="progress-bar" style="height:10px;background:var(--gray-100)"><div class="progress-fill" style="width:${tasks.length ? (done/tasks.length*100) : 0}%;background:var(--success)"></div></div></div>
        </div>
      </div>
    </div>` : ''}

    ${(p.team||[]).length ? `
    <div class="proj-detail-card" style="padding: 24px;">
      <div class="dash-card-head" style="margin-bottom:16px;">
        <h4 class="dash-card-title"><i class="ph-fill ph-users-three"></i> Team Members</h4>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px">
        ${(p.team||[]).map(m => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 16px;background:var(--gray-50);border-radius:var(--radius-full);border:1px solid var(--gray-100);transition:all var(--transition-fast)" onmouseover="this.style.background='var(--primary-50)';this.style.borderColor='var(--primary-200)'" onmouseout="this.style.background='var(--gray-50)';this.style.borderColor='var(--gray-100)'">
            <div class="avatr" style="width:28px;height:28px;font-size:0.6rem;margin-left:0;border:none;box-shadow:0 2px 6px rgba(0,0,0,0.1)">${getInitials(m)}</div>
            <span class="text-xs" style="font-weight:700;color:var(--gray-700)">${escapeHtml(m)}</span>
          </div>
        `).join('')}
      </div>
    </div>` : ''}
  `;
}

// ===== PROJECT TASKS TAB =====
let _projTaskSubtaskOpen = {};

async function loadProjTasks(pid) {
  let tasks = await API.getProjectTasks(pid);
  if (!Array.isArray(tasks)) tasks = [];
  const container = document.getElementById('proj-tab-content');
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:var(--font-sm);font-weight:700;color:var(--gray-600)"><i class="ph ph-check-circle"></i> Project Tasks <span class="text-xs text-muted" style="font-weight:400">(${tasks.length})</span></h3>
      <button class="btn btn-primary btn-sm" onclick="showCreateProjTaskModal('${pid}')">+ Add Task</button>
    </div>
    <div class="task-cards-list" style="max-width: 900px;">
      ${tasks.length ? tasks.map(t => {
        const priClass = 'priority-' + (t.priority || 'medium').toLowerCase();
        const statusDone = t.status === 'Done' ? 'status-done' : '';
        const statusCycleClass = t.status === 'Done' ? 's-done' : t.status === 'In Progress' ? 's-progress' : 's-todo';
        const subs = t.subtasks || [];
        const subsDone = subs.filter(s => s.completed).length;
        const isOpen = _projTaskSubtaskOpen[t._id];
        return `
        <div class="task-card ${priClass} ${statusDone}">
          <div class="task-card-body">
            <div class="task-card-check ${t.status==='Done'?'checked':''}" onclick="toggleTaskDone('${t._id}','${t.status}');setTimeout(()=>loadProjTasks('${pid}'),300)">✓</div>
            <div class="task-card-info" style="${t.status==='Done' ? 'opacity: 0.7;' : ''}">
              <div class="task-card-title">${escapeHtml(t.title)}</div>
              ${t.description ? `<div class="task-card-desc">${escapeHtml(t.description)}</div>` : ''}
              <div class="task-card-meta">
                ${(t.tags||[]).map(tag => `<span class="badge" style="background:var(--primary-50);color:var(--primary-600);font-size:0.65rem;padding:1px 8px;border-radius:var(--radius-full)">${escapeHtml(tag)}</span>`).join('')}
                ${t.due_date ? `<span class="text-xs text-muted"><i class="ph ph-calendar-blank"></i> ${formatDate(t.due_date)}</span>` : ''}
                ${subs.length ? `<span class="subtask-toggle" onclick="event.stopPropagation();_projTaskSubtaskOpen['${t._id}']=!_projTaskSubtaskOpen['${t._id}'];loadProjTasks('${pid}')"><i class="ph ph-caret-${isOpen?'up':'down'}"></i> ${subsDone}/${subs.length} subtasks</span>` : ''}
              </div>
            </div>
            <div class="task-card-right">
              <span class="badge ${priorityClass(t.priority)}" style="font-size:0.65rem">${t.priority}</span>
              <button class="status-cycle ${statusCycleClass}" onclick="event.stopPropagation();cycleTaskStatus('${t._id}','${t.status}');setTimeout(()=>loadProjTasks('${pid}'),300)">${t.status}</button>
              <div class="task-card-actions" style="opacity:1">
                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();showEditTaskModal('${t._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();API.deleteTask('${t._id}').then(()=>{showToast('Deleted');loadProjTasks('${pid}')})" title="Delete" style="color:var(--error)"><i class="ph ph-trash"></i></button>
              </div>
            </div>
          </div>
          ${isOpen && subs.length ? `
          <div class="subtask-cascade">
            ${subs.map((s, idx) => `
              <div class="subtask-cascade-item">
                <div class="subtask-check ${s.completed?'checked':''}" onclick="fetch('/api/tasks/${t._id}/subtask/${idx}/toggle',{method:'PUT',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}}).then(()=>loadProjTasks('${pid}'))">✓</div>
                <span class="subtask-text ${s.completed?'completed':''}">${escapeHtml(s.title)}</span>
              </div>
            `).join('')}
            <div class="subtask-add-row">
              <input placeholder="Add a subtask..." onkeydown="if(event.key==='Enter'){addProjSubtask('${t._id}','${pid}',this.value);this.value=''}">
              <button class="btn btn-sm btn-outline" onclick="addProjSubtask('${t._id}','${pid}',this.previousElementSibling.value);this.previousElementSibling.value=''">Add</button>
            </div>
          </div>` : ''}
        </div>
      `}).join('') : '<div class="empty-state" style="padding:48px 0"><div class="empty-icon"><i class="ph-fill ph-check-circle" style="font-size:2.5rem;color:var(--gray-300)"></i></div><h4>No tasks yet</h4><p style="color:var(--gray-400);font-size:var(--font-xs)">Add tasks to track work for this project</p></div>'}
    </div>
  `;
}

async function addProjSubtask(taskId, pid, title) {
  title = title?.trim();
  if (!title) return;
  const res = await API.addSubtask(taskId, { title });
  if (res && res.error) return;
  loadProjTasks(pid);
}

function showCreateProjTaskModal(pid) {
  showModal('Add Task to Project', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Task Title <span class="required">*</span></label>
          <input class="form-input" id="proj-task-title" placeholder="What needs to be done?" autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="proj-task-priority-sel">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p==='Medium'?'selected':''}" onclick="document.querySelectorAll('#proj-task-priority-sel .priority-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected');this.dataset.val='${p}'"  data-val="${p==='Medium'?'Medium':''}">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input type="date" class="form-input" id="proj-task-due">
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createProjTask('${pid}')"><i class="ph ph-plus"></i> Add Task</button>`);
}

async function createProjTask(pid) {
  const title = document.getElementById('proj-task-title').value.trim();
  if (!title) { showToast('Task Title is required','error'); document.getElementById('proj-task-title').focus(); return; }
  const selPri = document.querySelector('#proj-task-priority-sel .priority-option.selected');
  const priority = selPri ? selPri.textContent.trim() : 'Medium';
  const res = await API.createTask({ title, project_id: pid, priority, due_date: document.getElementById('proj-task-due').value });
  if (res && res.error) return;
  closeModal(); showToast('Task added! <i class="ph-fill ph-check-circle"></i>');
  loadProjTasks(pid);
  if (typeof refreshTasksUI === 'function') refreshTasksUI();
}

// ===== PROJECT NOTES TAB (with Rich Text Editor) =====
let _editingNoteId = null;

async function loadProjNotes(pid) {
  let notes = await API.getProjectNotes(pid);
  if (!Array.isArray(notes)) notes = [];
  const container = document.getElementById('proj-tab-content');
  const colors = ['#7C3AED','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'];
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:var(--font-sm);font-weight:700;color:var(--gray-600)"><i class="ph ph-notebook"></i> Project Notes <span class="text-xs text-muted" style="font-weight:400">(${notes.length})</span></h3>
      <button class="btn btn-primary btn-sm" onclick="openNoteEditor('${pid}')">+ New Note</button>
    </div>
    <div id="notes-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
      ${notes.length ? notes.map((n, i) => {
        const color = colors[i % colors.length];
        const rawContent = n.content || '';
        return `
        <div class="proj-detail-card note-card" onclick="openNoteEditor('${pid}','${n._id}')" style="padding:20px;cursor:pointer;border-left:4px solid ${color};">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:28px;height:28px;border-radius:var(--radius-md);background:${color}15;color:${color};display:flex;align-items:center;justify-content:center;font-size:0.8rem"><i class="ph ph-note"></i></div>
              <div class="note-title" style="font-size:var(--font-sm);font-weight:700;color:var(--gray-700)">${escapeHtml(n.title || 'Untitled Note')}</div>
            </div>
            <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-outline" onclick="openNoteEditor('${pid}','${n._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
              <button class="btn btn-sm btn-outline" style="color:var(--error)" onclick="API.deleteProjectNote('${n._id}').then(()=>{showToast('Note deleted');loadProjNotes('${pid}')})" title="Delete"><i class="ph ph-trash"></i></button>
            </div>
          </div>
          <div class="note-preview-rich" style="font-size:0.78rem;color:var(--gray-500);line-height:1.6;margin-bottom:10px;max-height:120px;overflow:hidden;position:relative">${rawContent}</div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="note-date" style="font-size:0.65rem;color:var(--gray-300)">
              <i class="ph ph-clock"></i> ${timeAgo(n.updated_at || n.created_at)}
            </div>
            <div style="font-size:0.6rem;color:${color};font-weight:600;text-transform:uppercase;letter-spacing:0.03em">Click to edit</div>
          </div>
        </div>
      `}).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:48px 0"><div class="empty-icon"><i class="ph-fill ph-notebook" style="font-size:2.5rem;color:var(--gray-300)"></i></div><h4>No notes yet</h4><p style="color:var(--gray-400);font-size:var(--font-xs)">Create notes with the rich text editor</p></div>'}
    </div>
  `;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

async function openNoteEditor(pid, noteId) {
  _editingNoteId = noteId || null;
  let title = '', content = '';
  if (noteId) {
    const note = await API.getProjectNote(noteId);
    title = note.title || '';
    content = note.content || '';
  }

  const container = document.getElementById('proj-tab-content');
  container.innerHTML = `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-outline btn-sm" onclick="loadProjNotes('${pid}')"><i class="ph ph-arrow-left"></i> Back</button>
          <h3 style="font-size:var(--font-base)">${noteId ? 'Edit Note' : 'New Note'}</h3>
        </div>
        <button class="btn btn-primary btn-sm" onclick="saveNote('${pid}')"><i class="ph ph-floppy-disk"></i> Save</button>
      </div>
      <div class="form-group">
        <input class="form-input" id="note-title" placeholder="Note title..." value="${escapeHtml(title)}" style="font-size:var(--font-lg);font-weight:600;border:none;padding:12px 0;border-bottom:1px solid var(--gray-200);border-radius:0">
      </div>
      <div class="rte-container">
        <div class="rte-toolbar">
          <select onchange="execRTE('formatBlock',this.value);this.selectedIndex=0" title="Heading">
            <option value="">Format</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="p">Paragraph</option>
          </select>
          <div class="rte-separator"></div>
          <button class="rte-btn" onclick="execRTE('bold')" title="Bold"><b>B</b></button>
          <button class="rte-btn" onclick="execRTE('italic')" title="Italic"><i>I</i></button>
          <button class="rte-btn" onclick="execRTE('underline')" title="Underline"><u>U</u></button>
          <button class="rte-btn" onclick="execRTE('strikeThrough')" title="Strikethrough"><s>S</s></button>
          <div class="rte-separator"></div>
          <button class="rte-btn" onclick="execRTE('foreColor','#7C3AED')" title="Purple" style="color:var(--primary-500)">A</button>
          <button class="rte-btn" onclick="execRTE('foreColor','#EF4444')" title="Red" style="color:var(--error)">A</button>
          <button class="rte-btn" onclick="execRTE('foreColor','#000000')" title="Default">A</button>
          <div class="rte-separator"></div>
          <button class="rte-btn" onclick="execRTE('insertUnorderedList')" title="Bullets">•≡</button>
          <button class="rte-btn" onclick="execRTE('insertOrderedList')" title="Numbers">1.</button>
          <button class="rte-btn" onclick="execRTE('formatBlock','blockquote')" title="Quote">❝</button>
          <div class="rte-separator"></div>
          <button class="rte-btn" onclick="execRTE('justifyLeft')" title="Left">⫷</button>
          <button class="rte-btn" onclick="execRTE('justifyCenter')" title="Center">⫶</button>
          <button class="rte-btn" onclick="execRTE('justifyRight')" title="Right">⫸</button>
          <div class="rte-separator"></div>
          <button class="rte-btn" onclick="insertLink()" title="Link">🔗</button>
          <button class="rte-btn" onclick="execRTE('removeFormat')" title="Clear">✕</button>
          <button class="rte-btn" onclick="execRTE('undo')" title="Undo">↩</button>
          <button class="rte-btn" onclick="execRTE('redo')" title="Redo">↪</button>
        </div>
        <div class="rte-editor" id="rte-editor" contenteditable="true">${content || '<p>Start writing your note...</p>'}</div>
      </div>
    </div>
  `;
  setTimeout(() => document.getElementById('rte-editor')?.focus(), 100);
}

function execRTE(command, value) {
  document.execCommand(command, false, value || null);
  document.getElementById('rte-editor')?.focus();
}

function insertLink() {
  const url = prompt('Enter URL:');
  if (url) execRTE('createLink', url);
}

async function saveNote(pid) {
  const title = document.getElementById('note-title').value.trim() || 'Untitled Note';
  const content = document.getElementById('rte-editor').innerHTML;
  if (_editingNoteId) {
    const res = await API.updateProjectNote(_editingNoteId, { title, content });
    if (res && res.error) return;
    showToast('Note updated! 📝');
  } else {
    const res = await API.createProjectNote(pid, { title, content });
    if (res && res.error) return;
    showToast('Note created! 📝');
  }
  _editingNoteId = null;
  loadProjNotes(pid);
}

// ===== ATTACHMENTS TAB =====
async function loadProjAttachments(pid) {
  let atts = await API.getProjectAttachments(pid);
  if (!Array.isArray(atts)) atts = [];
  const container = document.getElementById('proj-tab-content');
  const iconMap = { pdf:'ph-file-pdf', doc:'ph-file-doc', docx:'ph-file-doc', xls:'ph-file-xls', xlsx:'ph-file-xls', ppt:'ph-file-ppt', png:'ph-image', jpg:'ph-image', jpeg:'ph-image', gif:'ph-image', svg:'ph-image', zip:'ph-file-zip', rar:'ph-file-zip', mp4:'ph-video', mov:'ph-video', mp3:'ph-music-note', wav:'ph-music-note', txt:'ph-file-text', csv:'ph-file-csv', json:'ph-brackets-curly', js:'ph-code', py:'ph-code', html:'ph-code' };
  const colorMap = { pdf:'#EF4444', doc:'#3B82F6', docx:'#3B82F6', xls:'#10B981', xlsx:'#10B981', ppt:'#F97316', png:'#8B5CF6', jpg:'#8B5CF6', jpeg:'#8B5CF6', gif:'#8B5CF6', svg:'#8B5CF6', zip:'#F59E0B', rar:'#F59E0B', mp4:'#EC4899', mov:'#EC4899', mp3:'#06B6D4', wav:'#06B6D4' };
  function getExt(name) { return (name||'').split('.').pop().toLowerCase(); }
  function getIcon(name) { return iconMap[getExt(name)] || 'ph-file'; }
  function getColor(name) { return colorMap[getExt(name)] || '#6B7280'; }
  function formatSize(bytes) { if (!bytes||bytes===0) return ''; if (bytes < 1024) return bytes+' B'; if (bytes < 1048576) return (bytes/1024).toFixed(1)+' KB'; return (bytes/1048576).toFixed(1)+' MB'; }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:var(--font-sm);font-weight:700;color:var(--gray-600)"><i class="ph ph-paperclip"></i> Attachments <span class="text-xs text-muted" style="font-weight:400">(${atts.length})</span></h3>
    </div>
    <div class="proj-detail-card upload-sec" style="margin-bottom:20px;padding:32px;border:2px dashed var(--gray-300);background:var(--primary-50);border-radius:var(--radius-lg);cursor:pointer;text-align:center" onmouseover="this.style.borderColor='var(--primary-400)';this.style.background='var(--primary-100)'" onmouseout="this.style.borderColor='var(--gray-300)';this.style.background='var(--primary-50)'">
      <div class="upload-zone" id="upload-zone"
           onclick="document.getElementById('file-input').click()"
           ondragover="event.preventDefault();this.classList.add('dragover')"
           ondragleave="this.classList.remove('dragover')"
           ondrop="event.preventDefault();this.classList.remove('dragover');handleFileDrop(event,'${pid}')">
        <div style="font-size:2rem;color:var(--primary-400);margin-bottom:8px"><i class="ph ph-cloud-arrow-up"></i></div>
        <div class="font-medium" style="font-size:var(--font-sm);color:var(--gray-600)">Drop files here or click to upload</div>
        <div class="text-xs text-muted" style="margin-top:4px">PDF, DOC, XLS, images, videos — any file type</div>
        <input type="file" id="file-input" multiple style="display:none" onchange="handleFileSelect(event,'${pid}')">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px" id="att-grid">
      ${atts.length ? atts.map(a => {
        const ext = getExt(a.original_name);
        const icon = getIcon(a.original_name);
        const color = getColor(a.original_name);
        return `
        <div class="proj-detail-card att-file-card" style="padding:16px;display:flex;align-items:center;gap:14px;">
          <div style="width:44px;height:44px;border-radius:var(--radius-md);background:${color}12;color:${color};display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0"><i class="ph-fill ${icon}"></i></div>
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--font-xs);font-weight:600;color:var(--gray-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.original_name)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
              <span style="font-size:0.6rem;text-transform:uppercase;font-weight:700;color:${color};background:${color}12;padding:1px 6px;border-radius:var(--radius-full)">${ext}</span>
              <span style="font-size:0.6rem;color:var(--gray-400)">${formatSize(a.size)}</span>
            </div>
          </div>
          <div style="display:flex;gap:4px;flex-shrink:0">
            <a href="/uploads/${a.filename}" target="_blank" class="btn btn-sm btn-outline" title="Download" style="padding:4px 6px"><i class="ph ph-download-simple"></i></a>
            <button class="btn btn-sm btn-outline" style="color:var(--error);padding:4px 6px" onclick="API.deleteProjectAttachment('${a._id}').then(()=>{showToast('Deleted');loadProjAttachments('${pid}')})" title="Delete"><i class="ph ph-trash"></i></button>
          </div>
        </div>
      `}).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:48px 0"><div class="empty-icon"><i class="ph-fill ph-files" style="font-size:2.5rem;color:var(--gray-300)"></i></div><h4>No attachments yet</h4><p style="color:var(--gray-400);font-size:var(--font-xs)">Upload files to keep project resources organized</p></div>'}
    </div>
  `;
}

async function handleFileSelect(event, pid) {
  const files = event.target.files;
  for (const file of files) { 
    const res = await API.uploadProjectAttachment(pid, file); 
    if (res && res.error) return showToast(res.error, 'error');
  }
  showToast(`${files.length} file(s) uploaded!`);
  loadProjAttachments(pid);
}

async function handleFileDrop(event, pid) {
  const files = event.dataTransfer.files;
  for (const file of files) { 
    const res = await API.uploadProjectAttachment(pid, file); 
    if (res && res.error) return showToast(res.error, 'error');
  }
  showToast(`${files.length} file(s) uploaded!`);
  loadProjAttachments(pid);
}

// ===== SUB-PROJECTS TAB =====
async function loadProjSubprojects(pid) {
  let subs = await API.getSubProjects(pid);
  if (!Array.isArray(subs)) subs = [];
  // Fetch task counts for each sub-project
  const subData = await Promise.all(subs.map(async s => {
    let tasks = [];
    try { tasks = await API.getProjectTasks(s._id); } catch(e) {}
    return { ...s, taskCount: tasks.length, doneTasks: tasks.filter(t => t.status === 'Done').length };
  }));
  const container = document.getElementById('proj-tab-content');
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:var(--font-sm);font-weight:700;color:var(--gray-600)"><i class="ph ph-tree-structure"></i> Sub-Projects <span class="text-xs text-muted" style="font-weight:400">(${subs.length})</span></h3>
      <button class="btn btn-primary btn-sm" onclick="showCreateSubProjectModal('${pid}')">+ Add Sub-Project</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px">
      ${subData.length ? subData.map(s => {
        const borderColor = s.priority==='Critical'?'var(--error)':s.priority==='High'?'#F97316':s.priority==='Medium'?'var(--accent-500)':'var(--success)';
        const statusDot = s.status === 'Completed' ? 'dot-done' : s.status === 'Active' ? 'dot-active' : s.status === 'On Hold' ? 'dot-hold' : 'dot-planning';
        return `
        <div class="proj-detail-card subproj-card" style="padding:22px 24px;border-left:4px solid ${borderColor}" onclick="openProjectDetail('${s._id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div style="flex:1;min-width:0">
              <div style="font-size:var(--font-base);font-weight:700;color:var(--gray-700);margin-bottom:6px">${escapeHtml(s.name)}</div>
              ${s.description ? `<div style="font-size:0.75rem;color:var(--gray-500);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(s.description)}</div>` : ''}
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
              <button class="btn btn-sm btn-outline" onclick="showEditProjectModal('${s._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
              <button class="btn btn-sm btn-outline" style="color:var(--error)" onclick="API.deleteProject('${s._id}').then(()=>{showToast('Deleted');loadProjSubprojects('${pid}')})" title="Delete"><i class="ph ph-trash"></i></button>
            </div>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
            <span class="badge ${priorityClass(s.priority)}" style="font-size:0.62rem">${s.priority}</span>
            <span style="display:inline-flex;align-items:center;gap:4px"><span class="proj-status-dot ${statusDot}"></span><span class="text-xs" style="color:var(--gray-500)">${s.status}</span></span>
            ${s.deadline ? `<span class="text-xs text-muted" style="display:inline-flex;align-items:center;gap:3px"><i class="ph ph-calendar-blank"></i> ${formatDate(s.deadline)}</span>` : ''}
            <span class="text-xs" style="display:inline-flex;align-items:center;gap:3px;color:var(--primary-500)"><i class="ph ph-check-circle"></i> ${s.doneTasks}/${s.taskCount} tasks</span>
            ${(s.team||[]).length ? `<span class="text-xs text-muted" style="display:inline-flex;align-items:center;gap:3px"><i class="ph ph-users"></i> ${(s.team||[]).length} members</span>` : ''}
          </div>

          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1">
              <div class="progress-bar" style="height:6px;border-radius:100px"><div class="progress-fill" style="width:${s.progress}%;border-radius:100px"></div></div>
            </div>
            <span class="text-xs" style="font-weight:700;color:${s.progress >= 80 ? 'var(--success)' : s.progress >= 40 ? 'var(--accent-500)' : 'var(--gray-400)'}">${s.progress}%</span>
          </div>
        </div>
      `}).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:48px 0"><div class="empty-icon"><i class="ph-fill ph-tree-structure" style="font-size:2.5rem;color:var(--gray-300)"></i></div><h4>No sub-projects</h4><p style="color:var(--gray-400);font-size:var(--font-xs)">Break this project into smaller, manageable pieces</p></div>'}
    </div>
  `;
}

let _subProjFormStatus = 'Active';
let _subProjFormTeam = [];

function showCreateSubProjectModal(pid) {
  _subProjFormStatus = 'Active';
  _subProjFormTeam = [];
  showModal('Create Sub-Project', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Sub-Project Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="sub-proj-name" placeholder="e.g. Frontend Implementation" required maxlength="100" autofocus>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="sub-proj-desc" placeholder="Details about this sub-project..." maxlength="500"></textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="sub-pri-sel">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p==='Medium'?'selected':''}" onclick="document.querySelectorAll('#sub-pri-sel .priority-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-selector" id="sub-proj-status-sel">
            ${['Planning','Active','On Hold'].map(s => `<div class="status-option ${s==='Active'?'selected':''}" onclick="_subProjFormStatus='${s}';this.parentElement.querySelectorAll('.status-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">${s}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" class="form-input" id="sub-proj-deadline">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Team Members</label>
          <div class="tag-input-area" id="sub-proj-team-area" onclick="document.getElementById('sub-proj-team-input')?.focus()">
            <input type="text" id="sub-proj-team-input" placeholder="Type name and press Enter..." onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();const v=this.value.trim().replace(',','');if(v&&!_subProjFormTeam.includes(v)){_subProjFormTeam.push(v);renderSubProjTeamPills();}this.value=''}">
          </div>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createSubProject('${pid}')"><i class="ph ph-plus"></i> Create Sub-Project</button>`);
}

function renderSubProjTeamPills() {
  const area = document.getElementById('sub-proj-team-area');
  if (!area) return;
  area.innerHTML = _subProjFormTeam.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="_subProjFormTeam.splice(${i},1);renderSubProjTeamPills()">✕</span></span>`).join('') + `<input type="text" id="sub-proj-team-input" placeholder="Type name and press Enter..." onkeydown="if(event.key==='Enter'||event.key===','){event.preventDefault();const v=this.value.trim().replace(',','');if(v&&!_subProjFormTeam.includes(v)){_subProjFormTeam.push(v);renderSubProjTeamPills();}this.value=''}">`;
  document.getElementById('sub-proj-team-input')?.focus();
}

async function createSubProject(pid) {
  const name = document.getElementById('sub-proj-name').value.trim();
  if (!name) { showToast('Project Name is required','error'); document.getElementById('sub-proj-name').focus(); return; }
  const selPri = document.querySelector('#sub-pri-sel .priority-option.selected');
  const res = await API.createSubProject(pid, {
    name,
    description: document.getElementById('sub-proj-desc').value,
    priority: selPri ? selPri.textContent.trim() : 'Medium',
    status: _subProjFormStatus,
    deadline: document.getElementById('sub-proj-deadline').value,
    team: _subProjFormTeam
  });
  if (res && res.error) return;
  closeModal(); showToast('Sub-project created! 🚀'); loadProjSubprojects(pid);
}

// ===== CREATE / EDIT / DELETE MODALS =====
function refreshProjectsUI() {
  if (document.getElementById('projects-grid')) loadProjects();
  if (document.getElementById('dash-projects-content') && typeof loadDashProjects === 'function') loadDashProjects();
}

function showCreateProjectModal() {
  _projFormPriority = 'Medium';
  _projFormStatus = 'Active';
  _projFormTeam = [];
  showModal('Create New Project', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Project Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="new-proj-name" placeholder="e.g. Website Redesign" required maxlength="100" autofocus>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="new-proj-desc" placeholder="What is the goal of this project?" maxlength="500"></textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="create-proj-pri">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p==='Medium'?'selected':''}" onclick="selectProjPriority('${p}','create-proj-pri')">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-selector" id="create-proj-status">
            ${['Planning','Active'].map(s => `<div class="status-option ${s==='Active'?'selected':''}" onclick="selectProjStatus(this,'${s}')">${s}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" class="form-input" id="new-proj-deadline">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Team Members</label>
          <div class="tag-input-area" id="create-proj-team" onclick="document.getElementById('proj-team-input')?.focus()">
            <input type="text" id="proj-team-input" placeholder="Type name and press Enter..." onkeydown="handleProjTeamKey(event,'create')">
          </div>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createProject()"><i class="ph ph-plus"></i> Create Project</button>`);
}

window.selectProjPriority = function(p, containerId) {
  _projFormPriority = p;
  document.querySelectorAll(`#${containerId} .priority-option`).forEach(el => el.classList.remove('selected'));
  document.querySelector(`#${containerId} .p-${p.toLowerCase()}`).classList.add('selected');
}
window.selectProjStatus = function(el, s) {
  _projFormStatus = s;
  el.parentElement.querySelectorAll('.status-option').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
}
window.handleProjTeamKey = function(e, mode) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(',','');
    const arr = mode === 'create' ? _projFormTeam : _projFormTeam;
    if (val && !arr.includes(val)) { arr.push(val); renderProjTeamPills(mode); }
    e.target.value = '';
  }
}
function renderProjTeamPills(mode) {
  const containerId = mode === 'create' ? 'create-proj-team' : 'edit-proj-team';
  const inputId = mode === 'create' ? 'proj-team-input' : 'edit-proj-team-input';
  const area = document.getElementById(containerId);
  if (!area) return;
  area.innerHTML = _projFormTeam.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="_projFormTeam.splice(${i},1);renderProjTeamPills('${mode}')">✕</span></span>`).join('') + `<input type="text" id="${inputId}" placeholder="Type name and press Enter..." onkeydown="handleProjTeamKey(event,'${mode}')">`;
  document.getElementById(inputId)?.focus();
}

async function createProject() {
  const name = document.getElementById('new-proj-name').value.trim();
  if (!name) { showToast('Project Name is required', 'error'); document.getElementById('new-proj-name').focus(); return; }
  const res = await API.createProject({ name, description: document.getElementById('new-proj-desc').value, priority: _projFormPriority, status: _projFormStatus, deadline: document.getElementById('new-proj-deadline').value, team: _projFormTeam });
  if (res && res.error) return;
  closeModal(); showToast('Project created! <i class="ph-fill ph-check-circle"></i>'); refreshProjectsUI();
}

async function showEditProjectModal(id) {
  let p;
  try {
    p = await (await fetch('/api/projects/' + id, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })).json();
  } catch(e) { return showToast('Error loading project', 'error'); }

  _projFormPriority = p.priority || 'Medium';
  _projFormStatus = p.status || 'Active';
  _projFormTeam = [...(p.team || [])];

  showModal('Edit Project', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Project Name <span class="required">*</span></label>
          <input type="text" class="form-input" id="edit-proj-name" value="${escapeHtml(p.name)}" required maxlength="100">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="edit-proj-desc" maxlength="500">${escapeHtml(p.description||'')}</textarea>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="edit-proj-pri">
            ${['Low','Medium','High','Critical'].map(x => `<div class="priority-option p-${x.toLowerCase()} ${x===_projFormPriority?'selected':''}" onclick="selectProjPriority('${x}','edit-proj-pri')">${x}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-selector" id="edit-proj-status-sel">
            ${['Planning','Active','On Hold','Completed'].map(s => `<div class="status-option ${s===_projFormStatus?'selected':''}" onclick="selectProjStatus(this,'${s}')">${s}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Progress (%)</label>
          <input type="range" id="edit-proj-progress" min="0" max="100" value="${p.progress}" oninput="document.getElementById('prog-val').textContent=this.value+'%'" style="width:100%">
          <div class="text-xs text-muted text-center" id="prog-val">${p.progress}%</div>
        </div>
        <div class="form-group">
          <label class="form-label">Deadline</label>
          <input type="date" class="form-input" id="edit-proj-deadline" value="${p.deadline||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Team Members</label>
          <div class="tag-input-area" id="edit-proj-team" onclick="document.getElementById('edit-proj-team-input')?.focus()">
            ${_projFormTeam.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="_projFormTeam.splice(${i},1);renderProjTeamPills('edit')">✕</span></span>`).join('')}
            <input type="text" id="edit-proj-team-input" placeholder="Type name and press Enter..." onkeydown="handleProjTeamKey(event,'edit')">
          </div>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveProject('${id}')"><i class="ph ph-floppy-disk"></i> Save Changes</button>`);
}

async function saveProject(id) {
  const name = document.getElementById('edit-proj-name').value.trim();
  if (!name) { showToast('Project Name is required', 'error'); return; }
  const res = await API.updateProject(id, {
    name,
    description: document.getElementById('edit-proj-desc').value,
    priority: _projFormPriority,
    status: _projFormStatus,
    progress: parseInt(document.getElementById('edit-proj-progress').value) || 0,
    deadline: document.getElementById('edit-proj-deadline')?.value || '',
    team: _projFormTeam,
  });
  if (res && res.error) return;
  closeModal(); showToast('Project updated! <i class="ph-fill ph-check-circle"></i>');
  if (_currentProjectId === id) { openProjectDetail(id); refreshProjectsUI(); } else refreshProjectsUI();
}

async function confirmDeleteProject(id) {
  showModal('Delete Project', `
    <div style="text-align:center;padding:var(--space-4) 0">
      <i class="ph ph-trash" style="font-size:3rem;color:var(--error);margin-bottom:var(--space-3);display:block"></i>
      <p style="color:var(--gray-600)">Are you sure you want to <strong>permanently delete</strong> this project?</p>
      <p style="color:var(--gray-400);font-size:var(--font-xs)">All tasks, notes, and attachments will be removed.</p>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="deleteProjectConfirm('${id}')"><i class="ph ph-trash"></i> Delete Project</button>`);
}
async function deleteProjectConfirm(id) { 
  const res = await API.deleteProject(id);
  if (res && res.error) return;
  closeModal(); showToast('Project deleted'); renderProjectsPage(); refreshProjectsUI(); 
}
