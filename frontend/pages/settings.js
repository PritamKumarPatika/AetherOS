// AetherOS — Settings Page
// ======================== SETTINGS PAGE V2 ========================

const SET_THEMES = [
  { id: 'blurple',  color: '#6B5CE7', props: {'--primary-50':'#F4F3FD', '--primary-100':'#E0DDFA', '--primary-200':'#C4BFF5', '--primary-300':'#9E94EF', '--primary-400':'#7A6AE9', '--primary-500':'#6B5CE7', '--primary-600':'#5340E0', '--primary-700':'#4634B9'} },
  { id: 'mint',     color: '#10B981', props: {'--primary-50':'#ECFDF5', '--primary-100':'#D1FAE5', '--primary-200':'#A7F3D0', '--primary-300':'#6EE7B7', '--primary-400':'#34D399', '--primary-500':'#10B981', '--primary-600':'#059669', '--primary-700':'#047857'} },
  { id: 'orange',   color: '#F97316', props: {'--primary-50':'#FFF7ED', '--primary-100':'#FFEDD5', '--primary-200':'#FED7AA', '--primary-300':'#FDBA74', '--primary-400':'#FB923C', '--primary-500':'#F97316', '--primary-600':'#EA580C', '--primary-700':'#C2410C'} },
  { id: 'pink',     color: '#EC4899', props: {'--primary-50':'#FDF2F8', '--primary-100':'#FCE7F3', '--primary-200':'#FBCFE8', '--primary-300':'#F9A8D4', '--primary-400':'#F472B6', '--primary-500':'#EC4899', '--primary-600':'#DB2777', '--primary-700':'#BE185D'} },
  { id: 'blue',     color: '#3B82F6', props: {'--primary-50':'#EFF6FF', '--primary-100':'#DBEAFE', '--primary-200':'#BFDBFE', '--primary-300':'#93C5FD', '--primary-400':'#60A5FA', '--primary-500':'#3B82F6', '--primary-600':'#2563EB', '--primary-700':'#1D4ED8'} }
];

window.setAppTheme = function(themeId, btnElement) {
  const theme = SET_THEMES.find(t=>t.id === themeId);
  if(!theme) return;
  
  // Set CSS Root Variables
  const root = document.documentElement;
  Object.keys(theme.props).forEach(k => root.style.setProperty(k, theme.props[k]));
  
  // Visuals
  document.querySelectorAll('.set-theme-swatch').forEach(el=>el.classList.remove('active'));
  if(btnElement) btnElement.classList.add('active');
  
  // Save to local storage
  localStorage.setItem('aether_theme', themeId);
}

// Ensure theme is applied on load
const savedTheme = localStorage.getItem('aether_theme');
if(savedTheme) window.setAppTheme(savedTheme, null);

async function renderSettingsPage() {
  const user = await API.getUser();
  const settings = user.settings || {};
  const currentTheme = localStorage.getItem('aether_theme') || 'blurple';
  
  // Simulate some profile stats
  const profile = await API.getStudyProfile().catch(()=>({})) || {};
  const initials = (user.name||'A').substring(0,2).toUpperCase();
  const joinDate = new Date(user.created_at || Date.now()).toLocaleDateString('en-US', {month:'short', year:'numeric'});

  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="set-page animate-fade-in">
      <div class="set-header"><h2><i class="ph-fill ph-gear-six"></i> Preferences Hub</h2></div>
      
      <div class="set-grid">
        <!-- Profile Card -->
        <div class="set-card" style="animation-delay:0.1s">
          <div class="set-card-title"><i class="ph-bold ph-user"></i> Account Overview</div>
          <div class="set-profile" id="set-profile-card">
            <div class="set-avatar-wrap">
              ${initials}
              <div class="set-status-dot" title="Online"></div>
            </div>
            <div class="set-user-info">
              <h3 class="set-username">${escapeHtml(user.name||'Explorer')}</h3>
              <div class="set-email"><i class="ph ph-envelope-simple"></i> ${escapeHtml(user.email||'student@aether.os')}</div>
              <div class="set-level-badge"><i class="ph-fill ph-lightning"></i> Level ${profile.study_level||1} · ${profile.total_xp||0} XP</div>
            </div>
          </div>
          <p style="font-size:0.75rem;color:var(--gray-400);margin-top:24px;border-top:1px solid var(--gray-100);padding-top:16px;">
            Member since ${joinDate}
          </p>
        </div>

        <!-- Appearance (Themes) -->
        <div class="set-card" style="animation-delay:0.2s">
          <div class="set-card-title"><i class="ph-bold ph-palette"></i> Appearance & Theme</div>
          <p style="font-size:0.85rem;color:var(--gray-500);margin-bottom:20px;line-height:1.4">Customize AetherOS to match your energy. Select an accent color below to instantly transform the UI globally.</p>
          <div class="set-themes">
            ${SET_THEMES.map(t => 
              `<div class="set-theme-swatch ${currentTheme===t.id?'active':''}" style="background-color:${t.color}" title="${t.id}" onclick="setAppTheme('${t.id}', this)"></div>`
            ).join('')}
          </div>
        </div>

        <!-- App Settings Toggles -->
        <div class="set-card" style="animation-delay:0.3s">
          <div class="set-card-title"><i class="ph-bold ph-sliders"></i> Features & Preferences</div>
          
          <div class="set-pref-row">
            <div class="set-pref-info">
              <div class="set-pref-title"><span class="set-pref-icon"><i class="ph-bold ph-target"></i></span> Focus Mode UI</div>
              <div class="set-pref-desc">Enable minimal Zen distraciton-free interface during study sessions.</div>
            </div>
            <label class="set-toggle-label"><input type="checkbox" id="set-tog-focus" ${settings.focus_mode?'checked':''} onchange="toggleSetting('focus_mode',this.checked)"><span class="set-toggle-slider"></span></label>
          </div>

          <div class="set-pref-row">
            <div class="set-pref-info">
              <div class="set-pref-title"><span class="set-pref-icon"><i class="ph-bold ph-chart-bar"></i></span> Daily Review Digest</div>
              <div class="set-pref-desc">Receive an AI-powered summary of your tasks and productivity at the end of day.</div>
            </div>
            <label class="set-toggle-label"><input type="checkbox" id="set-tog-review" ${settings.daily_review?'checked':''} onchange="toggleSetting('daily_review',this.checked)"><span class="set-toggle-slider"></span></label>
          </div>

          <div class="set-pref-row">
            <div class="set-pref-info">
              <div class="set-pref-title"><span class="set-pref-icon"><i class="ph-bold ph-bell-ringing"></i></span> Smart Notifications</div>
              <div class="set-pref-desc">Allow gentle reminders for upcoming meetings, deadlines, and streak retention.</div>
            </div>
            <label class="set-toggle-label"><input type="checkbox" id="set-tog-notif" ${settings.notifications?'checked':''} onchange="toggleSetting('notifications',this.checked)"><span class="set-toggle-slider"></span></label>
          </div>
        </div>

        <!-- Data Vault & Actions -->
        <div class="set-card" style="animation-delay:0.4s">
          <div class="set-card-title"><i class="ph-bold ph-database"></i> Data Management</div>
          
          <div class="set-vault-grid">
            <button class="set-action-btn" onclick="downloadBlob(API.exportTasks(),'tasks.xlsx');showToast('Exported Tasks!')">
              <i class="ph-fill ph-file-xls"></i>
              <div class="set-action-title">Export Tasks</div>
              <div class="set-action-desc">Download as Excel</div>
            </button>
            
            <button class="set-action-btn" onclick="downloadBlob(API.exportProjects(),'projects.xlsx');showToast('Exported Projects!')">
              <i class="ph-fill ph-folder-open"></i>
              <div class="set-action-title">Export Projects</div>
              <div class="set-action-desc">Backup Workspace</div>
            </button>
            
            <button class="set-zen-btn" onclick="enterFocusMode()">
              <i class="ph-fill ph-flower-lotus"></i> Enter Zen Mode
            </button>
          </div>
        </div>
        
      </div>
    </div>
  `;

  // 3D Tilt binding
  const proCard = document.getElementById('set-profile-card');
  if(proCard) {
    proCard.parentElement.addEventListener('mousemove', (e) => {
      const rect = proCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPct = x / rect.width;
      const yPct = y / rect.height;
      const xRotation = (yPct - 0.5) * -20;
      const yRotation = (xPct - 0.5) * 20;
      proCard.querySelector('.set-avatar-wrap').style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.05)`;
    });
    proCard.parentElement.addEventListener('mouseleave', () => {
      proCard.querySelector('.set-avatar-wrap').style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
    });
  }
}

async function toggleSetting(key, value) {
  const user = await API.getUser();
  const settings = { ...user.settings, [key]: value };
  await API.updateSettings(settings);
  showToast(`${key.replace('_',' ')} ${value ? 'enabled' : 'disabled'}`);
  if (key === 'focus_mode' && value) enterFocusMode();
}

// ---- Focus Mode ----
function enterFocusMode() {
  let seconds = 25 * 60;
  let running = false;
  let interval = null;

  const overlay = document.createElement('div');
  overlay.className = 'focus-overlay';
  overlay.id = 'focus-overlay';

  function updateDisplay() {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const timerEl = document.getElementById('focus-timer');
    if (timerEl) timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  overlay.innerHTML = `
    <div style="text-align:center">
      <h2 style="color:rgba(255,255,255,0.6);margin-bottom:16px;font-size:1rem;text-transform:uppercase;letter-spacing:0.1em">Focus Mode</h2>
      <div class="focus-timer" id="focus-timer">25:00</div>
      <div class="focus-task">Focus on your current task. Minimize distractions.</div>
      <div class="focus-controls">
        <button class="focus-btn start" id="focus-start" onclick="toggleFocusTimer()">Start</button>
        <button class="focus-btn stop" onclick="exitFocusMode()">Exit</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  window._focusTimer = { seconds, running, interval };
  window.toggleFocusTimer = function() {
    const ft = window._focusTimer;
    if (ft.running) {
      clearInterval(ft.interval);
      ft.running = false;
      document.getElementById('focus-start').textContent = 'Resume';
    } else {
      ft.running = true;
      document.getElementById('focus-start').textContent = 'Pause';
      ft.interval = setInterval(() => {
        ft.seconds--;
        if (ft.seconds <= 0) {
          clearInterval(ft.interval);
          showToast('Focus session complete! Take a break.', 'success');
          exitFocusMode();
          return;
        }
        const m = Math.floor(ft.seconds / 60);
        const s = ft.seconds % 60;
        const el = document.getElementById('focus-timer');
        if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      }, 1000);
    }
  };
}

function exitFocusMode() {
  if (window._focusTimer?.interval) clearInterval(window._focusTimer.interval);
  const overlay = document.getElementById('focus-overlay');
  if (overlay) overlay.remove();
}

// ---- Daily Review ----
async function showDailyReview() {
  const data = await API.getAnalytics('daily');
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <h2><i class="ph ph-chart-bar"></i> Daily Review</h2>
      <button class="btn btn-outline" onclick="renderDashboard()"><i class="ph ph-arrow-left"></i> Back to Dashboard</button>
    </div>
    <div class="review-grid">
      <div class="review-card animate-fade-in"><div class="review-value">${data.tasks_completed}</div><div class="review-label">Tasks Completed</div></div>
      <div class="review-card animate-fade-in" style="animation-delay:.1s"><div class="review-value" style="color:var(--error)">${data.tasks_missed}</div><div class="review-label">Tasks Missed</div></div>
      <div class="review-card animate-fade-in" style="animation-delay:.2s"><div class="review-value">${data.meetings_attended}</div><div class="review-label">Meetings Attended</div></div>
    </div>
    <div class="card animate-fade-in" style="text-align:center;padding:48px">
      <h3 style="margin-bottom:8px">Productivity Score</h3>
      <div style="font-size:4rem;font-weight:800;color:${data.productivity_score>=70?'var(--success)':'var(--warning)'}">${data.productivity_score}%</div>
      <p class="text-muted" style="margin-top:12px">${data.productivity_score>=70?'Great day! Keep it up! <i class="ph-fill ph-fire"></i>':'Room for improvement. Tomorrow is a new chance! <i class="ph-fill ph-barbell"></i>'}</p>
    </div>
    <div class="insights-card animate-fade-in" style="margin-top:24px">
      <h4><i class="ph ph-robot"></i> AI Summary</h4>
      ${(data.ai_insights||[]).map(i => `<div class="insight-item">${i}</div>`).join('')}
    </div>
  `;
}
