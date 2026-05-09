/* ==========================================================================
   Live Hard Tracker — app logic
   ========================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'liveHardState_v1';
  const STATE_VERSION = 1;

  /* ----- Phase + task definitions -------------------------------------- */

  const ICONS = {
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5C12 2.5 5.5 9.5 5.5 14.5a6.5 6.5 0 0 0 13 0c0-5-6.5-12-6.5-12z"/></svg>',
    reading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H11v18H5.5A1.5 1.5 0 0 1 4 19.5z"/><path d="M20 4.5A1.5 1.5 0 0 0 18.5 3H13v18h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
    workout1: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6 M6 6v12 M9 9v6 M15 9v6 M18 6v12 M21 9v6 M9 12h6"/></svg>',
    workout2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.5 4.5l1.4 1.4 M18.1 18.1l1.4 1.4 M4.5 19.5l1.4-1.4 M18.1 5.9l1.4-1.4"/></svg>',
    diet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3c-9 0-17 4-17 12 0 3 1 5 3 6 8 0 14-9 14-18z"/><path d="M4 21c0-7 6-12 12-13"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    coldShower: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20 M2 12h20 M5 5l14 14 M19 5L5 19"/></svg>',
    powerList: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11 M9 12h11 M9 18h11"/><path d="M4 6l1 1 2-2 M4 12l1 1 2-2 M4 18l1 1 2-2"/></svg>',
    visualization: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.7 2.1 2.1.9-2.1.7L19 20l-.7-2.3L16 17l2.3-.7z"/></svg>',
    stranger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8h-1l-5 3 1-4a8 8 0 1 1 13-7z"/></svg>',
    kindness: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 7.6a5.5 5.5 0 0 0-9.3-3.3l-.5.5-.5-.5a5.5 5.5 0 1 0-7.7 7.7l8.2 8.2 8.2-8.2a5.5 5.5 0 0 0 1.6-4.4z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  };

  const TASKS = {
    water: { label: 'Drink 1 gallon of water', detail: 'Plain water — no flavor, no carbonation.' },
    reading: { label: 'Read 10 pages', detail: 'Non-fiction, self-development. No audiobooks.' },
    workout1: { label: '45-min workout', detail: 'Indoor or outdoor — your choice.' },
    workout2: { label: '45-min outdoor workout', detail: 'Must be outside, regardless of weather.' },
    diet: { label: 'Follow your diet', detail: 'No alcohol. No cheat meals.' },
    photo: { label: 'Progress picture', detail: 'Same time, same place each day.' },
    coldShower: { label: '5-min cold shower', detail: 'Cold enough to be uncomfortable.' },
    powerList: { label: '3 critical power list tasks', detail: 'Important goals outside your normal routine.' },
    visualization: { label: '10-min visualization', detail: 'Vivid mental rehearsal of your goals.' },
    stranger: { label: 'Conversation with a stranger', detail: 'A real exchange — not just a greeting.' },
    kindness: { label: 'Random act of kindness', detail: 'Make it creative and meaningful.' },
  };

  const PHASES = {
    '75hard': {
      id: '75hard',
      name: '75 HARD',
      duration: 75,
      tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo'],
    },
    phase1: {
      id: 'phase1',
      name: 'Phase 1',
      duration: 30,
      tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo', 'coldShower', 'powerList', 'visualization'],
    },
    phase2: {
      id: 'phase2',
      name: 'Phase 2',
      duration: 30,
      tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo'],
    },
    phase3: {
      id: 'phase3',
      name: 'Phase 3',
      duration: 30,
      tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo', 'coldShower', 'powerList', 'stranger', 'kindness'],
    },
  };

  const PHASE_ORDER = ['75hard', 'phase1', 'phase2', 'phase3'];

  /* ----- Date utilities ------------------------------------------------ */

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const dateFromISO = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isoFromDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const addDays = (iso, n) => {
    const d = dateFromISO(iso);
    d.setDate(d.getDate() + n);
    return isoFromDate(d);
  };

  const daysBetween = (iso1, iso2) =>
    Math.round((dateFromISO(iso2) - dateFromISO(iso1)) / 86400000);

  const formatDate = (iso) => {
    const d = dateFromISO(iso);
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatShortDate = (iso) => {
    const d = dateFromISO(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  /* ----- State management --------------------------------------------- */

  const defaultState = () => ({
    version: STATE_VERSION,
    startDate: null,
    currentPhase: null, // null | '75hard' | 'phase1' | 'phase1-wait' | 'phase2' | 'phase3' | 'complete'
    phaseStartDate: null,
    phase1CompletedDate: null,
    days: { '75hard': {}, phase1: {}, phase2: {}, phase3: {} },
    settings: { theme: 'auto' },
  });

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (parsed.version !== STATE_VERSION) return defaultState();
      const def = defaultState();
      return { ...def, ...parsed, days: { ...def.days, ...(parsed.days || {}) }, settings: { ...def.settings, ...(parsed.settings || {}) } };
    } catch {
      return defaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }

  /* ----- Phase / day logic -------------------------------------------- */

  function getCurrentDayIndex() {
    if (!state.phaseStartDate) return -1;
    return daysBetween(state.phaseStartDate, todayISO());
  }

  function isDayComplete(phaseId, dayIndex) {
    const day = state.days[phaseId]?.[dayIndex];
    if (!day) return false;
    const required = PHASES[phaseId].tasks;
    return required.every((t) => day.tasks?.[t]);
  }

  function completedDaysCount(phaseId) {
    const phase = PHASES[phaseId];
    if (!phase) return 0;
    let count = 0;
    for (let i = 0; i < phase.duration; i++) {
      if (isDayComplete(phaseId, i)) count++;
    }
    return count;
  }

  function currentStreak() {
    if (!state.currentPhase || !PHASES[state.currentPhase]) return 0;
    const phaseId = state.currentPhase;
    const today = getCurrentDayIndex();
    if (today < 0) return 0;
    let streak = 0;
    for (let i = today; i >= 0; i--) {
      if (isDayComplete(phaseId, i)) streak++;
      else if (i < today) break; // today not yet complete is fine
    }
    return streak;
  }

  function isPhaseComplete(phaseId) {
    const phase = PHASES[phaseId];
    if (!phase) return false;
    return completedDaysCount(phaseId) === phase.duration;
  }

  function yearDeadlineISO() {
    if (!state.startDate) return null;
    return addDays(state.startDate, 365);
  }

  /* ----- DOM refs ----------------------------------------------------- */

  const $ = (sel) => document.querySelector(sel);
  const el = {
    welcome: $('#welcomeSection'),
    wait: $('#waitSection'),
    dashboard: $('#dashboardSection'),
    phaseName: $('#phaseName'),
    todayDateText: $('#todayDateText'),
    heroStatus: $('#heroStatus'),
    ringFill: $('#ringFill'),
    ringDay: $('#ringDay'),
    ringTotal: $('#ringTotal'),
    completeCount: $('#completeCount'),
    remainingCount: $('#remainingCount'),
    overallDay: $('#overallDay'),
    streak: $('#streak'),
    todayHeading: $('#todayHeading'),
    completionBadge: $('#completionBadge'),
    tasksContainer: $('#tasksContainer'),
    calendarHeading: $('#calendarHeading'),
    calendar: $('#calendar'),
    journey: $('#journey'),
    yearDeadline: $('#yearDeadline'),
    settingsSheet: $('#settingsSheet'),
    confirmModal: $('#confirmModal'),
    confirmTitle: $('#confirmTitle'),
    confirmBody: $('#confirmBody'),
    confirmOk: $('#confirmOk'),
    toast: $('#toast'),
    startDateInput: $('#startDateInput'),
    waitProgressFill: $('#waitProgressFill'),
    waitDaysDone: $('#waitDaysDone'),
    waitDaysLeft: $('#waitDaysLeft'),
    startPhase2Btn: $('#startPhase2Btn'),
    resetPhaseLabel: $('#resetPhaseLabel'),
    importInput: $('#importInput'),
  };

  /* ----- Rendering ---------------------------------------------------- */

  function render() {
    applyTheme();
    if (!state.currentPhase) {
      showSection('welcome');
      return;
    }
    if (state.currentPhase === 'phase1-wait') {
      showSection('wait');
      renderWait();
      return;
    }
    showSection('dashboard');
    renderHero();
    renderTasks();
    renderCalendar();
    renderJourney();
    autoAdvanceIfPossible();
  }

  function showSection(which) {
    el.welcome.hidden = which !== 'welcome';
    el.wait.hidden = which !== 'wait';
    el.dashboard.hidden = which !== 'dashboard';
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'auto');
    document.querySelectorAll('.segment[data-theme]').forEach((s) => {
      s.classList.toggle('active', s.dataset.theme === (state.settings.theme || 'auto'));
    });
  }

  function renderHero() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const dayIdx = getCurrentDayIndex();
    const dayNum = Math.max(1, Math.min(dayIdx + 1, phase.duration));
    const completed = completedDaysCount(state.currentPhase);
    const remaining = Math.max(0, phase.duration - completed);

    el.phaseName.textContent = phase.name;
    el.todayDateText.textContent = formatDate(todayISO());
    el.ringDay.textContent = dayNum;
    el.ringTotal.textContent = phase.duration;
    el.completeCount.textContent = completed;
    el.remainingCount.textContent = remaining;
    el.overallDay.textContent = state.startDate ? daysBetween(state.startDate, todayISO()) + 1 : '—';
    el.streak.textContent = currentStreak();

    const circumference = 2 * Math.PI * 52;
    const progress = completed / phase.duration;
    el.ringFill.style.strokeDashoffset = circumference * (1 - progress);

    // Status pill
    const status = el.heroStatus;
    status.classList.remove('failed', 'complete');
    if (isPhaseComplete(state.currentPhase)) {
      status.textContent = 'Phase complete';
      status.classList.add('complete');
    } else if (dayIdx >= phase.duration) {
      status.textContent = 'Past final day';
      status.classList.add('failed');
    } else if (dayIdx < 0) {
      status.textContent = 'Not started';
    } else {
      status.textContent = 'In progress';
    }

    // Year deadline
    const deadline = yearDeadlineISO();
    if (deadline) {
      const remain = daysBetween(todayISO(), deadline);
      el.yearDeadline.textContent = remain >= 0
        ? `${remain} days until year deadline`
        : `${-remain} days past deadline`;
    }
  }

  function renderTasks() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const dayIdx = getCurrentDayIndex();

    el.todayHeading.textContent = `Day ${Math.max(1, dayIdx + 1)} checklist`;

    if (dayIdx < 0) {
      el.tasksContainer.innerHTML = '<div class="settings-hint" style="text-align:center;padding:24px;">This phase hasn\'t started yet.</div>';
      el.completionBadge.textContent = '0 / ' + phase.tasks.length;
      return;
    }
    if (dayIdx >= phase.duration) {
      el.tasksContainer.innerHTML = '<div class="settings-hint" style="text-align:center;padding:24px;">All days for this phase have passed.</div>';
      el.completionBadge.textContent = '— / ' + phase.tasks.length;
      return;
    }

    const dayState = state.days[state.currentPhase][dayIdx] || { tasks: {} };
    const checkedCount = phase.tasks.filter((t) => dayState.tasks?.[t]).length;

    el.completionBadge.textContent = `${checkedCount} / ${phase.tasks.length}`;
    el.completionBadge.classList.toggle('complete', checkedCount === phase.tasks.length);

    el.tasksContainer.innerHTML = phase.tasks
      .map((taskId) => {
        const t = TASKS[taskId];
        const checked = !!dayState.tasks?.[taskId];
        return `
          <button class="task ${checked ? 'checked' : ''}" data-task="${taskId}" type="button" aria-pressed="${checked}">
            <span class="task-icon" aria-hidden="true">${ICONS[taskId]}</span>
            <span class="task-body">
              <span class="task-label">${t.label}</span>
              <span class="task-detail">${t.detail}</span>
            </span>
            <span class="task-check" aria-hidden="true">${ICONS.check}</span>
          </button>
        `;
      })
      .join('');

    el.tasksContainer.querySelectorAll('.task').forEach((btn) => {
      btn.addEventListener('click', () => toggleTodayTask(btn.dataset.task));
    });
  }

  function renderCalendar() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const dayIdx = getCurrentDayIndex();
    el.calendarHeading.textContent = `${phase.name} calendar`;
    const cells = [];
    for (let i = 0; i < phase.duration; i++) {
      const isComplete = isDayComplete(state.currentPhase, i);
      const isToday = i === dayIdx;
      const isFuture = i > dayIdx;
      const cls = ['cal-day'];
      if (isComplete) cls.push('complete');
      if (isToday) cls.push('today');
      else if (isFuture) cls.push('future');
      const dateLabel = state.phaseStartDate ? formatShortDate(addDays(state.phaseStartDate, i)) : '';
      const title = `Day ${i + 1}${dateLabel ? ' · ' + dateLabel : ''}${isComplete ? ' · Complete' : ''}`;
      cells.push(`<div class="${cls.join(' ')}" title="${title}">${i + 1}</div>`);
    }
    el.calendar.innerHTML = cells.join('');
  }

  function renderJourney() {
    el.journey.innerHTML = PHASE_ORDER.map((id, idx) => {
      const phase = PHASES[id];
      const completed = completedDaysCount(id);
      const isActive = state.currentPhase === id;
      const isDone = isPhaseComplete(id);
      const cls = ['phase-row'];
      if (isActive) cls.push('active');
      if (isDone) cls.push('complete');
      const pct = (completed / phase.duration) * 100;
      const stateText = isDone
        ? 'Done'
        : isActive
        ? `${completed} / ${phase.duration}`
        : completed > 0
        ? `${completed} / ${phase.duration}`
        : 'Locked';
      return `
        <div class="${cls.join(' ')}">
          <div class="phase-num">${idx + 1}</div>
          <div class="phase-info">
            <div class="phase-name">${phase.name}</div>
            <div class="phase-meta">${phase.duration} days · ${phase.tasks.length} daily tasks</div>
          </div>
          <div class="phase-bar"><div class="phase-bar-fill" style="width:${pct}%"></div></div>
          <div class="phase-state">${stateText}</div>
        </div>
      `;
    }).join('');
  }

  function renderWait() {
    if (!state.phase1CompletedDate) return;
    const elapsed = daysBetween(state.phase1CompletedDate, todayISO());
    const done = Math.max(0, Math.min(30, elapsed));
    const left = Math.max(0, 30 - done);
    el.waitDaysDone.textContent = done;
    el.waitDaysLeft.textContent = left;
    el.waitProgressFill.style.width = `${(done / 30) * 100}%`;
    el.startPhase2Btn.disabled = done < 30;
  }

  /* ----- Actions ------------------------------------------------------ */

  function toggleTodayTask(taskId) {
    const dayIdx = getCurrentDayIndex();
    const phase = PHASES[state.currentPhase];
    if (!phase || dayIdx < 0 || dayIdx >= phase.duration) return;
    if (!state.days[state.currentPhase][dayIdx]) {
      state.days[state.currentPhase][dayIdx] = { tasks: {} };
    }
    const day = state.days[state.currentPhase][dayIdx];
    day.tasks[taskId] = !day.tasks[taskId];
    saveState();
    renderTasks();
    renderHero();
    renderCalendar();
    renderJourney();
    if (PHASES[state.currentPhase].tasks.every((t) => day.tasks[t])) {
      const isLast = dayIdx === phase.duration - 1;
      if (isLast) {
        showToast(`${phase.name} complete — incredible work.`);
        autoAdvanceIfPossible();
      } else {
        showToast(`Day ${dayIdx + 1} done. Keep going.`);
      }
    }
  }

  function beginJourney() {
    state = defaultState();
    state.startDate = todayISO();
    state.currentPhase = '75hard';
    state.phaseStartDate = todayISO();
    saveState();
    render();
    showToast('Day 1 of 75 HARD. Let\'s go.');
  }

  function resetToday() {
    const dayIdx = getCurrentDayIndex();
    if (dayIdx < 0) return;
    if (state.days[state.currentPhase][dayIdx]) {
      state.days[state.currentPhase][dayIdx] = { tasks: {} };
      saveState();
      render();
      showToast('Today reset.');
    }
  }

  function failToday() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const isPhase3 = state.currentPhase === 'phase3';
    confirm({
      title: isPhase3 ? 'Restart entire program?' : `Restart ${phase.name}?`,
      body: isPhase3
        ? 'Per the Live Hard rules, missing a task during Phase 3 resets the entire program back to Day 1 of 75 HARD.'
        : `You will lose all progress in ${phase.name} and restart from Day 1 today.`,
      onConfirm: () => {
        if (isPhase3) {
          beginJourney();
        } else {
          resetPhase(state.currentPhase, true);
          showToast(`${phase.name} restarted from Day 1.`);
        }
      },
    });
  }

  function resetPhase(phaseId, restartToday = false) {
    state.days[phaseId] = {};
    if (state.currentPhase === phaseId || restartToday) {
      state.currentPhase = phaseId;
      state.phaseStartDate = todayISO();
      if (phaseId === '75hard') state.startDate = todayISO();
    }
    saveState();
    render();
  }

  function resetAll() {
    confirm({
      title: 'Reset entire journey?',
      body: 'This erases all progress across every phase and returns you to the welcome screen.',
      onConfirm: () => {
        localStorage.removeItem(STORAGE_KEY);
        state = defaultState();
        render();
        closeSettings();
        showToast('Journey reset.');
      },
    });
  }

  function autoAdvanceIfPossible() {
    if (!state.currentPhase) return;
    if (!isPhaseComplete(state.currentPhase)) return;
    const idx = PHASE_ORDER.indexOf(state.currentPhase);
    if (idx === -1) return;

    if (state.currentPhase === '75hard') {
      // Offer to start Phase 1 (auto-start same day)
      state.currentPhase = 'phase1';
      state.phaseStartDate = todayISO();
      saveState();
      render();
      showToast('75 HARD complete. Phase 1 begins today.');
    } else if (state.currentPhase === 'phase1') {
      state.phase1CompletedDate = todayISO();
      state.currentPhase = 'phase1-wait';
      saveState();
      render();
      showToast('Phase 1 complete. 30-day rest begins now.');
    } else if (state.currentPhase === 'phase2') {
      state.currentPhase = 'phase3';
      state.phaseStartDate = todayISO();
      saveState();
      render();
      showToast('Phase 2 complete. Phase 3 begins today.');
    } else if (state.currentPhase === 'phase3') {
      state.currentPhase = 'complete';
      saveState();
      render();
      showToast('Live Hard complete. You did it.');
    }
  }

  function startPhase2() {
    if (!state.phase1CompletedDate) return;
    const elapsed = daysBetween(state.phase1CompletedDate, todayISO());
    if (elapsed < 30) return;
    state.currentPhase = 'phase2';
    state.phaseStartDate = todayISO();
    saveState();
    render();
    showToast('Phase 2 begins today.');
  }

  /* ----- Theme -------------------------------------------------------- */

  function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const cur = state.settings.theme || 'auto';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    state.settings.theme = next;
    saveState();
    applyTheme();
    showToast(`Theme: ${next}`);
  }

  function setTheme(theme) {
    state.settings.theme = theme;
    saveState();
    applyTheme();
  }

  /* ----- Settings sheet ------------------------------------------------ */

  function openSettings() {
    el.settingsSheet.setAttribute('aria-hidden', 'false');
    if (state.startDate) el.startDateInput.value = state.startDate;
    if (state.currentPhase && PHASES[state.currentPhase]) {
      el.resetPhaseLabel.textContent = `Restart ${PHASES[state.currentPhase].name}`;
    }
  }

  function closeSettings() {
    el.settingsSheet.setAttribute('aria-hidden', 'true');
  }

  function changeStartDate(newDate) {
    if (!newDate || newDate === state.startDate) return;
    confirm({
      title: 'Change start date?',
      body: 'This will recompute the calendar from the new start date but keep your task data.',
      onConfirm: () => {
        const oldStart = state.startDate;
        const diff = daysBetween(oldStart, newDate);
        state.startDate = newDate;
        if (state.phaseStartDate === oldStart) state.phaseStartDate = newDate;
        else if (state.phaseStartDate) state.phaseStartDate = addDays(state.phaseStartDate, diff);
        saveState();
        render();
        closeSettings();
        showToast('Start date updated.');
      },
    });
  }

  /* ----- Confirm modal ------------------------------------------------- */

  let confirmCallback = null;

  function confirm({ title, body, onConfirm }) {
    el.confirmTitle.textContent = title;
    el.confirmBody.textContent = body;
    confirmCallback = onConfirm;
    el.confirmModal.setAttribute('aria-hidden', 'false');
  }

  function closeConfirm() {
    el.confirmModal.setAttribute('aria-hidden', 'true');
    confirmCallback = null;
  }

  /* ----- Toast --------------------------------------------------------- */

  let toastTimer;
  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
  }

  /* ----- Export / Import ---------------------------------------------- */

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-hard-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object' || parsed.version !== STATE_VERSION) {
          throw new Error('Invalid file');
        }
        confirm({
          title: 'Replace current progress?',
          body: 'This will overwrite your current data with the contents of the backup file.',
          onConfirm: () => {
            const def = defaultState();
            state = { ...def, ...parsed, days: { ...def.days, ...(parsed.days || {}) }, settings: { ...def.settings, ...(parsed.settings || {}) } };
            saveState();
            render();
            closeSettings();
            showToast('Backup restored.');
          },
        });
      } catch {
        showToast('Could not read that file.');
      }
    };
    reader.readAsText(file);
  }

  /* ----- Event wiring -------------------------------------------------- */

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]');
    if (!t) return;
    const action = t.dataset.action;
    switch (action) {
      case 'toggle-theme': cycleTheme(); break;
      case 'open-settings': openSettings(); break;
      case 'close-settings': closeSettings(); break;
      case 'close-confirm': closeConfirm(); break;
      case 'begin-journey': beginJourney(); break;
      case 'reset-today': resetToday(); break;
      case 'fail-day': failToday(); break;
      case 'reset-current-phase':
        if (state.currentPhase && PHASES[state.currentPhase]) {
          confirm({
            title: `Restart ${PHASES[state.currentPhase].name}?`,
            body: `All progress in ${PHASES[state.currentPhase].name} will be erased and Day 1 will be today.`,
            onConfirm: () => { resetPhase(state.currentPhase, true); closeSettings(); showToast('Phase restarted.'); },
          });
        }
        break;
      case 'reset-75hard':
      case 'reset-phase1':
      case 'reset-phase2':
      case 'reset-phase3': {
        const map = { 'reset-75hard': '75hard', 'reset-phase1': 'phase1', 'reset-phase2': 'phase2', 'reset-phase3': 'phase3' };
        const pid = map[action];
        confirm({
          title: `Restart ${PHASES[pid].name}?`,
          body: `All progress in ${PHASES[pid].name} will be erased.`,
          onConfirm: () => { resetPhase(pid, state.currentPhase === pid); closeSettings(); showToast(`${PHASES[pid].name} reset.`); },
        });
        break;
      }
      case 'reset-all': resetAll(); break;
      case 'start-phase2': startPhase2(); break;
      case 'export': exportData(); break;
      case 'import': el.importInput.click(); break;
    }
  });

  // Theme segmented control
  document.querySelectorAll('.segment[data-theme]').forEach((seg) => {
    seg.addEventListener('click', () => setTheme(seg.dataset.theme));
  });

  // Confirm OK
  el.confirmOk.addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirm();
  });

  // Start date
  el.startDateInput.addEventListener('change', (e) => changeStartDate(e.target.value));

  // Import file
  el.importInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) importData(file);
    e.target.value = '';
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (el.confirmModal.getAttribute('aria-hidden') === 'false') closeConfirm();
      else if (el.settingsSheet.getAttribute('aria-hidden') === 'false') closeSettings();
    }
  });

  // Re-render at midnight (so day rolls over)
  function scheduleMidnightRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0);
    const ms = nextMidnight - now;
    setTimeout(() => { render(); scheduleMidnightRefresh(); }, ms);
  }
  scheduleMidnightRefresh();

  // Re-render when tab becomes visible (handles overnight)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  /* ----- Boot --------------------------------------------------------- */

  render();
})();
