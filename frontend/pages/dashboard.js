// AetherOS — Dashboard V2 Command Center
// Pulls live data from every module with anime.js animations

const DASH_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Don't count the days, make the days count.",
  "Small daily improvements lead to stunning results.",
  "Your only limit is your mind.",
  "Discipline is the bridge between goals and accomplishment.",
  "It always seems impossible until it's done.",
  "The way to get started is to quit talking and begin doing."
];

async function renderDashboard() {
  const content = document.getElementById('page-content');
  const today = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;

  let user = null;
  try { user = JSON.parse(localStorage.getItem('user')); } catch(e) {}
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  const hour = today.getHours();
  let greetingTime = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const quote = DASH_QUOTES[Math.floor(Math.random() * DASH_QUOTES.length)];

  const timeStr = today.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});

  content.innerHTML = `
    <div style="position:relative;">
      <div class="dash-particles" id="dash-particles"></div>

      <!-- HERO -->
      <div class="dash-hero" id="dash-hero">
        <div class="dash-hero-top">
          <div class="dash-hero-left">
            <div class="dash-date"><i class="ph ph-calendar-blank"></i> ${dateStr}</div>
            <h1 class="dash-greeting" id="dash-greeting">${greetingTime}, ${escapeHtml(firstName)} <span class="dash-wave">👋</span></h1>
            <p class="dash-subtitle"><i class="ph-fill ph-sparkle" style="color:var(--primary-400)"></i> Here's your command center overview</p>
            <div class="dash-quote">"${quote}"</div>
          </div>
          <div class="dash-hero-right">
            <div class="dash-clock" id="dash-clock">${timeStr}</div>
            <div class="dash-clock-label">Current Time</div>
            <div class="dash-weather-mini" id="dash-weather-mini"><i class="ph ph-cloud" style="opacity:.3"></i></div>
          </div>
        </div>
        <div class="dash-actions">
          <button class="dash-action primary" onclick="router.navigate('/ai')"><i class="ph-fill ph-robot"></i> Ask AI</button>
          <button class="dash-action" onclick="router.navigate('/tasks')"><i class="ph ph-clipboard-text"></i> Tasks</button>
          <button class="dash-action" onclick="router.navigate('/study')"><i class="ph ph-graduation-cap"></i> Study Hub</button>
          <button class="dash-action" onclick="showCreateProjectModal()"><i class="ph ph-folder-plus"></i> New Project</button>
          <button class="dash-action" onclick="window.focusTimer?.show?.() || enterFocusMode()"><i class="ph ph-timer"></i> Focus</button>
        </div>
        <div class="dash-quick-row">
          <div class="dash-quick-input-wrap">
            <input type="text" class="dash-quick-input" id="dash-quick-input" placeholder="Quick add a task for today..." onkeypress="if(event.key==='Enter') dashQuickTask()">
            <button class="dash-quick-btn" onclick="dashQuickTask()"><i class="ph ph-arrow-up"></i></button>
          </div>
        </div>
      </div>

      <!-- STATS STRIP -->
      <div class="dash-stats" id="dash-stats">
        <div class="dash-stat" onclick="router.navigate('/tasks')">
          <div class="dash-stat-icon" style="background:rgba(239,68,68,.1);color:#EF4444"><i class="ph-fill ph-warning-circle"></i></div>
          <div class="dash-stat-info"><div class="dash-stat-val dash-counter" data-val="0" id="stat-tasks-due">0</div><div class="dash-stat-lbl">Due Today</div></div>
        </div>
        <div class="dash-stat" onclick="router.navigate('/projects')">
          <div class="dash-stat-icon" style="background:rgba(59,130,246,.1);color:#3B82F6"><i class="ph-fill ph-folder-open"></i></div>
          <div class="dash-stat-info"><div class="dash-stat-val dash-counter" data-val="0" id="stat-projects">0</div><div class="dash-stat-lbl">Active Projects</div></div>
        </div>
        <div class="dash-stat" onclick="router.navigate('/study')">
          <div class="dash-stat-icon" style="background:rgba(249,115,22,.1);color:#F97316"><i class="ph-fill ph-fire"></i></div>
          <div class="dash-stat-info"><div class="dash-stat-val" id="stat-streak"><span class="dash-mini-fire">🔥</span> <span class="dash-counter" data-val="0">0</span></div><div class="dash-stat-lbl">Day Streak</div></div>
        </div>
        <div class="dash-stat" onclick="router.navigate('/study')">
          <div class="dash-stat-info"><div class="dash-stat-val dash-counter" data-val="0" id="stat-xp">0</div><div class="dash-stat-lbl">XP · Lvl <span id="stat-lvl">1</span></div></div>
          <div class="dash-xp-ring" id="stat-xp-ring"></div>
        </div>
        <div class="dash-stat" onclick="router.navigate('/meetings')">
          <div class="dash-stat-icon" style="background:rgba(139,92,246,.1);color:#8B5CF6"><i class="ph-fill ph-video-camera"></i></div>
          <div class="dash-stat-info"><div class="dash-stat-val dash-counter" data-val="0" id="stat-meetings">0</div><div class="dash-stat-lbl">Today's Meetings</div></div>
        </div>
        <div class="dash-stat" onclick="router.navigate('/analytics')">
          <div class="dash-stat-icon" style="background:rgba(16,185,129,.1);color:#10B981"><i class="ph-fill ph-chart-line-up"></i></div>
          <div class="dash-stat-info"><div class="dash-stat-val"><span class="dash-counter" data-val="0" id="stat-prod">0</span>%</div><div class="dash-stat-lbl">Productivity</div></div>
        </div>
      </div>

      <!-- BENTO GRID -->
      <div class="dash-grid">
        <!-- ROW 1 -->
        <div class="dash-card span-2" id="dc-tasks">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-clipboard-text"></i> My Tasks</div>
            <span class="dash-card-link" onclick="router.navigate('/tasks')">View all <i class="ph ph-arrow-right"></i></span>
          </div>
          <div id="dc-tasks-content"><div class="dash-empty"><i class="ph ph-spinner"></i> Loading...</div></div>
        </div>

        <div class="dash-card" id="dc-calendar">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-calendar"></i> Schedule</div>
            <span class="dash-card-link" onclick="router.navigate('/calendar')">Full view <i class="ph ph-arrow-right"></i></span>
          </div>
          <div id="dc-calendar-content"></div>
        </div>

        <!-- ROW 2 -->
        <div class="dash-card" id="dc-study">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-graduation-cap"></i> Study Snapshot</div>
            <span class="dash-card-link" onclick="router.navigate('/study')">Open Hub <i class="ph ph-arrow-right"></i></span>
          </div>
          <div id="dc-study-content"><div class="dash-empty"><i class="ph ph-spinner"></i></div></div>
        </div>

        <div class="dash-card" id="dc-goals">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-target"></i> Active Goals</div>
          </div>
          <div id="dc-goals-content"><div class="dash-empty"><i class="ph ph-spinner"></i></div></div>
        </div>

        <div class="dash-card" id="dc-notes">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-note-pencil"></i> Recent Notes</div>
            <span class="dash-card-link" onclick="router.navigate('/study');setTimeout(()=>{document.querySelector('[data-tab=notes]')?.click()},300)">All Notes <i class="ph ph-arrow-right"></i></span>
          </div>
          <div id="dc-notes-content"><div class="dash-empty"><i class="ph ph-spinner"></i></div></div>
        </div>

        <!-- ROW 3 -->
        <div class="dash-card dash-weather-card" id="dc-weather">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-cloud-sun"></i> Weather</div>
          </div>
          <div id="dc-weather-content"><div class="dash-empty"><i class="ph ph-map-pin"></i> Locating...</div></div>
        </div>

        <div class="dash-card" id="dc-holidays">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-calendar-star"></i> Upcoming Holidays</div>
          </div>
          <div id="dc-holidays-content"><div class="dash-empty"><i class="ph ph-spinner"></i></div></div>
        </div>

        <div class="dash-card" id="dc-reminders">
          <div class="dash-card-head">
            <div class="dash-card-title"><i class="ph-fill ph-bell-ringing"></i> Alerts</div>
          </div>
          <div id="dc-reminders-content"><div class="dash-empty"><i class="ph ph-spinner"></i></div></div>
        </div>

        <!-- ROW 4 -->
        <div class="dash-card span-3 dash-ai-card" id="dc-ai" style="min-height:140px;justify-content:center;">
          <div class="dash-ai-glow"></div>
          <div class="dash-card-head" style="margin-bottom:8px;">
            <div class="dash-card-title"><i class="ph-fill ph-robot"></i> AI Insights</div>
            <span class="dash-card-link" onclick="router.navigate('/ai')">Ask AI <i class="ph ph-arrow-right"></i></span>
          </div>
          <div id="dc-ai-content" style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;"><div class="dash-empty"><i class="ph ph-sparkle"></i> Generating insights...</div></div>
        </div>
      </div>
    </div>
  `;

  // Start clock
  dashStartClock();

  // Load critical data in parallel
  Promise.all([
    dashLoadStats(),
    dashLoadTasks(),
    dashLoadCalendar(),
    dashLoadStudy(),
    dashLoadGoals(),
    dashLoadNotes(),
    dashLoadAI(),
    dashLoadReminders()
  ]).then(() => {
    // Run entrance animations after core data loads
    dashRunAnimations();
  });

  // Load third-party generic data non-blockingly
  dashLoadWeather();
  dashLoadHolidays();

  // Particles
  dashCreateParticles();
}

// ---- Clock ----
function dashStartClock() {
  const el = document.getElementById('dash-clock');
  if (!el) return;
  setInterval(() => {
    if (!document.getElementById('dash-clock')) return;
    el.textContent = new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true});
  }, 1000);
}

// ---- Quick Task ----
async function dashQuickTask() {
  const input = document.getElementById('dash-quick-input');
  if (!input || !input.value.trim()) return;
  try {
    await API.createTask({ title: input.value.trim(), priority:'Medium', status:'Todo', due_date:todayStr() });
    input.value = '';
    showToast('Task added!', 'success');
    dashLoadTasks();
    dashLoadStats();
  } catch(e) { showToast('Failed to add task', 'error'); }
}

// ---- Stats Strip ----
async function dashLoadStats() {
  try {
    const [tasks, projects, streaks, profile, meetings, analytics] = await Promise.all([
      API.getTasks().then(r => Array.isArray(r) ? r : []).catch(()=>[]),
      API.getProjects().then(r => Array.isArray(r) ? r : []).catch(()=>[]),
      API.getStreaks().catch(()=>({})),
      API.getStudyProfile().catch(()=>({})),
      API.getMeetings(todayStr()).then(r => Array.isArray(r) ? r : []).catch(()=>[]),
      API.getAnalytics('weekly').catch(()=>({}))
    ]);

    const todayKey = todayStr();
    const due = tasks.filter(t => t.due_date === todayKey && t.status !== 'Done').length;
    const streak = streaks?.current_streak || 0;
    const xp = profile?.total_xp || 0;
    const lvl = profile?.study_level || 1;
    const scores = analytics?.chart_data?.productivity_score || [];
    const prod = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;

    // Set data-val attributes for counters
    const setVal = (id, val) => { const el = document.getElementById(id); if(el) { el.dataset.val = val; } };
    setVal('stat-tasks-due', due);
    setVal('stat-projects', projects.length);
    document.querySelector('#stat-streak .dash-counter')?.setAttribute('data-val', streak);
    setVal('stat-xp', xp);
    const lvlEl = document.getElementById('stat-lvl'); if(lvlEl) lvlEl.textContent = lvl;
    setVal('stat-meetings', meetings.length);
    setVal('stat-prod', prod);

    // XP Ring SVG
    const xpRing = document.getElementById('stat-xp-ring');
    if (xpRing) {
      const pct = Math.round(((xp % 500) / 500) * 100);
      const circumference = 2 * Math.PI * 16;
      const offset = circumference - (pct / 100) * circumference;
      xpRing.innerHTML = `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="16" fill="none" stroke="var(--gray-200)" stroke-width="3"/>
        <circle cx="22" cy="22" r="16" fill="none" stroke="var(--primary-500)" stroke-width="3" stroke-linecap="round"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 22 22)" style="transition:stroke-dashoffset 1s ease"/>
        <text x="22" y="22" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="900" fill="var(--gray-700)">${lvl}</text></svg>`;
    }
  } catch(e) { console.error('Stats load error:', e); }
}

// ---- Tasks Card ----
async function dashLoadTasks() {
  let tasks = await API.getTasks().catch(()=>[]);
  if (!Array.isArray(tasks)) tasks = [];
  const container = document.getElementById('dc-tasks-content');
  if (!container) return;

  const inProgress = tasks.filter(t => t.status === 'In Progress');
  const todo = tasks.filter(t => t.status === 'Todo');
  const todayKey = todayStr();
  const todayTasks = tasks.filter(t => t.due_date === todayKey);

  function renderTab(tab) {
    const list = tab === 'progress' ? inProgress : tab === 'todo' ? todo : todayTasks;
    container.innerHTML = `
      <div class="dash-task-tabs">
        <div class="dash-task-tab ${tab==='progress'?'active':''}" data-t="progress">In Progress (${inProgress.length})</div>
        <div class="dash-task-tab ${tab==='todo'?'active':''}" data-t="todo">Todo (${todo.length})</div>
        <div class="dash-task-tab ${tab==='today'?'active':''}" data-t="today">Today (${todayTasks.length})</div>
      </div>
      <div style="max-height:280px;overflow-y:auto">
        ${list.slice(0,8).map(t => `
          <div class="dash-task-item" onclick="router.navigate('/tasks')">
            <div class="dash-task-check ${t.status==='Done'?'done':''}">${t.status==='Done'?'✓':''}</div>
            <div class="dash-task-title ${t.status==='Done'?'completed':''}">${escapeHtml(t.title||'Untitled')}</div>
            <span class="dash-task-badge ${priorityClass(t.priority)}">${t.priority||'Medium'}</span>
          </div>
        `).join('')}
        ${!list.length ? '<div class="dash-empty"><i class="ph-fill ph-check-circle"></i> All clear!</div>' : ''}
      </div>
    `;
    container.querySelectorAll('.dash-task-tab').forEach(tab => {
      tab.addEventListener('click', () => renderTab(tab.dataset.t));
    });
  }
  renderTab('progress');
}

// ---- Calendar & Meetings ----
async function dashLoadCalendar() {
  const container = document.getElementById('dc-calendar-content');
  if (!container) return;
  const now = new Date();
  const dayNames = ['S','M','T','W','T','F','S'];
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());

  let calHtml = dayNames.map(d => `<div class="dash-cal-label">${d}</div>`).join('');
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    calHtml += `<div class="dash-cal-day ${isToday?'today':''}">${d.getDate()}</div>`;
  }

  const meetings = await API.getMeetings(todayStr()).then(r=>Array.isArray(r)?r:[]).catch(()=>[]);
  container.innerHTML = `
    <div style="font-size:.78rem;font-weight:700;color:var(--gray-500);margin-bottom:10px">${now.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div>
    <div class="dash-cal-grid">${calHtml}</div>
    <div style="font-size:.75rem;font-weight:700;color:var(--gray-500);margin:12px 0 8px;display:flex;align-items:center;gap:6px"><i class="ph ph-video-camera"></i> Today's Meetings</div>
    ${meetings.length ? meetings.map(m => `
      <div class="dash-meeting-item">
        <span class="dash-meeting-time">${m.time||''}</span>
        <span class="dash-meeting-name">${escapeHtml(m.title)}</span>
        <span class="dash-meeting-badge">${m.platform||'Meet'}</span>
      </div>
    `).join('') : '<div class="dash-empty"><i class="ph ph-coffee"></i> No meetings today</div>'}
  `;
}

// ---- Study Snapshot ----
async function dashLoadStudy() {
  const container = document.getElementById('dc-study-content');
  if (!container) return;
  try {
    const [subjects, profile, streaks] = await Promise.all([
      API.getSubjects().then(r=>Array.isArray(r)?r:[]).catch(()=>[]),
      API.getStudyProfile().catch(()=>({})),
      API.getStreaks().catch(()=>({}))
    ]);
    const topics = (await Promise.all(subjects.map(s=>API.getTopics(s._id).then(r=>Array.isArray(r)?r:[]).catch(()=>[])) )).flat();
    const done = topics.filter(t=>t.status==='Completed').length;

    container.innerHTML = `
      <div class="dash-study-row">
        <div class="dash-study-mini"><div class="dash-study-mini-val">${subjects.length}</div><div class="dash-study-mini-lbl">Subjects</div></div>
        <div class="dash-study-mini"><div class="dash-study-mini-val">${topics.length}</div><div class="dash-study-mini-lbl">Topics</div></div>
        <div class="dash-study-mini"><div class="dash-study-mini-val">${done}</div><div class="dash-study-mini-lbl">Done</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--gray-50);border-radius:12px;margin-bottom:10px">
        <span class="dash-mini-fire" style="font-size:1.4rem">🔥</span>
        <div><div style="font-size:.95rem;font-weight:800;color:var(--gray-800)">${streaks?.current_streak||0} Day Streak</div><div style="font-size:.65rem;color:var(--gray-400)">Keep it going!</div></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(135deg,var(--primary-50),rgba(59,130,246,.05));border-radius:12px">
        <i class="ph-fill ph-lightning" style="font-size:1.2rem;color:var(--primary-500)"></i>
        <div><div style="font-size:.85rem;font-weight:800;color:var(--gray-800)">${profile?.total_xp||0} XP</div><div style="font-size:.65rem;color:var(--gray-400)">Level ${profile?.study_level||1}</div></div>
      </div>
    `;
  } catch(e) { container.innerHTML = '<div class="dash-empty"><i class="ph ph-graduation-cap"></i> No study data</div>'; }
}

// ---- Goals ----
async function dashLoadGoals() {
  const container = document.getElementById('dc-goals-content');
  if (!container) return;
  try {
    const goals = await API.getGoals().then(r=>Array.isArray(r)?r:[]).catch(()=>[]);
    if (!goals.length) { container.innerHTML = '<div class="dash-empty"><i class="ph-fill ph-target"></i> No goals set</div>'; return; }
    container.innerHTML = goals.slice(0,4).map(g => {
      const pct = g.status === 'Completed' ? 100 : g.progress || 0;
      return `
        <div class="dash-goal-item">
          <div class="dash-goal-top"><span class="dash-goal-name">${escapeHtml(g.title||g.name||'Untitled')}</span><span class="dash-goal-pct">${pct}%</span></div>
          <div class="dash-goal-bar"><div class="dash-goal-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  } catch(e) { container.innerHTML = '<div class="dash-empty"><i class="ph-fill ph-target"></i> Error loading goals</div>'; }
}

// ---- Recent Notes ----
async function dashLoadNotes() {
  const container = document.getElementById('dc-notes-content');
  if (!container) return;
  try {
    const notes = await API.getAllNotes().then(r=>Array.isArray(r)?r:[]).catch(()=>[]);
    if (!notes.length) { container.innerHTML = '<div class="dash-empty"><i class="ph ph-note-pencil"></i> No notes yet</div>'; return; }
    const sorted = notes.sort((a,b)=>new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0));
    container.innerHTML = sorted.slice(0,3).map(n => {
      const tags = (n.tags||[]).slice(0,2).map(t=>`<span class="dash-note-tag">${escapeHtml(t)}</span>`).join('');
      const preview = (n.content||'').replace(/<[^>]+>/g,'').substring(0,60);
      return `
        <div class="dash-note-item" onclick="router.navigate('/study');setTimeout(()=>{document.querySelector('[data-tab=notes]')?.click()},300)">
          <div class="dash-note-title">${escapeHtml(n.title||'Untitled')}</div>
          <div class="dash-note-meta">${tags} ${preview}...</div>
        </div>`;
    }).join('');
  } catch(e) { container.innerHTML = '<div class="dash-empty"><i class="ph ph-note-pencil"></i> Error</div>'; }
}

// ---- AI Insights ----
async function dashLoadAI() {
  const container = document.getElementById('dc-ai-content');
  if (!container) return;
  try {
    const [tasks, streaks] = await Promise.all([
      API.getTasks().then(r=>Array.isArray(r)?r:[]).catch(()=>[]),
      API.getStreaks().catch(()=>({}))
    ]);
    const todayKey = todayStr();
    const due = tasks.filter(t=>t.due_date===todayKey&&t.status!=='Done').length;
    const overdue = tasks.filter(t=>t.due_date<todayKey&&t.status!=='Done').length;
    const streak = streaks?.current_streak||0;
    const tips = [];
    if (due > 0) tips.push(`You have <strong>${due} task${due>1?'s':''}</strong> due today. Focus on completing the highest priority ones first.`);
    if (overdue > 0) tips.push(`<strong>${overdue} task${overdue>1?'s are':' is'}</strong> overdue. Consider rescheduling or breaking them into smaller pieces.`);
    if (streak >= 3) tips.push(`Amazing! You're on a <strong>${streak}-day study streak</strong>. Keep the momentum going! 🔥`);
    if (streak === 0) tips.push(`Start a study session today to begin building your streak. Even 15 minutes counts!`);
    if (!tips.length) tips.push(`Great job staying on top of things! Consider reviewing your goals or exploring a new topic.`);
    tips.push(`<strong>Tip:</strong> Use the Quick Add bar above to rapidly capture tasks without leaving this page.`);

    container.innerHTML = tips.map(t => `<div class="dash-ai-tip" style="min-width:280px;flex-shrink:0;">${t}</div>`).join('');
  } catch(e) { container.innerHTML = '<div class="dash-empty"><i class="ph ph-robot"></i> AI unavailable</div>'; }
}

// ---- Reminders ----
async function dashLoadReminders() {
  const container = document.getElementById('dc-reminders-content');
  if (!container) return;
  try {
    const reminders = await API.getReminders().then(r=>Array.isArray(r)?r:[]).catch(()=>[]);
    if (!reminders.length) { container.innerHTML = '<div class="dash-empty"><i class="ph-fill ph-check-circle"></i> All caught up!</div>'; return; }
    container.innerHTML = reminders.slice(0,5).map(r => `
      <div class="dash-reminder">
        <div class="dash-reminder-icon ${r.iconClass||''}" style="background:${r.iconClass==='blue'?'#DBEAFE;color:#2563EB':r.iconClass==='green'?'rgba(16,185,129,.1);color:#10B981':r.iconClass==='orange'?'rgba(249,115,22,.1);color:#F97316':'var(--primary-50);color:var(--primary-500)'}">${r.icon||'<i class="ph ph-bell"></i>'}</div>
        <div class="dash-reminder-info"><div class="dash-reminder-title">${escapeHtml(r.title)}</div><div class="dash-reminder-time">${escapeHtml(r.time||'')}</div></div>
      </div>
    `).join('');
  } catch(e) { container.innerHTML = '<div class="dash-empty"><i class="ph ph-bell"></i> Error</div>'; }
}

// ---- Particle System ----
function dashCreateParticles() {
  const container = document.getElementById('dash-particles');
  if (!container) return;
  const colors = ['var(--primary-300)', 'var(--primary-200)', '#93C5FD', '#C4B5FD', '#FDE68A'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'dash-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.width = (2 + Math.random() * 4) + 'px';
    p.style.height = p.style.width;
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(p);
  }

  // Animate with anime.js if available
  if (typeof anime !== 'undefined') {
    anime({
      targets: '.dash-particle',
      translateY: function() { return [0, -(40 + Math.random() * 80)]; },
      translateX: function() { return [(Math.random() - 0.5) * 60]; },
      opacity: [0, function() { return 0.2 + Math.random() * 0.4; }, 0],
      scale: [0.5, 1, 0.5],
      duration: function() { return 3000 + Math.random() * 4000; },
      delay: function(el, i) { return i * 100 + Math.random() * 1000; },
      loop: true,
      easing: 'easeInOutSine'
    });
  }
}

// ---- Anime.js Entrance Animations ----
function dashRunAnimations() {
  if (typeof anime === 'undefined') {
    // Fallback: just show everything
    document.querySelectorAll('.dash-card').forEach(c => { c.style.opacity = '1'; c.style.transform = 'translateY(0)'; });
    dashAnimateCounters();
    return;
  }

  // Staggered card entrance
  anime({
    targets: '.dash-card',
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 600,
    delay: anime.stagger(80, {start: 200}),
    easing: 'easeOutCubic'
  });

  // Stat tiles entrance
  anime({
    targets: '.dash-stat',
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 500,
    delay: anime.stagger(60, {start: 100}),
    easing: 'easeOutCubic'
  });

  // Counter animation
  dashAnimateCounters();
}

function dashAnimateCounters() {
  document.querySelectorAll('.dash-counter').forEach(el => {
    const target = parseInt(el.dataset.val) || 0;
    if (typeof anime !== 'undefined') {
      const obj = { val: 0 };
      anime({
        targets: obj,
        val: target,
        round: 1,
        duration: 1200,
        easing: 'easeOutExpo',
        update: () => { el.textContent = obj.val; }
      });
    } else {
      // Fallback
      let cur = 0;
      const step = Math.max(1, target / 30);
      const interval = setInterval(() => { cur += step; if (cur >= target) { cur = target; clearInterval(interval); } el.textContent = Math.round(cur); }, 20);
    }
  });
}

// ---- Weather (Open-Meteo — Free, No API Key) ----
const WEATHER_ICONS = {
  0: { icon: 'ph-fill ph-sun', label: 'Clear Sky', gradient: 'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  1: { icon: 'ph-fill ph-sun', label: 'Mostly Clear', gradient: 'linear-gradient(135deg,#FDE68A,#F59E0B)' },
  2: { icon: 'ph-fill ph-cloud-sun', label: 'Partly Cloudy', gradient: 'linear-gradient(135deg,#93C5FD,#3B82F6)' },
  3: { icon: 'ph-fill ph-cloud', label: 'Overcast', gradient: 'linear-gradient(135deg,#9CA3AF,#6B7280)' },
  45: { icon: 'ph-fill ph-cloud-fog', label: 'Foggy', gradient: 'linear-gradient(135deg,#D1D5DB,#9CA3AF)' },
  48: { icon: 'ph-fill ph-cloud-fog', label: 'Icy Fog', gradient: 'linear-gradient(135deg,#E0E7FF,#A5B4FC)' },
  51: { icon: 'ph-fill ph-cloud-rain', label: 'Light Drizzle', gradient: 'linear-gradient(135deg,#93C5FD,#6366F1)' },
  53: { icon: 'ph-fill ph-cloud-rain', label: 'Drizzle', gradient: 'linear-gradient(135deg,#93C5FD,#6366F1)' },
  55: { icon: 'ph-fill ph-cloud-rain', label: 'Heavy Drizzle', gradient: 'linear-gradient(135deg,#818CF8,#4F46E5)' },
  61: { icon: 'ph-fill ph-cloud-rain', label: 'Light Rain', gradient: 'linear-gradient(135deg,#93C5FD,#3B82F6)' },
  63: { icon: 'ph-fill ph-cloud-rain', label: 'Rain', gradient: 'linear-gradient(135deg,#60A5FA,#2563EB)' },
  65: { icon: 'ph-fill ph-cloud-rain', label: 'Heavy Rain', gradient: 'linear-gradient(135deg,#3B82F6,#1E40AF)' },
  71: { icon: 'ph-fill ph-snowflake', label: 'Light Snow', gradient: 'linear-gradient(135deg,#E0E7FF,#A5B4FC)' },
  73: { icon: 'ph-fill ph-snowflake', label: 'Snow', gradient: 'linear-gradient(135deg,#C7D2FE,#818CF8)' },
  75: { icon: 'ph-fill ph-snowflake', label: 'Heavy Snow', gradient: 'linear-gradient(135deg,#A5B4FC,#6366F1)' },
  80: { icon: 'ph-fill ph-cloud-rain', label: 'Rain Showers', gradient: 'linear-gradient(135deg,#60A5FA,#2563EB)' },
  81: { icon: 'ph-fill ph-cloud-rain', label: 'Heavy Showers', gradient: 'linear-gradient(135deg,#3B82F6,#1E40AF)' },
  95: { icon: 'ph-fill ph-cloud-lightning', label: 'Thunderstorm', gradient: 'linear-gradient(135deg,#6366F1,#4338CA)' },
  96: { icon: 'ph-fill ph-cloud-lightning', label: 'Hail Storm', gradient: 'linear-gradient(135deg,#818CF8,#4338CA)' },
  99: { icon: 'ph-fill ph-cloud-lightning', label: 'Severe Storm', gradient: 'linear-gradient(135deg,#4F46E5,#312E81)' }
};

function getWeatherInfo(code) {
  return WEATHER_ICONS[code] || WEATHER_ICONS[Math.floor(code/10)*10] || { icon:'ph-fill ph-cloud', label:'Unknown', gradient:'linear-gradient(135deg,#9CA3AF,#6B7280)' };
}

async function dashLoadWeather() {
  const container = document.getElementById('dc-weather-content');
  const miniEl = document.getElementById('dash-weather-mini');
  if (!container) return;

  try {
    // Get user location
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
    });
    const lat = pos.coords.latitude.toFixed(2);
    const lon = pos.coords.longitude.toFixed(2);

    // Fetch weather from Open-Meteo (free, no key)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=4`;
    
    // Add an abort controller to prevent hanging fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await res.json();

    const current = data.current;
    const daily = data.daily;
    const info = getWeatherInfo(current.weather_code);
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const wind = Math.round(current.wind_speed_10m);

    // Reverse geocode city name (approximate)
    let cityName = 'Your Location';
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1`);
      // Fallback: just show coords-based label
    } catch(e) {}

    // Hero mini weather
    if (miniEl) {
      miniEl.innerHTML = `<i class="${info.icon}" style="font-size:1.2rem"></i> <span style="font-weight:800;font-size:1.1rem">${temp}°C</span>`;
      miniEl.style.opacity = '1';
    }

    // Full weather card
    container.innerHTML = `
      <div class="dash-weather-now">
        <div class="dash-weather-icon-wrap" style="background:${info.gradient}">
          <i class="${info.icon}"></i>
        </div>
        <div class="dash-weather-info">
          <div class="dash-weather-temp">${temp}°C</div>
          <div class="dash-weather-desc">${info.label}</div>
          <div class="dash-weather-details">
            <span><i class="ph ph-drop"></i> ${humidity}%</span>
            <span><i class="ph ph-wind"></i> ${wind} km/h</span>
          </div>
        </div>
      </div>
      <div class="dash-weather-forecast">
        ${daily.time.slice(1, 4).map((d, i) => {
          const fInfo = getWeatherInfo(daily.weather_code[i+1]);
          const dayName = new Date(d).toLocaleDateString('en-US', { weekday:'short' });
          return `
            <div class="dash-forecast-day">
              <div class="dash-forecast-label">${dayName}</div>
              <i class="${fInfo.icon}" style="color:var(--gray-500)"></i>
              <div class="dash-forecast-temps">
                <span class="dash-forecast-hi">${Math.round(daily.temperature_2m_max[i+1])}°</span>
                <span class="dash-forecast-lo">${Math.round(daily.temperature_2m_min[i+1])}°</span>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;

    // Animate weather icon
    if (typeof anime !== 'undefined') {
      anime({ targets: '.dash-weather-icon-wrap', scale: [0, 1], rotate: ['-15deg', '0deg'], duration: 800, easing: 'easeOutBack' });
      anime({ targets: '.dash-forecast-day', translateY: [15, 0], opacity: [0, 1], delay: anime.stagger(100, {start: 300}), duration: 500, easing: 'easeOutCubic' });
    }
  } catch(e) {
    console.warn('Weather: Location denied or API error', e);
    container.innerHTML = `
      <div class="dash-empty" style="flex-direction:column">
        <i class="ph ph-map-pin-line" style="font-size:1.5rem;margin-bottom:8px"></i>
        Enable location access for real-time weather
      </div>`;
    if (miniEl) miniEl.innerHTML = '<i class="ph ph-cloud-slash" style="opacity:.4"></i>';
  }
}

// ---- Holidays (Nager.Date API with Robust Fallback) ----
const FALLBACK_HOLIDAYS_IN_2026 = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-04', name: 'Holi' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas Day' }
];

async function dashLoadHolidays() {
  const container = document.getElementById('dc-holidays-content');
  if (!container) return;

  try {
    let upcoming = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    const year = today.getFullYear();
    
    // Attempt to fetch from free API
    try {
      // Very fast timeout so the UI doesn't hang
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const holidays = await res.json();
      if (Array.isArray(holidays) && holidays.length > 0) {
        upcoming = holidays.filter(h => new Date(h.date) >= today).slice(0, 5);
      }
    } catch (e) {
      console.warn('Holidays API failed, using Indian defaults');
    }

    // Fallback to local array
    if (!upcoming.length) {
      upcoming = FALLBACK_HOLIDAYS_IN_2026.filter(h => new Date(h.date) >= today).slice(0, 5);
    }

    if (!upcoming.length) {
      container.innerHTML = '<div class="dash-empty"><i class="ph ph-calendar-star"></i> No upcoming holidays</div>';
      return;
    }

    container.innerHTML = upcoming.map((h, i) => {
      const hDate = new Date(h.date);
      const diffDays = Math.ceil((hDate - today) / (1000*60*60*24));
      const dayLabel = diffDays === 0 ? 'Today! 🎉' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
      
      return `
        <div class="dash-holiday-item" style="animation-delay:${i * 80}ms">
          <div class="dash-holiday-date">
            <div class="dash-holiday-month">${hDate.toLocaleDateString('en-US',{month:'short'})}</div>
            <div class="dash-holiday-day">${hDate.getDate()}</div>
          </div>
          <div class="dash-holiday-info">
            <div class="dash-holiday-name">${escapeHtml(h.localName || h.name)}</div>
            <div class="dash-holiday-countdown">${dayLabel}</div>
          </div>
        </div>`;
    }).join('');

    // Animate
    if (typeof anime !== 'undefined') {
      anime({ targets: '.dash-holiday-item', translateX: [-20, 0], opacity: [0, 1], delay: anime.stagger(80, {start: 100}), duration: 500, easing: 'easeOutCubic' });
    }
  } catch(e) {
    container.innerHTML = '<div class="dash-empty"><i class="ph ph-calendar-star"></i> Could not load holidays</div>';
  }
}
