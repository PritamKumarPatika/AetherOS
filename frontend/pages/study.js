// AetherOS — Study Hub V4 (Gamified Learning Platform)
let _studyTab = 'subjects';
let _studySubjects = [];
let _allTopics = [];
let _studyProfile = {};

function safeArr(v) { return Array.isArray(v) ? v : []; }

async function renderStudyPage() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="study-page">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2><i class="ph ph-graduation-cap"></i> Study Hub</h2>
        <div style="display:flex;align-items:center;gap:10px">
          <div id="xp-bar-mini"></div>
          <button class="btn btn-primary" id="study-main-action" style="display:none"></button>
        </div>
      </div>
      <div class="st-stats-row" id="study-stats"><div class="loading-shimmer" style="height:60px;border-radius:12px;grid-column:1/-1"></div></div>
      <div class="st-tabs">
        <button class="st-tab active" data-tab="subjects"><i class="ph ph-books"></i> Subjects</button>
        <button class="st-tab" data-tab="topics"><i class="ph ph-list-checks"></i> Topics</button>
        <button class="st-tab" data-tab="notes"><i class="ph ph-note-pencil"></i> Notes</button>
        <button class="st-tab" data-tab="goals"><i class="ph ph-target"></i> Goals</button>
        <button class="st-tab" data-tab="paths"><i class="ph ph-path"></i> Paths</button>
        <button class="st-tab" data-tab="streaks"><i class="ph ph-fire"></i> Streaks</button>
        <button class="st-tab" data-tab="achievements"><i class="ph ph-trophy"></i> Achievements</button>
      </div>
      <div id="study-tab-content"><div class="loading-shimmer" style="height:200px;border-radius:12px"></div></div>
    </div>`;
  document.querySelectorAll('.st-tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.st-tab').forEach(b => b.classList.remove('active'));
    t.classList.add('active'); _studyTab = t.dataset.tab; renderStudyTab();
  }));
  await loadStudyStats();
  renderStudyTab();
}

async function loadStudyStats() {
  try {
    const [subjs, goals, streaks, profile] = await Promise.all([API.getSubjects(), API.getGoals(), API.getStreaks(), API.getStudyProfile()]);
    _studySubjects = safeArr(subjs); _studyProfile = profile || {};
    _allTopics = (await Promise.all(_studySubjects.map(s => API.getTopics(s._id).then(safeArr)))).flat();
    const done = _allTopics.filter(t => t.status === 'Completed').length;
    const el = document.getElementById('study-stats');
    if (!el) return;
    const g = safeArr(goals);
    el.innerHTML = `
      <div class="st-stat-card"><div class="st-stat-icon" style="background:var(--primary-50);color:var(--primary-500)"><i class="ph ph-books"></i></div><div><div class="st-stat-num" data-target="${_studySubjects.length}">0</div><div class="st-stat-label">Subjects</div></div></div>
      <div class="st-stat-card"><div class="st-stat-icon" style="background:rgba(59,130,246,.1);color:#3B82F6"><i class="ph ph-list-checks"></i></div><div><div class="st-stat-num" data-target="${_allTopics.length}">0</div><div class="st-stat-label">Topics</div></div></div>
      <div class="st-stat-card"><div class="st-stat-icon" style="background:rgba(16,185,129,.1);color:var(--success)"><i class="ph ph-check-circle"></i></div><div><div class="st-stat-num" data-target="${done}">0</div><div class="st-stat-label">Completed</div></div></div>
      <div class="st-stat-card"><div class="st-stat-icon" style="background:rgba(249,115,22,.1);color:#F97316"><i class="ph ph-target"></i></div><div><div class="st-stat-num" data-target="${g.length}">0</div><div class="st-stat-label">Goals</div></div></div>
      <div class="st-stat-card st-stat-xp"><div class="st-stat-icon" style="background:rgba(139,92,246,.1);color:#8B5CF6"><i class="ph ph-lightning"></i></div><div><div class="st-stat-num" data-target="${_studyProfile.total_xp||0}">0</div><div class="st-stat-label">XP · Lvl ${_studyProfile.study_level||1}</div></div></div>`;
    el.querySelectorAll('.st-stat-num').forEach(n => {
      const target = parseInt(n.dataset.target)||0; let cur = 0;
      const step = Math.max(1, Math.ceil(target/40));
      const t = setInterval(() => { cur = Math.min(cur+step, target); n.textContent = cur; if (cur>=target) clearInterval(t); }, 30);
    });
    // Mini XP bar
    const xpBar = document.getElementById('xp-bar-mini');
    if (xpBar) { const pct = Math.round(((_studyProfile.total_xp||0)%500)/5); xpBar.innerHTML = `<div class="st-xp-mini"><span class="st-xp-lvl">Lvl ${_studyProfile.study_level||1}</span><div class="st-xp-track"><div class="st-xp-fill" style="width:${pct}%"></div></div><span class="st-xp-val">${_studyProfile.total_xp||0} XP</span></div>`; }
  } catch(e) { console.error('Stats error:', e); }
}

async function renderStudyTab() {
  const c = document.getElementById('study-tab-content');
  const btn = document.getElementById('study-main-action');
  if (!c) return;
  const actions = { subjects:{label:'+ Add Subject',fn:'showCreateSubjectModal()'}, topics:{label:'+ Add Topic',fn:'showCreateTopicModalGlobal()'}, notes:{label:'+ New Note',fn:'showCreateNoteModal()'}, goals:{label:'+ New Goal',fn:'showCreateGoalModal()'}, paths:{label:'+ Create Path',fn:'showCreatePathModal()'}, streaks:{label:'⏱ Log Time',fn:'showLogTimeModal()'}, achievements:{label:'',fn:''} };
  const a = actions[_studyTab]||actions.subjects;
  if (a.label) { btn.style.display='inline-flex'; btn.innerHTML=a.label; btn.setAttribute('onclick',a.fn); } else { btn.style.display='none'; }
  c.innerHTML = '<div class="loading-shimmer" style="height:300px;border-radius:12px"></div>';
  try {
    if (_studyTab==='subjects') await renderSubjectsTab(c);
    else if (_studyTab==='topics') await renderTopicsTab(c);
    else if (_studyTab==='notes') await renderNotesTab(c);
    else if (_studyTab==='goals') await renderGoalsTab(c);
    else if (_studyTab==='paths') await renderPathsTab(c);
    else if (_studyTab==='streaks') await renderStreaksTab(c);
    else if (_studyTab==='achievements') await renderAchievementsTab(c);
  } catch(e) { c.innerHTML = `<div class="empty-state"><i class="ph ph-warning" style="font-size:2rem;color:var(--error)"></i><h3>Something went wrong</h3><p>${escapeHtml(e.message||'Unknown error')}</p><button class="btn btn-primary" onclick="renderStudyTab()">Retry</button></div>`; console.error(e); }
}

// ======================== SUBJECTS TAB ========================
async function renderSubjectsTab(container) {
  const subjects = safeArr(await API.getSubjects());
  _studySubjects = subjects;
  if (!subjects.length) { container.innerHTML = `<div class="empty-state"><i class="ph ph-books" style="font-size:2.5rem;color:var(--gray-300)"></i><h3>No subjects yet</h3><p>Create your first subject to start organizing your study material</p><button class="btn btn-primary" onclick="showCreateSubjectModal()">+ Add Subject</button></div>`; return; }
  let html = '<div class="st-subject-grid">';
  for (const s of subjects) {
    const topics = safeArr(await API.getTopics(s._id));
    const done = topics.filter(t=>t.status==='Completed').length;
    const inProg = topics.filter(t=>t.status==='In Progress').length;
    const pct = topics.length ? Math.round(done/topics.length*100) : 0;
    html += `<div class="st-subj-card animate-fade-in"><div class="st-subj-color-strip" style="background:${s.color||'var(--primary-400)'}"></div><div class="st-subj-body">
      <div class="st-subj-top"><div class="st-subj-icon" style="background:${s.color||'var(--primary-400)'}22;color:${s.color||'var(--primary-400)'}"><i class="ph ph-books"></i></div>
        <div class="st-subj-title-block"><div class="st-subj-name">${escapeHtml(s.name)}</div>${s.description?`<div class="st-subj-desc">${escapeHtml(s.description)}</div>`:''}</div>
        <div class="st-subj-acts"><button class="btn-icon" onclick="showEditSubjectModal('${s._id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button><button class="btn-icon" onclick="confirmDeleteSubject('${s._id}')" title="Delete" style="color:var(--error)"><i class="ph ph-trash"></i></button></div></div>
      <div class="st-subj-chips-row"><span class="st-chip"><i class="ph ph-calendar-blank"></i> ${s.exam_date?formatDate(s.exam_date):'No exam'}</span><span class="st-chip"><i class="ph ph-list-checks"></i> ${done}/${topics.length} done</span>${inProg?`<span class="st-chip st-chip-blue"><i class="ph ph-circle-notch"></i> ${inProg} active</span>`:''}</div>
      <div class="st-subj-progress-row"><div class="st-prog-bar"><div class="st-prog-fill" style="width:${pct}%;background:${s.color||'var(--primary-400)'}"></div></div><span class="st-prog-pct">${pct}%</span></div>
      <div class="st-subj-topics-bar"><span class="st-topics-label">Topics</span><button class="btn btn-sm btn-outline" onclick="showAddTopicModal('${s._id}')"><i class="ph ph-plus"></i> Add</button></div>
      <div class="st-topics-chip-list">${topics.length?topics.map(t=>`<div class="st-tc-chip" onclick="showTopicDetailModal('${t._id}','${s._id}')"><span class="st-tc-dot" style="background:${t.status==='Completed'?'var(--success)':t.status==='In Progress'?'#3B82F6':'var(--gray-300)'}"></span><span class="st-tc-label">${escapeHtml(t.name)}</span></div>`).join(''):'<span class="st-tc-empty">No topics yet</span>'}</div>
    </div></div>`;
  }
  html += '</div>'; container.innerHTML = html;
}

// ======================== TOPICS TAB V2 (Cascading + SubTopics + Notes) ========================
let _expandedTopics = {};

async function renderTopicsTab(container) {
  if (!_studySubjects.length) { container.innerHTML = `<div class="empty-state"><i class="ph ph-list-checks" style="font-size:2.5rem;color:var(--gray-300)"></i><h3>No subjects yet</h3><p>Create a subject first, then add topics to it</p><button class="btn btn-primary" onclick="document.querySelector('[data-tab=subjects]').click()"><i class="ph ph-books"></i> Go to Subjects</button></div>`; return; }
  const allTopics = (await Promise.all(_studySubjects.map(s=>API.getTopics(s._id).then(ts=>safeArr(ts).map(t=>({...t,_sn:s.name,_sc:s.color||'var(--primary-400)',_sid:s._id})))))).flat();
  _allTopics = allTopics;
  const ns=allTopics.filter(t=>t.status==='Not Started').length, ip=allTopics.filter(t=>t.status==='In Progress').length, dn=allTopics.filter(t=>t.status==='Completed').length;
  const totalSub = allTopics.reduce((a,t)=>(a+(safeArr(t.subtopics).length)),0);
  container.innerHTML = `
    <div class="tp-overview-row">
      <div class="tp-ov-card"><div class="tp-ov-icon" style="background:rgba(107,114,128,.08);color:var(--gray-500)"><i class="ph ph-circle"></i></div><div class="tp-ov-val">${ns}</div><div class="tp-ov-label">Not Started</div></div>
      <div class="tp-ov-card"><div class="tp-ov-icon" style="background:rgba(59,130,246,.08);color:#3B82F6"><i class="ph ph-circle-half"></i></div><div class="tp-ov-val">${ip}</div><div class="tp-ov-label">In Progress</div></div>
      <div class="tp-ov-card"><div class="tp-ov-icon" style="background:rgba(16,185,129,.08);color:var(--success)"><i class="ph-fill ph-check-circle"></i></div><div class="tp-ov-val">${dn}</div><div class="tp-ov-label">Completed</div></div>
      <div class="tp-ov-card"><div class="tp-ov-icon" style="background:rgba(249,115,22,.08);color:#F97316"><i class="ph ph-tree-structure"></i></div><div class="tp-ov-val">${totalSub}</div><div class="tp-ov-label">Sub-topics</div></div>
    </div>
    <div class="tp-filter-bar">
      <div class="tp-filter-pills" id="tp-status-pills">
        <button class="tp-pill active" data-val="" onclick="setTopicFilter('status','',this)">All <span class="tp-pill-count">${allTopics.length}</span></button>
        <button class="tp-pill" data-val="Not Started" onclick="setTopicFilter('status','Not Started',this)"><span class="tp-pill-dot" style="background:var(--gray-400)"></span>Not Started <span class="tp-pill-count">${ns}</span></button>
        <button class="tp-pill" data-val="In Progress" onclick="setTopicFilter('status','In Progress',this)"><span class="tp-pill-dot" style="background:#3B82F6"></span>In Progress <span class="tp-pill-count">${ip}</span></button>
        <button class="tp-pill" data-val="Completed" onclick="setTopicFilter('status','Completed',this)"><span class="tp-pill-dot" style="background:var(--success)"></span>Completed <span class="tp-pill-count">${dn}</span></button>
      </div>
      <div class="tp-filter-right">
        <select id="tf-subj" onchange="filterTopics()" class="tp-select"><option value="">All Subjects</option>${_studySubjects.map(s=>`<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('')}</select>
        <div class="tp-search-wrap"><i class="ph ph-magnifying-glass"></i><input id="tf-q" oninput="filterTopics()" class="tp-search" placeholder="Search topics..."></div>
      </div>
    </div>
    <div id="topics-grid-wrap"></div>`;
  window._topicStatusFilter = '';
  renderTopicsCascade(allTopics);
}

function setTopicFilter(type, val, btn) {
  if (type === 'status') { window._topicStatusFilter = val; document.querySelectorAll('#tp-status-pills .tp-pill').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
  filterTopics();
}
function filterTopics() {
  const sid=document.getElementById('tf-subj')?.value||'', q=(document.getElementById('tf-q')?.value||'').toLowerCase();
  const st = window._topicStatusFilter || '';
  let f=_allTopics;
  if(sid)f=f.filter(t=>String(t.subject_id)===sid||t._sid===sid);
  if(st)f=f.filter(t=>t.status===st);
  if(q)f=f.filter(t=>t.name.toLowerCase().includes(q)||(t.description||'').toLowerCase().includes(q));
  renderTopicsCascade(f);
}

function renderTopicsCascade(topics) {
  const w = document.getElementById('topics-grid-wrap'); if (!w) return;
  if (!topics.length) { w.innerHTML = `<div class="tp-empty-state"><div class="tp-empty-icon"><i class="ph ph-folder-notch-open" style="font-size:2.5rem;color:var(--gray-300)"></i></div><h3>No topics found</h3><p>No topics match your filters. Create a new topic to get started.</p><button class="btn btn-primary" onclick="showCreateTopicModalGlobal()"><i class="ph ph-plus"></i> Add Topic</button></div>`; return; }
  w.innerHTML = `<div class="tpc-list">${topics.map((t,i)=>{
    const subs = safeArr(t.subtopics);
    const sc = t.status==='Completed'?'var(--success)':t.status==='In Progress'?'#3B82F6':'var(--gray-400)';
    const isOpen = _expandedTopics[t._id];
    const notePreview = stripHtml(t.notes_content||'').substring(0,80);
    const descPrev = (t.description||'').substring(0,120);
    return `<div class="tpc-item animate-fade-in" style="animation-delay:${i*0.03}s">
      <div class="tpc-parent" onclick="toggleTopicExpand('${t._id}')">
        <div class="tpc-expand-icon ${isOpen?'open':''}"><i class="ph ph-caret-right"></i></div>
        <div class="tpc-status-dot" style="background:${sc}"></div>
        <div class="tpc-main">
          <div class="tpc-title-row">
            <span class="tpc-name">${escapeHtml(t.name)}</span>
            <span class="tpc-subj-badge">${escapeHtml(t._sn||'')}</span>
            <span class="tpc-diff-pill tpc-diff-${(t.difficulty||'Medium').toLowerCase()}">${t.difficulty||'Medium'}</span>
            ${subs.length?`<span class="tpc-sub-count"><i class="ph ph-tree-structure"></i> ${subs.length}</span>`:''}
            ${notePreview?`<span class="tpc-note-indicator"><i class="ph ph-note"></i></span>`:''}
          </div>
          ${descPrev?`<div class="tpc-desc">${escapeHtml(descPrev)}${(t.description||'').length>120?'...':''}</div>`:''}
          ${notePreview?`<div class="tpc-note-preview"><i class="ph ph-quotes"></i> ${escapeHtml(notePreview)}${stripHtml(t.notes_content||'').length>80?'...':''}</div>`:''}
        </div>
        <div class="tpc-actions" onclick="event.stopPropagation()">
          <button class="btn-icon btn-icon-sm" onclick="openTopicNoteEditor('${t._id}')" title="Notes"><i class="ph ph-note-pencil"></i></button>
          <button class="btn-icon btn-icon-sm" onclick="showEditTopicModal('${t._id}','${t._sid||t.subject_id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
          <button class="btn-icon btn-icon-sm" onclick="confirmDeleteTopic('${t._id}')" title="Delete" style="color:var(--error)"><i class="ph ph-trash"></i></button>
        </div>
      </div>
      <div class="tpc-children ${isOpen?'open':''}" id="tpc-ch-${t._id}">
        <div class="tpc-sub-list">
          ${subs.map(s=>{
            const ssc = s.status==='Completed'?'var(--success)':s.status==='In Progress'?'#3B82F6':'var(--gray-400)';
            const snp = stripHtml(s.notes_content||'').substring(0,60);
            return `<div class="tpc-sub-card">
              <div class="tpc-sub-dot" style="background:${ssc}"></div>
              <div class="tpc-sub-main">
                <div class="tpc-sub-title">${escapeHtml(s.name)}</div>
                ${s.description?`<div class="tpc-sub-desc">${escapeHtml((s.description||'').substring(0,80))}</div>`:''}
                ${snp?`<div class="tpc-note-preview" style="font-size:.7rem"><i class="ph ph-quotes"></i> ${escapeHtml(snp)}</div>`:''}
                <div class="tpc-sub-meta">
                  <button class="tpc-sub-status" style="--sc:${ssc}" onclick="cycleSubSt('${t._id}','${s.id}','${s.status}')">${s.status}</button>
                  <span class="tpc-diff-pill tpc-diff-${(s.difficulty||'Medium').toLowerCase()}" style="font-size:.6rem">${s.difficulty||'Medium'}</span>
                </div>
              </div>
              <div class="tpc-sub-acts">
                <button class="btn-icon btn-icon-sm" onclick="openSubNoteEditor('${t._id}','${s.id}')" title="Notes"><i class="ph ph-note-pencil"></i></button>
                <button class="btn-icon btn-icon-sm" onclick="editSubtopicModal('${t._id}','${s.id}')" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                <button class="btn-icon btn-icon-sm" onclick="deleteSubtopic('${t._id}','${s.id}')" title="Delete" style="color:var(--error)"><i class="ph ph-trash"></i></button>
              </div>
            </div>`;
          }).join('')}
        </div>
        <button class="tpc-add-sub-btn" onclick="event.stopPropagation();showInlineSubForm('${t._id}')"><i class="ph ph-plus"></i> Add Sub-topic</button>
        <div class="tpc-inline-form" id="tpc-isf-${t._id}" style="display:none">
          <input class="form-input" id="isf-name-${t._id}" placeholder="Sub-topic name...">
          <input class="form-input" id="isf-desc-${t._id}" placeholder="Description (optional)" style="font-size:.75rem">
          <div style="display:flex;gap:6px;margin-top:6px">
            <button class="btn btn-primary btn-sm" onclick="doAddSubtopic('${t._id}')"><i class="ph ph-plus"></i> Add</button>
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('tpc-isf-${t._id}').style.display='none'">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function stripHtml(html) { const d=document.createElement('div'); d.innerHTML=html||''; return d.textContent||d.innerText||''; }

function toggleTopicExpand(tid) {
  _expandedTopics[tid] = !_expandedTopics[tid];
  const ch = document.getElementById('tpc-ch-'+tid);
  const icon = ch?.previousElementSibling?.querySelector('.tpc-expand-icon');
  if (ch) ch.classList.toggle('open');
  if (icon) icon.classList.toggle('open');
}

function showInlineSubForm(tid) {
  if (!_expandedTopics[tid]) toggleTopicExpand(tid);
  const f = document.getElementById('tpc-isf-'+tid);
  if (f) { f.style.display='block'; document.getElementById('isf-name-'+tid)?.focus(); }
}

async function doAddSubtopic(tid) {
  const n = document.getElementById('isf-name-'+tid)?.value.trim();
  if (!n) { showToast('Name required','error'); return; }
  const desc = document.getElementById('isf-desc-'+tid)?.value||'';
  await API.addSubtopic(tid, {name:n, description:desc});
  showToast('Sub-topic added ✓'); await API.awardXP(3,'subtopic_created');
  renderStudyTab(); loadStudyStats();
}

async function cycleSubSt(tid, sid, cur) {
  const next=cur==='Not Started'?'In Progress':cur==='In Progress'?'Completed':'Not Started';
  await API.updateSubtopic(tid, sid, {status:next});
  if(next==='Completed'){await API.awardXP(15,'subtopic_completed');showToast('🎉 Sub-topic completed!');}else showToast(`Sub-topic → ${next}`);
  renderStudyTab(); loadStudyStats();
}

async function editSubtopicModal(tid, sid) {
  const topic = _allTopics.find(t=>t._id===tid);
  const sub = safeArr(topic?.subtopics).find(s=>s.id===sid);
  if (!sub) return;
  showModal('<i class="ph ph-pencil-simple"></i> Edit Sub-topic',`
    <div class="form-group"><label>Name *</label><input id="es-name" class="form-input" value="${escapeHtml(sub.name)}"></div>
    <div class="form-group"><label>Description</label><textarea id="es-desc" class="form-input" rows="2">${escapeHtml(sub.description||'')}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="es-st" class="form-input">${['Not Started','In Progress','Completed'].map(s=>`<option${sub.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label>Difficulty</label><select id="es-diff" class="form-input">${['Easy','Medium','Hard'].map(d=>`<option${sub.difficulty===d?' selected':''}>${d}</option>`).join('')}</select></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doEditSubtopic('${tid}','${sid}')"><i class="ph ph-floppy-disk"></i> Save</button>`);
}
async function doEditSubtopic(tid, sid) {
  const n=document.getElementById('es-name')?.value.trim(); if(!n){showToast('Name required','error');return;}
  await API.updateSubtopic(tid, sid, {name:n, description:document.getElementById('es-desc')?.value||'', status:document.getElementById('es-st')?.value, difficulty:document.getElementById('es-diff')?.value});
  closeModal(); showToast('Sub-topic updated ✓'); renderStudyTab(); loadStudyStats();
}
async function deleteSubtopic(tid, sid) {
  if (!confirm('Delete this sub-topic?')) return;
  await API.deleteSubtopic(tid, sid); showToast('Sub-topic deleted'); renderStudyTab(); loadStudyStats();
}

// ---- Rich Note Editor ----
function buildNoteEditor(contentHtml, saveCallback) {
  const editorId = 'rne-'+Date.now();
  return `<div class="rne-wrap">
    <div class="rne-toolbar">
      <button type="button" onclick="rneCmd('bold')" title="Bold"><i class="ph-bold ph-text-b"></i></button>
      <button type="button" onclick="rneCmd('italic')" title="Italic"><i class="ph-bold ph-text-italic"></i></button>
      <button type="button" onclick="rneCmd('underline')" title="Underline"><i class="ph-bold ph-text-underline"></i></button>
      <span class="rne-sep"></span>
      <button type="button" onclick="rneCmd('formatBlock','H2')" title="Heading"><i class="ph-bold ph-text-h-two"></i></button>
      <button type="button" onclick="rneCmd('formatBlock','H3')" title="Subheading"><i class="ph-bold ph-text-h-three"></i></button>
      <span class="rne-sep"></span>
      <button type="button" onclick="rneCmd('insertUnorderedList')" title="Bullet List"><i class="ph-bold ph-list-bullets"></i></button>
      <button type="button" onclick="rneCmd('insertOrderedList')" title="Numbered List"><i class="ph-bold ph-list-numbers"></i></button>
      <span class="rne-sep"></span>
      <button type="button" onclick="rneInsertCode()" title="Code"><i class="ph-bold ph-code"></i></button>
      <button type="button" onclick="rneInsertLink()" title="Link"><i class="ph-bold ph-link"></i></button>
      <button type="button" onclick="rneCmd('hiliteColor','#FEFCBF')" title="Highlight"><i class="ph-bold ph-highlighter-circle"></i></button>
    </div>
    <div class="rne-editor" id="${editorId}" contenteditable="true" data-save-fn="${saveCallback}">${contentHtml||'<p>Start writing your notes...</p>'}</div>
  </div>`;
}
function rneCmd(cmd, val) { document.execCommand(cmd, false, val||null); }
function rneInsertCode() { document.execCommand('insertHTML',false,'<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:.85em">code</code> '); }
function rneInsertLink() { const url=prompt('Enter URL:'); if(url) document.execCommand('createLink',false,url); }

function openTopicNoteEditor(tid) {
  const topic = _allTopics.find(t=>t._id===tid);
  if (!topic) return;
  const editor = buildNoteEditor(topic.notes_content||'', `saveTopicNote_${tid}`);
  showModal(`<i class="ph ph-note-pencil"></i> Notes — ${escapeHtml(topic.name)}`,`
    <div class="rne-container">${editor}</div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNoteFromEditor('${tid}','topic')"><i class="ph ph-floppy-disk"></i> Save Notes</button>`);
}

function openSubNoteEditor(tid, sid) {
  const topic = _allTopics.find(t=>t._id===tid);
  const sub = safeArr(topic?.subtopics).find(s=>s.id===sid);
  if (!sub) return;
  const editor = buildNoteEditor(sub.notes_content||'', `saveSubNote_${tid}_${sid}`);
  showModal(`<i class="ph ph-note-pencil"></i> Notes — ${escapeHtml(sub.name)}`,`
    <div class="rne-container">${editor}</div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNoteFromEditor('${tid}','sub','${sid}')"><i class="ph ph-floppy-disk"></i> Save Notes</button>`);
}

async function saveNoteFromEditor(tid, type, sid) {
  const editors = document.querySelectorAll('.rne-editor');
  const editor = editors[editors.length-1];
  if (!editor) return;
  const html = editor.innerHTML;
  if (type==='topic') { await API.saveTopicNotes(tid, html); }
  else { await API.updateSubtopic(tid, sid, {notes_content:html}); }
  closeModal(); showToast('Notes saved ✓'); renderStudyTab();
}

function viewTopicNote(tid) {
  const topic = _allTopics.find(t=>t._id===tid);
  if (!topic||!topic.notes_content) return;
  showModal(`<i class="ph ph-note"></i> ${escapeHtml(topic.name)} — Notes`,`
    <div class="rne-view">${topic.notes_content}</div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline" onclick="closeModal();openTopicNoteEditor('${tid}')"><i class="ph ph-pencil-simple"></i> Edit</button>`);
}

// ---- Topic CRUD Modals ----
async function cycleTopicSt(tid, cur, btn) {
  const next = cur==='Not Started'?'In Progress':cur==='In Progress'?'Completed':'Not Started';
  const res = await API.updateTopic(tid, { status: next });
  if (res && res.error) return;
  if(next==='Completed'){await API.awardXP(25,'topic_completed');showToast('🎉 +25 XP! Topic completed');} else showToast(`Status → ${next}`);
  renderStudyTab();loadStudyStats();
}

async function showAddTopicModal(sid) {
  const subj=_studySubjects.find(s=>s._id===sid)||{name:'Subject'};
  showModal(`<i class="ph ph-list-checks"></i> Add Topic — ${escapeHtml(subj.name)}`,`
    <div class="form-group"><label>Topic Name *</label><input id="tp-name" class="form-input" placeholder="e.g. Arrays & Sorting" autofocus></div>
    <div class="form-group"><label>Description</label><textarea id="tp-desc" class="form-input" rows="2" placeholder="What does this topic cover?"></textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="tp-status" class="form-input"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div>
      <div class="form-group"><label>Difficulty</label><select id="tp-diff" class="form-input"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div>
    </div>
    <div class="form-group"><label>Resources <span style="font-weight:400;color:var(--gray-400)">(Label | URL per line)</span></label><textarea id="tp-res" class="form-input" rows="2" placeholder="Docs | https://..."></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateTopic('${sid}')"><i class="ph ph-plus"></i> Create</button>`);
}
async function doCreateTopic(sid) {
  const n = document.getElementById('tp-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const desc = document.getElementById('tp-desc')?.value || '';
  const resStr = (document.getElementById('tp-res')?.value || '').split('\n').filter(l => l.trim()).map(l => { const [a, b] = l.split('|').map(x => x.trim()); return b ? { label: a, url: b } : { label: l.trim(), url: l.trim() }; });
  const res = await API.createTopic({ subject_id: sid, name: n, description: desc, status: document.getElementById('tp-status')?.value, difficulty: document.getElementById('tp-diff')?.value, resources: resStr });
  if (res && res.error) return;
  closeModal(); showToast('Topic created ✓'); await API.awardXP(5, 'topic_created'); renderStudyTab(); loadStudyStats();
}
function showCreateTopicModalGlobal() {
  if(!_studySubjects.length){showToast('Create a subject first','error');return;}
  showModal('<i class="ph ph-list-checks"></i> Add Topic',`
    <div class="form-group"><label>Subject *</label><select id="tp-subj" class="form-input">${_studySubjects.map(s=>`<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>Topic Name *</label><input id="tp-name" class="form-input" placeholder="Enter topic name..." autofocus></div>
    <div class="form-group"><label>Description</label><textarea id="tp-desc" class="form-input" rows="2" placeholder="What does this topic cover?"></textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="tp-status" class="form-input"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div>
      <div class="form-group"><label>Difficulty</label><select id="tp-diff" class="form-input"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div>
    </div>
    <div class="form-group"><label>Resources <span style="font-weight:400;color:var(--gray-400)">(Label | URL per line)</span></label><textarea id="tp-res" class="form-input" rows="2" placeholder="Docs | https://..."></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateTopicGlobal()"><i class="ph ph-plus"></i> Create</button>`);
}
async function doCreateTopicGlobal() {
  const sid = document.getElementById('tp-subj')?.value;
  const n = document.getElementById('tp-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const desc = document.getElementById('tp-desc')?.value || '';
  const resStr = (document.getElementById('tp-res')?.value || '').split('\n').filter(l => l.trim()).map(l => { const p = l.split('|').map(x => x.trim()); return p[1] ? { label: p[0], url: p[1] } : { label: l.trim(), url: l.trim() }; });
  const res = await API.createTopic({ subject_id: sid, name: n, description: desc, status: document.getElementById('tp-status')?.value, difficulty: document.getElementById('tp-diff')?.value, resources: resStr });
  if (res && res.error) return;
  closeModal(); showToast('Topic created ✓'); await API.awardXP(5, 'topic_created'); renderStudyTab(); loadStudyStats();
}

async function showEditTopicModal(tid,sid) {
  const h={Authorization:`Bearer ${localStorage.getItem('token')}`};
  const t=await(await fetch(`/api/study/topics/${tid}`,{headers:h})).json();
  const rt=(t.resources||[]).map(r=>`${r.label||r.url} | ${r.url}`).join('\n');
  showModal('<i class="ph ph-pencil-simple"></i> Edit Topic',`
    <div class="form-group"><label>Name *</label><input id="etp-name" class="form-input" value="${escapeHtml(t.name)}"></div>
    <div class="form-group"><label>Description</label><textarea id="etp-desc" class="form-input" rows="2">${escapeHtml(t.description||'')}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="etp-status" class="form-input">${['Not Started','In Progress','Completed'].map(s=>`<option${t.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label>Difficulty</label><select id="etp-diff" class="form-input">${['Easy','Medium','Hard'].map(d=>`<option${t.difficulty===d?' selected':''}>${d}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label>Resources <span style="font-weight:400;color:var(--gray-400)">(Label | URL per line)</span></label><textarea id="etp-res" class="form-input" rows="2">${escapeHtml(rt)}</textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doUpdateTopic('${tid}')"><i class="ph ph-floppy-disk"></i> Save</button>`);
}
async function doUpdateTopic(tid) {
  const n = document.getElementById('etp-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const desc = document.getElementById('etp-desc')?.value || '';
  const resStr = (document.getElementById('etp-res')?.value || '').split('\n').filter(l => l.trim()).map(l => { const p = l.split('|').map(x => x.trim()); return p[1] ? { label: p[0], url: p[1] } : { label: l.trim(), url: l.trim() }; });
  const res = await API.updateTopic(tid, { name: n, description: desc, status: document.getElementById('etp-status')?.value, difficulty: document.getElementById('etp-diff')?.value, resources: resStr });
  if (res && res.error) return;
  closeModal(); showToast('Topic updated ✓'); renderStudyTab(); loadStudyStats();
}
function confirmDeleteTopic(id) { showModal('Delete Topic?', '<p style="color:var(--gray-500);font-size:.85rem">Permanently delete this topic and all sub-topics?</p>', `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--error);color:#fff" onclick="doDeleteTopic('${id}')"><i class="ph ph-trash"></i> Delete</button>`); }
async function doDeleteTopic(id) {
  const res = await API.deleteTopic(id);
  if (res && res.error) return;
  closeModal(); showToast('Topic deleted'); renderStudyTab(); loadStudyStats();
}




// ======================== NOTES TAB V2 ========================
let _allNotes = [];
let _noteFilter = 'all';
let _noteSearch = '';
let _noteSort = 'recent';
let _noteSubjFilter = '';

function stripHtml(h) { const d=document.createElement('div');d.innerHTML=h;return d.textContent||d.innerText||''; }
function relativeDate(iso) {
  if (!iso) return '';
  const d=new Date(iso), now=new Date(), diff=Math.floor((now-d)/1000);
  if(diff<60)return 'Just now'; if(diff<3600)return `${Math.floor(diff/60)}m ago`;
  if(diff<86400)return `${Math.floor(diff/3600)}h ago`;
  const days=Math.floor(diff/86400);
  if(days===1)return 'Yesterday'; if(days<7)return `${days}d ago`;
  if(days<30)return `${Math.floor(days/7)}w ago`;
  return d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
}
function wordCount(s) { const t=stripHtml(s||'').trim(); return t?t.split(/\s+/).length:0; }

function getFilteredNotes() {
  let list = [..._allNotes];
  if (_noteSubjFilter) list = list.filter(n=>n.subject_id===_noteSubjFilter);
  if (_noteFilter==='pinned') list = list.filter(n=>n.is_pinned);
  if (_noteSearch) { const q=_noteSearch.toLowerCase(); list=list.filter(n=>(n.title||'').toLowerCase().includes(q)||stripHtml(n.content||'').toLowerCase().includes(q)||(n.tags||[]).some(t=>t.toLowerCase().includes(q))); }
  list.sort((a,b)=>{
    if(a.is_pinned&&!b.is_pinned)return -1; if(!a.is_pinned&&b.is_pinned)return 1;
    if(_noteSort==='recent')return new Date(b.updated_at||0)-new Date(a.updated_at||0);
    if(_noteSort==='oldest')return new Date(a.updated_at||0)-new Date(b.updated_at||0);
    if(_noteSort==='alpha')return (a.title||'').localeCompare(b.title||'');
    return 0;
  });
  return list;
}

async function renderNotesTab(container) {
  const notes = safeArr(await API.getAllNotes());
  _allNotes = notes;
  const sm = {}; _studySubjects.forEach(s=>sm[s._id]=s);
  const pinned = notes.filter(n=>n.is_pinned).length;
  const subjSet = new Set(notes.map(n=>n.subject_id).filter(Boolean));

  if (!notes.length) {
    container.innerHTML = `<div class="nt-empty"><i class="ph ph-notebook" style="font-size:3rem;color:var(--gray-300)"></i><h3>No notes yet</h3><p>Create your first study note to get started</p><button class="btn btn-primary" onclick="showCreateNoteModal()"><i class="ph ph-plus"></i> New Note</button></div>`;
    return;
  }

  let html = `<div class="nt-stats-row">
    <div class="nt-stat"><div class="nt-stat-icon" style="background:rgba(107,92,231,.08);color:var(--primary-500)"><i class="ph ph-notebook"></i></div><div class="nt-stat-val">${notes.length}</div><div class="nt-stat-label">Total Notes</div></div>
    <div class="nt-stat"><div class="nt-stat-icon" style="background:rgba(245,158,11,.08);color:#F59E0B"><i class="ph-fill ph-push-pin"></i></div><div class="nt-stat-val">${pinned}</div><div class="nt-stat-label">Pinned</div></div>
    <div class="nt-stat"><div class="nt-stat-icon" style="background:rgba(59,130,246,.08);color:#3B82F6"><i class="ph ph-books"></i></div><div class="nt-stat-val">${subjSet.size}</div><div class="nt-stat-label">Subjects</div></div>
    <div class="nt-stat"><div class="nt-stat-icon" style="background:rgba(16,185,129,.08);color:var(--success)"><i class="ph ph-text-aa"></i></div><div class="nt-stat-val">${notes.reduce((s,n)=>s+wordCount(n.content),0)}</div><div class="nt-stat-label">Total Words</div></div>
  </div>`;

  html += `<div class="nt-filter-bar">
    <div class="nt-filter-left">
      <button class="nt-pill${_noteFilter==='all'?' active':''}" onclick="_noteFilter='all';renderNoteCards()"><i class="ph ph-squares-four"></i> All <span class="nt-pill-count">${notes.length}</span></button>
      <button class="nt-pill${_noteFilter==='pinned'?' active':''}" onclick="_noteFilter='pinned';renderNoteCards()"><i class="ph-fill ph-push-pin"></i> Pinned <span class="nt-pill-count">${pinned}</span></button>
    </div>
    <div class="nt-filter-right">
      <select class="nt-select" onchange="_noteSubjFilter=this.value;renderNoteCards()">
        <option value="">All Subjects</option>
        ${_studySubjects.map(s=>`<option value="${s._id}"${_noteSubjFilter===s._id?' selected':''}>${escapeHtml(s.name)}</option>`).join('')}
      </select>
      <select class="nt-select" onchange="_noteSort=this.value;renderNoteCards()">
        <option value="recent"${_noteSort==='recent'?' selected':''}>Recent</option>
        <option value="oldest"${_noteSort==='oldest'?' selected':''}>Oldest</option>
        <option value="alpha"${_noteSort==='alpha'?' selected':''}>A-Z</option>
      </select>
      <div class="nt-search-wrap"><i class="ph ph-magnifying-glass"></i><input class="nt-search" placeholder="Search notes..." value="${escapeHtml(_noteSearch)}" oninput="_noteSearch=this.value;renderNoteCards()"></div>
    </div>
  </div>`;

  html += `<div id="nt-cards-container"></div>`;
  container.innerHTML = html;
  renderNoteCards();
}

function renderNoteCards() {
  const container = document.getElementById('nt-cards-container');
  if (!container) return;
  const sm = {}; _studySubjects.forEach(s=>sm[s._id]=s);
  const filtered = getFilteredNotes();

  if (!filtered.length) {
    container.innerHTML = `<div class="nt-empty" style="padding:40px"><i class="ph ph-magnifying-glass" style="font-size:2rem;color:var(--gray-300)"></i><h3>No notes match</h3><p>Try a different search or filter</p></div>`;
    return;
  }

  let html = '<div class="nt-grid">';
  for (const n of filtered) {
    const subj = sm[n.subject_id];
    const sc = subj ? subj.color : 'var(--gray-400)';
    const raw = stripHtml(n.content||'');
    const preview = raw.substring(0, 120) + (raw.length > 120 ? '...' : '');
    const wc = wordCount(n.content);
    const rd = relativeDate(n.updated_at);
    const tags = safeArr(n.tags);
    const isPinned = n.is_pinned;

    html += `<div class="nt-card animate-fade-in${isPinned?' nt-card-pinned':''}" onclick="showNoteViewModal('${n._id}')">
      <div class="nt-card-top">
        <div class="nt-card-dot" style="background:${sc}"></div>
        <div class="nt-card-title">${escapeHtml(n.title||'Untitled')}</div>
        <div class="nt-card-actions" onclick="event.stopPropagation()">
          <button class="btn-icon nt-pin-btn${isPinned?' nt-pinned':''}" onclick="toggleNotePin('${n._id}')" title="${isPinned?'Unpin':'Pin'}"><i class="ph${isPinned?'-fill':''} ph-push-pin"></i></button>
          <button class="btn-icon" onclick="showEditNoteModal('${n._id}')"><i class="ph ph-pencil-simple"></i></button>
          <button class="btn-icon" onclick="confirmDeleteNote('${n._id}')" style="color:var(--error)"><i class="ph ph-trash"></i></button>
        </div>
      </div>
      ${subj?`<div class="nt-card-subj" style="color:${sc}"><i class="ph ph-books"></i> ${escapeHtml(subj.name)}</div>`:''}
      <div class="nt-card-preview">${preview||'<span style="color:var(--gray-400)">Empty note</span>'}</div>
      ${tags.length?`<div class="nt-card-tags">${tags.map(t=>`<span class="nt-tag">#${escapeHtml(t)}</span>`).join('')}</div>`:''}
      <div class="nt-card-footer">
        <span class="nt-card-date"><i class="ph ph-clock"></i> ${rd}</span>
        <span class="nt-card-words"><i class="ph ph-text-aa"></i> ${wc} words</span>
      </div>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
  document.querySelectorAll('.nt-pill').forEach(p=>{
    const f=p.textContent.trim().startsWith('All')?'all':'pinned';
    p.classList.toggle('active',f===_noteFilter);
  });
}

async function toggleNotePin(nid) {
  await API.toggleNotePin(nid);
  const n = _allNotes.find(x=>x._id===nid);
  if(n) n.is_pinned = !n.is_pinned;
  showToast(n?.is_pinned ? 'Note pinned 📌' : 'Note unpinned');
  renderStudyTab();
}

// ======================== GOALS TAB V2 ========================
let _allGoals = [];
let _goalFilter = 'all';
let _goalSort = 'due';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr), now = new Date();
  now.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.ceil((d - now) / 86400000);
}

function goalDueLabel(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Tomorrow';
  if (d <= 7) return `${d}d left`;
  return new Date(dateStr).toLocaleDateString('en',{month:'short',day:'numeric'});
}

async function renderGoalsTab(container) {
  const goals = safeArr(await API.getGoals());
  _allGoals = goals;
  const sm = {}; _studySubjects.forEach(s=>sm[s._id]=s);

  if (!goals.length) {
    container.innerHTML = `<div class="gl-empty"><i class="ph ph-target" style="font-size:3rem;color:var(--gray-300)"></i><h3>No goals yet</h3><p>Set study goals and track your progress</p><button class="btn btn-primary" onclick="showCreateGoalModal()"><i class="ph ph-plus"></i> New Goal</button></div>`;
    return;
  }

  const pending = goals.filter(g=>g.status==='Pending');
  const inProg = goals.filter(g=>g.status==='In Progress');
  const completed = goals.filter(g=>g.status==='Completed');
  const overdue = goals.filter(g=>g.due_date && daysUntil(g.due_date)<0 && g.status!=='Completed');
  const pct = goals.length ? Math.round(completed.length/goals.length*100) : 0;

  // Stats row
  let html = `<div class="gl-stats-row">
    <div class="gl-stat"><div class="gl-stat-icon" style="background:rgba(107,92,231,.08);color:var(--primary-500)"><i class="ph ph-target"></i></div><div class="gl-stat-val">${goals.length}</div><div class="gl-stat-label">Total Goals</div></div>
    <div class="gl-stat"><div class="gl-stat-icon" style="background:rgba(59,130,246,.08);color:#3B82F6"><i class="ph ph-circle-half"></i></div><div class="gl-stat-val">${inProg.length}</div><div class="gl-stat-label">In Progress</div></div>
    <div class="gl-stat"><div class="gl-stat-icon" style="background:rgba(16,185,129,.08);color:var(--success)"><i class="ph-fill ph-check-circle"></i></div><div class="gl-stat-val">${pct}%</div><div class="gl-stat-label">Completed</div></div>
    <div class="gl-stat"><div class="gl-stat-icon" style="background:${overdue.length?'rgba(239,68,68,.08)':'rgba(156,163,175,.06)'};color:${overdue.length?'var(--error)':'var(--gray-400)'}"><i class="ph ph-warning"></i></div><div class="gl-stat-val">${overdue.length}</div><div class="gl-stat-label">Overdue</div></div>
  </div>`;

  // Progress bar
  html += `<div class="gl-progress-wrap">
    <div class="gl-progress-bar"><div class="gl-progress-fill" style="width:${pct}%"></div></div>
    <span class="gl-progress-label">${completed.length}/${goals.length} completed</span>
  </div>`;

  // Filter pills
  html += `<div class="gl-filter-bar">
    <div class="gl-filter-left">
      <button class="gl-pill${_goalFilter==='all'?' active':''}" onclick="_goalFilter='all';renderGoalCards()"><i class="ph ph-squares-four"></i> All <span class="gl-pill-count">${goals.length}</span></button>
      <button class="gl-pill${_goalFilter==='in_progress'?' active':''}" onclick="_goalFilter='in_progress';renderGoalCards()"><i class="ph ph-circle-half"></i> Active <span class="gl-pill-count">${inProg.length}</span></button>
      <button class="gl-pill${_goalFilter==='pending'?' active':''}" onclick="_goalFilter='pending';renderGoalCards()"><i class="ph ph-circle"></i> Pending <span class="gl-pill-count">${pending.length}</span></button>
      <button class="gl-pill${_goalFilter==='completed'?' active':''}" onclick="_goalFilter='completed';renderGoalCards()"><i class="ph-fill ph-check-circle"></i> Done <span class="gl-pill-count">${completed.length}</span></button>
      ${overdue.length?`<button class="gl-pill${_goalFilter==='overdue'?' active':''}" onclick="_goalFilter='overdue';renderGoalCards()" style="--pill-active:#EF4444"><i class="ph ph-warning"></i> Overdue <span class="gl-pill-count">${overdue.length}</span></button>`:''}
    </div>
    <div class="gl-filter-right">
      <select class="gl-select" onchange="_goalSort=this.value;renderGoalCards()">
        <option value="due"${_goalSort==='due'?' selected':''}>By Deadline</option>
        <option value="recent"${_goalSort==='recent'?' selected':''}>Recent</option>
        <option value="alpha"${_goalSort==='alpha'?' selected':''}>A-Z</option>
      </select>
    </div>
  </div>`;

  html += `<div id="gl-cards-container"></div>`;
  container.innerHTML = html;
  renderGoalCards();
}

function getFilteredGoals() {
  let list = [..._allGoals];
  if (_goalFilter==='in_progress') list = list.filter(g=>g.status==='In Progress');
  else if (_goalFilter==='pending') list = list.filter(g=>g.status==='Pending');
  else if (_goalFilter==='completed') list = list.filter(g=>g.status==='Completed');
  else if (_goalFilter==='overdue') list = list.filter(g=>g.due_date && daysUntil(g.due_date)<0 && g.status!=='Completed');

  list.sort((a,b)=>{
    // Completed always at bottom
    if(a.status==='Completed'&&b.status!=='Completed')return 1;
    if(a.status!=='Completed'&&b.status==='Completed')return -1;
    if(_goalSort==='due'){
      const da=a.due_date?new Date(a.due_date):new Date('9999');
      const db=b.due_date?new Date(b.due_date):new Date('9999');
      return da-db;
    }
    if(_goalSort==='recent')return new Date(b.created_at||0)-new Date(a.created_at||0);
    if(_goalSort==='alpha')return (a.title||'').localeCompare(b.title||'');
    return 0;
  });
  return list;
}

function renderGoalCards() {
  const container = document.getElementById('gl-cards-container');
  if (!container) return;
  const sm = {}; _studySubjects.forEach(s=>sm[s._id]=s);
  const filtered = getFilteredGoals();

  if (!filtered.length) {
    container.innerHTML = `<div class="gl-empty" style="padding:40px"><i class="ph ph-target" style="font-size:2rem;color:var(--gray-300)"></i><h3>No goals match</h3><p>Try a different filter</p></div>`;
    return;
  }

  let html = '<div class="gl-list">';
  for (const g of filtered) {
    const subj = sm[g.subject_id];
    const isOverdue = g.due_date && daysUntil(g.due_date) < 0 && g.status !== 'Completed';
    const isDone = g.status === 'Completed';
    const dueLabel = goalDueLabel(g.due_date);
    const daysLeft = daysUntil(g.due_date);
    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2 && !isDone;
    const statusIcon = isDone
      ? '<i class="ph-fill ph-check-circle" style="color:var(--success);font-size:1.5rem"></i>'
      : g.status === 'In Progress'
        ? '<i class="ph ph-circle-half" style="color:#3B82F6;font-size:1.5rem"></i>'
        : '<i class="ph ph-circle" style="color:var(--gray-300);font-size:1.5rem"></i>';

    html += `<div class="gl-card animate-fade-in${isOverdue?' gl-card-overdue':''}${isDone?' gl-card-done':''}${isUrgent?' gl-card-urgent':''}">
      <div class="gl-card-check" onclick="cycleGoalSt('${g._id}','${g.status}')">${statusIcon}</div>
      <div class="gl-card-body">
        <div class="gl-card-title${isDone?' gl-done-text':''}">${escapeHtml(g.title)}</div>
        ${g.description?`<div class="gl-card-desc">${escapeHtml(g.description)}</div>`:''}
        <div class="gl-card-meta">
          ${subj?`<span class="gl-card-badge" style="color:${subj.color};border-color:${subj.color}"><i class="ph ph-books"></i> ${escapeHtml(subj.name)}</span>`:''}
          ${g.due_date?`<span class="gl-card-badge${isOverdue?' gl-badge-overdue':''}${isUrgent?' gl-badge-urgent':''}"><i class="ph ph-calendar"></i> ${dueLabel}${isOverdue?' ⚠️':''}</span>`:''}
          <span class="gl-card-badge" style="color:${isDone?'var(--success)':g.status==='In Progress'?'#3B82F6':'var(--gray-400)'};border-color:${isDone?'var(--success)':g.status==='In Progress'?'#3B82F6':'var(--gray-200)'}">${g.status}</span>
        </div>
      </div>
      <div class="gl-card-actions">
        <button class="btn-icon" onclick="showEditGoalModal('${g._id}')"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn-icon" onclick="confirmDeleteGoal('${g._id}')" style="color:var(--error)"><i class="ph ph-trash"></i></button>
      </div>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;

  document.querySelectorAll('.gl-pill').forEach(p=>{
    const txt = p.textContent.trim();
    let f = 'all';
    if (txt.startsWith('Active')) f = 'in_progress';
    else if (txt.startsWith('Pending')) f = 'pending';
    else if (txt.startsWith('Done')) f = 'completed';
    else if (txt.startsWith('Overdue')) f = 'overdue';
    p.classList.toggle('active', f === _goalFilter);
  });
}

async function cycleGoalSt(gid, cur) {
  const next = cur==='Pending'?'In Progress':cur==='In Progress'?'Completed':'Pending';
  await API.updateGoal(gid,{status:next});
  if(next==='Completed'){await API.awardXP(50,'goal_completed');showToast('🎯 +50 XP! Goal completed');}
  else showToast(`Goal → ${next}`);
  renderStudyTab();loadStudyStats();
}
function confirmDeleteGoal(id){showModal('Delete Goal?',`<p style="color:var(--gray-500);font-size:.85rem">This will permanently delete this goal.</p>`,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--error);color:#fff" onclick="doDeleteGoal('${id}')"><i class="ph ph-trash"></i> Delete</button>`);}
async function doDeleteGoal(id){await API.deleteGoal(id);closeModal();showToast('Goal deleted');renderStudyTab();loadStudyStats();}

// ======================== LEARNING PATHS TAB V2 ========================
async function renderPathsTab(container) {
  const paths = safeArr(await API.getPaths());
  const sm = {}; _studySubjects.forEach(s=>sm[s._id]=s);

  if (!paths.length) {
    container.innerHTML = `<div class="lp-empty"><i class="ph ph-map-trifold" style="font-size:3rem;color:var(--gray-300)"></i><h3>No learning paths yet</h3><p>Create a structured learning journey with checkpoints to earn XP</p><button class="btn btn-primary" onclick="showCreatePathModal()"><i class="ph ph-plus"></i> Create Path</button></div>`;
    return;
  }

  const active = paths.filter(p=>p.status==='In Progress');
  const notStarted = paths.filter(p=>p.status==='Not Started');
  const completed = paths.filter(p=>p.status==='Completed');
  const totalXP = paths.reduce((s,p)=>s+(p.total_xp||0),0);
  const allCps = paths.reduce((s,p)=>s+safeArr(p.checkpoints).length,0);
  const doneCps = paths.reduce((s,p)=>s+safeArr(p.checkpoints).filter(c=>c.completed).length,0);

  // Stats
  let html = `<div class="lp-stats-row">
    <div class="lp-stat"><div class="lp-stat-icon" style="background:rgba(107,92,231,.08);color:var(--primary-500)"><i class="ph ph-map-trifold"></i></div><div class="lp-stat-val">${paths.length}</div><div class="lp-stat-label">Paths</div></div>
    <div class="lp-stat"><div class="lp-stat-icon" style="background:rgba(59,130,246,.08);color:#3B82F6"><i class="ph ph-flag-checkered"></i></div><div class="lp-stat-val">${doneCps}/${allCps}</div><div class="lp-stat-label">Checkpoints</div></div>
    <div class="lp-stat"><div class="lp-stat-icon" style="background:rgba(245,158,11,.08);color:#F59E0B"><i class="ph-fill ph-star"></i></div><div class="lp-stat-val">${totalXP}</div><div class="lp-stat-label">XP Earned</div></div>
    <div class="lp-stat"><div class="lp-stat-icon" style="background:rgba(16,185,129,.08);color:var(--success)"><i class="ph ph-trophy"></i></div><div class="lp-stat-val">${completed.length}</div><div class="lp-stat-label">Completed</div></div>
  </div>`;

  // Render each path as a roadmap card
  for (const p of paths) {
    const cps = safeArr(p.checkpoints);
    const dc = cps.filter(c=>c.completed).length;
    const pct = cps.length ? Math.round(dc/cps.length*100) : 0;
    const txp = cps.reduce((s,c)=>s+(c.reward_xp||50),0);
    const ni = cps.findIndex(c=>!c.completed);
    const subj = sm[p.subject_id];
    const isDone = p.status === 'Completed';
    const isActive = p.status === 'In Progress';
    const statusColor = isDone ? 'var(--success)' : isActive ? '#3B82F6' : 'var(--gray-400)';

    html += `<div class="lp-card animate-fade-in${isDone?' lp-card-done':''}">
      <div class="lp-card-header">
        <div class="lp-card-left">
          <div class="lp-card-icon" style="background:${statusColor}22;color:${statusColor}"><i class="ph ${isDone?'ph-trophy':isActive?'ph-lightning':'ph-map-pin'}"></i></div>
          <div>
            <div class="lp-card-title">${escapeHtml(p.title||p.name||'Untitled Path')}</div>
            ${p.description?`<div class="lp-card-desc">${escapeHtml(p.description)}</div>`:''}
          </div>
        </div>
        <div class="lp-card-right">
          ${subj?`<span class="lp-badge" style="color:${subj.color};border-color:${subj.color}"><i class="ph ph-books"></i> ${escapeHtml(subj.name)}</span>`:''}
          <span class="lp-badge lp-badge-xp"><i class="ph-fill ph-star"></i> ${p.total_xp||0}/${txp} XP</span>
          <span class="lp-badge" style="color:${statusColor};border-color:${statusColor}">${p.status||'Not Started'}</span>
          <div class="lp-card-actions">
            <button class="btn-icon" onclick="showEditPathModal('${p._id}')"><i class="ph ph-pencil-simple"></i></button>
            <button class="btn-icon" onclick="confirmDeletePath('${p._id}')" style="color:var(--error)"><i class="ph ph-trash"></i></button>
          </div>
        </div>
      </div>

      <div class="lp-progress-row">
        <div class="lp-progress-bar"><div class="lp-progress-fill${isDone?' lp-progress-done':''}" style="width:${pct}%"></div></div>
        <span class="lp-progress-label">${dc}/${cps.length}${isDone?' ✓':''}</span>
      </div>

      <div class="lp-roadmap">
        ${cps.map((cp, i) => {
          const done = cp.completed;
          const current = !done && i === ni;
          const locked = !done && !current;
          const nodeClass = done ? 'lp-node-done' : current ? 'lp-node-current' : 'lp-node-locked';
          const icon = done
            ? '<i class="ph-fill ph-check-circle"></i>'
            : current
              ? '<i class="ph-fill ph-play-circle"></i>'
              : '<i class="ph ph-lock-simple"></i>';

          return `<div class="lp-node ${nodeClass}">
            <div class="lp-node-line${i===0?' lp-node-first':''}${i===cps.length-1?' lp-node-last':''}">
              <div class="lp-node-dot">${icon}</div>
            </div>
            <div class="lp-node-content">
              <div class="lp-node-title">${escapeHtml(cp.title||'Checkpoint '+(i+1))}</div>
              <div class="lp-node-xp">+${cp.reward_xp||50} XP</div>
            </div>
            ${current?`<button class="btn btn-sm btn-primary lp-claim-btn" onclick="event.stopPropagation();claimCP('${p._id}',${i})"><i class="ph ph-trophy"></i> Claim</button>`:''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  container.innerHTML = html;
}

async function claimCP(pid, idx) {
  try {
    const r = await API.completeCheckpoint(pid, idx);
    showModal('🎉 Checkpoint Complete!', `
      <div style="text-align:center;padding:20px">
        <div style="font-size:3rem;margin-bottom:12px">⭐</div>
        <div style="font-size:1.5rem;font-weight:800;color:var(--primary-600)">+${r.xp_earned||50} XP Earned!</div>
        <div style="color:var(--gray-500);margin-top:8px">Total Path XP: ${r.total_xp||0}</div>
        ${r.all_done?'<div style="margin-top:16px;padding:10px 20px;background:rgba(16,185,129,.1);border-radius:12px;color:var(--success);font-weight:700"><i class="ph ph-trophy"></i> 🏆 Path Completed! +100 Bonus XP</div>':''}
      </div>`,
      `<button class="btn btn-primary" onclick="closeModal();renderStudyTab();loadStudyStats()">Continue</button>`);
    await API.awardXP(r.xp_earned||50, 'checkpoint');
    if (r.all_done) await API.awardXP(100, 'path_completed');
  } catch(e) { showToast('Error claiming', 'error'); }
}

function confirmDeletePath(id) {
  showModal('Delete Path?', `<p style="color:var(--gray-500);font-size:.85rem">Delete this path and all checkpoints?</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--error);color:#fff" onclick="doDeletePath('${id}')"><i class="ph ph-trash"></i> Delete</button>`);
}
async function doDeletePath(id) { await API.deletePath(id); closeModal(); showToast('Path deleted'); renderStudyTab(); }

// ======================== STREAKS TAB ========================
// ======================== STREAKS TAB V2 ========================

function generateStkCurrentWeek(days) {
  const map = {}; days.forEach(d=>map[d.date]=d.minutes||0);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday start
  
  let html = '';
  // 7 days radially distributed
  for(let i=0; i<7; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const k = d.toISOString().split('T')[0];
    const mins = map[k]||0;
    const isToday = k === today.toISOString().split('T')[0];
    
    // Position on a circle
    const angle = (i/7) * 2 * Math.PI - (Math.PI/2);
    const x = 100 + 80 * Math.cos(angle);
    const y = 100 + 80 * Math.sin(angle);
    
    const dayName = d.toLocaleDateString('en-US',{weekday:'short'}).charAt(0);
    
    html += `<div class="stk-orbit-day ${mins?'active':''} ${isToday?'today':''}" style="left:${x}px;top:${y}px" title="${k}: ${mins} min">
      ${dayName}
    </div>`;
  }
  return html;
}

function generateStkMatrix(days) {
  const map = {}; days.forEach(d=>map[d.date]=d.minutes||0);
  // 90 days
  const today = new Date();
  let html = '';
  for(let i=89; i>=0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const k = d.toISOString().split('T')[0];
    const mins = map[k]||0;
    const lvl = mins===0 ? 0 : mins<30 ? 1 : mins<60 ? 2 : mins<120 ? 3 : 4;
    
    // Staggered animation delay based on column
    const col = Math.floor((89-i)/7);
    const delay = (89-i) * 0.005;
    
    html += `<div class="stk-m-cell stk-lvl-${lvl}" style="--delay:${delay}s" data-tooltip="${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}: ${mins} min"></div>`;
  }
  return html;
}

// Particle system for Log interaction
window.triggerStkBurst = function(btn) {
  const rect = btn.getBoundingClientRect();
  const colors = ['#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#10B981'];
  
  for(let i=0; i<20; i++) {
    const p = document.createElement('div');
    p.className = 'stk-particle';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.left = (rect.left + rect.width/2) + 'px';
    p.style.top = (rect.top + rect.height/2) + 'px';
    
    // Random trajectory
    const angle = Math.random() * 2 * Math.PI;
    const dist = 50 + Math.random() * 80;
    const tx = Math.cos(angle) * dist + 'px';
    const ty = Math.sin(angle) * dist + 'px';
    
    p.style.setProperty('--tx', tx);
    p.style.setProperty('--ty', ty);
    p.style.animation = `stkBurst .6s cubic-bezier(0.1, 0.8, 0.2, 1) forwards`;
    
    document.body.appendChild(p);
    setTimeout(()=>p.remove(), 600);
  }
  
  // Intensify fire temporarily
  const fire = document.querySelector('.stk-fire');
  if(fire) {
    fire.style.animationDuration = '0.5s';
    setTimeout(()=>fire.style.animationDuration='3s', 2000);
  }

  // Then actually log time
  showLogTimeModal();
}

// Animate numbers
function stkAnimateNumbers() {
  document.querySelectorAll('.stk-odometer').forEach(el => {
    const target = parseFloat(el.dataset.val)||0;
    let cur = 0;
    const step = Math.max(1, target/30);
    const interval = setInterval(()=> {
      cur += step;
      if(cur >= target) { cur = target; clearInterval(interval); }
      el.textContent = Math.round(cur);
    }, 20);
  });
}

async function renderStreaksTab(container) {
  const data = await API.getStreaks()||{}; 
  const days = safeArr(data.days);
  const todayKey = new Date().toISOString().split('T')[0];
  const loggedToday = days.some(d=>d.date===todayKey && d.minutes>0);
  const totalHours = Math.round((data.total_minutes||0)/60); 
  const activeDays = days.filter(d=>d.minutes>0).length;
  
  container.innerHTML = `
    <div class="stk-dashboard">
      <!-- HERO (3D Fire & Big Stats) -->
      <div class="stk-hero animate-fade-in">
        <div class="stk-fire-wrap">
          <div class="stk-fire"></div>
          <div class="stk-spark"></div><div class="stk-spark"></div><div class="stk-spark"></div>
        </div>
        <div class="stk-hero-main">
          <div class="stk-hero-main-title">Continuous Study</div>
          <div class="stk-hero-count-wrap">
            <h1 class="stk-hero-count stk-odometer" data-val="${data.current_streak||0}">0</h1>
            <span class="stk-hero-count-label">Days</span>
          </div>
        </div>
        <div class="stk-hero-stats">
          <div class="stk-stat-col">
            <span class="stk-stat-val stk-odometer" data-val="${totalHours}">0</span>
            <span class="stk-stat-lbl">Hours</span>
          </div>
          <div class="stk-stat-col">
            <span class="stk-stat-val stk-odometer" data-val="${activeDays}">0</span>
            <span class="stk-stat-lbl">Active Days</span>
          </div>
          <div class="stk-stat-col">
            <span class="stk-stat-val stk-odometer" data-val="${data.total_minutes||0}">0</span>
            <span class="stk-stat-lbl">Total Minutes</span>
          </div>
        </div>
        <div class="stk-log-wrap">
          ${loggedToday 
            ? '<div class="stk-logged-badge"><i class="ph-fill ph-check-circle"></i> Today Logged</div>'
            : '<button class="stk-btn-log" onclick="triggerStkBurst(this)"><i class="ph-fill ph-fire"></i> Log Today</button>'}
        </div>
      </div>

      <!-- ROW 2: Orbit & Insight -->
      <div class="stk-row-2">
        <div class="stk-orbit-card animate-fade-in" style="animation-delay:0.1s">
          <div class="stk-orbit-title"><i class="ph ph-planet"></i> Current Week Orbit</div>
          <div class="stk-orbit-container">
            <div class="stk-orbit-ring"></div>
            ${generateStkCurrentWeek(days)}
          </div>
        </div>

        <div class="stk-matrix-card animate-fade-in" style="animation-delay:0.2s">
          <div class="stk-matrix-header">
            <div class="stk-matrix-title"><i class="ph ph-calendar-plus"></i> 90-Day Contribution Field</div>
            <div style="font-size:.75rem;color:var(--gray-400);display:flex;align-items:center;gap:6px;">
              <span>Less</span>
              <div style="display:flex;gap:4px">
                <div class="stk-m-cell stk-lvl-0" style="opacity:1;pointer-events:none;transform:none;animation:none;"></div>
                <div class="stk-m-cell stk-lvl-1" style="opacity:1;pointer-events:none;transform:none;animation:none;"></div>
                <div class="stk-m-cell stk-lvl-2" style="opacity:1;pointer-events:none;transform:none;animation:none;"></div>
                <div class="stk-m-cell stk-lvl-3" style="opacity:1;pointer-events:none;transform:none;animation:none;"></div>
                <div class="stk-m-cell stk-lvl-4" style="opacity:1;pointer-events:none;transform:none;animation:none;"></div>
              </div>
              <span>More</span>
            </div>
          </div>
          <div class="stk-matrix-scroll" style="overflow-x:auto">
            <div class="stk-matrix" style="width:max-content">${generateStkMatrix(days)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(stkAnimateNumbers, 50);
}

// ======================== ACHIEVEMENTS TAB V2 ========================

// Badge tier config
const TIERS = {
  bronze:  { label:'Bronze',  gradient:'linear-gradient(135deg,#CD7F32,#8B6914)', glow:'rgba(205,127,50,.4)', text:'#8B6914' },
  silver:  { label:'Silver',  gradient:'linear-gradient(135deg,#C0C0C0,#808080)', glow:'rgba(192,192,192,.4)', text:'#808080' },
  gold:    { label:'Gold',    gradient:'linear-gradient(135deg,#FFD700,#FFA500)', glow:'rgba(255,215,0,.4)', text:'#B8860B' },
  diamond: { label:'Diamond', gradient:'linear-gradient(135deg,#B9F2FF,#6C5CE7,#EC4899)', glow:'rgba(108,92,231,.5)', text:'#6C5CE7' }
};

const CATS = {
  learning:    { label:'📚 Learning',     icon:'ph-books',         color:'#3B82F6' },
  consistency: { label:'🔥 Consistency',   icon:'ph-fire',          color:'#EF4444' },
  mastery:     { label:'🎯 Mastery',       icon:'ph-target',        color:'#10B981' },
  notes:       { label:'📝 Notes',         icon:'ph-note-pencil',   color:'#8B5CF6' },
  goals:       { label:'🏆 Goals & Paths', icon:'ph-trophy',        color:'#F59E0B' },
  xp:          { label:'⚡ XP & Levels',   icon:'ph-lightning',     color:'#6C5CE7' },
  special:     { label:'🌟 Special',       icon:'ph-star',          color:'#EC4899' }
};

function buildBadgeDefs(stats) {
  const s = stats;
  return [
    // ========== LEARNING (20) ==========
    {id:'l1',cat:'learning',tier:'bronze',icon:'ph-book-open',title:'First Steps',desc:'Create your first subject',val:s.subjects,req:1},
    {id:'l2',cat:'learning',tier:'bronze',icon:'ph-books',title:'Bookworm',desc:'Create 3 subjects',val:s.subjects,req:3},
    {id:'l3',cat:'learning',tier:'silver',icon:'ph-books',title:'Librarian',desc:'Create 5 subjects',val:s.subjects,req:5},
    {id:'l4',cat:'learning',tier:'gold',icon:'ph-books',title:'Professor',desc:'Create 10 subjects',val:s.subjects,req:10},
    {id:'l5',cat:'learning',tier:'bronze',icon:'ph-list-checks',title:'Topic Starter',desc:'Create your first topic',val:s.topics,req:1},
    {id:'l6',cat:'learning',tier:'bronze',icon:'ph-list-checks',title:'Topic Explorer',desc:'Create 5 topics',val:s.topics,req:5},
    {id:'l7',cat:'learning',tier:'silver',icon:'ph-list-checks',title:'Topic Hunter',desc:'Create 10 topics',val:s.topics,req:10},
    {id:'l8',cat:'learning',tier:'silver',icon:'ph-list-checks',title:'Topic Pro',desc:'Create 25 topics',val:s.topics,req:25},
    {id:'l9',cat:'learning',tier:'gold',icon:'ph-list-checks',title:'Topic Master',desc:'Create 50 topics',val:s.topics,req:50},
    {id:'l10',cat:'learning',tier:'diamond',icon:'ph-list-checks',title:'Topic Legend',desc:'Create 100 topics',val:s.topics,req:100},
    {id:'l11',cat:'learning',tier:'bronze',icon:'ph-link',title:'Resourceful',desc:'Add first resource link',val:s.resources,req:1},
    {id:'l12',cat:'learning',tier:'silver',icon:'ph-link',title:'Research Pro',desc:'Add 10 resource links',val:s.resources,req:10},
    {id:'l13',cat:'learning',tier:'gold',icon:'ph-link',title:'Info Hoarder',desc:'Add 50 resource links',val:s.resources,req:50},
    {id:'l14',cat:'learning',tier:'bronze',icon:'ph-folder-open',title:'Organized',desc:'Have topics in 2 subjects',val:s.subjectsWithTopics,req:2},
    {id:'l15',cat:'learning',tier:'silver',icon:'ph-folder-open',title:'Multi-Learner',desc:'Have topics in 5 subjects',val:s.subjectsWithTopics,req:5},
    {id:'l16',cat:'learning',tier:'bronze',icon:'ph-chalkboard-teacher',title:'Hard Mode',desc:'Create a Hard difficulty topic',val:s.hardTopics,req:1},
    {id:'l17',cat:'learning',tier:'silver',icon:'ph-chalkboard-teacher',title:'Challenge Seeker',desc:'Create 5 Hard topics',val:s.hardTopics,req:5},
    {id:'l18',cat:'learning',tier:'gold',icon:'ph-chalkboard-teacher',title:'Fearless',desc:'Create 10 Hard topics',val:s.hardTopics,req:10},
    {id:'l19',cat:'learning',tier:'bronze',icon:'ph-tree-structure',title:'Sub-Topic Starter',desc:'Create first sub-topic',val:s.subtopics,req:1},
    {id:'l20',cat:'learning',tier:'silver',icon:'ph-tree-structure',title:'Deep Diver',desc:'Create 10 sub-topics',val:s.subtopics,req:10},

    // ========== CONSISTENCY (18) ==========
    {id:'c1',cat:'consistency',tier:'bronze',icon:'ph-fire',title:'Spark',desc:'Start a 1-day streak',val:s.streak,req:1},
    {id:'c2',cat:'consistency',tier:'bronze',icon:'ph-fire',title:'On Fire',desc:'3-day streak',val:s.streak,req:3},
    {id:'c3',cat:'consistency',tier:'silver',icon:'ph-fire',title:'Weekly Warrior',desc:'7-day streak',val:s.streak,req:7},
    {id:'c4',cat:'consistency',tier:'silver',icon:'ph-fire',title:'Fortnight Force',desc:'14-day streak',val:s.streak,req:14},
    {id:'c5',cat:'consistency',tier:'gold',icon:'ph-fire',title:'Monthly Master',desc:'30-day streak',val:s.streak,req:30},
    {id:'c6',cat:'consistency',tier:'gold',icon:'ph-fire',title:'Unstoppable',desc:'60-day streak',val:s.streak,req:60},
    {id:'c7',cat:'consistency',tier:'diamond',icon:'ph-fire',title:'Eternal Flame',desc:'100-day streak',val:s.streak,req:100},
    {id:'c8',cat:'consistency',tier:'diamond',icon:'ph-fire',title:'Legendary',desc:'365-day streak',val:s.streak,req:365},
    {id:'c9',cat:'consistency',tier:'bronze',icon:'ph-timer',title:'15 Minutes',desc:'Log 15 min study time',val:s.totalMinutes,req:15},
    {id:'c10',cat:'consistency',tier:'bronze',icon:'ph-timer',title:'Hour Power',desc:'Log 1 hour total',val:s.totalMinutes,req:60},
    {id:'c11',cat:'consistency',tier:'silver',icon:'ph-timer',title:'Dedicated',desc:'Log 5 hours total',val:s.totalMinutes,req:300},
    {id:'c12',cat:'consistency',tier:'silver',icon:'ph-timer',title:'Marathon',desc:'Log 10 hours total',val:s.totalMinutes,req:600},
    {id:'c13',cat:'consistency',tier:'gold',icon:'ph-timer',title:'Time Lord',desc:'Log 50 hours total',val:s.totalMinutes,req:3000},
    {id:'c14',cat:'consistency',tier:'diamond',icon:'ph-timer',title:'10K Hours',desc:'Log 100 hours total',val:s.totalMinutes,req:6000},
    {id:'c15',cat:'consistency',tier:'bronze',icon:'ph-calendar-check',title:'Active Learner',desc:'Study 5 different days',val:s.activeDays,req:5},
    {id:'c16',cat:'consistency',tier:'silver',icon:'ph-calendar-check',title:'Regular',desc:'Study 15 different days',val:s.activeDays,req:15},
    {id:'c17',cat:'consistency',tier:'gold',icon:'ph-calendar-check',title:'Habitual',desc:'Study 30 different days',val:s.activeDays,req:30},
    {id:'c18',cat:'consistency',tier:'diamond',icon:'ph-calendar-check',title:'Daily Champion',desc:'Study 100 different days',val:s.activeDays,req:100},

    // ========== MASTERY (20) ==========
    {id:'m1',cat:'mastery',tier:'bronze',icon:'ph-check-circle',title:'First Blood',desc:'Complete your first topic',val:s.completed,req:1},
    {id:'m2',cat:'mastery',tier:'bronze',icon:'ph-check-circle',title:'Getting Started',desc:'Complete 3 topics',val:s.completed,req:3},
    {id:'m3',cat:'mastery',tier:'silver',icon:'ph-check-circle',title:'Achiever',desc:'Complete 5 topics',val:s.completed,req:5},
    {id:'m4',cat:'mastery',tier:'silver',icon:'ph-check-circle',title:'Steady Progress',desc:'Complete 10 topics',val:s.completed,req:10},
    {id:'m5',cat:'mastery',tier:'gold',icon:'ph-check-circle',title:'Completionist',desc:'Complete 25 topics',val:s.completed,req:25},
    {id:'m6',cat:'mastery',tier:'gold',icon:'ph-check-circle',title:'Knowledge King',desc:'Complete 50 topics',val:s.completed,req:50},
    {id:'m7',cat:'mastery',tier:'diamond',icon:'ph-check-circle',title:'Grand Master',desc:'Complete 100 topics',val:s.completed,req:100},
    {id:'m8',cat:'mastery',tier:'bronze',icon:'ph-smiley',title:'Easy Win',desc:'Complete 1 Easy topic',val:s.easyDone,req:1},
    {id:'m9',cat:'mastery',tier:'silver',icon:'ph-smiley',title:'Easy Street',desc:'Complete 5 Easy topics',val:s.easyDone,req:5},
    {id:'m10',cat:'mastery',tier:'bronze',icon:'ph-equals',title:'Middle Ground',desc:'Complete 1 Medium topic',val:s.medDone,req:1},
    {id:'m11',cat:'mastery',tier:'silver',icon:'ph-equals',title:'Balanced',desc:'Complete 5 Medium topics',val:s.medDone,req:5},
    {id:'m12',cat:'mastery',tier:'gold',icon:'ph-equals',title:'Well Rounded',desc:'Complete 10 Medium topics',val:s.medDone,req:10},
    {id:'m13',cat:'mastery',tier:'silver',icon:'ph-skull',title:'Brave Soul',desc:'Complete 1 Hard topic',val:s.hardDone,req:1},
    {id:'m14',cat:'mastery',tier:'gold',icon:'ph-skull',title:'Warrior',desc:'Complete 5 Hard topics',val:s.hardDone,req:5},
    {id:'m15',cat:'mastery',tier:'diamond',icon:'ph-skull',title:'Invincible',desc:'Complete 10 Hard topics',val:s.hardDone,req:10},
    {id:'m16',cat:'mastery',tier:'silver',icon:'ph-graduation-cap',title:'Full Subject',desc:'Complete all topics in a subject',val:s.fullSubjects,req:1},
    {id:'m17',cat:'mastery',tier:'gold',icon:'ph-graduation-cap',title:'Multi-Graduate',desc:'Complete all topics in 3 subjects',val:s.fullSubjects,req:3},
    {id:'m18',cat:'mastery',tier:'diamond',icon:'ph-graduation-cap',title:'Valedictorian',desc:'Complete all topics in 5 subjects',val:s.fullSubjects,req:5},
    {id:'m19',cat:'mastery',tier:'gold',icon:'ph-medal',title:'Perfectionist',desc:'Complete 90% of all topics',val:s.completionPct,req:90},
    {id:'m20',cat:'mastery',tier:'diamond',icon:'ph-crown',title:'100% Club',desc:'Complete ALL topics',val:s.completionPct,req:100},

    // ========== NOTES (12) ==========
    {id:'n1',cat:'notes',tier:'bronze',icon:'ph-note-pencil',title:'Note Taker',desc:'Create your first note',val:s.notes,req:1},
    {id:'n2',cat:'notes',tier:'bronze',icon:'ph-note-pencil',title:'Note Keeper',desc:'Create 5 notes',val:s.notes,req:5},
    {id:'n3',cat:'notes',tier:'silver',icon:'ph-note-pencil',title:'Scribe',desc:'Create 10 notes',val:s.notes,req:10},
    {id:'n4',cat:'notes',tier:'silver',icon:'ph-note-pencil',title:'Prolific Writer',desc:'Create 25 notes',val:s.notes,req:25},
    {id:'n5',cat:'notes',tier:'gold',icon:'ph-note-pencil',title:'Author',desc:'Create 50 notes',val:s.notes,req:50},
    {id:'n6',cat:'notes',tier:'diamond',icon:'ph-note-pencil',title:'Novelist',desc:'Create 100 notes',val:s.notes,req:100},
    {id:'n7',cat:'notes',tier:'bronze',icon:'ph-text-aa',title:'First Words',desc:'Write 100 words in notes',val:s.noteWords,req:100},
    {id:'n8',cat:'notes',tier:'silver',icon:'ph-text-aa',title:'Essayist',desc:'Write 1,000 words',val:s.noteWords,req:1000},
    {id:'n9',cat:'notes',tier:'gold',icon:'ph-text-aa',title:'Wordsmith',desc:'Write 5,000 words',val:s.noteWords,req:5000},
    {id:'n10',cat:'notes',tier:'diamond',icon:'ph-text-aa',title:'Encyclopedia',desc:'Write 10,000 words',val:s.noteWords,req:10000},
    {id:'n11',cat:'notes',tier:'bronze',icon:'ph-push-pin',title:'Pinned!',desc:'Pin your first note',val:s.pinnedNotes,req:1},
    {id:'n12',cat:'notes',tier:'silver',icon:'ph-hash',title:'Tag Master',desc:'Use tags on 5 notes',val:s.taggedNotes,req:5},

    // ========== GOALS & PATHS (15) ==========
    {id:'g1',cat:'goals',tier:'bronze',icon:'ph-target',title:'Goal Setter',desc:'Create your first goal',val:s.goals,req:1},
    {id:'g2',cat:'goals',tier:'bronze',icon:'ph-target',title:'Ambitious',desc:'Create 5 goals',val:s.goals,req:5},
    {id:'g3',cat:'goals',tier:'silver',icon:'ph-target',title:'Driven',desc:'Create 10 goals',val:s.goals,req:10},
    {id:'g4',cat:'goals',tier:'gold',icon:'ph-target',title:'Visionary',desc:'Create 25 goals',val:s.goals,req:25},
    {id:'g5',cat:'goals',tier:'bronze',icon:'ph-check-square',title:'Goal Crusher',desc:'Complete your first goal',val:s.goalsDone,req:1},
    {id:'g6',cat:'goals',tier:'silver',icon:'ph-check-square',title:'Goal Achiever',desc:'Complete 5 goals',val:s.goalsDone,req:5},
    {id:'g7',cat:'goals',tier:'gold',icon:'ph-check-square',title:'Relentless',desc:'Complete 10 goals',val:s.goalsDone,req:10},
    {id:'g8',cat:'goals',tier:'diamond',icon:'ph-check-square',title:'Unstoppable Force',desc:'Complete 25 goals',val:s.goalsDone,req:25},
    {id:'g9',cat:'goals',tier:'bronze',icon:'ph-map-trifold',title:'Pathfinder',desc:'Create your first learning path',val:s.paths,req:1},
    {id:'g10',cat:'goals',tier:'silver',icon:'ph-map-trifold',title:'Trail Blazer',desc:'Create 3 learning paths',val:s.paths,req:3},
    {id:'g11',cat:'goals',tier:'gold',icon:'ph-map-trifold',title:'Journey Master',desc:'Create 5 paths',val:s.paths,req:5},
    {id:'g12',cat:'goals',tier:'bronze',icon:'ph-flag-checkered',title:'Checkpoint!',desc:'Complete first checkpoint',val:s.checkpointsDone,req:1},
    {id:'g13',cat:'goals',tier:'silver',icon:'ph-flag-checkered',title:'Milestone Maker',desc:'Complete 10 checkpoints',val:s.checkpointsDone,req:10},
    {id:'g14',cat:'goals',tier:'gold',icon:'ph-flag-checkered',title:'Path Complete',desc:'Complete a full learning path',val:s.pathsDone,req:1},
    {id:'g15',cat:'goals',tier:'diamond',icon:'ph-flag-checkered',title:'Grand Journey',desc:'Complete 3 learning paths',val:s.pathsDone,req:3},

    // ========== XP & LEVELS (20) ==========
    {id:'x1',cat:'xp',tier:'bronze',icon:'ph-lightning',title:'First XP',desc:'Earn 10 XP',val:s.xp,req:10},
    {id:'x2',cat:'xp',tier:'bronze',icon:'ph-lightning',title:'XP Hunter',desc:'Earn 50 XP',val:s.xp,req:50},
    {id:'x3',cat:'xp',tier:'bronze',icon:'ph-lightning',title:'Century',desc:'Earn 100 XP',val:s.xp,req:100},
    {id:'x4',cat:'xp',tier:'silver',icon:'ph-lightning',title:'Power Up',desc:'Earn 250 XP',val:s.xp,req:250},
    {id:'x5',cat:'xp',tier:'silver',icon:'ph-lightning',title:'Half K',desc:'Earn 500 XP',val:s.xp,req:500},
    {id:'x6',cat:'xp',tier:'gold',icon:'ph-lightning',title:'Thousand Club',desc:'Earn 1,000 XP',val:s.xp,req:1000},
    {id:'x7',cat:'xp',tier:'gold',icon:'ph-lightning',title:'Power Surge',desc:'Earn 2,500 XP',val:s.xp,req:2500},
    {id:'x8',cat:'xp',tier:'gold',icon:'ph-lightning',title:'5K Runner',desc:'Earn 5,000 XP',val:s.xp,req:5000},
    {id:'x9',cat:'xp',tier:'diamond',icon:'ph-lightning',title:'XP Legend',desc:'Earn 10,000 XP',val:s.xp,req:10000},
    {id:'x10',cat:'xp',tier:'diamond',icon:'ph-lightning',title:'XP Immortal',desc:'Earn 25,000 XP',val:s.xp,req:25000},
    {id:'x11',cat:'xp',tier:'diamond',icon:'ph-lightning',title:'XP God',desc:'Earn 50,000 XP',val:s.xp,req:50000},
    {id:'x12',cat:'xp',tier:'diamond',icon:'ph-lightning',title:'Transcendent',desc:'Earn 100,000 XP',val:s.xp,req:100000},
    {id:'x13',cat:'xp',tier:'bronze',icon:'ph-arrow-circle-up',title:'Level 2',desc:'Reach level 2',val:s.level,req:2},
    {id:'x14',cat:'xp',tier:'bronze',icon:'ph-arrow-circle-up',title:'Level 5',desc:'Reach level 5',val:s.level,req:5},
    {id:'x15',cat:'xp',tier:'silver',icon:'ph-arrow-circle-up',title:'Level 10',desc:'Reach level 10',val:s.level,req:10},
    {id:'x16',cat:'xp',tier:'silver',icon:'ph-arrow-circle-up',title:'Level 15',desc:'Reach level 15',val:s.level,req:15},
    {id:'x17',cat:'xp',tier:'gold',icon:'ph-arrow-circle-up',title:'Level 25',desc:'Reach level 25',val:s.level,req:25},
    {id:'x18',cat:'xp',tier:'gold',icon:'ph-arrow-circle-up',title:'Level 50',desc:'Reach level 50',val:s.level,req:50},
    {id:'x19',cat:'xp',tier:'diamond',icon:'ph-arrow-circle-up',title:'Level 75',desc:'Reach level 75',val:s.level,req:75},
    {id:'x20',cat:'xp',tier:'diamond',icon:'ph-crown',title:'MAX LEVEL',desc:'Reach level 100',val:s.level,req:100},

    // ========== SPECIAL (10) ==========
    {id:'s1',cat:'special',tier:'gold',icon:'ph-sparkle',title:'Speed Learner',desc:'Complete 3 topics in one day',val:s.maxTopicsDay,req:3},
    {id:'s2',cat:'special',tier:'gold',icon:'ph-moon',title:'Night Owl',desc:'Study after midnight',val:s.nightStudy,req:1},
    {id:'s3',cat:'special',tier:'gold',icon:'ph-sun',title:'Early Bird',desc:'Study before 7 AM',val:s.earlyStudy,req:1},
    {id:'s4',cat:'special',tier:'diamond',icon:'ph-infinity',title:'Dedicated Scholar',desc:'Use all study features',val:s.featuresUsed,req:5},
    {id:'s5',cat:'special',tier:'bronze',icon:'ph-hand-waving',title:'Welcome!',desc:'Open the Study Hub',val:1,req:1},
    {id:'s6',cat:'special',tier:'silver',icon:'ph-palette',title:'Customizer',desc:'Use 3 different subject colors',val:s.uniqueColors,req:3},
    {id:'s7',cat:'special',tier:'gold',icon:'ph-star-four',title:'All-Rounder',desc:'Earn badge from every category',val:s.catsWithBadges,req:7},
    {id:'s8',cat:'special',tier:'diamond',icon:'ph-diamond',title:'Diamond Collector',desc:'Earn 5 Diamond badges',val:s.diamondCount,req:5},
    {id:'s9',cat:'special',tier:'gold',icon:'ph-medal',title:'Half Century',desc:'Earn 50 total badges',val:s.earnedBadges,req:50},
    {id:'s10',cat:'special',tier:'diamond',icon:'ph-crown',title:'Completionist',desc:'Earn all badges',val:s.earnedBadges,req:115},
  ];
}

function collectAchStats(profile, allNotes, allGoals) {
  const xp = profile.total_xp||0;
  const level = profile.study_level||1;
  const streak = profile.current_streak||0;
  const totalMinutes = profile.total_minutes||0;
  const activeDays = profile.active_days||0;
  const subjects = _studySubjects.length;
  const topics = _allTopics.length;
  const completed = _allTopics.filter(t=>t.status==='Completed').length;
  const easyDone = _allTopics.filter(t=>t.status==='Completed'&&t.difficulty==='Easy').length;
  const medDone = _allTopics.filter(t=>t.status==='Completed'&&t.difficulty==='Medium').length;
  const hardDone = _allTopics.filter(t=>t.status==='Completed'&&t.difficulty==='Hard').length;
  const hardTopics = _allTopics.filter(t=>t.difficulty==='Hard').length;
  const subtopics = _allTopics.reduce((s,t)=>s+safeArr(t.sub_topics).length,0);
  const resources = _allTopics.reduce((s,t)=>s+safeArr(t.resources).length,0);
  const sWithT = new Set(_allTopics.map(t=>t.subject_id)).size;
  const notes = allNotes ? allNotes.length : 0;
  const noteWords = allNotes ? allNotes.reduce((s,n)=>{const txt=(n.content||'').replace(/<[^>]+>/g,' ');return s+txt.split(/\s+/).filter(Boolean).length;},0) : 0;
  const pinnedNotes = allNotes ? allNotes.filter(n=>n.is_pinned).length : 0;
  const taggedNotes = allNotes ? allNotes.filter(n=>safeArr(n.tags).length>0).length : 0;
  const goals = allGoals ? allGoals.length : 0;
  const goalsDone = allGoals ? allGoals.filter(g=>g.status==='Completed').length : 0;
  const paths = profile.paths_count||0;
  const pathsDone = profile.paths_done||0;
  const checkpointsDone = profile.checkpoints_done||0;
  const uniqueColors = new Set(_studySubjects.map(s=>s.color)).size;
  const completionPct = topics>0?Math.round(completed/topics*100):0;
  // Full subjects (all topics in a subject completed)
  let fullSubjects = 0;
  _studySubjects.forEach(sub=>{
    const subTopics = _allTopics.filter(t=>String(t.subject_id)===sub._id);
    if(subTopics.length>0 && subTopics.every(t=>t.status==='Completed')) fullSubjects++;
  });
  const featuresUsed = [subjects>0, topics>0, notes>0, goals>0, streak>0].filter(Boolean).length;

  return {xp,level,streak,totalMinutes,activeDays,subjects,topics,completed,easyDone,medDone,hardDone,hardTopics,subtopics,resources,subjectsWithTopics:sWithT,notes,noteWords,pinnedNotes,taggedNotes,goals,goalsDone,paths,pathsDone,checkpointsDone,uniqueColors,completionPct,fullSubjects,featuresUsed,maxTopicsDay:0,nightStudy:0,earlyStudy:0,catsWithBadges:0,diamondCount:0,earnedBadges:0};
}

let _achFilter = 'all';
let _achSearch = '';

function buildXPRing(pct, lvl) {
  const r = 54, c = 2 * Math.PI * r;
  const offset = c - (pct/100)*c;
  return `<svg class="ach-ring" viewBox="0 0 120 120">
    <defs><linearGradient id="achGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="var(--primary-400)"/><stop offset="100%" stop-color="#3B82F6"/></linearGradient></defs>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--gray-100)" stroke-width="8"/>
    <circle cx="60" cy="60" r="${r}" fill="none" stroke="url(#achGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)" class="ach-ring-progress"/>
    <text x="60" y="54" text-anchor="middle" class="ach-ring-level">${lvl}</text>
    <text x="60" y="72" text-anchor="middle" class="ach-ring-label">LEVEL</text>
  </svg>`;
}

async function renderAchievementsTab(container) {
  const profile = _studyProfile.total_xp !== undefined ? _studyProfile : (await API.getStudyProfile()||{});
  const xp = profile.total_xp||0, lvl = profile.study_level||1, xpNext = profile.xp_to_next||500;
  const pct = Math.round(((xp%500)/500)*100);

  const [allNotes, allGoals] = await Promise.all([
    API.getAllNotes().then(res => Array.isArray(res) ? res : []).catch(()=>[]),
    API.getGoals().then(res => Array.isArray(res) ? res : []).catch(()=>[])
  ]);

  const stats = collectAchStats(profile, allNotes, allGoals);
  const badges = buildBadgeDefs(stats);

  // Calculate dynamic stats
  let earnedCount = 0;
  const earnedByCat = {};
  badges.forEach(b => {
    const earned = (b.val||0) >= b.req;
    if (earned) {
      earnedCount++;
      earnedByCat[b.cat] = (earnedByCat[b.cat]||0) + 1;
    }
  });
  stats.earnedBadges = earnedCount;
  stats.catsWithBadges = Object.keys(earnedByCat).length;
  stats.diamondCount = badges.filter(b=>b.tier==='diamond'&&(b.val||0)>=b.req).length;

  // Re-evaluate after dynamic stats
  const finalBadges = buildBadgeDefs(stats);
  earnedCount = finalBadges.filter(b=>(b.val||0)>=b.req).length;

  const tierCounts = {bronze:0,silver:0,gold:0,diamond:0};
  finalBadges.forEach(b=>{if((b.val||0)>=b.req)tierCounts[b.tier]++;});

  // Hero section
  let html = `<div class="ach-hero">
    <div class="ach-hero-ring">${buildXPRing(pct, lvl)}</div>
    <div class="ach-hero-info">
      <div class="ach-hero-xp">${xp.toLocaleString()} <span>XP</span></div>
      <div class="ach-hero-next">${xpNext} XP to level ${lvl+1}</div>
      <div class="ach-hero-bar"><div class="ach-hero-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="ach-hero-stats">
      <div class="ach-hero-stat"><span class="ach-hero-stat-val">${earnedCount}</span><span>Unlocked</span></div>
      <div class="ach-hero-stat"><span class="ach-hero-stat-val">${finalBadges.length}</span><span>Total</span></div>
      <div class="ach-hero-stat"><span class="ach-hero-stat-val">${Math.round(earnedCount/finalBadges.length*100)}%</span><span>Progress</span></div>
    </div>
  </div>`;

  // Tier summary
  html += `<div class="ach-tiers-row">
    ${Object.entries(TIERS).map(([k,t])=>`<div class="ach-tier-card"><div class="ach-tier-icon" style="background:${t.gradient}"><i class="ph-fill ph-shield-star"></i></div><div class="ach-tier-count">${tierCounts[k]}</div><div class="ach-tier-label">${t.label}</div></div>`).join('')}
  </div>`;

  // Filter bar
  html += `<div class="ach-filter-bar">
    <div class="ach-filter-left">
      <button class="ach-pill${_achFilter==='all'?' active':''}" onclick="_achFilter='all';renderAchCards()"><i class="ph ph-squares-four"></i> All <span class="ach-pill-count">${finalBadges.length}</span></button>
      <button class="ach-pill${_achFilter==='earned'?' active':''}" onclick="_achFilter='earned';renderAchCards()"><i class="ph-fill ph-check-circle"></i> Earned <span class="ach-pill-count">${earnedCount}</span></button>
      <button class="ach-pill${_achFilter==='locked'?' active':''}" onclick="_achFilter='locked';renderAchCards()"><i class="ph ph-lock"></i> Locked <span class="ach-pill-count">${finalBadges.length-earnedCount}</span></button>
      ${Object.entries(CATS).map(([k,c])=>`<button class="ach-pill${_achFilter===k?' active':''}" onclick="_achFilter='${k}';renderAchCards()"><i class="ph ${c.icon}"></i> ${c.label.split(' ')[1]}</button>`).join('')}
    </div>
    <div class="ach-filter-right">
      <div class="ach-search-wrap"><i class="ph ph-magnifying-glass"></i><input class="ach-search" placeholder="Search badges..." oninput="_achSearch=this.value;renderAchCards()"></div>
    </div>
  </div>`;

  html += `<div id="ach-grid-container"></div>`;
  container.innerHTML = html;

  // Store badges for filtering
  window._achBadges = finalBadges;
  renderAchCards();
}

function renderAchCards() {
  const container = document.getElementById('ach-grid-container');
  if (!container || !window._achBadges) return;
  let list = [...window._achBadges];

  // Filter
  if (_achFilter === 'earned') list = list.filter(b=>(b.val||0)>=b.req);
  else if (_achFilter === 'locked') list = list.filter(b=>(b.val||0)<b.req);
  else if (CATS[_achFilter]) list = list.filter(b=>b.cat===_achFilter);

  // Search
  if (_achSearch) {
    const q = _achSearch.toLowerCase();
    list = list.filter(b=>b.title.toLowerCase().includes(q)||b.desc.toLowerCase().includes(q));
  }

  if (!list.length) {
    container.innerHTML = `<div class="ach-empty"><i class="ph ph-trophy" style="font-size:2rem;color:var(--gray-300)"></i><p>No badges match your filter</p></div>`;
    return;
  }

  let html = '<div class="ach-grid">';
  for (const b of list) {
    const earned = (b.val||0) >= b.req;
    const progress = Math.min(Math.round(((b.val||0)/b.req)*100), 100);
    const t = TIERS[b.tier];
    const cat = CATS[b.cat];

    html += `<div class="ach-card ${earned?'ach-earned':'ach-locked'} ach-tier-${b.tier}" title="${b.desc}">
      <div class="ach-card-badge" style="--tier-gradient:${t.gradient};--tier-glow:${t.glow}">
        <div class="ach-badge-bg${earned?' ach-badge-unlocked':''}"><i class="ph${earned?'-fill':''} ${b.icon}"></i></div>
        ${earned?`<div class="ach-badge-check"><i class="ph-fill ph-check-circle"></i></div>`:''}
      </div>
      <div class="ach-card-info">
        <div class="ach-card-title">${b.title}</div>
        <div class="ach-card-desc">${b.desc}</div>
        <div class="ach-card-progress-row">
          <div class="ach-card-bar"><div class="ach-card-fill" style="width:${progress}%;background:${earned?t.gradient:'var(--gray-200)'}"></div></div>
          <span class="ach-card-pct">${Math.min(b.val||0,b.req)}/${b.req}</span>
        </div>
      </div>
      <div class="ach-card-tier"><span style="color:${t.text}">${t.label}</span></div>
    </div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

// ======================== SUBJECT MODALS ========================
function showCreateSubjectModal() {
  const cols=['#6C5CE7','#3B82F6','#10B981','#F97316','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
  showModal('<i class="ph ph-books"></i> Add Subject',`
    <div class="form-group"><label>Name *</label><input type="text" id="cs-name" class="form-input" placeholder="e.g. Mathematics" required maxlength="100" autofocus></div>
    <div class="form-group"><label>Description</label><input type="text" id="cs-desc" class="form-input" placeholder="Brief description" maxlength="200"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Exam Date</label><input id="cs-exam" type="date" class="form-input"></div>
      <div class="form-group"><label>Color</label><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${cols.map(c=>`<div style="width:28px;height:28px;border-radius:8px;background:${c};cursor:pointer;border:2px solid transparent" onclick="this.parentElement.querySelectorAll('div').forEach(d=>d.style.borderColor='transparent');this.style.borderColor='#fff';document.getElementById('cs-color').value='${c}'"></div>`).join('')}<input type="hidden" id="cs-color" value="${cols[0]}"></div></div>
    </div>`,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateSubject()"><i class="ph ph-plus"></i> Create</button>`);
}
async function doCreateSubject() {
  const n = document.getElementById('cs-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const res = await API.createSubject({
    name: n,
    description: document.getElementById('cs-desc')?.value || '',
    exam_date: document.getElementById('cs-exam')?.value || '',
    color: document.getElementById('cs-color')?.value || '#6C5CE7'
  });
  if (res && res.error) return;
  closeModal(); showToast('Subject created ✓');
  await API.awardXP(10, 'subject_created');
  renderStudyTab(); loadStudyStats();
}
async function showEditSubjectModal(id) {
  const s=_studySubjects.find(x=>x._id===id);if(!s)return;
  const cols=['#6C5CE7','#3B82F6','#10B981','#F97316','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
  showModal('<i class="ph ph-pencil-simple"></i> Edit Subject',`
    <div class="form-group"><label>Name *</label><input type="text" id="es-name" class="form-input" value="${escapeHtml(s.name)}" required maxlength="100"></div>
    <div class="form-group"><label>Description</label><input type="text" id="es-desc" class="form-input" value="${escapeHtml(s.description||'')}" maxlength="200"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Exam Date</label><input id="es-exam" type="date" class="form-input" value="${s.exam_date||''}"></div>
      <div class="form-group"><label>Color</label><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${cols.map(c=>`<div style="width:28px;height:28px;border-radius:8px;background:${c};cursor:pointer;border:2px solid ${c===s.color?'#fff':'transparent'}" onclick="this.parentElement.querySelectorAll('div').forEach(d=>d.style.borderColor='transparent');this.style.borderColor='#fff';document.getElementById('es-color').value='${c}'"></div>`).join('')}<input type="hidden" id="es-color" value="${s.color||cols[0]}"></div></div>
    </div>`,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doUpdateSubject('${id}')"><i class="ph ph-floppy-disk"></i> Save</button>`);
}
async function doUpdateSubject(id) {
  const n = document.getElementById('es-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const res = await API.updateSubject(id, {
    name: n,
    description: document.getElementById('es-desc')?.value || '',
    exam_date: document.getElementById('es-exam')?.value || '',
    color: document.getElementById('es-color')?.value
  });
  if (res && res.error) return;
  closeModal(); showToast('Subject updated ✓');
  renderStudyTab(); loadStudyStats();
}
function confirmDeleteSubject(id){showModal('Delete Subject?','<p style="color:var(--gray-500);font-size:.85rem">This will permanently delete the subject and ALL its topics.</p>',`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--error);color:#fff" onclick="doDeleteSubject('${id}')"><i class="ph ph-trash"></i> Delete</button>`);}
async function doDeleteSubject(id) {
  const res = await API.deleteSubject(id);
  if (res && res.error) return;
  closeModal(); showToast('Subject deleted');
  renderStudyTab(); loadStudyStats();
}

// ======================== TOPIC MODALS ========================
async function showAddTopicModal(sid) {
  const subj=_studySubjects.find(s=>s._id===sid)||{name:'Subject'};
  showModal(`<i class="ph ph-list-checks"></i> Add Topic — ${escapeHtml(subj.name)}`,`
    <div class="form-group"><label>Topic Name *</label><input type="text" id="tp-name" class="form-input" placeholder="e.g. Arrays & Sorting" required maxlength="100" autofocus></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="tp-status" class="form-input"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div>
      <div class="form-group"><label>Difficulty</label><select id="tp-diff" class="form-input"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div>
    </div>
    <div class="form-group"><label>Resources (Label | URL per line)</label><textarea id="tp-res" class="form-input" rows="3" placeholder="Khan Academy | https://..." maxlength="1000"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateTopic('${sid}')"><i class="ph ph-plus"></i> Create</button>`);
}
async function doCreateTopic(sid) {
  const n = document.getElementById('tp-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const resStr = (document.getElementById('tp-res')?.value||'').split('\n').filter(l=>l.trim()).map(l=>{const[a,b]=l.split('|').map(x=>x.trim());return b?{label:a,url:b}:{label:l.trim(),url:l.trim()};});
  const res = await API.createTopic({ subject_id: sid, name: n, status: document.getElementById('tp-status')?.value, difficulty: document.getElementById('tp-diff')?.value, resources: resStr });
  if (res && res.error) return;
  closeModal(); showToast('Topic created ✓');
  await API.awardXP(5, 'topic_created');
  renderStudyTab(); loadStudyStats();
}
function showCreateTopicModalGlobal() {
  if(!_studySubjects.length){showToast('Create a subject first','error');return;}
  showModal('<i class="ph ph-list-checks"></i> Add Topic',`
    <div class="form-group"><label>Subject *</label><select id="tp-subj" class="form-input">${_studySubjects.map(s=>`<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>Topic Name *</label><input type="text" id="tp-name" class="form-input" placeholder="Topic name..." required maxlength="100" autofocus></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="tp-status" class="form-input"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div>
      <div class="form-group"><label>Difficulty</label><select id="tp-diff" class="form-input"><option>Easy</option><option selected>Medium</option><option>Hard</option></select></div>
    </div>`,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateTopicGlobal()"><i class="ph ph-plus"></i> Create</button>`);
}
async function doCreateTopicGlobal() {
  const sid = document.getElementById('tp-subj')?.value;
  const n = document.getElementById('tp-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const res = await API.createTopic({ subject_id: sid, name: n, status: document.getElementById('tp-status')?.value, difficulty: document.getElementById('tp-diff')?.value });
  if (res && res.error) return;
  closeModal(); showToast('Topic created ✓');
  await API.awardXP(5, 'topic_created');
  renderStudyTab(); loadStudyStats();
}

async function showTopicDetailModal(tid,sid) {
  const h={Authorization:`Bearer ${localStorage.getItem('token')}`};
  const t=await(await fetch(`/api/study/topics/${tid}`,{headers:h})).json();
  const subj=_studySubjects.find(s=>s._id===sid||s._id===String(t.subject_id));const res=safeArr(t.resources);
  showModal(`<i class="ph ph-book-open"></i> ${escapeHtml(t.name)}`,`
    <div class="st-detail-grid">
      <div class="st-detail-row"><div class="st-detail-label">Subject</div><div>${subj?`<span class="st-subj-pill" style="border-color:${subj.color};color:${subj.color}">${escapeHtml(subj.name)}</span>`:'-'}</div></div>
      <div class="st-detail-row"><div class="st-detail-label">Status</div><div class="st-status-selector">${['Not Started','In Progress','Completed'].map(s=>`<button class="st-status-opt${t.status===s?' active':''}" onclick="updateTopicField('${tid}','status','${s}',this)" style="--sc:${s==='Completed'?'var(--success)':s==='In Progress'?'#3B82F6':'var(--gray-400)'}">${s}</button>`).join('')}</div></div>
      <div class="st-detail-row"><div class="st-detail-label">Difficulty</div><div class="st-status-selector">${['Easy','Medium','Hard'].map(d=>`<button class="st-status-opt${t.difficulty===d?' active':''}" onclick="updateTopicField('${tid}','difficulty','${d}',this)" style="--sc:${d==='Easy'?'var(--success)':d==='Hard'?'var(--error)':'#F97316'}">${d}</button>`).join('')}</div></div>
      <div class="st-detail-row"><div class="st-detail-label">Resources</div><div>${res.length?res.map(r=>`<a href="${escapeHtml(r.url)}" target="_blank" class="st-resource-link-card"><i class="ph ph-arrow-square-out"></i> ${escapeHtml(r.label||r.url)}</a>`).join(''):'<span style="color:var(--gray-400);font-size:.75rem">None</span>'}</div></div>
    </div>`,`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline" onclick="closeModal();showEditTopicModal('${tid}','${sid}')"><i class="ph ph-pencil-simple"></i> Edit</button><button class="btn btn-outline" onclick="confirmDeleteTopic('${tid}')" style="color:var(--error)"><i class="ph ph-trash"></i></button>`);
}
async function updateTopicField(tid, f, v, btn) {
  const res = await API.updateTopic(tid, { [f]: v });
  if (res && res.error) return;
  btn.parentElement.querySelectorAll('.st-status-opt').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if (f === 'status' && v === 'Completed') {
    await API.awardXP(25, 'topic_completed'); showToast('🎉 +25 XP!');
  } else { showToast(`${f} → ${v}`); }
  loadStudyStats();
}

async function showEditTopicModal(tid,sid) {
  const h={Authorization:`Bearer ${localStorage.getItem('token')}`};
  const t=await(await fetch(`/api/study/topics/${tid}`,{headers:h})).json();
  const rt=(t.resources||[]).map(r=>`${r.label||r.url} | ${r.url}`).join('\n');
  showModal('<i class="ph ph-pencil-simple"></i> Edit Topic',`
    <div class="form-group"><label>Name *</label><input type="text" id="etp-name" class="form-input" value="${escapeHtml(t.name)}" required maxlength="100"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="etp-status" class="form-input">${['Not Started','In Progress','Completed'].map(s=>`<option${t.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label>Difficulty</label><select id="etp-diff" class="form-input">${['Easy','Medium','Hard'].map(d=>`<option${t.difficulty===d?' selected':''}>${d}</option>`).join('')}</select></div>
    </div>
    <div class="form-group"><label>Resources (Label | URL per line)</label><textarea id="etp-res" class="form-input" rows="3" maxlength="1000">${escapeHtml(rt)}</textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doUpdateTopic('${tid}')"><i class="ph ph-floppy-disk"></i> Save</button>`);
}
async function doUpdateTopic(tid) {
  const n = document.getElementById('etp-name')?.value.trim();
  if (!n) { showToast('Name required', 'error'); return; }
  const resStr = (document.getElementById('etp-res')?.value||'').split('\n').filter(l=>l.trim()).map(l=>{const p=l.split('|').map(x=>x.trim());return p[1]?{label:p[0],url:p[1]}:{label:l.trim(),url:l.trim()};});
  const res = await API.updateTopic(tid, { name: n, status: document.getElementById('etp-status')?.value, difficulty: document.getElementById('etp-diff')?.value, resources: resStr });
  if (res && res.error) return;
  closeModal(); showToast('Topic updated ✓');
  renderStudyTab(); loadStudyStats();
}
function confirmDeleteTopic(id){showModal('Delete Topic?','<p style="color:var(--gray-500);font-size:.85rem">Permanently delete this topic?</p>',`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--error);color:#fff" onclick="doDeleteTopic('${id}')"><i class="ph ph-trash"></i> Delete</button>`);}
async function doDeleteTopic(id) {
  const res = await API.deleteTopic(id);
  if (res && res.error) return;
  closeModal(); showToast('Topic deleted');
  renderStudyTab(); loadStudyStats();
}

// ======================== NOTE MODALS V2 ========================
async function showNoteViewModal(nid) {
  const h={Authorization:`Bearer ${localStorage.getItem('token')}`};
  const n=await(await fetch(`/api/study/notes/${nid}`,{headers:h})).json();
  const subj=_studySubjects.find(s=>s._id===String(n.subject_id));
  const date=n.updated_at?new Date(n.updated_at).toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  const created=n.created_at?new Date(n.created_at).toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'}):'';
  const wc=wordCount(n.content);
  const tags=safeArr(n.tags);
  const isPinned=n.is_pinned;

  showModal(`<i class="ph ph-note-pencil"></i> ${escapeHtml(n.title||'Untitled')}`,`
    <div class="nt-view-meta">
      ${subj?`<span class="nt-view-badge" style="color:${subj.color};border-color:${subj.color}"><i class="ph ph-books"></i> ${escapeHtml(subj.name)}</span>`:''}
      <span class="nt-view-badge"><i class="ph ph-clock"></i> ${date}</span>
      <span class="nt-view-badge"><i class="ph ph-text-aa"></i> ${wc} words</span>
      ${isPinned?'<span class="nt-view-badge" style="color:#F59E0B;border-color:#F59E0B"><i class="ph-fill ph-push-pin"></i> Pinned</span>':''}
    </div>
    ${tags.length?`<div class="nt-view-tags">${tags.map(t=>`<span class="nt-tag">#${escapeHtml(t)}</span>`).join('')}</div>`:''}
    <div class="nt-view-content rne-view">${n.content||'<p style="color:var(--gray-400)">Empty note</p>'}</div>
    ${created!==date?`<div class="nt-view-created">Created ${created}</div>`:''}`,
    `<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-outline" onclick="closeModal();toggleNotePin('${nid}')"><i class="ph${isPinned?'-fill':''} ph-push-pin"></i> ${isPinned?'Unpin':'Pin'}</button><button class="btn btn-outline" onclick="closeModal();showEditNoteModal('${nid}')"><i class="ph ph-pencil-simple"></i> Edit</button><button class="btn btn-outline" onclick="confirmDeleteNote('${nid}')" style="color:var(--error)"><i class="ph ph-trash"></i></button>`);
}

function showCreateNoteModal(){
  const editor = buildNoteEditor('', 'create-note-editor');
  showModal('<i class="ph ph-note-pencil"></i> New Note',`
    <div class="form-group"><label>Title *</label><input type="text" id="cn-title" class="form-input" placeholder="Note title..." required maxlength="100" autofocus></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Subject</label><select id="cn-subj" class="form-input"><option value="">None</option>${_studySubjects.map(s=>`<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Tags <span style="font-weight:400;color:var(--gray-400)">(comma separated)</span></label><input type="text" id="cn-tags" class="form-input" placeholder="react, hooks, state..." maxlength="200"></div>
    </div>
    <div class="form-group"><label>Content</label><div class="rne-container">${editor}</div></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateNote()"><i class="ph ph-floppy-disk"></i> Save</button>`);
}

async function doCreateNote(){
  const t=document.getElementById('cn-title')?.value.trim();
  if(!t){showToast('Title required','error');return;}
  const editors=document.querySelectorAll('.rne-editor');
  const editor=editors[editors.length-1];
  const content=editor?editor.innerHTML:'';
  const tagsRaw=document.getElementById('cn-tags')?.value||'';
  const tags=tagsRaw.split(',').map(t=>t.trim()).filter(Boolean);
  const d={title:t,content:content,subject_id:document.getElementById('cn-subj')?.value||'',tags:tags};
  const res = await API.createNote(d);
  if (res && res.error) return;
  closeModal();showToast('Note saved ✓');
  await API.awardXP(5,'note_created');
  renderStudyTab();
}

async function showEditNoteModal(nid){
  const h={Authorization:`Bearer ${localStorage.getItem('token')}`};
  const n=await(await fetch(`/api/study/notes/${nid}`,{headers:h})).json();
  const editor = buildNoteEditor(n.content||'', 'edit-note-editor');
  const tags=safeArr(n.tags).join(', ');
  showModal('<i class="ph ph-pencil-simple"></i> Edit Note',`
    <div class="form-group"><label>Title *</label><input type="text" id="en-title" class="form-input" value="${escapeHtml(n.title||'')}" required maxlength="100"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Subject</label><select id="en-subj" class="form-input"><option value="">None</option>${_studySubjects.map(s=>`<option value="${s._id}"${String(n.subject_id)===s._id?' selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Tags <span style="font-weight:400;color:var(--gray-400)">(comma separated)</span></label><input type="text" id="en-tags" class="form-input" value="${escapeHtml(tags)}" maxlength="200"></div>
    </div>
    <div class="form-group"><label>Content</label><div class="rne-container">${editor}</div></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doUpdateNote('${nid}')"><i class="ph ph-floppy-disk"></i> Save</button>`);
}

async function doUpdateNote(nid){
  const t=document.getElementById('en-title')?.value.trim();
  if(!t){showToast('Title required','error');return;}
  const editors=document.querySelectorAll('.rne-editor');
  const editor=editors[editors.length-1];
  const content=editor?editor.innerHTML:'';
  const tagsRaw=document.getElementById('en-tags')?.value||'';
  const tags=tagsRaw.split(',').map(t=>t.trim()).filter(Boolean);
  const res = await API.updateNote(nid,{title:t,content:content,subject_id:document.getElementById('en-subj')?.value||'',tags:tags});
  if (res && res.error) return;
  closeModal();showToast('Note updated ✓');renderStudyTab();
}

function confirmDeleteNote(nid){showModal('Delete Note?','<p style="color:var(--gray-500);font-size:.85rem">Permanently delete this note?</p>',`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn" style="background:var(--error);color:#fff" onclick="doDeleteNote('${nid}')"><i class="ph ph-trash"></i> Delete</button>`);}
async function doDeleteNote(nid) {
  const res = await API.deleteNote(nid);
  if (res && res.error) return;
  closeModal(); showToast('Note deleted'); renderStudyTab();
}

// ======================== GOAL MODALS V2 ========================
function showCreateGoalModal(){
  showModal('<i class="ph ph-target"></i> New Goal',`
    <div class="form-group"><label>Title *</label><input type="text" id="cg-title" class="form-input" placeholder="e.g. Complete Chapter 5" required maxlength="100" autofocus></div>
    <div class="form-group"><label>Description</label><textarea id="cg-desc" class="form-input" rows="2" placeholder="What do you want to achieve?" maxlength="250"></textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Subject</label><select id="cg-subj" class="form-input"><option value="">General</option>${_studySubjects.map(s=>`<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Due Date</label><input id="cg-due" type="date" class="form-input"></div>
    </div>
    <div class="form-group"><label>Priority</label><div class="gl-priority-picker">
      <button type="button" class="gl-prio-opt active" data-prio="normal" onclick="pickGoalPrio(this)"><i class="ph ph-minus"></i> Normal</button>
      <button type="button" class="gl-prio-opt" data-prio="high" onclick="pickGoalPrio(this)"><i class="ph ph-arrow-up"></i> High</button>
      <button type="button" class="gl-prio-opt" data-prio="critical" onclick="pickGoalPrio(this)"><i class="ph ph-fire"></i> Critical</button>
    </div></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreateGoal()"><i class="ph ph-plus"></i> Create</button>`);
}

function pickGoalPrio(btn) {
  btn.closest('.gl-priority-picker').querySelectorAll('.gl-prio-opt').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}

async function doCreateGoal(){
  const t=document.getElementById('cg-title')?.value.trim();
  if(!t){showToast('Title required','error');return;}
  const prio=document.querySelector('.gl-prio-opt.active')?.dataset.prio||'normal';
  const res = await API.createGoal({
    title:t,
    description:document.getElementById('cg-desc')?.value||'',
    subject_id:document.getElementById('cg-subj')?.value||'',
    due_date:document.getElementById('cg-due')?.value||'',
    status:'Pending',
    priority:prio
  });
  if (res && res.error) return;
  closeModal();showToast('Goal created ✓');await API.awardXP(10,'goal_created');renderStudyTab();loadStudyStats();
}

async function showEditGoalModal(gid){
  const h={Authorization:`Bearer ${localStorage.getItem('token')}`};
  const g=await(await fetch(`/api/study/goals/${gid}`,{headers:h})).json();
  const prio=g.priority||'normal';
  showModal('<i class="ph ph-pencil-simple"></i> Edit Goal',`
    <div class="form-group"><label>Title *</label><input type="text" id="eg-title" class="form-input" value="${escapeHtml(g.title||'')}" required maxlength="100"></div>
    <div class="form-group"><label>Description</label><textarea id="eg-desc" class="form-input" rows="2" maxlength="250">${escapeHtml(g.description||'')}</textarea></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Subject</label><select id="eg-subj" class="form-input"><option value="">General</option>${_studySubjects.map(s=>`<option value="${s._id}"${String(g.subject_id)===s._id?' selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select></div>
      <div class="form-group"><label>Due Date</label><input id="eg-due" type="date" class="form-input" value="${g.due_date||''}"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="form-group"><label>Status</label><select id="eg-status" class="form-input">${['Pending','In Progress','Completed'].map(s=>`<option${g.status===s?' selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-group"><label>Priority</label><div class="gl-priority-picker">
        <button type="button" class="gl-prio-opt${prio==='normal'?' active':''}" data-prio="normal" onclick="pickGoalPrio(this)"><i class="ph ph-minus"></i> Normal</button>
        <button type="button" class="gl-prio-opt${prio==='high'?' active':''}" data-prio="high" onclick="pickGoalPrio(this)"><i class="ph ph-arrow-up"></i> High</button>
        <button type="button" class="gl-prio-opt${prio==='critical'?' active':''}" data-prio="critical" onclick="pickGoalPrio(this)"><i class="ph ph-fire"></i> Critical</button>
      </div></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doUpdateGoal('${gid}')"><i class="ph ph-floppy-disk"></i> Save</button>`);
}

async function doUpdateGoal(gid){
  const t=document.getElementById('eg-title')?.value.trim();
  if(!t){showToast('Title required','error');return;}
  const prio=document.querySelector('.gl-prio-opt.active')?.dataset.prio||'normal';
  const res = await API.updateGoal(gid,{
    title:t,
    description:document.getElementById('eg-desc')?.value||'',
    subject_id:document.getElementById('eg-subj')?.value||'',
    due_date:document.getElementById('eg-due')?.value||'',
    status:document.getElementById('eg-status')?.value||'Pending',
    priority:prio
  });
  if (res && res.error) return;
  closeModal();showToast('Goal updated ✓');renderStudyTab();loadStudyStats();
}

// ======================== PATH MODALS ========================
function showCreatePathModal(){showModal('<i class="ph ph-path"></i> Create Learning Path',`
    <div class="form-group"><label>Path Title *</label><input type="text" id="cp-title" class="form-input" placeholder="e.g. Master React.js" required maxlength="100" autofocus></div>
    <div class="form-group"><label>Description</label><textarea id="cp-desc" class="form-input" rows="2" placeholder="What will you learn?" maxlength="250"></textarea></div>
    <div class="form-group"><label>Subject</label><select id="cp-subj" class="form-input"><option value="">None</option>${_studySubjects.map(s=>`<option value="${s._id}">${escapeHtml(s.name)}</option>`).join('')}</select></div>
    <div class="form-group"><label>Checkpoints (Title | XP per line)</label><textarea id="cp-checks" class="form-input" rows="5" placeholder="Introduction | 25\nBasics | 50\nProject | 75\nAssessment | 100" maxlength="2000"></textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doCreatePath()"><i class="ph ph-plus"></i> Create Path</button>`);}

async function doCreatePath() {
  const t = document.getElementById('cp-title')?.value.trim();
  if (!t) { showToast('Title required', 'error'); return; }
  const raw = document.getElementById('cp-checks')?.value || '';
  const cps = raw.split('\n').filter(l => l.trim()).map(l => {
    const [a, x] = l.split('|').map(s => s.trim());
    return { title: a, reward_xp: parseInt(x) || 50, completed: false };
  });
  const res = await API.createPath({ title: t, description: document.getElementById('cp-desc')?.value || '', subject_id: document.getElementById('cp-subj')?.value || '', checkpoints: cps });
  if (res && res.error) return;
  closeModal(); showToast('Path created ✓');
  await API.awardXP(15, 'path_created'); renderStudyTab();
}

async function showEditPathModal(pid){const h={Authorization:`Bearer ${localStorage.getItem('token')}`};const p=await(await fetch(`/api/study/paths/${pid}`,{headers:h})).json();const cks=(p.checkpoints||[]).map(c=>`${c.title||'Checkpoint'} | ${c.reward_xp||50}`).join('\n');showModal('<i class="ph ph-pencil-simple"></i> Edit Path',`
    <div class="form-group"><label>Title *</label><input type="text" id="ep-title" class="form-input" value="${escapeHtml(p.title||p.name||'')}" required maxlength="100"></div>
    <div class="form-group"><label>Description</label><textarea id="ep-desc" class="form-input" rows="2" maxlength="250">${escapeHtml(p.description||'')}</textarea></div>
    <div class="form-group"><label>Checkpoints (Title | XP per line)</label><textarea id="ep-checks" class="form-input" rows="5" maxlength="2000">${escapeHtml(cks)}</textarea></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doUpdatePath('${pid}')"><i class="ph ph-floppy-disk"></i> Save</button>`);}

async function doUpdatePath(pid) {
  const t = document.getElementById('ep-title')?.value.trim();
  if (!t) { showToast('Title required', 'error'); return; }
  const raw = document.getElementById('ep-checks')?.value || '';
  const cps = raw.split('\n').filter(l => l.trim()).map(l => {
    const [a, x] = l.split('|').map(s => s.trim());
    return { title: a, reward_xp: parseInt(x) || 50, completed: false };
  });
  const res = await API.updatePath(pid, { title: t, description: document.getElementById('ep-desc')?.value || '', checkpoints: cps, status: 'Not Started', total_xp: 0 });
  if (res && res.error) return;
  closeModal(); showToast('Path updated ✓'); renderStudyTab();
}

// ======================== LOG TIME MODAL ========================
function showLogTimeModal(){showModal('<i class="ph ph-timer"></i> Log Study Time',`
    <div class="form-group"><label>Minutes Studied *</label><input id="lt-min" type="number" class="form-input" placeholder="e.g. 45" min="1" max="480" autofocus required></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${[15,30,45,60,90,120].map(m=>`<button class="btn btn-sm btn-outline" onclick="document.getElementById('lt-min').value=${m}">${m}m</button>`).join('')}</div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="doLogTime()"><i class="ph ph-fire"></i> Log Time</button>`);}

async function doLogTime() {
  const m = parseInt(document.getElementById('lt-min')?.value);
  if (!m || m < 1) { showToast('Enter valid minutes', 'error'); return; }
  const res = await API.logStudyTime({ minutes: m });
  if (res && res.error) return;
  const xp = Math.round(m / 5);
  await API.awardXP(xp, 'study_time');
  closeModal(); showToast(`+${m} min logged 🔥 +${xp} XP`);
  renderStudyTab(); loadStudyStats();
}
