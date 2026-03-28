// AetherOS — Helper Utilities

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function priorityClass(priority) {
  return `badge-${(priority || 'medium').toLowerCase()}`;
}

function statusClass(status) {
  const map = { 'Todo': 'badge-todo', 'In Progress': 'badge-in-progress', 'Done': 'badge-done' };
  return map[status] || 'badge-todo';
}

function getInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function downloadBlob(response, filename) {
  response.blob().then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  });
}
