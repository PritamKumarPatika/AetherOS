// AetherOS — Meetings Page (Premium Overhaul)
let _meetFilter = 'all';
let _meetFormAttendees = [];

async function renderMeetingsPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="meetings-page">
      <div class="page-header">
        <h2><i class="ph ph-video-camera"></i> Meetings</h2>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="downloadBlob(API.exportProjects(),'meetings_export.xlsx');showToast('Exporting...')"><i class="ph ph-download-simple"></i> Export</button>
          <button class="btn btn-primary" onclick="showCreateMeetingModal()">+ Schedule Meeting</button>
        </div>
      </div>
      <div class="meet-stats" id="meet-stats-bar"></div>
      <div class="meet-filters" id="meet-filters">
        <button class="meet-filter-btn active" data-filter="all" onclick="setMeetFilter('all',this)">All</button>
        <button class="meet-filter-btn" data-filter="upcoming" onclick="setMeetFilter('upcoming',this)">Upcoming</button>
        <button class="meet-filter-btn" data-filter="today" onclick="setMeetFilter('today',this)">Today</button>
        <button class="meet-filter-btn" data-filter="past" onclick="setMeetFilter('past',this)">Past</button>
      </div>
      <div class="meeting-grid" id="meetings-grid"><div class="empty-state"><p>Loading...</p></div></div>
    </div>
  `;
  loadMeetings();
}

function setMeetFilter(f, el) {
  _meetFilter = f;
  document.querySelectorAll('.meet-filter-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  loadMeetings();
}

function getPlatformIcon(platform) {
  const p = (platform || '').toLowerCase();
  if (p.includes('zoom')) return 'ph-video-camera';
  if (p.includes('teams')) return 'ph-microsoft-teams-logo';
  if (p.includes('google') || p.includes('meet')) return 'ph-google-logo';
  return 'ph-monitor';
}

function getMeetStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 's-done';
  if (s === 'in progress') return 's-progress';
  if (s === 'cancelled') return 's-cancelled';
  return 's-todo';
}

async function loadMeetings() {
  let meetings = await API.getMeetings();
  if (!Array.isArray(meetings)) meetings = [];
  const todayDate = todayStr();
  const grid = document.getElementById('meetings-grid');
  const statsBar = document.getElementById('meet-stats-bar');

  // Stats
  const upcoming = meetings.filter(m => m.date >= todayDate && m.status !== 'Completed' && m.status !== 'Cancelled');
  const todayMeets = meetings.filter(m => m.date === todayDate);
  const completed = meetings.filter(m => m.status === 'Completed');

  if (statsBar) {
    statsBar.innerHTML = `
      <div class="meet-stat" onclick="setMeetFilter('upcoming',document.querySelector('[data-filter=upcoming]'))">
        <div class="ms-icon upcoming"><i class="ph ph-clock-countdown"></i></div>
        <div><div class="ms-num">${upcoming.length}</div><div class="ms-label">Upcoming</div></div>
      </div>
      <div class="meet-stat" onclick="setMeetFilter('today',document.querySelector('[data-filter=today]'))">
        <div class="ms-icon today"><i class="ph ph-sun"></i></div>
        <div><div class="ms-num">${todayMeets.length}</div><div class="ms-label">Today</div></div>
      </div>
      <div class="meet-stat">
        <div class="ms-icon done"><i class="ph ph-check-circle"></i></div>
        <div><div class="ms-num">${completed.length}</div><div class="ms-label">Completed</div></div>
      </div>
      <div class="meet-stat" onclick="setMeetFilter('all',document.querySelector('[data-filter=all]'))">
        <div class="ms-icon total"><i class="ph ph-calendar-blank"></i></div>
        <div><div class="ms-num">${meetings.length}</div><div class="ms-label">Total</div></div>
      </div>
    `;
  }

  // Filter
  let filtered = meetings;
  if (_meetFilter === 'upcoming') filtered = upcoming;
  else if (_meetFilter === 'today') filtered = todayMeets;
  else if (_meetFilter === 'past') filtered = meetings.filter(m => m.date < todayDate || m.status === 'Completed');

  // Sort by date then time
  filtered.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  if (!grid) return;
  grid.innerHTML = filtered.length ? filtered.map(m => {
    const priClass = 'priority-' + (m.priority || 'medium').toLowerCase();
    const statusClass = 'status-' + (m.status || 'scheduled').toLowerCase().replace(' ','-');
    const statusCycleClass = getMeetStatusClass(m.status);
    const attendees = m.attendees || [];
    const isToday = m.date === todayDate;
    const isPast = m.date < todayDate;

    return `
    <div class="meet-card ${priClass} ${statusClass} animate-fade-in">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
        <div class="meet-title">${escapeHtml(m.title)}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <span class="badge ${priorityClass(m.priority)}" style="font-size:0.6rem">${m.priority}</span>
          <button class="status-cycle ${statusCycleClass}" style="font-size:0.62rem;padding:2px 8px" onclick="event.stopPropagation();cycleMeetStatus('${m._id}','${m.status}')">${m.status}</button>
        </div>
      </div>

      <div class="meet-time-row">
        <i class="ph ph-clock"></i>
        ${m.time || '--:--'} — ${m.end_time || '--:--'}
        <span style="color:var(--gray-300)">·</span>
        <i class="ph ph-calendar-blank"></i>
        ${isToday ? '<span style="color:var(--primary-500);font-weight:700">Today</span>' : formatDate(m.date)}
        ${isPast && m.status !== 'Completed' ? '<span style="color:var(--error);font-weight:600;font-size:0.6rem;margin-left:4px">PAST</span>' : ''}
      </div>

      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span class="meet-platform-badge"><i class="ph ${getPlatformIcon(m.platform)}"></i> ${m.platform || 'Other'}</span>
        ${m.notes ? `<span style="font-size:0.65rem;color:var(--gray-400);display:inline-flex;align-items:center;gap:3px"><i class="ph ph-note"></i> ${escapeHtml((m.notes||'').substring(0,60))}${(m.notes||'').length>60?'...':''}</span>` : ''}
      </div>

      ${attendees.length ? `<div class="meet-attendees"><i class="ph ph-users" style="font-size:0.75rem;color:var(--gray-400)"></i>${attendees.map(a => `<span class="meet-attendee-chip"><span class="avatr" style="width:16px;height:16px;font-size:0.45rem;margin:0">${getInitials(a)}</span>${escapeHtml(a)}</span>`).join('')}</div>` : ''}

      <div class="meet-actions">
        ${m.link ? `<a href="${m.link}" target="_blank" class="join-btn" onclick="event.stopPropagation()"><i class="ph ph-video-camera"></i> Join Meeting</a>` : '<span style="font-size:0.65rem;color:var(--gray-300)"><i class="ph ph-link-break"></i> No link</span>'}
        <div style="flex:1"></div>
        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();showEditMeetingModal('${m._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-sm btn-outline" style="color:var(--error)" onclick="event.stopPropagation();confirmDeleteMeeting('${m._id}')" title="Delete"><i class="ph ph-trash"></i></button>
      </div>
    </div>
  `}).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:48px 0"><div class="empty-icon"><i class="ph-fill ph-calendar-blank" style="font-size:2.5rem;color:var(--gray-300)"></i></div><h4>No meetings</h4><p style="color:var(--gray-400);font-size:var(--font-xs)">Schedule your first meeting to get started</p></div>';
}

async function cycleMeetStatus(id, current) {
  const cycle = ['Scheduled','In Progress','Completed','Cancelled'];
  const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
  const res = await API.updateMeeting(id, { status: next });
  if (res && res.error) return;
  showToast(`Status → ${next}`);
  loadMeetings();
}

// ===== CREATE MEETING MODAL =====
function showCreateMeetingModal(preDate) {
  _meetFormAttendees = [];
  showModal('Schedule Meeting', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Meeting Title <span class="required">*</span></label>
          <input type="text" class="form-input" id="new-meet-title" placeholder="e.g. Sprint Planning" required maxlength="100" autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="new-meet-date" value="${preDate || todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">Start Time</label>
          <input type="time" class="form-input" id="new-meet-time">
        </div>
        <div class="form-group">
          <label class="form-label">End Time</label>
          <input type="time" class="form-input" id="new-meet-end">
        </div>
        <div class="form-group">
          <label class="form-label">Platform</label>
          <div class="priority-selector" id="meet-platform-sel">
            ${['Google Meet','Zoom','Microsoft Teams','Other'].map(p => `<div class="priority-option ${p==='Google Meet'?'selected':''}" onclick="document.querySelectorAll('#meet-platform-sel .priority-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')" style="font-size:0.72rem">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="meet-pri-sel">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p==='Medium'?'selected':''}" onclick="document.querySelectorAll('#meet-pri-sel .priority-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Meeting Link</label>
          <input class="form-input" id="new-meet-link" placeholder="https://meet.google.com/...">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Attendees</label>
          <div class="tag-input-area" id="meet-attendees-area" onclick="document.getElementById('meet-attendee-input')?.focus()">
            <input type="text" id="meet-attendee-input" placeholder="Type name and press Enter..." onkeydown="handleMeetAttendeeKey(event)">
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Notes</label>
          <textarea class="form-input" id="new-meet-notes" placeholder="Agenda or notes for this meeting..." maxlength="500" rows="3"></textarea>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="createMeeting()"><i class="ph ph-calendar-plus"></i> Schedule Meeting</button>`);
}

window.handleMeetAttendeeKey = function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(',','');
    if (val && !_meetFormAttendees.includes(val)) { _meetFormAttendees.push(val); renderMeetAttendeePills(); }
    e.target.value = '';
  }
}

function renderMeetAttendeePills() {
  const area = document.getElementById('meet-attendees-area');
  if (!area) return;
  area.innerHTML = _meetFormAttendees.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="_meetFormAttendees.splice(${i},1);renderMeetAttendeePills()">✕</span></span>`).join('') + `<input type="text" id="meet-attendee-input" placeholder="Type name and press Enter..." onkeydown="handleMeetAttendeeKey(event)">`;
  document.getElementById('meet-attendee-input')?.focus();
}

async function createMeeting() {
  const title = document.getElementById('new-meet-title').value.trim();
  if (!title) { showToast('Title required', 'error'); document.getElementById('new-meet-title').focus(); return; }
  const selPlatform = document.querySelector('#meet-platform-sel .priority-option.selected');
  const selPri = document.querySelector('#meet-pri-sel .priority-option.selected');
  const res = await API.createMeeting({
    title,
    date: document.getElementById('new-meet-date').value,
    time: document.getElementById('new-meet-time').value,
    end_time: document.getElementById('new-meet-end').value,
    platform: selPlatform ? selPlatform.textContent.trim() : 'Google Meet',
    priority: selPri ? selPri.textContent.trim() : 'Medium',
    link: document.getElementById('new-meet-link').value,
    notes: document.getElementById('new-meet-notes').value,
    attendees: _meetFormAttendees,
  });
  if (res && res.error) return;
  closeModal(); showToast('Meeting scheduled! <i class="ph-fill ph-check-circle"></i>');
  loadMeetings();
  if (typeof renderFullCalendar === 'function') { const n = new Date(); renderFullCalendar(n.getFullYear(), n.getMonth()); }
}

// ===== EDIT MEETING MODAL =====
async function showEditMeetingModal(id) {
  const m = await API.updateMeeting(id, {}).catch(() => null);
  // Fetch meeting properly
  const meet = await (await fetch(`/api/meetings/${id}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })).json();
  _meetFormAttendees = [...(meet.attendees || [])];

  showModal('Edit Meeting', `
    <div class="task-form">
      <div class="task-form-grid">
        <div class="form-group full-width">
          <label class="form-label">Meeting Title <span class="required">*</span></label>
          <input type="text" class="form-input" id="edit-meet-title" value="${escapeHtml(meet.title)}" required maxlength="100">
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="edit-meet-date" value="${meet.date||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Start Time</label>
          <input type="time" class="form-input" id="edit-meet-time" value="${meet.time||''}">
        </div>
        <div class="form-group">
          <label class="form-label">End Time</label>
          <input type="time" class="form-input" id="edit-meet-end" value="${meet.end_time||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <div class="status-selector" id="edit-meet-status-sel">
            ${['Scheduled','In Progress','Completed','Cancelled'].map(s => `<div class="status-option ${s===meet.status?'selected':''}" onclick="this.parentElement.querySelectorAll('.status-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">${s}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Platform</label>
          <div class="priority-selector" id="edit-meet-platform-sel">
            ${['Google Meet','Zoom','Microsoft Teams','Other'].map(p => `<div class="priority-option ${p===meet.platform?'selected':''}" onclick="document.querySelectorAll('#edit-meet-platform-sel .priority-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')" style="font-size:0.72rem">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="edit-meet-pri-sel">
            ${['Low','Medium','High','Critical'].map(p => `<div class="priority-option p-${p.toLowerCase()} ${p===meet.priority?'selected':''}" onclick="document.querySelectorAll('#edit-meet-pri-sel .priority-option').forEach(e=>e.classList.remove('selected'));this.classList.add('selected')">${p}</div>`).join('')}
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Meeting Link</label>
          <input class="form-input" id="edit-meet-link" value="${meet.link||''}" placeholder="https://meet.google.com/...">
        </div>
        <div class="form-group full-width">
          <label class="form-label">Attendees</label>
          <div class="tag-input-area" id="edit-meet-attendees-area" onclick="document.getElementById('edit-meet-attendee-input')?.focus()">
            ${_meetFormAttendees.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="_meetFormAttendees.splice(${i},1);renderEditMeetAttendeePills()">✕</span></span>`).join('')}
            <input type="text" id="edit-meet-attendee-input" placeholder="Type name and press Enter..." onkeydown="handleEditMeetAttendeeKey(event)">
          </div>
        </div>
        <div class="form-group full-width">
          <label class="form-label">Notes</label>
          <textarea class="form-input" id="edit-meet-notes" maxlength="500" rows="3">${escapeHtml(meet.notes||'')}</textarea>
        </div>
      </div>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveMeeting('${id}')"><i class="ph ph-floppy-disk"></i> Save Changes</button>`);
}

window.handleEditMeetAttendeeKey = function(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.trim().replace(',','');
    if (val && !_meetFormAttendees.includes(val)) { _meetFormAttendees.push(val); renderEditMeetAttendeePills(); }
    e.target.value = '';
  }
}

function renderEditMeetAttendeePills() {
  const area = document.getElementById('edit-meet-attendees-area');
  if (!area) return;
  area.innerHTML = _meetFormAttendees.map((t, i) => `<span class="tag-pill">${escapeHtml(t)}<span class="tag-remove" onclick="_meetFormAttendees.splice(${i},1);renderEditMeetAttendeePills()">✕</span></span>`).join('') + `<input type="text" id="edit-meet-attendee-input" placeholder="Type name and press Enter..." onkeydown="handleEditMeetAttendeeKey(event)">`;
  document.getElementById('edit-meet-attendee-input')?.focus();
}

async function saveMeeting(id) {
  const title = document.getElementById('edit-meet-title').value.trim();
  if (!title) { showToast('Title required', 'error'); return; }
  const selPlatform = document.querySelector('#edit-meet-platform-sel .priority-option.selected');
  const selPri = document.querySelector('#edit-meet-pri-sel .priority-option.selected');
  const selStatus = document.querySelector('#edit-meet-status-sel .status-option.selected');
  const res = await API.updateMeeting(id, {
    title,
    date: document.getElementById('edit-meet-date').value,
    time: document.getElementById('edit-meet-time').value,
    end_time: document.getElementById('edit-meet-end').value,
    platform: selPlatform ? selPlatform.textContent.trim() : 'Google Meet',
    priority: selPri ? selPri.textContent.trim() : 'Medium',
    status: selStatus ? selStatus.textContent.trim() : 'Scheduled',
    link: document.getElementById('edit-meet-link').value,
    notes: document.getElementById('edit-meet-notes').value,
    attendees: _meetFormAttendees,
  });
  if (res && res.error) return;
  closeModal(); showToast('Meeting updated! <i class="ph-fill ph-check-circle"></i>'); loadMeetings();
}

// ===== DELETE =====
async function confirmDeleteMeeting(id) {
  showModal('Delete Meeting', `
    <div style="text-align:center;padding:var(--space-4) 0">
      <i class="ph ph-trash" style="font-size:3rem;color:var(--error);margin-bottom:var(--space-3);display:block"></i>
      <p style="color:var(--gray-600)">Are you sure you want to <strong>permanently delete</strong> this meeting?</p>
      <p style="color:var(--gray-400);font-size:var(--font-xs)">This action cannot be undone.</p>
    </div>
  `, `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="deleteMeetingConfirm('${id}')"><i class="ph ph-trash"></i> Delete Meeting</button>`);
}

async function deleteMeetingConfirm(id) {
  const res = await API.deleteMeeting(id); 
  if (res && res.error) return;
  closeModal(); showToast('Meeting deleted'); loadMeetings();
}
