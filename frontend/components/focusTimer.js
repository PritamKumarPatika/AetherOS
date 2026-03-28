class FocusTimer {
  constructor() {
    this.timeLeft = 25 * 60; // 25 mins
    this.timerId = null;
    this.isActive = false;
    this.initUI();
  }

  initUI() {
    // Inject CSS
    const style = document.createElement('style');
    style.innerHTML = `
      .focus-timer-widget {
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--card-bg);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(124, 58, 237, 0.3);
        padding: var(--space-4) var(--space-5);
        border-radius: var(--radius-xl);
        box-shadow: 0 10px 40px rgba(124, 58, 237, 0.2);
        z-index: 9999;
        display: none;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .focus-timer-widget.visible {
        display: flex;
        transform: translateY(0);
        opacity: 1;
      }
      .focus-timer-header {
        display: flex; justify-content: space-between; width: 100%; align-items: center;
      }
      .focus-timer-title { font-weight: 600; font-size: var(--font-sm); display: flex; align-items: center; gap: 6px; color: var(--primary-600); }
      .focus-timer-close { cursor: pointer; color: var(--gray-400); transition: color 0.2s; }
      .focus-timer-close:hover { color: var(--error); }
      .focus-timer-display {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--gray-800);
        font-variant-numeric: tabular-nums;
        letter-spacing: -1px;
      }
      .focus-timer-controls {
        display: flex; gap: var(--space-3); width: 100%;
      }
      .focus-btn {
        flex: 1; padding: var(--space-2); border: none; border-radius: var(--radius-md);
        font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 4px;
      }
      .btn-play { background: var(--primary-500); color: white; }
      .btn-play:hover { background: var(--primary-600); }
      .btn-stop { background: var(--gray-100); color: var(--gray-600); }
      .btn-stop:hover { background: var(--gray-200); }
    `;
    document.head.appendChild(style);

    // Inject DOM
    this.el = document.createElement('div');
    this.el.className = 'focus-timer-widget';
    this.el.innerHTML = `
      <div class="focus-timer-header">
        <div class="focus-timer-title"><i class="ph-fill ph-target"></i> Focus Session</div>
        <div class="focus-timer-close" onclick="window.focusTimer.hide()"><i class="ph ph-x"></i></div>
      </div>
      <div class="focus-timer-display" id="focus-time-display">25:00</div>
      <div class="focus-timer-controls">
        <button class="focus-btn btn-play" id="focus-toggle-btn" onclick="window.focusTimer.toggle()">
          <i class="ph-fill ph-play"></i> Start
        </button>
        <button class="focus-btn btn-stop" onclick="window.focusTimer.reset()">
          <i class="ph-fill ph-stop"></i> Reset
        </button>
      </div>
    `;
    document.body.appendChild(this.el);
    this.displayEl = document.getElementById('focus-time-display');
    this.toggleBtn = document.getElementById('focus-toggle-btn');
  }

  show() {
    this.el.style.display = 'flex';
    // Trigger reflow
    void this.el.offsetWidth;
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
    setTimeout(() => {
      if(!this.el.classList.contains('visible')) this.el.style.display = 'none';
    }, 400);
  }

  toggle() {
    if (this.isActive) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.timeLeft <= 0) this.reset();
    this.isActive = true;
    this.toggleBtn.innerHTML = '<i class="ph-fill ph-pause"></i> Pause';
    this.toggleBtn.style.background = 'var(--warning)';
    
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  pause() {
    this.isActive = false;
    clearInterval(this.timerId);
    this.toggleBtn.innerHTML = '<i class="ph-fill ph-play"></i> Resume';
    this.toggleBtn.style.background = 'var(--primary-500)';
  }

  reset() {
    this.pause();
    this.timeLeft = 25 * 60;
    this.updateDisplay();
    this.toggleBtn.innerHTML = '<i class="ph-fill ph-play"></i> Start';
  }

  complete() {
    this.pause();
    showToast('Focus session complete! Great work.', 'success');
    // We could log time here automatically if we wanted
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => {}); 
  }

  updateDisplay() {
    const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const s = (this.timeLeft % 60).toString().padStart(2, '0');
    this.displayEl.textContent = `${m}:${s}`;
    if (this.isActive) {
      document.title = `(${m}:${s}) AetherOS Focus`;
    } else {
      document.title = `AetherOS — AI Productivity Platform`;
    }
  }
}

// Initialize globally
document.addEventListener('DOMContentLoaded', () => {
  window.focusTimer = new FocusTimer();
});
