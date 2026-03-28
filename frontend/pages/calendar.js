// AetherOS — Calendar Page (Premium Overhaul)
async function renderCalendarPage() {
  const content = document.getElementById('page-content');
  const now = new Date();
  content.innerHTML = `
    <div class="calendar-page">
      <div class="page-header">
        <h2><i class="ph ph-calendar"></i> Calendar</h2>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="jumpToToday()"><i class="ph ph-crosshair"></i> Today</button>
          <button class="btn btn-primary" onclick="showCreateMeetingModal()">+ New Event</button>
        </div>
      </div>
      <div class="cal-full card" id="cal-full"></div>
    </div>
  `;
  renderFullCalendar(now.getFullYear(), now.getMonth());
}

function jumpToToday() {
  const n = new Date();
  renderFullCalendar(n.getFullYear(), n.getMonth());
}

async function renderFullCalendar(year, month) {
  const container = document.getElementById('cal-full');
  if (!container) return;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Fetch both meetings and tasks to show on calendar
  let meetings = [];
  let tasks = [];
  try { meetings = await API.getMeetings(); } catch(e) {}
  try { tasks = await API.getTasks(); } catch(e) {}
  if (!Array.isArray(meetings)) meetings = [];
  if (!Array.isArray(tasks)) tasks = [];

  // Build cells
  let cellsHtml = dayNames.map(d => `<div class="cal-day-label">${d}</div>`).join('');

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cellsHtml += '<div class="cal-cell" style="background:var(--gray-50);cursor:default;min-height:80px"></div>';

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = today.getFullYear()===year && today.getMonth()===month && today.getDate()===d;
    const dayOfWeek = new Date(year, month, d).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Meetings on this date
    const dayMeetings = meetings.filter(m => m.date === dateStr);
    // Tasks with due_date on this date
    const dayTasks = tasks.filter(t => t.due_date === dateStr && t.status !== 'Done');

    const eventsHtml = dayMeetings.map(m => {
      const priClass = 'pri-' + (m.priority || 'medium').toLowerCase();
      return `<div class="cal-event ${priClass}" onclick="event.stopPropagation();showEditMeetingModal('${m._id}')" title="${escapeHtml(m.title)}&#10;${m.time||''} - ${m.end_time||''}&#10;${m.platform||''}">${m.time ? m.time + ' ' : ''}<strong>${escapeHtml(m.title)}</strong></div>`;
    }).join('');

    const tasksHtml = dayTasks.map(t =>
      `<div class="cal-task-dot" title="Task: ${escapeHtml(t.title)}" onclick="event.stopPropagation()"><i class="ph ph-check-circle" style="font-size:0.55rem"></i> ${escapeHtml(t.title)}</div>`
    ).join('');

    cellsHtml += `
      <div class="cal-cell ${isToday?'today':''} ${isWeekend?'weekend':''}" onclick="showCreateMeetingModal('${dateStr}')">
        <div class="date-num">${d}</div>
        ${eventsHtml}
        ${tasksHtml}
      </div>
    `;
  }

  // Fill remaining cells to complete the last row
  const totalCells = firstDay + daysInMonth;
  const remainder = totalCells % 7;
  if (remainder > 0) {
    for (let i = 0; i < (7 - remainder); i++) {
      cellsHtml += '<div class="cal-cell" style="background:var(--gray-50);cursor:default;min-height:80px"></div>';
    }
  }

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;

  container.innerHTML = `
    <div class="cal-nav">
      <button class="btn btn-outline btn-sm" onclick="renderFullCalendar(${prevYear},${prevMonth})"><i class="ph ph-caret-left"></i> ${months[prevMonth]}</button>
      <h3>${months[month]} ${year}</h3>
      <button class="btn btn-outline btn-sm" onclick="renderFullCalendar(${nextYear},${nextMonth})">${months[nextMonth]} <i class="ph ph-caret-right"></i></button>
    </div>
    <div class="cal-grid">${cellsHtml}</div>
    <div style="display:flex;gap:16px;margin-top:12px;justify-content:center;padding:8px 0">
      <span style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--gray-400)"><span style="width:8px;height:8px;border-radius:2px;background:rgba(239,68,68,0.3)"></span> Critical</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--gray-400)"><span style="width:8px;height:8px;border-radius:2px;background:rgba(249,115,22,0.3)"></span> High</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--gray-400)"><span style="width:8px;height:8px;border-radius:2px;background:rgba(59,130,246,0.3)"></span> Medium</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--gray-400)"><span style="width:8px;height:8px;border-radius:2px;background:rgba(16,185,129,0.3)"></span> Low</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:0.65rem;color:var(--gray-400)"><span style="width:8px;height:8px;border-radius:2px;background:rgba(124,58,237,0.2)"></span> Task Due</span>
    </div>
  `;
}
