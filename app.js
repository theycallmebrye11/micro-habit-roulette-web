;(() => {
  'use strict';

  // ==================== Defaults ====================
  const DEFAULTS = [
    'Drink a glass of water',
    'Do 5 stretching exercises',
    'Tidy one surface',
    'Write down 3 things you\'re grateful for',
    'Take 10 deep breaths',
  ];

  const STORAGE_KEY = 'mhr_data';
  const TIMER_DURATION = 120; // seconds
  const SPIN_DURATION = 1500; // ms
  const TICK_INTERVAL = 80;   // ms

  // ==================== State ====================
  let state = {
    habits: [],
    streak: 0,
    totalCompleted: 0,
    lastCompletedDate: null,
    isSpinning: false,
    isTimerRunning: false,
    isComplete: false,
    selectedHabit: null,
    remaining: TIMER_DURATION,
    cyclingText: '',
    timerId: null,
    spinTimerId: null,
  };

  let darkMode = false;

  // ==================== DOM refs ====================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const themeToggle = $('#theme-toggle');
  const navItems = $$('.nav-item');
  const screens = {
    roulette: $('#screen-roulette'),
    habits: $('#screen-habits'),
    stats: $('#screen-stats'),
  };

  // Roulette
  const rouletteEmpty = $('#roulette-empty');
  const rouletteIdle = $('#roulette-idle');
  const rouletteSpinning = $('#roulette-spinning');
  const rouletteActive = $('#roulette-active');
  const activeCircle = $('#active-circle');
  const spinBtn = $('#spin-btn');
  const cyclingText = $('#cycling-text');
  const activeHabitName = $('#active-habit-name');
  const activeTimer = $('#active-timer');
  const activeComplete = $('#active-complete');
  const actionButtons = $('#action-buttons');
  const skipBtn = $('#skip-btn');
  const doneBtn = $('#done-btn');

  // Habits
  const habitsList = $('#habits-list');
  const habitsEmpty = $('#habits-empty');
  const habitCount = $('#habit-count');
  const showAddBtn = $('#show-add-btn');
  const addForm = $('#add-habit-form');
  const habitInput = $('#habit-input');
  const saveHabitBtn = $('#save-habit-btn');
  const cancelHabitBtn = $('#cancel-habit-btn');

  // Stats
  const streakValue = $('#streak-value');
  const streakUnit = $('#streak-unit');
  const totalValue = $('#total-value');
  const totalUnit = $('#total-unit');
  const appTitle = $('#app-title');

  // ==================== Persistence ====================
  function saveState() {
    const data = {
      habits: state.habits,
      streak: state.streak,
      totalCompleted: state.totalCompleted,
      lastCompletedDate: state.lastCompletedDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        state.habits = data.habits || [];
        state.streak = data.streak || 0;
        state.totalCompleted = data.totalCompleted || 0;
        state.lastCompletedDate = data.lastCompletedDate || null;
      } catch {
        seedDefaults();
      }
    } else {
      seedDefaults();
    }
  }

  function seedDefaults() {
    state.habits = DEFAULTS.map((name, i) => ({
      id: Date.now() + i,
      name,
      createdAt: new Date().toISOString(),
    }));
    state.streak = 0;
    state.totalCompleted = 0;
    state.lastCompletedDate = null;
    saveState();
  }

  // ==================== Theme ====================
  function toggleTheme() {
    darkMode = !darkMode;
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    const lightIcon = themeToggle.querySelector('.icon-light');
    const darkIcon = themeToggle.querySelector('.icon-dark');
    lightIcon.hidden = darkMode;
    darkIcon.hidden = !darkMode;
  }

  // ==================== Navigation ====================
  function navigate(screen) {
    $$('.screen').forEach((el) => el.classList.remove('active'));
    navItems.forEach((el) => el.classList.remove('active'));
    screens[screen].classList.add('active');
    const activeNav = document.querySelector(`[data-screen="${screen}"]`);
    if (activeNav) activeNav.classList.add('active');
  }

  // ==================== Habit CRUD ====================
  function addHabit(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (state.habits.some((h) => h.name === trimmed)) {
      showToast('This habit already exists!');
      return false;
    }
    state.habits.push({
      id: Date.now(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    });
    saveState();
    renderHabits();
    renderRoulette();
    return true;
  }

  function deleteHabit(id) {
    const idx = state.habits.findIndex((h) => h.id === id);
    if (idx === -1) return;
    const deleted = state.habits.splice(idx, 1)[0];
    saveState();
    renderHabits();
    renderRoulette();
    showToast(`"${deleted.name}" deleted`, () => {
      state.habits.splice(idx, 0, deleted);
      saveState();
      renderHabits();
      renderRoulette();
    });
  }

  // ==================== Habits Render ====================
  function renderHabits() {
    habitCount.textContent = `${state.habits.length} habit${state.habits.length !== 1 ? 's' : ''}`;
    const empty = state.habits.length === 0;
    habitsEmpty.hidden = !empty;

    habitsList.innerHTML = '';
    state.habits.forEach((habit) => {
      const li = document.createElement('li');
      li.className = 'habit-item';
      li.innerHTML = `
        <div class="habit-icon">✅</div>
        <span class="habit-name">${escapeHtml(habit.name)}</span>
        <button class="delete-btn" data-id="${habit.id}" aria-label="Delete">✕</button>
      `;
      li.querySelector('.delete-btn').addEventListener('click', () => {
        deleteHabit(habit.id);
      });
      habitsList.appendChild(li);
    });

    const hasSession = state.isSpinning || state.isTimerRunning || state.isComplete;
    showAddBtn.hidden = hasSession;
    addForm.hidden = true;
  }

  // ==================== Roulette Render ====================
  function renderRoulette() {
    const empty = state.habits.length === 0;
    const hasSession = state.isSpinning || state.isTimerRunning || state.isComplete;

    rouletteEmpty.hidden = !empty || hasSession;
    rouletteIdle.hidden = empty || hasSession;
    rouletteSpinning.hidden = !state.isSpinning;
    rouletteActive.hidden = !(state.isTimerRunning || state.isComplete);
    actionButtons.hidden = !(state.isTimerRunning || state.isComplete);
    showAddBtn.hidden = hasSession;

    if (state.isSpinning) {
      cyclingText.textContent = state.cyclingText;
    }

    if (state.isTimerRunning || state.isComplete) {
      activeHabitName.textContent = state.selectedHabit ? state.selectedHabit.name : '';
      if (state.isComplete) {
        activeCircle.classList.add('complete');
        activeTimer.hidden = true;
        activeComplete.hidden = false;
      } else {
        activeCircle.classList.remove('complete');
        activeTimer.hidden = false;
        activeComplete.hidden = true;
        activeTimer.textContent = formatTime(state.remaining);
      }
    }
  }

  // ==================== Roulette Logic ====================
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function spin() {
    if (state.habits.length === 0 || state.isSpinning || state.isTimerRunning) return;

    resetSession();
    state.isSpinning = true;
    state.isComplete = false;
    renderRoulette();

    const totalTicks = Math.floor(SPIN_DURATION / TICK_INTERVAL);
    let tick = 0;

    state.spinTimerId = setInterval(() => {
      const idx = Math.floor(Math.random() * state.habits.length);
      state.cyclingText = state.habits[idx].name;
      tick++;
      renderRoulette();

      if (tick >= totalTicks) {
        clearInterval(state.spinTimerId);
        state.spinTimerId = null;
        state.isSpinning = false;
        state.selectedHabit = state.habits[idx];
        state.remaining = TIMER_DURATION;
        state.isTimerRunning = true;
        renderRoulette();
        startTimer();
      }
    }, TICK_INTERVAL);
  }

  function startTimer() {
    state.timerId = setInterval(() => {
      if (state.remaining <= 0) {
        clearInterval(state.timerId);
        state.timerId = null;
        state.isTimerRunning = false;
        state.isComplete = true;
        renderRoulette();
        return;
      }
      state.remaining--;
      updateTimerDisplay();
    }, 1000);
  }

  function updateTimerDisplay() {
    if (state.isTimerRunning) {
      activeTimer.textContent = formatTime(state.remaining);
    }
  }

  function markDone() {
    if (!state.selectedHabit) return;

    state.totalCompleted++;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (state.lastCompletedDate === null) {
      state.streak = 1;
    } else {
      const last = new Date(state.lastCompletedDate);
      const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
      const diff = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        state.streak++;
      } else if (diff > 1) {
        state.streak = 1;
      }
    }

    state.lastCompletedDate = now.toISOString();
    saveState();
    renderStats();
    resetSession();
    renderRoulette();
    renderHabits();
  }

  function skip() {
    resetSession();
    renderRoulette();
    renderHabits();
  }

  function resetSession() {
    if (state.spinTimerId) {
      clearInterval(state.spinTimerId);
      state.spinTimerId = null;
    }
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    state.isSpinning = false;
    state.isTimerRunning = false;
    state.isComplete = false;
    state.selectedHabit = null;
    state.remaining = TIMER_DURATION;
    state.cyclingText = '';
  }

  // ==================== Stats Render ====================
  function renderStats() {
    streakValue.textContent = state.streak;
    streakUnit.textContent = state.streak === 1 ? 'day' : 'days';
    totalValue.textContent = state.totalCompleted;
    totalUnit.textContent = state.totalCompleted === 1 ? 'habit' : 'habits';
  }

  // ==================== Toast ====================
  function showToast(message, onUndo) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    if (onUndo) {
      const action = document.createElement('button');
      action.className = 'toast-action';
      action.textContent = 'Undo';
      action.addEventListener('click', () => {
        onUndo();
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      });
      toast.appendChild(action);
    }

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==================== Utility ====================
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== Event Listeners ====================

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Navigation
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      navigate(item.dataset.screen);
    });
  });

  // Spin
  spinBtn.addEventListener('click', spin);

  // Done / Skip
  doneBtn.addEventListener('click', markDone);
  skipBtn.addEventListener('click', skip);

  // Add habit form
  showAddBtn.addEventListener('click', () => {
    if (state.isSpinning || state.isTimerRunning) return;
    showAddBtn.hidden = true;
    addForm.hidden = false;
    habitInput.focus();
  });

  cancelHabitBtn.addEventListener('click', () => {
    addForm.hidden = true;
    showAddBtn.hidden = false;
    habitInput.value = '';
  });

  function submitHabit() {
    const val = habitInput.value;
    if (!val.trim()) {
      showToast('Habit cannot be empty!');
      return;
    }
    if (addHabit(val)) {
      habitInput.value = '';
      addForm.hidden = true;
      showAddBtn.hidden = false;
    }
  }

  saveHabitBtn.addEventListener('click', submitHabit);
  habitInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitHabit();
    if (e.key === 'Escape') {
      addForm.hidden = true;
      showAddBtn.hidden = false;
      habitInput.value = '';
    }
  });

  // ==================== Keyboard shortcuts ====================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!addForm.hidden) {
        addForm.hidden = true;
        showAddBtn.hidden = false;
        habitInput.value = '';
      }
    }
    if (e.key === ' ' && !state.isSpinning && !state.isTimerRunning && state.habits.length > 0) {
      const active = document.querySelector('.screen.active');
      if (active && active.id === 'screen-roulette') {
        e.preventDefault();
        spin();
      }
    }
  });

  // ==================== Init ====================
  function init() {
    loadState();
    renderHabits();
    renderRoulette();
    renderStats();
    navigate('roulette');
  }

  init();
})();
