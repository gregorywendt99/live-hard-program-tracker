/* ==========================================================================
   Live Hard Tracker — app logic with Firebase auth + Firestore sync
   ========================================================================== */

(() => {
  'use strict';

  const STATE_VERSION = 1;
  const LEGACY_KEY = 'liveHardState_v1';
  const LOCAL_ONLY_KEY = 'liveHardLocalOnly';

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
    '75hard': { id: '75hard', name: '75 HARD', stage: 1, duration: 75, tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo'] },
    phase1:   { id: 'phase1',   name: 'Phase 1', stage: 2, duration: 30, tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo', 'coldShower', 'powerList', 'visualization'] },
    phase2:   { id: 'phase2',   name: 'Phase 2', stage: 3, duration: 30, tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo'] },
    phase3:   { id: 'phase3',   name: 'Phase 3', stage: 4, duration: 30, tasks: ['water', 'reading', 'workout1', 'workout2', 'diet', 'photo', 'coldShower', 'powerList', 'stranger', 'kindness'] },
  };
  const PHASE_ORDER = ['75hard', 'phase1', 'phase2', 'phase3'];

  /* ----- Date utilities ----------------------------------------------- */

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dateFromISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const isoFromDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (iso, n) => { const d = dateFromISO(iso); d.setDate(d.getDate() + n); return isoFromDate(d); };
  const daysBetween = (iso1, iso2) => Math.round((dateFromISO(iso2) - dateFromISO(iso1)) / 86400000);
  const formatDate = (iso) => dateFromISO(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const formatShortDate = (iso) => dateFromISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const formatFullDate = (iso) => dateFromISO(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const addYears = (iso, n) => {
    const d = dateFromISO(iso);
    d.setFullYear(d.getFullYear() + n);
    return isoFromDate(d);
  };
  const formatDateRange = (startISO, endISO) => {
    const sd = dateFromISO(startISO);
    const ed = dateFromISO(endISO);
    if (sd.getFullYear() === ed.getFullYear()) {
      return `${formatShortDate(startISO)} → ${formatShortDate(endISO)}, ${ed.getFullYear()}`;
    }
    return `${formatFullDate(startISO)} → ${formatFullDate(endISO)}`;
  };

  /* ----- App phase + auth state --------------------------------------- */

  let appPhase = 'loading'; // 'loading' | 'setup' | 'auth' | 'app'
  let firebaseApp = null;
  let firebaseAuth = null;
  let firestore = null;
  let currentUser = null;
  let useLocalOnly = false;
  let unsubFirestore = null;
  let saveDebounceTimer = null;
  let initialLoadDone = false;
  const photoDataCache = new Map(); // dayNum -> data URL string
  let photoSheetDay = null;
  let photoUploadInProgress = false;
  let authMode = 'signin';

  /* ----- State management --------------------------------------------- */

  const WATER_TARGET = 128;
  const WATER_STANDARD_PRESETS = [8, 12, 16, 20, 24];

  const defaultState = () => ({
    version: STATE_VERSION,
    startDate: null,
    currentPhase: null,
    phaseStartDate: null,
    phase1CompletedDate: null,
    days: { '75hard': {}, phase1: {}, phase2: {}, phase3: {} },
    settings: { theme: 'auto' },
    waterCustomAmounts: [],
    photos: {}, // { [journeyDay: number 1-indexed]: { uploadedAt: string } }
  });

  let state = defaultState();

  const localKey = () =>
    currentUser ? `liveHardState_v1_${currentUser.uid}` : LEGACY_KEY;

  function loadStateLocal() {
    const tryKeys = currentUser ? [localKey(), LEGACY_KEY] : [LEGACY_KEY];
    for (const k of tryKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed.version !== STATE_VERSION) continue;
        const def = defaultState();
        return { ...def, ...parsed, days: { ...def.days, ...(parsed.days || {}) }, settings: { ...def.settings, ...(parsed.settings || {}) } };
      } catch {}
    }
    return defaultState();
  }

  function saveStateLocal() {
    try {
      localStorage.setItem(localKey(), JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }

  function saveState() {
    saveStateLocal();
    // Only sync to Firestore once the initial load has finished. Otherwise a
    // user action (e.g. tapping a theme button) during the boot window would
    // overwrite the user's remote document with the empty default state.
    if (currentUser && !useLocalOnly && firestore && initialLoadDone) {
      saveStateRemote();
    }
  }

  function saveStateRemote() {
    // Belt-and-suspenders: never push a state with no journey data. If we
    // somehow reach here with defaultState, just bail.
    if (!state.startDate && !state.currentPhase) return;
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
      try {
        await firestore.collection('users').doc(currentUser.uid).set(state);
      } catch (e) {
        console.error('Save to Firestore failed', e);
      }
    }, 200);
  }

  /* ----- Phase / day logic -------------------------------------------- */

  function getCurrentDayIndex() {
    if (!state.phaseStartDate) return -1;
    return daysBetween(state.phaseStartDate, todayISO());
  }
  function isDayComplete(phaseId, dayIndex) {
    const day = state.days[phaseId]?.[dayIndex];
    if (!day) return false;
    return PHASES[phaseId].tasks.every((t) => day.tasks?.[t]);
  }
  function completedDaysCount(phaseId) {
    const phase = PHASES[phaseId];
    if (!phase) return 0;
    let count = 0;
    for (let i = 0; i < phase.duration; i++) if (isDayComplete(phaseId, i)) count++;
    return count;
  }
  function currentStreak() {
    if (!state.currentPhase || !PHASES[state.currentPhase]) return 0;
    const today = getCurrentDayIndex();
    if (today < 0) return 0;
    let streak = 0;
    for (let i = today; i >= 0; i--) {
      if (isDayComplete(state.currentPhase, i)) streak++;
      else if (i < today) break;
    }
    return streak;
  }
  function isPhaseComplete(phaseId) {
    const phase = PHASES[phaseId];
    return phase ? completedDaysCount(phaseId) === phase.duration : false;
  }
  function yearDeadlineISO() {
    return state.startDate ? addYears(state.startDate, 1) : null;
  }

  // Latest date a stage can start so the entire LIVEHARD program still fits
  // within one year. Working backward from the anniversary:
  //   Phase 3 ends on the anniversary, so it must start anniversary − 29
  //   Phase 2 ends the day before Phase 3 starts → start = phase3Start − 30
  //   30-day mandatory rest sits between Phase 1 end and Phase 2 start
  //   Phase 1 ends 30 days before Phase 2 starts → start = phase2Start − 59
  function getStageLatestStart(stageId) {
    if (!state.startDate) return null;
    const yearDeadline = yearDeadlineISO();
    const phase3Start = addDays(yearDeadline, -29);
    const phase2Start = addDays(phase3Start, -30);
    const phase1Start = addDays(phase2Start, -59);
    switch (stageId) {
      case '75hard': return state.startDate;
      case 'phase1': return phase1Start;
      case 'phase2': return phase2Start;
      case 'phase3': return phase3Start;
      default: return null;
    }
  }

  function getStageDateLine(id) {
    if (!state.startDate) return '';
    const phase = PHASES[id];
    const isActive = state.currentPhase === id;
    const isDone = isPhaseComplete(id);

    if (isActive && state.phaseStartDate) {
      const start = state.phaseStartDate;
      const end = addDays(start, phase.duration - 1);
      return formatDateRange(start, end);
    }
    if (isDone) return 'Completed';
    if (id === '75hard') return `Started ${formatFullDate(state.startDate)}`;
    const latest = getStageLatestStart(id);
    return latest ? `Start by ${formatFullDate(latest)}` : '';
  }

  /* ----- DOM refs ----------------------------------------------------- */

  const $ = (sel) => document.querySelector(sel);
  const el = {
    boot: $('#bootSection'),
    setup: $('#setupSection'),
    auth: $('#authSection'),
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
    accountGroup: $('#accountGroup'),
    accountAvatar: $('#accountAvatar'),
    accountEmail: $('#accountEmail'),
    authForm: $('#authForm'),
    authEmail: $('#authEmail'),
    authPassword: $('#authPassword'),
    authError: $('#authError'),
    authSubmit: $('#authSubmit'),
    passwordHint: $('#passwordHint'),
    waterSheet: $('#waterSheet'),
    waterTotal: $('#waterTotal'),
    waterPercent: $('#waterPercent'),
    waterBarFill: $('#waterBarFill'),
    waterPresets: $('#waterPresets'),
    waterCustomForm: $('#waterCustomForm'),
    waterCustomInput: $('#waterCustomInput'),
    photoSheet: $('#photoSheet'),
    photoTitle: $('#photoTitle'),
    photoDayLine: $('#photoDayLine'),
    photoPreview: $('#photoPreview'),
    photoInput: $('#photoInput'),
    photoPickBtn: $('#photoPickBtn'),
    photoRemoveBtn: $('#photoRemoveBtn'),
    photoProgress: $('#photoProgress'),
    photoProgressFill: $('#photoProgressFill'),
    photoProgressLabel: $('#photoProgressLabel'),
    photoPrevBtn: $('#photoPrevBtn'),
    photoNextBtn: $('#photoNextBtn'),
    photosCard: $('#photosCard'),
    photosStage: $('#photosStage'),
    photosImage: $('#photosImage'),
    photosImageWrap: $('.photos-image-wrap'),
    photosEmpty: $('#photosEmpty'),
    photosDayTag: $('#photosDayTag'),
    photosRailTrack: $('#photosRailTrack'),
    photosModePill: $('#photosModePill'),
  };

  /* ----- Rendering ---------------------------------------------------- */

  function showSection(which) {
    el.boot.hidden = which !== 'boot';
    el.setup.hidden = which !== 'setup';
    el.auth.hidden = which !== 'auth';
    el.welcome.hidden = which !== 'welcome';
    el.wait.hidden = which !== 'wait';
    el.dashboard.hidden = which !== 'dashboard';
  }

  function render() {
    applyTheme();
    if (appPhase === 'loading') { showSection('boot'); return; }
    if (appPhase === 'setup') { showSection('setup'); return; }
    if (appPhase === 'auth') { showSection('auth'); updateAuthUI(); return; }

    // appPhase === 'app'
    updateAccountUI();
    if (!state.currentPhase) { showSection('welcome'); return; }
    if (state.currentPhase === 'phase1-wait') { showSection('wait'); renderWait(); return; }
    showSection('dashboard');
    renderHero();
    renderTasks();
    renderCalendar();
    renderJourney();
    restartPhotoCarousel();
    autoAdvanceIfPossible();
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'auto');
    document.querySelectorAll('.segment[data-theme]').forEach((s) => {
      s.classList.toggle('active', s.dataset.theme === (state.settings.theme || 'auto'));
    });
  }

  function updateAccountUI() {
    if (currentUser && !useLocalOnly) {
      el.accountGroup.hidden = false;
      el.accountEmail.textContent = currentUser.email || 'Anonymous';
      el.accountAvatar.textContent = (currentUser.email || 'L').charAt(0).toUpperCase();
    } else {
      el.accountGroup.hidden = true;
    }
  }

  function updateAuthUI() {
    document.querySelectorAll('[data-auth-mode]').forEach((b) => {
      const active = b.dataset.authMode === authMode;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    el.authSubmit.textContent = authMode === 'signin' ? 'Sign in' : 'Create account';
    el.authPassword.setAttribute('autocomplete', authMode === 'signin' ? 'current-password' : 'new-password');
    el.passwordHint.hidden = authMode === 'signin';
    hideAuthError();
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
    el.ringFill.style.strokeDashoffset = circumference * (1 - completed / phase.duration);

    const status = el.heroStatus;
    status.classList.remove('failed', 'complete');
    if (isPhaseComplete(state.currentPhase)) { status.textContent = 'Phase complete'; status.classList.add('complete'); }
    else if (dayIdx >= phase.duration) { status.textContent = 'Past final day'; status.classList.add('failed'); }
    else if (dayIdx < 0) { status.textContent = 'Not started'; }
    else { status.textContent = 'In progress'; }

    const deadline = yearDeadlineISO();
    if (deadline) {
      const remain = daysBetween(todayISO(), deadline);
      el.yearDeadline.textContent = remain >= 0
        ? `${remain} days · ends ${formatFullDate(deadline)}`
        : `${-remain} days past ${formatFullDate(deadline)}`;
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

    const journeyDayNum = state.startDate ? daysBetween(state.startDate, todayISO()) + 1 : null;

    el.tasksContainer.innerHTML = phase.tasks.map((taskId) => {
      const t = TASKS[taskId];
      const checked = !!dayState.tasks?.[taskId];
      const isWater = taskId === 'water';
      const isPhoto = taskId === 'photo';
      const hasPhoto = journeyDayNum && state.photos && state.photos[journeyDayNum];
      let detail = t.detail;
      let mainAction = '';
      if (isWater) {
        detail = `${dayState.water_oz || 0} / ${WATER_TARGET} fl oz · tap to log`;
        mainAction = ' data-action="open-water"';
      } else if (isPhoto) {
        detail = hasPhoto ? 'Tap to view or replace today\'s photo' : 'Tap to upload today\'s photo';
        mainAction = ' data-action="open-photo"';
      }
      return `
        <div class="task ${checked ? 'checked' : ''}" data-task-id="${taskId}">
          <button class="task-main" type="button"${mainAction}>
            <span class="task-icon" aria-hidden="true">${ICONS[taskId]}</span>
            <span class="task-body">
              <span class="task-label">${t.label}</span>
              <span class="task-detail">${detail}</span>
            </span>
          </button>
          <button class="task-toggle" type="button" data-action="toggle-task" data-task-id="${taskId}" aria-label="Mark ${t.label} ${checked ? 'incomplete' : 'complete'}" aria-pressed="${checked}">
            <span class="task-check" aria-hidden="true">${ICONS.check}</span>
          </button>
        </div>`;
    }).join('');
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
    el.journey.innerHTML = PHASE_ORDER.map((id) => {
      const phase = PHASES[id];
      const completed = completedDaysCount(id);
      const isActive = state.currentPhase === id;
      const isDone = isPhaseComplete(id);
      const cls = ['phase-row'];
      if (isActive) cls.push('active');
      if (isDone) cls.push('complete');
      const pct = (completed / phase.duration) * 100;
      const stateText = isDone ? 'Done' : isActive ? `${completed} / ${phase.duration}` : completed > 0 ? `${completed} / ${phase.duration}` : 'Locked';
      const dateLine = getStageDateLine(id);
      return `
        <div class="${cls.join(' ')}">
          <div class="phase-num">${phase.stage}</div>
          <div class="phase-info">
            <div class="phase-eyebrow">Stage ${phase.stage}</div>
            <div class="phase-name">${phase.name}</div>
          </div>
          <div class="phase-meta-col">
            <div class="phase-state">${stateText}</div>
            <div class="phase-meta">${phase.duration} days · ${phase.tasks.length} daily tasks</div>
            ${dateLine ? `<div class="phase-dates">${dateLine}</div>` : ''}
          </div>
          <div class="phase-bar"><div class="phase-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
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

  /* ----- Tracker actions ---------------------------------------------- */

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
    renderTasks(); renderHero(); renderCalendar(); renderJourney();
    if (PHASES[state.currentPhase].tasks.every((t) => day.tasks[t])) {
      const isLast = dayIdx === phase.duration - 1;
      if (isLast) { showToast(`${phase.name} complete — incredible work.`); autoAdvanceIfPossible(); }
      else { showToast(`Day ${dayIdx + 1} done. Keep going.`); }
    }
  }

  /* ----- Water tracking ------------------------------------------------ */

  function ensureToday() {
    const dayIdx = getCurrentDayIndex();
    if (dayIdx < 0 || !PHASES[state.currentPhase] || dayIdx >= PHASES[state.currentPhase].duration) return null;
    if (!state.days[state.currentPhase][dayIdx]) {
      state.days[state.currentPhase][dayIdx] = { tasks: {} };
    }
    return state.days[state.currentPhase][dayIdx];
  }

  function openWaterSheet() {
    renderWaterSheet();
    el.waterSheet.setAttribute('aria-hidden', 'false');
    setTimeout(() => el.waterCustomInput.focus({ preventScroll: true }), 250);
  }

  function closeWaterSheet() {
    el.waterSheet.setAttribute('aria-hidden', 'true');
  }

  function renderWaterSheet() {
    const dayIdx = getCurrentDayIndex();
    const day = state.days[state.currentPhase]?.[dayIdx] || { tasks: {} };
    const total = day.water_oz || 0;
    const pct = Math.min(100, Math.round((total / WATER_TARGET) * 100));

    el.waterTotal.textContent = total;
    el.waterPercent.textContent = `${pct}%`;
    el.waterBarFill.style.width = `${pct}%`;

    const customPresets = (state.waterCustomAmounts || []).slice().sort((a, b) => a - b);

    el.waterPresets.innerHTML = [
      ...WATER_STANDARD_PRESETS.map((amt) =>
        `<button class="water-chip" type="button" data-action="water-add" data-water-amount="${amt}">${amt} oz</button>`
      ),
      ...customPresets.map((amt) => `
        <span class="water-chip-group">
          <button class="water-chip water-chip-custom" type="button" data-action="water-add" data-water-amount="${amt}">${amt} oz</button>
          <button class="water-chip-remove" type="button" data-action="water-remove" data-water-amount="${amt}" aria-label="Remove ${amt} oz preset">×</button>
        </span>
      `)
    ].join('');
  }

  function addWater(oz) {
    if (!Number.isFinite(oz) || oz <= 0) return;
    const day = ensureToday();
    if (!day) return;
    day.water_oz = (day.water_oz || 0) + oz;
    let toastMsg = `+${oz} fl oz`;
    if (day.water_oz >= WATER_TARGET && !day.tasks.water) {
      day.tasks.water = true;
      toastMsg = `+${oz} fl oz · Goal reached`;
    }
    saveState();
    renderWaterSheet();
    renderTasks(); renderHero(); renderCalendar(); renderJourney();
    showToast(toastMsg);
  }

  function addCustomWater(oz) {
    if (!Number.isFinite(oz) || oz <= 0 || oz > 500) {
      showToast('Enter an amount between 1 and 500.');
      return;
    }
    const customPresets = state.waterCustomAmounts || [];
    if (!WATER_STANDARD_PRESETS.includes(oz) && !customPresets.includes(oz)) {
      state.waterCustomAmounts = [...customPresets, oz].sort((a, b) => a - b);
    }
    addWater(oz);
    el.waterCustomInput.value = '';
  }

  function removeCustomAmount(oz) {
    state.waterCustomAmounts = (state.waterCustomAmounts || []).filter((x) => x !== oz);
    saveState();
    renderWaterSheet();
  }

  function resetWaterToday() {
    const dayIdx = getCurrentDayIndex();
    if (dayIdx < 0) return;
    const day = state.days[state.currentPhase][dayIdx];
    if (!day) return;
    day.water_oz = 0;
    if (day.tasks) day.tasks.water = false;
    saveState();
    renderWaterSheet();
    renderTasks(); renderHero(); renderCalendar(); renderJourney();
    showToast('Today\'s water cleared.');
  }

  /* ----- Photos --------------------------------------------------------- */

  // Photos are stored as data URLs in /users/{uid}/photos/{dayNum}. To stay
  // comfortably under Firestore's 1 MB per-document limit, photos are
  // compressed before encoding: 1200px long edge, JPEG quality 0.75 —
  // typical iPhone photos land around 200-300 KB encoded, ~270-400 KB as
  // base64.
  const PHOTO_MAX_DIM = 1200;
  const PHOTO_QUALITY = 0.75;
  const PHOTO_MAX_BYTES = 900 * 1024; // leave headroom under 1 MB doc cap

  function journeyDayForToday() {
    if (!state.startDate) return null;
    return daysBetween(state.startDate, todayISO()) + 1;
  }

  function dateForJourneyDay(dayNum) {
    if (!state.startDate || !dayNum) return null;
    return addDays(state.startDate, dayNum - 1);
  }

  // Map a journey day (1-indexed) back to its phase + dayIndex within that phase.
  function phaseDayFromJourneyDay(dayNum) {
    if (!state.startDate || !dayNum) return null;
    const target = addDays(state.startDate, dayNum - 1);
    for (const pid of PHASE_ORDER) {
      const phase = PHASES[pid];
      // Only consider phases that have a known start date
      let startISO = null;
      if (pid === '75hard') startISO = state.startDate;
      else if (state.currentPhase === pid && state.phaseStartDate) startISO = state.phaseStartDate;
      if (!startISO) continue;
      const offset = daysBetween(startISO, target);
      if (offset >= 0 && offset < phase.duration) return { phaseId: pid, dayIndex: offset };
    }
    return null;
  }

  function compressImageToDataURL(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = async () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        const longer = Math.max(width, height);
        if (longer > PHOTO_MAX_DIM) {
          const scale = PHOTO_MAX_DIM / longer;
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        // Try the chosen quality first; if the encoded blob is too large,
        // drop quality stepwise until it fits.
        const qualities = [PHOTO_QUALITY, 0.65, 0.55, 0.45, 0.35];
        for (const q of qualities) {
          const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
          if (!blob) continue;
          if (blob.size <= PHOTO_MAX_BYTES) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Read failed'));
            reader.readAsDataURL(blob);
            return;
          }
        }
        reject(new Error('Image is too large even after compression'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
      img.src = url;
    });
  }

  function photoDocRef(dayNum) {
    if (!firestore || !currentUser) return null;
    return firestore.collection('users').doc(currentUser.uid).collection('photos').doc(String(dayNum));
  }

  async function fetchPhotoURL(dayNum) {
    if (photoDataCache.has(dayNum)) return photoDataCache.get(dayNum);
    const ref = photoDocRef(dayNum);
    if (!ref) return null;
    try {
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = snap.data()?.data;
      if (!data) return null;
      photoDataCache.set(dayNum, data);
      return data;
    } catch (e) {
      console.error('Photo fetch failed', e);
      return null;
    }
  }

  function preloadImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  async function uploadPhotoForDay(dayNum, file) {
    if (!firestore || !currentUser) {
      showToast('Sign in first to save photos.');
      return;
    }
    photoUploadInProgress = true;
    el.photoPickBtn.disabled = true;
    el.photoRemoveBtn.hidden = true;
    el.photoProgress.hidden = false;
    el.photoProgressFill.style.width = '20%';
    el.photoProgressLabel.textContent = 'Compressing…';

    try {
      const dataUrl = await compressImageToDataURL(file);
      el.photoProgressFill.style.width = '70%';
      el.photoProgressLabel.textContent = 'Saving…';

      await photoDocRef(dayNum).set({
        data: dataUrl,
        uploadedAt: new Date().toISOString(),
      });

      el.photoProgressFill.style.width = '100%';
      el.photoProgressLabel.textContent = 'Done';
      photoDataCache.set(dayNum, dataUrl);

      if (!state.photos) state.photos = {};
      state.photos[dayNum] = { uploadedAt: new Date().toISOString() };

      const todayDay = journeyDayForToday();
      if (dayNum === todayDay) {
        const target = phaseDayFromJourneyDay(dayNum);
        if (target && state.currentPhase === target.phaseId) {
          if (!state.days[target.phaseId][target.dayIndex]) {
            state.days[target.phaseId][target.dayIndex] = { tasks: {} };
          }
          state.days[target.phaseId][target.dayIndex].tasks.photo = true;
        }
      }

      saveState();
      renderPhotoSheet();
      renderTasks(); renderHero(); renderCalendar(); renderJourney();
      restartPhotoCarousel();
      showToast(`Day ${dayNum} photo saved.`);
    } catch (e) {
      console.error('Photo upload failed', e);
      showToast(e?.message || 'Could not save that photo.');
    } finally {
      photoUploadInProgress = false;
      el.photoPickBtn.disabled = false;
      setTimeout(() => { el.photoProgress.hidden = true; }, 600);
    }
  }

  function removePhotoForDay(dayNum) {
    askConfirm({
      title: `Remove Day ${dayNum} photo?`,
      body: 'This permanently deletes the photo from your account.',
      onConfirm: async () => {
        try {
          const ref = photoDocRef(dayNum);
          if (ref) await ref.delete();
        } catch (e) { console.warn('Delete failed (may not exist)', e); }
        photoDataCache.delete(dayNum);
        if (state.photos) delete state.photos[dayNum];
        saveState();
        renderPhotoSheet();
        renderTasks();
        restartPhotoCarousel();
        showToast('Photo removed.');
      },
    });
  }

  function openPhotoSheet(dayNum) {
    photoSheetDay = dayNum ?? journeyDayForToday();
    if (!photoSheetDay) {
      showToast('Start your journey first.');
      return;
    }
    el.photoSheet.setAttribute('aria-hidden', 'false');
    renderPhotoSheet();
  }

  function closePhotoSheet() {
    el.photoSheet.setAttribute('aria-hidden', 'true');
    photoSheetDay = null;
  }

  async function renderPhotoSheet() {
    const dayNum = photoSheetDay;
    if (!dayNum) return;
    const todayDay = journeyDayForToday() || 1;
    const date = dateForJourneyDay(dayNum);
    el.photoDayLine.textContent = date
      ? `Day ${dayNum} · ${formatFullDate(date)}`
      : `Day ${dayNum}`;
    el.photoTitle.textContent = dayNum === todayDay ? 'Progress photo' : `Day ${dayNum} photo`;
    el.photoPrevBtn.disabled = dayNum <= 1;
    el.photoNextBtn.disabled = dayNum >= todayDay;

    const has = state.photos && state.photos[dayNum];
    el.photoRemoveBtn.hidden = !has;
    el.photoPickBtn.textContent = has ? 'Replace photo' : 'Choose photo';

    if (has) {
      const url = await fetchPhotoURL(dayNum);
      if (url) {
        el.photoPreview.innerHTML = `<img src="${url}" alt="Day ${dayNum} progress photo" />`;
      } else {
        el.photoPreview.innerHTML = `
          <div class="photo-preview-placeholder">
            <span>Photo couldn't load.</span>
          </div>`;
      }
    } else {
      el.photoPreview.innerHTML = `
        <div class="photo-preview-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <circle cx="12" cy="13" r="3.5"/>
          </svg>
          <span>No photo for this day yet</span>
        </div>`;
    }
  }

  /* ----- Photo carousel ------------------------------------------------ */

  let carouselTimer = null;
  let carouselCancel = null;

  function uploadedDays() {
    return Object.keys(state.photos || {})
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
  }

  function renderPhotoRail(activeDay) {
    const todayDay = journeyDayForToday();
    if (!todayDay) {
      el.photosRailTrack.innerHTML = '';
      return;
    }
    const items = [];
    for (let d = 1; d <= todayDay; d++) {
      const has = !!(state.photos && state.photos[d]);
      const cls = ['photos-day-item'];
      if (has) cls.push('has-photo');
      if (d === activeDay) cls.push('active');
      items.push(`
        <button class="${cls.join(' ')}" type="button" data-action="select-photo-day" data-day="${d}">
          <span class="photos-day-num">${d}</span>
          ${has ? '<span class="photos-day-tiny">●</span>' : '<span class="photos-day-tiny">·</span>'}
        </button>
      `);
    }
    el.photosRailTrack.innerHTML = items.join('');
    scrollRailTo(activeDay);
  }

  function scrollRailTo(day) {
    requestAnimationFrame(() => {
      const item = el.photosRailTrack.querySelector(`[data-day="${day}"]`);
      const rail = el.photosRailTrack.parentElement;
      if (!item || !rail) return;
      const itemTop = item.offsetTop;
      const itemH = item.offsetHeight;
      const railH = rail.clientHeight;
      const targetY = itemTop - railH / 2 + itemH / 2;
      el.photosRailTrack.style.transform = `translateY(${Math.max(0, -targetY)}px)`;
    });
  }

  async function showPhotoDay(day) {
    if (!day) return;
    const url = await fetchPhotoURL(day);
    if (!url) return;
    await preloadImage(url);
    el.photosImage.classList.remove('shown');
    requestAnimationFrame(() => {
      el.photosImage.src = url;
      el.photosImageWrap.classList.add('has-photo');
      el.photosDayTag.textContent = `Day ${day}`;
      requestAnimationFrame(() => el.photosImage.classList.add('shown'));
    });
    renderPhotoRail(day);
  }

  function clearCarousel() {
    if (carouselTimer) { clearTimeout(carouselTimer); carouselTimer = null; }
    if (carouselCancel) { carouselCancel(); carouselCancel = null; }
  }

  function setCarouselMode(label) {
    if (!label) {
      el.photosModePill.textContent = '—';
      el.photosModePill.classList.add('hidden');
      return;
    }
    el.photosModePill.textContent = label;
    el.photosModePill.classList.remove('hidden');
  }

  async function runCarousel() {
    clearCarousel();
    const days = uploadedDays();
    if (days.length === 0) {
      el.photosImageWrap.classList.remove('has-photo');
      el.photosImage.classList.remove('shown');
      el.photosImage.removeAttribute('src');
      setCarouselMode(null);
      renderPhotoRail(null);
      return;
    }
    if (days.length === 1) {
      setCarouselMode(null);
      await showPhotoDay(days[0]);
      return;
    }

    let cancelled = false;
    carouselCancel = () => { cancelled = true; };
    const wait = (ms) => new Promise((r) => { carouselTimer = setTimeout(r, ms); });

    while (!cancelled) {
      // Phase 1: comparison — first vs latest
      const first = days[0];
      const last = days[days.length - 1];
      setCarouselMode('Then vs Now');
      await showPhotoDay(first);
      if (cancelled) break;
      await wait(2500);
      if (cancelled) break;
      await showPhotoDay(last);
      if (cancelled) break;
      await wait(2500);
      if (cancelled) break;

      // Phase 2: full sequence
      setCarouselMode('Sequence');
      for (const d of days) {
        if (cancelled) break;
        await showPhotoDay(d);
        if (cancelled) break;
        await wait(1100);
      }
    }
  }

  function restartPhotoCarousel() {
    if (!state.startDate || !firestore || !currentUser) {
      clearCarousel();
      el.photosImageWrap?.classList.remove('has-photo');
      el.photosImage?.classList.remove('shown');
      setCarouselMode(null);
      renderPhotoRail(null);
      return;
    }
    runCarousel();
  }

  function beginJourney() {
    const settings = state.settings;
    state = defaultState();
    state.settings = settings;
    state.startDate = todayISO();
    state.currentPhase = '75hard';
    state.phaseStartDate = todayISO();
    saveState(); render();
    showToast('Day 1 of 75 HARD. Let\'s go.');
  }

  function resetToday() {
    const dayIdx = getCurrentDayIndex();
    if (dayIdx < 0) return;
    if (state.days[state.currentPhase][dayIdx]) {
      state.days[state.currentPhase][dayIdx] = { tasks: {} };
      saveState(); render();
      showToast('Today reset.');
    }
  }

  function failToday() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const isPhase3 = state.currentPhase === 'phase3';
    askConfirm({
      title: isPhase3 ? 'Restart entire program?' : `Restart ${phase.name}?`,
      body: isPhase3
        ? 'Per the Live Hard rules, missing a task during Phase 3 resets the entire program back to Day 1 of 75 HARD.'
        : `You will lose all progress in ${phase.name} and restart from Day 1 today.`,
      onConfirm: () => {
        if (isPhase3) beginJourney();
        else { resetPhase(state.currentPhase, true); showToast(`${phase.name} restarted from Day 1.`); }
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
    saveState(); render();
  }

  function resetAll() {
    askConfirm({
      title: 'Reset entire journey?',
      body: 'This erases all progress across every phase and returns you to the welcome screen.',
      onConfirm: () => {
        const settings = state.settings;
        state = defaultState();
        state.settings = settings;
        saveState(); render(); closeSettings();
        showToast('Journey reset.');
      },
    });
  }

  function autoAdvanceIfPossible() {
    if (!state.currentPhase || !isPhaseComplete(state.currentPhase)) return;
    if (PHASE_ORDER.indexOf(state.currentPhase) === -1) return;

    if (state.currentPhase === '75hard') {
      state.currentPhase = 'phase1'; state.phaseStartDate = todayISO();
      saveState(); render(); showToast('75 HARD complete. Phase 1 begins today.');
    } else if (state.currentPhase === 'phase1') {
      state.phase1CompletedDate = todayISO(); state.currentPhase = 'phase1-wait';
      saveState(); render(); showToast('Phase 1 complete. 30-day rest begins now.');
    } else if (state.currentPhase === 'phase2') {
      state.currentPhase = 'phase3'; state.phaseStartDate = todayISO();
      saveState(); render(); showToast('Phase 2 complete. Phase 3 begins today.');
    } else if (state.currentPhase === 'phase3') {
      state.currentPhase = 'complete';
      saveState(); render(); showToast('Live Hard complete. You did it.');
    }
  }

  function startPhase2() {
    if (!state.phase1CompletedDate) return;
    if (daysBetween(state.phase1CompletedDate, todayISO()) < 30) return;
    state.currentPhase = 'phase2'; state.phaseStartDate = todayISO();
    saveState(); render(); showToast('Phase 2 begins today.');
  }

  /* ----- Theme + settings --------------------------------------------- */

  function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const cur = state.settings.theme || 'auto';
    state.settings.theme = order[(order.indexOf(cur) + 1) % order.length];
    saveState(); applyTheme(); showToast(`Theme: ${state.settings.theme}`);
  }
  function setTheme(theme) {
    state.settings.theme = theme; saveState(); applyTheme();
  }
  function openSettings() {
    el.settingsSheet.setAttribute('aria-hidden', 'false');
    if (state.startDate) el.startDateInput.value = state.startDate;
    if (state.currentPhase && PHASES[state.currentPhase]) {
      el.resetPhaseLabel.textContent = `Restart ${PHASES[state.currentPhase].name}`;
    }
  }
  function closeSettings() { el.settingsSheet.setAttribute('aria-hidden', 'true'); }

  function changeStartDate(newDate) {
    if (!newDate || newDate === state.startDate) return;
    askConfirm({
      title: 'Change start date?',
      body: 'This will recompute the calendar from the new start date but keep your task data.',
      onConfirm: () => {
        const oldStart = state.startDate;
        const diff = daysBetween(oldStart, newDate);
        state.startDate = newDate;
        if (state.phaseStartDate === oldStart) state.phaseStartDate = newDate;
        else if (state.phaseStartDate) state.phaseStartDate = addDays(state.phaseStartDate, diff);
        saveState(); render(); closeSettings();
        showToast('Start date updated.');
      },
    });
  }

  /* ----- Confirm modal + toast ---------------------------------------- */

  let confirmCallback = null;
  function askConfirm({ title, body, onConfirm }) {
    el.confirmTitle.textContent = title;
    el.confirmBody.textContent = body;
    confirmCallback = onConfirm;
    el.confirmModal.setAttribute('aria-hidden', 'false');
  }
  function closeConfirm() {
    el.confirmModal.setAttribute('aria-hidden', 'true');
    confirmCallback = null;
  }

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
    a.href = url; a.download = `live-hard-${todayISO()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Backup downloaded.');
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object' || parsed.version !== STATE_VERSION) throw new Error('Invalid file');
        askConfirm({
          title: 'Replace current progress?',
          body: 'This will overwrite your current data with the contents of the backup file.',
          onConfirm: () => {
            const def = defaultState();
            state = { ...def, ...parsed, days: { ...def.days, ...(parsed.days || {}) }, settings: { ...def.settings, ...(parsed.settings || {}) } };
            saveState(); render(); closeSettings();
            showToast('Backup restored.');
          },
        });
      } catch { showToast('Could not read that file.'); }
    };
    reader.readAsText(file);
  }

  /* ----- Firebase + auth ---------------------------------------------- */

  function isFirebaseConfigured() {
    const c = window.firebaseConfig;
    if (!c) return false;
    const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
    return required.every((k) => typeof c[k] === 'string' && c[k] && !c[k].startsWith('YOUR_'));
  }

  function initFirebase() {
    firebaseApp = firebase.initializeApp(window.firebaseConfig);
    firebaseAuth = firebase.auth();
    firestore = firebase.firestore();
    firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
    firestore.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  }

  function onAuth(user) {
    if (user) {
      currentUser = user;
      initialLoadDone = false; // hold remote saves until we've loaded
      loadFromFirestore().then(() => {
        listenToFirestore();
        initialLoadDone = true;
        appPhase = 'app';
        render();
      }).catch((e) => {
        console.error('Firestore load failed', e);
        state = loadStateLocal();
        initialLoadDone = true;
        appPhase = 'app';
        render();
      });
    } else {
      currentUser = null;
      initialLoadDone = false;
      if (unsubFirestore) { unsubFirestore(); unsubFirestore = null; }
      clearCarousel();
      photoDataCache.clear();
      state = defaultState();
      appPhase = 'auth';
      render();
    }
  }

  function readLocalKey(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== STATE_VERSION) return null;
      const def = defaultState();
      return { ...def, ...parsed, days: { ...def.days, ...(parsed.days || {}) }, settings: { ...def.settings, ...(parsed.settings || {}) } };
    } catch { return null; }
  }

  async function loadFromFirestore() {
    const docRef = firestore.collection('users').doc(currentUser.uid);
    const snap = await docRef.get();
    const def = defaultState();

    // 1. Remote data wins if present
    if (snap.exists && snap.data() && snap.data().version === STATE_VERSION) {
      const data = snap.data();
      state = { ...def, ...data, days: { ...def.days, ...(data.days || {}) }, settings: { ...def.settings, ...(data.settings || {}) } };
      saveStateLocal();
      return;
    }

    // 2. This user's local cache (e.g. signed in here before, then offline edits)
    const userCache = readLocalKey(localKey());
    if (userCache && userCache.startDate) {
      state = userCache;
      try { await docRef.set(state); } catch (e) { console.error(e); }
      return;
    }

    // 3. Legacy single-user data from before auth was added.
    // Only migrate it once, then clear it so other accounts on this browser don't pick it up.
    const legacy = readLocalKey(LEGACY_KEY);
    if (legacy && legacy.startDate) {
      state = legacy;
      saveStateLocal();
      try { await docRef.set(state); } catch (e) { console.error(e); }
      try { localStorage.removeItem(LEGACY_KEY); } catch {}
      setTimeout(() => showToast('Imported your existing progress.'), 400);
      return;
    }

    // 4. Brand-new account
    state = def;
    try { await docRef.set(state); } catch (e) { console.error(e); }
  }

  function listenToFirestore() {
    if (unsubFirestore) unsubFirestore();
    const docRef = firestore.collection('users').doc(currentUser.uid);
    unsubFirestore = docRef.onSnapshot((snap) => {
      if (!snap.exists) return;
      if (snap.metadata.hasPendingWrites) return;
      const data = snap.data();
      if (!data || data.version !== STATE_VERSION) return;
      // Defense: never accept a snapshot that would erase a journey we
      // already have locally — protects against stale or empty remote writes.
      if (state.startDate && !data.startDate) {
        console.warn('Ignoring Firestore snapshot — would erase startDate');
        return;
      }
      const def = defaultState();
      state = { ...def, ...data, days: { ...def.days, ...(data.days || {}) }, settings: { ...def.settings, ...(data.settings || {}) } };
      saveStateLocal();
      render();
    }, (err) => console.error('Firestore listener error', err));
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = el.authEmail.value.trim();
    const password = el.authPassword.value;
    if (!email || !password) return;
    hideAuthError();
    el.authSubmit.disabled = true;
    const originalLabel = el.authSubmit.textContent;
    el.authSubmit.textContent = authMode === 'signin' ? 'Signing in…' : 'Creating account…';
    try {
      if (authMode === 'signin') await firebaseAuth.signInWithEmailAndPassword(email, password);
      else await firebaseAuth.createUserWithEmailAndPassword(email, password);
      el.authForm.reset();
    } catch (err) {
      showAuthError(prettyAuthError(err));
      el.authSubmit.disabled = false;
      el.authSubmit.textContent = originalLabel;
    }
  }

  async function signInWithGoogle() {
    hideAuthError();
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await firebaseAuth.signInWithPopup(provider);
    } catch (err) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') return;
      showAuthError(prettyAuthError(err));
    }
  }

  async function forgotPassword() {
    const email = el.authEmail.value.trim();
    if (!email) { showAuthError('Enter your email above first, then tap "Forgot password?"'); return; }
    try {
      await firebaseAuth.sendPasswordResetEmail(email);
      showToast(`Password reset email sent to ${email}`);
      hideAuthError();
    } catch (err) {
      showAuthError(prettyAuthError(err));
    }
  }

  async function doSignOut() {
    try {
      await firebaseAuth.signOut();
      closeSettings();
      showToast('Signed out.');
    } catch {
      showToast('Sign-out failed.');
    }
  }

  function showAuthError(msg) {
    el.authError.textContent = msg;
    el.authError.hidden = false;
  }
  function hideAuthError() {
    el.authError.hidden = true;
    el.authError.textContent = '';
  }

  function prettyAuthError(err) {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email': return 'That email looks invalid.';
      case 'auth/user-not-found': return 'No account with that email.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials': return 'Wrong email or password.';
      case 'auth/email-already-in-use': return 'An account with that email already exists.';
      case 'auth/weak-password': return 'Password must be at least 6 characters.';
      case 'auth/too-many-requests': return 'Too many attempts. Try again in a few minutes.';
      case 'auth/network-request-failed': return 'Network error. Check your connection.';
      case 'auth/operation-not-allowed': return 'That sign-in method isn\'t enabled in Firebase yet.';
      case 'auth/unauthorized-domain': return 'This domain isn\'t authorized in your Firebase project.';
      case 'auth/popup-blocked': return 'Popup was blocked — allow popups for this site and try again.';
      case 'auth/account-exists-with-different-credential': return 'You already have an account with a different sign-in method.';
      default: return err?.message || 'Something went wrong.';
    }
  }

  function continueLocalOnly() {
    sessionStorage.setItem(LOCAL_ONLY_KEY, '1');
    useLocalOnly = true;
    state = loadStateLocal();
    appPhase = 'app';
    render();
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
          askConfirm({
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
        askConfirm({
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
      case 'sign-out': doSignOut(); break;
      case 'forgot-password': forgotPassword(); break;
      case 'continue-local': continueLocalOnly(); break;
      case 'sign-in-google': signInWithGoogle(); break;
      case 'toggle-task': {
        const tid = t.dataset.taskId;
        if (tid) toggleTodayTask(tid);
        break;
      }
      case 'open-water': openWaterSheet(); break;
      case 'close-water': closeWaterSheet(); break;
      case 'water-add': {
        const amt = Number(t.dataset.waterAmount);
        if (amt > 0) addWater(amt);
        break;
      }
      case 'water-remove': {
        const amt = Number(t.dataset.waterAmount);
        if (amt > 0) removeCustomAmount(amt);
        break;
      }
      case 'reset-water-today': resetWaterToday(); break;
      case 'open-photo': openPhotoSheet(); break;
      case 'close-photo':
        if (!photoUploadInProgress) closePhotoSheet();
        break;
      case 'pick-photo': el.photoInput.click(); break;
      case 'remove-photo':
        if (photoSheetDay) removePhotoForDay(photoSheetDay);
        break;
      case 'photo-prev-day':
        if (photoSheetDay && photoSheetDay > 1 && !photoUploadInProgress) {
          photoSheetDay--;
          renderPhotoSheet();
        }
        break;
      case 'photo-next-day': {
        const todayDay = journeyDayForToday() || 1;
        if (photoSheetDay && photoSheetDay < todayDay && !photoUploadInProgress) {
          photoSheetDay++;
          renderPhotoSheet();
        }
        break;
      }
      case 'select-photo-day': {
        const d = Number(t.dataset.day);
        if (!d) break;
        if (state.photos && state.photos[d]) {
          clearCarousel();
          setCarouselMode('Paused');
          showPhotoDay(d);
        } else {
          openPhotoSheet(d);
        }
        break;
      }
    }
  });

  // Auth tab switching
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-auth-mode]');
    if (!tab) return;
    authMode = tab.dataset.authMode;
    updateAuthUI();
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

  // Auth form
  el.authForm.addEventListener('submit', handleAuthSubmit);

  // Water custom amount form
  el.waterCustomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const oz = parseInt(el.waterCustomInput.value, 10);
    addCustomWater(oz);
  });

  // Photo file input
  el.photoInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file && photoSheetDay) uploadPhotoForDay(photoSheetDay, file);
    e.target.value = '';
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
      else if (el.waterSheet.getAttribute('aria-hidden') === 'false') closeWaterSheet();
      else if (el.photoSheet.getAttribute('aria-hidden') === 'false' && !photoUploadInProgress) closePhotoSheet();
      else if (el.settingsSheet.getAttribute('aria-hidden') === 'false') closeSettings();
    }
  });

  // Re-render at midnight
  function scheduleMidnightRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0);
    setTimeout(() => { render(); scheduleMidnightRefresh(); }, nextMidnight - now);
  }
  scheduleMidnightRefresh();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearCarousel();
    } else {
      render();
    }
  });

  /* ----- Boot --------------------------------------------------------- */

  function boot() {
    // Local-only mode chosen this session
    if (sessionStorage.getItem(LOCAL_ONLY_KEY) === '1') {
      useLocalOnly = true;
      state = loadStateLocal();
      appPhase = 'app';
      render();
      return;
    }

    // Firebase not configured
    if (!isFirebaseConfigured() || typeof firebase === 'undefined') {
      appPhase = 'setup';
      render();
      return;
    }

    // Firebase configured — init and wait for auth
    try {
      initFirebase();
      firebaseAuth.onAuthStateChanged(onAuth);
    } catch (e) {
      console.error('Firebase init failed', e);
      appPhase = 'setup';
      render();
    }
  }

  boot();
})();
