// AetherOS — Reports & Analytics Page (Premium Overhaul)
let _analyticsCharts = [];

async function renderAnalyticsPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="analytics-page">
      <div class="page-header">
        <h2><i class="ph ph-chart-bar"></i> Reports & Analytics</h2>
        <div class="page-actions">
          <button class="btn btn-outline btn-sm" onclick="location.reload()"><i class="ph ph-arrow-clockwise"></i> Refresh</button>
        </div>
      </div>
      <div class="analytics-tabs">
        <div class="analytics-tab active" onclick="switchAnalyticsTab('daily',this)"><i class="ph ph-sun"></i> Daily</div>
        <div class="analytics-tab" onclick="switchAnalyticsTab('weekly',this)"><i class="ph ph-calendar-blank"></i> Weekly</div>
        <div class="analytics-tab" onclick="switchAnalyticsTab('monthly',this)"><i class="ph ph-chart-line-up"></i> Monthly</div>
      </div>
      <div id="analytics-content"><div class="loading-shimmer" style="height:400px;border-radius:var(--radius-xl)"></div></div>
    </div>
  `;
  loadAnalytics('daily');
}

async function switchAnalyticsTab(period, el) {
  document.querySelectorAll('.analytics-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  // Destroy existing charts
  _analyticsCharts.forEach(c => { try { c.destroy(); } catch(e) {} });
  _analyticsCharts = [];
  loadAnalytics(period);
}

async function loadAnalytics(period) {
  const data = await API.getAnalytics(period);
  const container = document.getElementById('analytics-content');
  if (!container) return;

  const score = data.productivity_score || 0;
  const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? '#F97316' : 'var(--error)';
  const pri = data.priority_breakdown || {};
  const projProgress = data.project_progress || {};

  container.innerHTML = `
    <!-- ROW 1: Hero Stats -->
    <div class="an-stats-row animate-fade-in">
      <div class="an-stat-card">
        <div class="an-stat-icon" style="background:var(--primary-50);color:var(--primary-500)"><i class="ph ph-check-circle"></i></div>
        <div class="an-stat-info">
          <div class="an-stat-num" data-target="${data.tasks_completed}">0</div>
          <div class="an-stat-label">Tasks Done</div>
        </div>
        <div class="an-stat-spark" style="color:var(--success);font-size:0.7rem"><i class="ph ph-trend-up"></i></div>
      </div>
      <div class="an-stat-card">
        <div class="an-stat-icon" style="background:rgba(239,68,68,0.1);color:var(--error)"><i class="ph ph-warning-circle"></i></div>
        <div class="an-stat-info">
          <div class="an-stat-num" data-target="${data.tasks_missed}">0</div>
          <div class="an-stat-label">Overdue</div>
        </div>
        <div class="an-stat-spark" style="color:var(--error);font-size:0.7rem">${data.tasks_missed > 0 ? '<i class="ph ph-trend-down"></i>':'<i class="ph ph-minus"></i>'}</div>
      </div>
      <div class="an-stat-card">
        <div class="an-stat-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6"><i class="ph ph-spinner-gap"></i></div>
        <div class="an-stat-info">
          <div class="an-stat-num" data-target="${data.tasks_in_progress}">0</div>
          <div class="an-stat-label">In Progress</div>
        </div>
      </div>
      <div class="an-stat-card">
        <div class="an-stat-icon" style="background:rgba(16,185,129,0.1);color:var(--success)"><i class="ph ph-video-camera"></i></div>
        <div class="an-stat-info">
          <div class="an-stat-num" data-target="${data.meetings_attended}">0</div>
          <div class="an-stat-label">Meetings</div>
        </div>
      </div>
      <div class="an-stat-card">
        <div class="an-stat-icon" style="background:rgba(124,58,237,0.1);color:var(--primary-500)"><i class="ph ph-folder-open"></i></div>
        <div class="an-stat-info">
          <div class="an-stat-num" data-target="${data.active_projects || 0}">0</div>
          <div class="an-stat-label">Projects</div>
        </div>
      </div>
      <div class="an-stat-card an-score-card">
        <div class="an-score-ring">
          <svg viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--gray-100)" stroke-width="6"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke="${scoreColor}" stroke-width="6"
              stroke-dasharray="${2 * Math.PI * 34}" stroke-dashoffset="${2 * Math.PI * 34 * (1 - score/100)}"
              stroke-linecap="round" transform="rotate(-90 40 40)" class="score-ring-fill"/>
          </svg>
          <div class="an-score-val" style="color:${scoreColor}">${score}%</div>
        </div>
        <div class="an-stat-label" style="text-align:center;margin-top:4px">Productivity</div>
      </div>
    </div>

    <!-- BENTO GRID -->
    <div class="an-bento animate-fade-in" style="animation-delay:.1s">
      <!-- Tasks Overview — spans 2 cols -->
      <div class="an-chart-card an-bento-wide">
        <div class="an-chart-header">
          <h4><i class="ph ph-chart-bar"></i> Tasks Overview</h4>
          <span class="an-badge">${period}</span>
        </div>
        <canvas id="chart-tasks"></canvas>
      </div>
      <!-- Productivity Trend -->
      <div class="an-chart-card">
        <div class="an-chart-header">
          <h4><i class="ph ph-chart-line-up"></i> Productivity Trend</h4>
          <span class="an-badge" style="background:rgba(16,185,129,0.1);color:var(--success)">Score %</span>
        </div>
        <canvas id="chart-productivity"></canvas>
      </div>
      <!-- Task Distribution -->
      <div class="an-chart-card">
        <div class="an-chart-header">
          <h4><i class="ph ph-chart-donut"></i> Task Distribution</h4>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px">
          <div style="width:150px;height:150px"><canvas id="chart-pie"></canvas></div>
          <div class="an-pie-legend an-pie-legend-row">
            <div class="an-pie-item"><span class="an-pie-dot" style="background:#10B981"></span> Done <strong>${data.tasks_completed}</strong></div>
            <div class="an-pie-item"><span class="an-pie-dot" style="background:#3B82F6"></span> In Progress <strong>${data.tasks_in_progress}</strong></div>
            <div class="an-pie-item"><span class="an-pie-dot" style="background:#9CA3AF"></span> Todo <strong>${data.tasks_todo}</strong></div>
            <div class="an-pie-item"><span class="an-pie-dot" style="background:#EF4444"></span> Overdue <strong>${data.tasks_missed}</strong></div>
          </div>
        </div>
      </div>
      <!-- Priority Breakdown -->
      <div class="an-chart-card">
        <div class="an-chart-header">
          <h4><i class="ph ph-flag-banner"></i> Priority Breakdown</h4>
        </div>
        <div class="an-priority-bars">
          ${['Critical','High','Medium','Low'].map(p => {
            const count = pri[p] || 0;
            const total = data.tasks_total || 1;
            const pct = Math.round(count / total * 100);
            const color = p==='Critical'?'#EF4444':p==='High'?'#F97316':p==='Medium'?'#3B82F6':'#10B981';
            return `<div class="an-pri-row">
              <div class="an-pri-label"><span class="an-pri-dot" style="background:${color}"></span>${p}</div>
              <div class="an-pri-bar-bg"><div class="an-pri-bar-fill" style="width:${pct}%;background:${color}"></div></div>
              <div class="an-pri-count">${count} <span>(${pct}%)</span></div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <!-- Project Progress — spans full width -->
      ${Object.keys(projProgress).length ? `
      <div class="an-chart-card an-bento-full">
        <div class="an-chart-header">
          <h4><i class="ph ph-kanban"></i> Project Progress</h4>
          <span class="an-badge">${Object.keys(projProgress).length} projects</span>
        </div>
        <div class="an-proj-bars">
          ${Object.entries(projProgress).map(([name, prog]) => `
            <div class="an-proj-row">
              <div class="an-proj-name">${escapeHtml(name)}</div>
              <div class="an-proj-bar-bg"><div class="an-proj-bar-fill" style="width:${prog}%;background:linear-gradient(90deg,var(--primary-400),var(--accent-400))"></div></div>
              <div class="an-proj-pct" style="color:${prog >= 80 ? 'var(--success)' : prog >= 40 ? '#F97316' : 'var(--gray-400)'}">${prog}%</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    </div>

    <!-- AI Insights — separate card below bento -->
    <div class="an-insights-card animate-fade-in" style="animation-delay:.3s">
      <div class="an-chart-header" style="margin-bottom:16px">
        <h4><i class="ph ph-robot"></i> AI Insights & Recommendations</h4>
        <span class="an-badge" style="background:linear-gradient(135deg,var(--primary-50),var(--accent-50));color:var(--primary-500)">Smart Analysis</span>
      </div>
      <div class="an-insights-grid">
        ${(data.ai_insights||[]).map(ins => {
          const i = typeof ins === 'string' ? { icon: '💡', text: ins, type: 'info' } : ins;
          const typeColor = i.type==='success'?'var(--success)':i.type==='warning'?'#F97316':i.type==='danger'?'var(--error)':i.type==='tip'?'var(--primary-500)':'#3B82F6';
          const typeBg = i.type==='success'?'rgba(16,185,129,0.06)':i.type==='warning'?'rgba(249,115,22,0.06)':i.type==='danger'?'rgba(239,68,68,0.06)':i.type==='tip'?'rgba(124,58,237,0.06)':'rgba(59,130,246,0.06)';
          return `<div class="an-insight-chip" style="border-left:3px solid ${typeColor};background:${typeBg}">
            <span class="an-insight-icon">${i.icon}</span>
            <div class="an-insight-body">
              <span class="an-insight-text">${escapeHtml(i.text)}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;

  // Animate counters
  animateCounters();
  // Render charts
  renderAnalyticsCharts(data);
}

function animateCounters() {
  document.querySelectorAll('.an-stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target) || 0;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(interval);
    }, 30);
  });
}

function renderAnalyticsCharts(data) {
  const cd = data.chart_data;
  if (!cd || !window.Chart) return;

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#94A3B8';

  // Tasks bar chart with gradient
  const ctx1 = document.getElementById('chart-tasks');
  if (ctx1) {
    const gradient1 = ctx1.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradient1.addColorStop(0, 'rgba(124,58,237,0.8)');
    gradient1.addColorStop(1, 'rgba(124,58,237,0.2)');
    const gradientMissed = ctx1.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradientMissed.addColorStop(0, 'rgba(239,68,68,0.7)');
    gradientMissed.addColorStop(1, 'rgba(239,68,68,0.15)');

    const c1 = new Chart(ctx1, {
      type: 'bar', data: {
        labels: cd.labels,
        datasets: [
          { label: 'Completed', data: cd.tasks_completed, backgroundColor: gradient1, borderRadius: 8, borderSkipped: false },
          ...(cd.tasks_missed ? [{ label: 'Missed', data: cd.tasks_missed, backgroundColor: gradientMissed, borderRadius: 8, borderSkipped: false }] : [])
        ]
      }, options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'rectRounded', padding: 16 } } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }
      }
    });
    _analyticsCharts.push(c1);
  }

  // Productivity line chart with gradient fill
  const ctx2 = document.getElementById('chart-productivity');
  if (ctx2 && cd.productivity_score) {
    const gradient2 = ctx2.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradient2.addColorStop(0, 'rgba(16,185,129,0.3)');
    gradient2.addColorStop(1, 'rgba(16,185,129,0.01)');

    const c2 = new Chart(ctx2, {
      type: 'line', data: {
        labels: cd.labels,
        datasets: [{
          label: 'Score', data: cd.productivity_score,
          borderColor: '#10B981', backgroundColor: gradient2, fill: true,
          tension: 0.4, pointRadius: 4, pointBackgroundColor: '#10B981',
          pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 7,
        }]
      }, options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeOutQuart' },
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } }
      }
    });
    _analyticsCharts.push(c2);
  }

  // Doughnut chart
  const ctx3 = document.getElementById('chart-pie');
  if (ctx3) {
    const c3 = new Chart(ctx3, {
      type: 'doughnut', data: {
        labels: ['Completed', 'In Progress', 'Todo', 'Overdue'],
        datasets: [{
          data: [data.tasks_completed, data.tasks_in_progress, data.tasks_todo, data.tasks_missed],
          backgroundColor: ['#10B981', '#3B82F6', '#9CA3AF', '#EF4444'],
          borderWidth: 0, hoverOffset: 8,
        }]
      }, options: {
        responsive: true, maintainAspectRatio: true,
        animation: { duration: 1200, animateRotate: true },
        cutout: '65%',
        plugins: { legend: { display: false } }
      }
    });
    _analyticsCharts.push(c3);
  }
}
