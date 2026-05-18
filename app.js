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
    photos: {}, // { [journeyDay: number 1-indexed]: { uploadedAt: string, alignment?: { p1, p2 } } }
    photoAlignmentRef: { r1: { x: 0.5, y: 0.22 }, r2: { x: 0.5, y: 0.5 }, r3: { x: 0.5, y: 0.78 } },
    photoAspectRatio: null, // width / height of the first uploaded photo
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
    photoSheetActions: $('#photoSheetActions'),
    photoAlignBtn: $('#photoAlignBtn'),
    photoAlignStage: $('#photoAlignStage'),
    photoAlignActions: $('#photoAlignActions'),
    photoAlignCanvas: $('#photoAlignCanvas'),
    photoAlignImg: $('#photoAlignImg'),
    photoAlignPin1: $('#photoAlignPin1'),
    photoAlignPin2: $('#photoAlignPin2'),
    photoAlignPin3: $('#photoAlignPin3'),
    photoAlignTarget1: $('#photoAlignTarget1'),
    photoAlignTarget2: $('#photoAlignTarget2'),
    photoAlignTarget3: $('#photoAlignTarget3'),
    photoAlignHint: $('#photoAlignHint'),
    photoAlignRotateSlider: $('#photoAlignRotateSlider'),
    photoAlignZoomSlider: $('#photoAlignZoomSlider'),
    photoAlignCalibrate: $('#photoAlignCalibrate'),
    photoAlignSaveBtn: $('#photoAlignSaveBtn'),
    photoAlignControls: $('#photoAlignControls'),
    photoAlignPreviewBtn: $('#photoAlignPreviewBtn'),
    photoAlignMagnifier: $('#photoAlignMagnifier'),
    photoAlignMagnifierClone: $('#photoAlignMagnifierClone'),
    photoAlignMagnifierImg: $('#photoAlignMagnifierImg'),
    photosCard: $('#photosCard'),
    photosStage: $('#photosStage'),
    photosImageA: $('#photosImageA'),
    photosImageB: $('#photosImageB'),
    photosImageWrap: $('.photos-image-wrap'),
    photosEmpty: $('#photosEmpty'),
    photosDayTag: $('#photosDayTag'),
    photosRailTrack: $('#photosRailTrack'),
    photosModePill: $('#photosModePill'),
    photosSide: $('.photos-side'),
    photosDownloadBtn: $('#photosDownloadBtn'),
    videoSheet: $('#videoSheet'),
    videoStatus: $('#videoStatus'),
    videoProgressFill: $('#videoProgressFill'),
    photosSummary: $('#photosSummary'),
    photosSummaryDay: $('#photosSummaryDay'),
    photosSummaryDate: $('#photosSummaryDate'),
    photosSummaryPhase: $('#photosSummaryPhase'),
    photosSummaryStats: $('#photosSummaryStats'),
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
    applyPhotoAspect();
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

  function applyPhotoAspect() {
    const r = state.photoAspectRatio;
    if (r && Number.isFinite(r) && r > 0) {
      document.documentElement.style.setProperty('--photo-aspect-ratio', String(r));
    } else {
      document.documentElement.style.removeProperty('--photo-aspect-ratio');
    }
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
        const aspectRatio = img.naturalWidth / img.naturalHeight;
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

        const qualities = [PHOTO_QUALITY, 0.65, 0.55, 0.45, 0.35];
        for (const q of qualities) {
          const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', q));
          if (!blob) continue;
          if (blob.size <= PHOTO_MAX_BYTES) {
            const reader = new FileReader();
            reader.onload = () => resolve({ dataUrl: reader.result, aspectRatio });
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

  const preloadedUrls = new Set();
  function preloadImage(url) {
    if (preloadedUrls.has(url)) return Promise.resolve(true);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { preloadedUrls.add(url); resolve(true); };
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
      const { dataUrl, aspectRatio } = await compressImageToDataURL(file);
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

      // Lock in the viewport aspect ratio to the first photo uploaded.
      if (!state.photoAspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0) {
        state.photoAspectRatio = aspectRatio;
        applyPhotoAspect();
      }

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
    el.photoAlignBtn.hidden = !has;
    el.photoAlignBtn.textContent = has?.alignment ? 'Re-align this photo' : 'Align this photo';
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

  /* ----- Photo alignment ------------------------------------------------ */

  // alignState shape:
  //   { day, pins: [{x,y}|null, {x,y}|null], transform: {tx,ty,scale,rotate},
  //     isCalibrating: bool, drag: any }
  // pins are in normalized photo-untransformed coords (0..1 of canvas).
  // transform is applied around the canvas center (rotate + scale) then a free
  // translate (tx,ty). Reference is stored in state.photoAlignmentRef as r1, r2
  // in normalized canvas coords.
  let alignState = null;

  function defaultRef() {
    const r = state.photoAlignmentRef || {};
    return {
      r1: r.r1 || { x: 0.5, y: 0.22 },
      r2: r.r2 || { x: 0.5, y: 0.5 },
      r3: r.r3 || { x: 0.5, y: 0.78 },
    };
  }

  function transformPoint(p, t, W, H) {
    const px = p.x * W;
    const py = p.y * H;
    const cx = W / 2;
    const cy = H / 2;
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(t.rotate);
    const sin = Math.sin(t.rotate);
    const rx = (dx * cos - dy * sin) * t.scale;
    const ry = (dx * sin + dy * cos) * t.scale;
    return { x: rx + cx + t.tx, y: ry + cy + t.ty };
  }

  function inverseTransformPoint(cp, t, W, H) {
    const cx = W / 2;
    const cy = H / 2;
    let dx = (cp.x - cx - t.tx) / t.scale;
    let dy = (cp.y - cy - t.ty) / t.scale;
    const cos = Math.cos(-t.rotate);
    const sin = Math.sin(-t.rotate);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return { x: (rx + cx) / W, y: (ry + cy) / H };
  }

  // Optimal least-squares similarity transform (Procrustes / 2D Kabsch):
  // given N source points and N target points in canvas pixels, find the
  // uniform-scale rotation + translation that best maps source → target.
  // For N=2 this is the unique exact-fit similarity. For N=3 it's the
  // best-fit, with no shearing or non-uniform stretch.
  function computeAutoTransformN(pts, refs, W, H) {
    const n = Math.min(pts.length, refs.length);
    if (n < 2) return null;
    const sources = [];
    const targets = [];
    for (let i = 0; i < n; i++) {
      if (!pts[i] || !refs[i]) continue;
      sources.push({ x: pts[i].x * W, y: pts[i].y * H });
      targets.push({ x: refs[i].x * W, y: refs[i].y * H });
    }
    const m = sources.length;
    if (m < 2) return null;
    let scx = 0, scy = 0, tcx = 0, tcy = 0;
    for (let i = 0; i < m; i++) {
      scx += sources[i].x; scy += sources[i].y;
      tcx += targets[i].x; tcy += targets[i].y;
    }
    scx /= m; scy /= m; tcx /= m; tcy /= m;
    let dot = 0, cross = 0, sqs = 0;
    for (let i = 0; i < m; i++) {
      const sx = sources[i].x - scx, sy = sources[i].y - scy;
      const tx = targets[i].x - tcx, ty = targets[i].y - tcy;
      dot   += sx * tx + sy * ty;
      cross += sx * ty - sy * tx;
      sqs   += sx * sx + sy * sy;
    }
    if (sqs < 0.5) return null;
    const scale = Math.sqrt(dot * dot + cross * cross) / sqs;
    const angle = Math.atan2(cross, dot);
    const cx = W / 2, cy = H / 2;
    const cos = Math.cos(angle) * scale;
    const sin = Math.sin(angle) * scale;
    const rx = cos * (scx - cx) - sin * (scy - cy);
    const ry = sin * (scx - cx) + cos * (scy - cy);
    return { tx: tcx - cx - rx, ty: tcy - cy - ry, scale, rotate: angle };
  }

  function pointsFromAlignment(alignment) {
    if (!alignment) return [];
    const pts = [];
    if (alignment.p1) pts.push(alignment.p1);
    if (alignment.p2) pts.push(alignment.p2);
    if (alignment.p3) pts.push(alignment.p3);
    return pts;
  }

  function refsForCount(ref, count) {
    const out = [];
    if (count >= 1) out.push(ref.r1);
    if (count >= 2) out.push(ref.r2);
    if (count >= 3) out.push(ref.r3);
    return out;
  }

  // Returns the affine matrix that lays out a photo at W×H pixels with its
  // pins mapped to the reference positions. Similarity transform only
  // (translate + rotate + uniform scale), no stretching.
  function alignmentMatrixObject(alignment, ref, W, H) {
    const pts = pointsFromAlignment(alignment);
    if (pts.length < 2 || !ref) return null;
    const refs = refsForCount(ref, pts.length);
    const t = computeAutoTransformN(pts, refs, W, H);
    if (!t) return null;
    const cx = W / 2, cy = H / 2;
    const cos = Math.cos(t.rotate) * t.scale;
    const sin = Math.sin(t.rotate) * t.scale;
    return {
      a: cos, b: sin, c: -sin, d: cos,
      e: t.tx + cx - cos * cx + sin * cy,
      f: t.ty + cy - sin * cx - cos * cy,
    };
  }

  // For the carousel: serialize the matrix into a CSS matrix() string.
  function alignmentMatrixCSS(alignment, ref, W, H) {
    const m = alignmentMatrixObject(alignment, ref, W, H);
    return m ? `matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})` : '';
  }

  function openAlignView() {
    if (!photoSheetDay) return;
    if (!state.photos?.[photoSheetDay]) {
      showToast('Upload a photo for this day first.');
      return;
    }
    const existing = state.photos[photoSheetDay].alignment;
    alignState = {
      day: photoSheetDay,
      pins: existing
        ? [
            existing.p1 ? { ...existing.p1 } : null,
            existing.p2 ? { ...existing.p2 } : null,
            existing.p3 ? { ...existing.p3 } : null,
          ]
        : [null, null, null],
      transform: { tx: 0, ty: 0, scale: 1, rotate: 0 },
      isCalibrating: false,
      previewMode: false,
      drag: null,
    };
    el.photoAlignStage.hidden = false;
    el.photoAlignActions.hidden = false;
    el.photoSheetActions.style.display = 'none';
    el.photoPreview.style.display = 'none';
    el.photoAlignCalibrate.checked = false;
    el.photoAlignRotateSlider.value = 0;
    el.photoAlignZoomSlider.value = 1;

    fetchPhotoURL(photoSheetDay).then((url) => {
      if (url) el.photoAlignImg.src = url;
      renderAlignView();
    });

    renderAlignView();
  }

  function closeAlignView() {
    alignState = null;
    hideMagnifier();
    el.photoAlignStage.hidden = true;
    el.photoAlignActions.hidden = true;
    el.photoSheetActions.style.display = '';
    el.photoPreview.style.display = '';
  }

  function renderAlignView() {
    if (!alignState) return;
    const W = el.photoAlignCanvas.clientWidth;
    const H = el.photoAlignCanvas.clientHeight;
    const { pins, isCalibrating, previewMode } = alignState;
    const ref = defaultRef();
    const placedCount = pins.filter(Boolean).length;

    // Effective transform:
    //  - calibrating → the user's manual similarity transform
    //  - previewing  → the best-fit similarity that lands pins on targets
    //  - placing     → identity, so pins stay exactly where they're tapped
    let transform = alignState.transform;
    if (previewMode && !isCalibrating && placedCount >= 2) {
      const refs = refsForCount(ref, placedCount);
      const previewT = computeAutoTransformN(pins.filter(Boolean), refs, W, H);
      if (previewT) transform = previewT;
    }

    el.photoAlignControls.hidden = !isCalibrating;
    el.photoAlignPreviewBtn.hidden = isCalibrating || placedCount < 2;
    el.photoAlignPreviewBtn.textContent = previewMode ? 'Back to editing' : 'Preview alignment';

    // Reference targets show in placing/preview modes (not while calibrating)
    const targets = [el.photoAlignTarget1, el.photoAlignTarget2, el.photoAlignTarget3];
    const refPts = [ref.r1, ref.r2, ref.r3];
    targets.forEach((tEl, i) => {
      tEl.style.left = `${refPts[i].x * W}px`;
      tEl.style.top = `${refPts[i].y * H}px`;
      tEl.style.display = isCalibrating ? 'none' : '';
    });

    // Image transform — similarity (rotate + uniform scale + translate)
    const imgTransform =
      `translate(${transform.tx}px, ${transform.ty}px) ` +
      `translate(${W / 2}px, ${H / 2}px) ` +
      `rotate(${transform.rotate}rad) scale(${transform.scale}) ` +
      `translate(${-W / 2}px, ${-H / 2}px)`;
    el.photoAlignImg.style.transform = imgTransform;
    if (!el.photoAlignMagnifier.hidden) {
      el.photoAlignMagnifierImg.style.transform = imgTransform;
    }

    // Pins follow the photo
    const pinEls = [el.photoAlignPin1, el.photoAlignPin2, el.photoAlignPin3];
    pinEls.forEach((pEl, i) => {
      const p = pins[i] ? transformPoint(pins[i], transform, W, H) : null;
      if (p) {
        pEl.style.left = `${p.x}px`;
        pEl.style.top = `${p.y}px`;
        pEl.classList.remove('placeholder');
      } else {
        pEl.classList.add('placeholder');
      }
    });

    // Hint text
    if (previewMode && !isCalibrating) el.photoAlignHint.textContent = 'Preview — tap "Back to editing" to adjust';
    else if (!pins[0]) el.photoAlignHint.textContent = 'Tap to place pin 1 (e.g. forehead)';
    else if (!pins[1]) el.photoAlignHint.textContent = 'Tap to place pin 2 (e.g. chest)';
    else if (!pins[2]) el.photoAlignHint.textContent = 'Tap to place pin 3 (e.g. belly button)';
    else if (isCalibrating) el.photoAlignHint.textContent = 'Drag, zoom or rotate to frame';
    else el.photoAlignHint.textContent = 'Tap any pin to move it';

    el.photoAlignSaveBtn.textContent = isCalibrating ? 'Set as reference' : 'Save alignment';
  }

  function placeOrMovePin(cx, cy) {
    if (!alignState) return;
    const W = el.photoAlignCanvas.clientWidth;
    const H = el.photoAlignCanvas.clientHeight;
    const photoPos = inverseTransformPoint({ x: cx, y: cy }, alignState.transform, W, H);
    photoPos.x = Math.max(0, Math.min(1, photoPos.x));
    photoPos.y = Math.max(0, Math.min(1, photoPos.y));
    const pins = alignState.pins;
    const firstEmpty = pins.findIndex((p) => !p);
    if (firstEmpty !== -1) {
      pins[firstEmpty] = photoPos;
    } else {
      // All pins placed — move the nearest one
      let nearestIdx = 0;
      let nearestDist = Infinity;
      pins.forEach((p, i) => {
        const pc = transformPoint(p, alignState.transform, W, H);
        const d = Math.hypot(cx - pc.x, cy - pc.y);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      });
      pins[nearestIdx] = photoPos;
    }
    renderAlignView();
  }

  function onAlignSlider() {
    if (!alignState || !alignState.isCalibrating) return;
    const rotDeg = parseFloat(el.photoAlignRotateSlider.value);
    const zoom = parseFloat(el.photoAlignZoomSlider.value);
    alignState.transform.rotate = rotDeg * Math.PI / 180;
    alignState.transform.scale = zoom;
    renderAlignView();
  }

  function onAlignCalibrateToggle() {
    if (!alignState) return;
    alignState.isCalibrating = el.photoAlignCalibrate.checked;
    alignState.previewMode = false;
    // Both modes start from identity: placing keeps it there so pins never
    // drift; calibration lets the user move it from there with sliders/drag.
    alignState.transform = { tx: 0, ty: 0, scale: 1, rotate: 0 };
    el.photoAlignRotateSlider.value = 0;
    el.photoAlignZoomSlider.value = 1;
    renderAlignView();
  }

  function savePhotoAlignment() {
    if (!alignState) return;
    const { day, pins, isCalibrating, transform } = alignState;
    const placedCount = pins.filter(Boolean).length;
    if (placedCount < 2) {
      showToast('Place at least 2 pins first.');
      return;
    }
    if (!state.photos[day]) {
      state.photos[day] = { uploadedAt: new Date().toISOString() };
    }
    const alignment = {};
    if (pins[0]) alignment.p1 = { ...pins[0] };
    if (pins[1]) alignment.p2 = { ...pins[1] };
    if (pins[2]) alignment.p3 = { ...pins[2] };
    state.photos[day].alignment = alignment;

    if (isCalibrating) {
      const W = el.photoAlignCanvas.clientWidth;
      const H = el.photoAlignCanvas.clientHeight;
      const newRef = { ...state.photoAlignmentRef };
      if (pins[0]) { const p = transformPoint(pins[0], transform, W, H); newRef.r1 = { x: p.x / W, y: p.y / H }; }
      if (pins[1]) { const p = transformPoint(pins[1], transform, W, H); newRef.r2 = { x: p.x / W, y: p.y / H }; }
      if (pins[2]) { const p = transformPoint(pins[2], transform, W, H); newRef.r3 = { x: p.x / W, y: p.y / H }; }
      state.photoAlignmentRef = newRef;
      showToast('Reference updated. All photos will re-align.');
    } else {
      showToast('Alignment saved.');
    }

    saveState();
    closeAlignView();
    renderPhotoSheet();
    restartPhotoCarousel();
  }

  const MAGNIFIER_SIZE = 150;
  const MAGNIFIER_ZOOM = 3.5;
  const MAGNIFIER_HOLD_MS = 180;

  function showMagnifier(cx, cy) {
    const W = el.photoAlignCanvas.clientWidth;
    const H = el.photoAlignCanvas.clientHeight;
    el.photoAlignMagnifierClone.style.width = `${W}px`;
    el.photoAlignMagnifierClone.style.height = `${H}px`;
    el.photoAlignMagnifierImg.src = el.photoAlignImg.src;
    el.photoAlignMagnifierImg.style.transform = el.photoAlignImg.style.transform;
    el.photoAlignMagnifier.hidden = false;
    updateMagnifier(cx, cy);
  }

  function updateMagnifier(cx, cy) {
    if (el.photoAlignMagnifier.hidden) return;
    const M = MAGNIFIER_SIZE;
    const S = MAGNIFIER_ZOOM;

    // Position relative to the viewport so the magnifier is never clipped by
    // the canvas's overflow:hidden or by sheet scrolling. The clone inside
    // still uses canvas-local coords to render the right zoomed region.
    const rect = el.photoAlignCanvas.getBoundingClientRect();
    const fingerVpX = rect.left + cx;
    const fingerVpY = rect.top + cy;
    const MARGIN = 12;
    const GAP = 40;

    let mxVp = fingerVpX - M / 2;
    let myVp = fingerVpY - M - GAP;          // try above the finger
    if (myVp < MARGIN) myVp = fingerVpY + GAP; // fall back to below
    mxVp = Math.max(MARGIN, Math.min(window.innerWidth - M - MARGIN, mxVp));
    myVp = Math.max(MARGIN, Math.min(window.innerHeight - M - MARGIN, myVp));

    el.photoAlignMagnifier.style.left = `${mxVp}px`;
    el.photoAlignMagnifier.style.top = `${myVp}px`;

    el.photoAlignMagnifierClone.style.transform =
      `translate(${M / 2}px, ${M / 2}px) scale(${S}) translate(${-cx}px, ${-cy}px)`;
    el.photoAlignMagnifierImg.style.transform = el.photoAlignImg.style.transform;
  }

  function hideMagnifier() {
    el.photoAlignMagnifier.hidden = true;
  }

  function setPinAt(pinIdx, cx, cy) {
    if (!alignState || pinIdx < 0 || pinIdx > 2) return;
    const W = el.photoAlignCanvas.clientWidth;
    const H = el.photoAlignCanvas.clientHeight;
    const photoPos = inverseTransformPoint({ x: cx, y: cy }, alignState.transform, W, H);
    photoPos.x = Math.max(0, Math.min(1, photoPos.x));
    photoPos.y = Math.max(0, Math.min(1, photoPos.y));
    alignState.pins[pinIdx] = photoPos;
    renderAlignView();
  }

  function findPinNearCanvasPoint(cx, cy, radius = 28) {
    if (!alignState) return -1;
    const W = el.photoAlignCanvas.clientWidth;
    const H = el.photoAlignCanvas.clientHeight;
    let bestIdx = -1;
    let bestDist = Infinity;
    alignState.pins.forEach((p, i) => {
      if (!p) return;
      const pc = transformPoint(p, alignState.transform, W, H);
      const d = Math.hypot(cx - pc.x, cy - pc.y);
      if (d < radius && d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  function setupAlignGestures() {
    // Re-parent the magnifier to <body> so position:fixed positioning escapes
    // any clipping or transformed ancestors. Without this it gets clipped by
    // the canvas's overflow:hidden and by the sheet's scroll viewport.
    if (el.photoAlignMagnifier && el.photoAlignMagnifier.parentElement !== document.body) {
      document.body.appendChild(el.photoAlignMagnifier);
    }

    const canvas = el.photoAlignCanvas;
    let drag = null;
    const MOVE_THRESHOLD = 6;

    // Pan is only allowed in calibration mode AND only if the pointer
    // didn't land on an existing pin. Pin grabs always win over pans so
    // the user can re-position pins even when all three are placed.
    const canPanFreely = () =>
      alignState && alignState.pins.every(Boolean) && alignState.isCalibrating;

    canvas.addEventListener('pointerdown', (e) => {
      if (!alignState || alignState.previewMode) return;
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // If the press lands near an existing pin, grab it.
      const grabbedPinIdx = findPinNearCanvasPoint(cx, cy);

      // For pin grabs, capture the offset between the click and the pin's
      // actual position so the pin doesn't jump to wherever you tapped
      // inside the circle — it stays put and only moves by the drag delta.
      let pinOffsetX = 0;
      let pinOffsetY = 0;
      if (grabbedPinIdx >= 0) {
        const W = canvas.clientWidth;
        const H = canvas.clientHeight;
        const pinCanvas = transformPoint(alignState.pins[grabbedPinIdx], alignState.transform, W, H);
        pinOffsetX = cx - pinCanvas.x;
        pinOffsetY = cy - pinCanvas.y;
      }

      drag = {
        type: grabbedPinIdx >= 0 ? 'moving-pin' : 'pending',
        pinIdx: grabbedPinIdx,
        startX: e.clientX, startY: e.clientY,
        cx, cy,
        pinOffsetX, pinOffsetY,
        origTransform: { ...alignState.transform },
        holdTimer: null,
      };

      if (drag.type === 'moving-pin') {
        // Magnifier centers on the pin's saved position, not the click
        showMagnifier(cx - pinOffsetX, cy - pinOffsetY);
      } else if (!canPanFreely()) {
        drag.holdTimer = setTimeout(() => {
          if (!drag || drag.type === 'pan' || drag.type === 'moving-pin') return;
          drag.type = 'placing';
          showMagnifier(drag.cx, drag.cy);
        }, MAGNIFIER_HOLD_MS);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drag || !alignState) return;
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      drag.cx = cx;
      drag.cy = cy;
      if (drag.type === 'pending' && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
        if (canPanFreely()) {
          drag.type = 'pan';
          if (drag.holdTimer) clearTimeout(drag.holdTimer);
        } else {
          drag.type = 'placing';
          if (drag.holdTimer) clearTimeout(drag.holdTimer);
          showMagnifier(cx, cy);
        }
      }
      if (drag.type === 'pan') {
        alignState.transform.tx = drag.origTransform.tx + dx;
        alignState.transform.ty = drag.origTransform.ty + dy;
        renderAlignView();
      } else if (drag.type === 'moving-pin') {
        // Subtract the original offset so the magnifier (and eventual
        // drop point) tracks the pin's center, not the finger center.
        updateMagnifier(cx - drag.pinOffsetX, cy - drag.pinOffsetY);
      } else if (drag.type === 'placing') {
        updateMagnifier(cx, cy);
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!drag) return;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
      if (drag.holdTimer) clearTimeout(drag.holdTimer);
      hideMagnifier();
      if (drag.type === 'moving-pin') {
        setPinAt(drag.pinIdx, drag.cx - drag.pinOffsetX, drag.cy - drag.pinOffsetY);
      } else if (drag.type === 'pending' || drag.type === 'placing') {
        placeOrMovePin(drag.cx, drag.cy);
      }
      drag = null;
    });

    canvas.addEventListener('pointercancel', () => {
      if (drag?.holdTimer) clearTimeout(drag.holdTimer);
      hideMagnifier();
      drag = null;
    });

    // Mouse wheel for zoom while calibrating
    canvas.addEventListener('wheel', (e) => {
      if (!alignState || !alignState.isCalibrating) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const next = Math.max(0.5, Math.min(3, alignState.transform.scale * (1 + delta)));
      alignState.transform.scale = next;
      el.photoAlignZoomSlider.value = next;
      renderAlignView();
    }, { passive: false });
  }

  /* ----- Photo carousel ------------------------------------------------ */

  let carouselTimer = null;
  let carouselCancel = null;
  let photoFrontLayer = 0; // index into [photosImageA, photosImageB]
  let userCarouselMode = 'auto'; // 'auto' | 'sequence' | 'compare'
  let carouselPaused = false;
  let modeOverrideUntil = 0; // ms timestamp — pill shows the chosen mode until then
  let lastPhaseLabel = '';   // the carousel's current live phase ('Then vs Now', 'Sequence', etc.)

  function photoLayers() { return [el.photosImageA, el.photosImageB]; }

  function resetPhotoLayers() {
    for (const layer of photoLayers()) {
      layer.style.transition = 'none';
      layer.style.opacity = '0';
      layer.style.transform = '';
      layer.style.zIndex = '';
      layer.removeAttribute('src');
    }
    requestAnimationFrame(() => {
      for (const layer of photoLayers()) layer.style.transition = '';
    });
    photoFrontLayer = 0;
  }

  function uploadedDays() {
    return Object.keys(state.photos || {})
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
  }

  function renderPhotoRail(activeDay) {
    const phase = PHASES[state.currentPhase];
    if (!phase || !state.startDate || !state.phaseStartDate) {
      el.photosRailTrack.innerHTML = '';
      updatePhotoSummary(null);
      return;
    }
    // Show every day of the current phase, even days without photos. The
    // carousel only plays uploaded days (via uploadedDays()), so empties
    // are just visible slots — they don't get auto-played but the user
    // can tap one to upload a photo for that day.
    const phaseStartJourney = daysBetween(state.startDate, state.phaseStartDate) + 1;
    const phaseEndJourney = phaseStartJourney + phase.duration - 1;
    const todayDay = journeyDayForToday() || 0;
    const items = [];
    for (let d = phaseStartJourney; d <= phaseEndJourney; d++) {
      const phaseDayNum = d - phaseStartJourney + 1;
      const has = !!(state.photos && state.photos[d]);
      const isFuture = d > todayDay;
      const cls = ['photos-day-item'];
      if (has) cls.push('has-photo');
      if (d === activeDay) cls.push('active');
      if (isFuture) cls.push('future');
      const dateISO = addDays(state.startDate, d - 1);
      const dateStr = formatShortDate(dateISO);
      items.push(`
        <button class="${cls.join(' ')}" type="button" data-action="select-photo-day" data-day="${d}">
          <span class="photos-day-num">${phaseDayNum}</span>
          <span class="photos-day-date">${dateStr}</span>
          <span class="photos-day-dot" aria-hidden="true"></span>
        </button>
      `);
    }
    el.photosRailTrack.innerHTML = items.join('');
    scrollRailTo(activeDay || todayDay);
    updatePhotoSummary(activeDay || todayDay);
    updateDownloadButtonState();
  }

  function updateDownloadButtonState() {
    if (!el.photosDownloadBtn) return;
    const count = uploadedDays().length;
    el.photosDownloadBtn.disabled = count < 2;
    el.photosDownloadBtn.title = count < 2
      ? 'Upload at least 2 photos to download a video'
      : 'Download as video';
  }

  function updatePhotoSummary(day) {
    if (!el.photosSummary) return;
    const target = day || journeyDayForToday();
    if (!target || !state.startDate) {
      el.photosSummaryDay.textContent = '—';
      el.photosSummaryDate.textContent = '';
      el.photosSummaryPhase.textContent = '';
      el.photosSummaryStats.textContent = '';
      return;
    }
    el.photosSummaryDay.textContent = `Day ${target}`;
    const dateISO = addDays(state.startDate, target - 1);
    el.photosSummaryDate.textContent = formatFullDate(dateISO);
    const phaseInfo = phaseDayFromJourneyDay(target);
    if (phaseInfo) {
      const phase = PHASES[phaseInfo.phaseId];
      el.photosSummaryPhase.textContent = `${phase.name} · Day ${phaseInfo.dayIndex + 1} of ${phase.duration}`;
    } else {
      el.photosSummaryPhase.textContent = '';
    }
    const uploaded = Object.keys(state.photos || {}).length;
    const todayDay = journeyDayForToday() || 0;
    el.photosSummaryStats.textContent =
      `${uploaded} of ${todayDay} photo${todayDay === 1 ? '' : 's'} uploaded · ${Math.max(0, todayDay - uploaded)} to catch up`;
  }

  // Light-weight rail update used by the carousel hot path — toggles the
  // `.active` class on existing items instead of rebuilding the whole rail's
  // HTML each cycle (which was dropping frames at fast sequence rates).
  function updatePhotoRailActive(activeDay) {
    if (!el.photosRailTrack) return;
    const current = el.photosRailTrack.querySelector('.photos-day-item.active');
    if (current && current.dataset.day === String(activeDay)) {
      updatePhotoSummary(activeDay);
      return;
    }
    if (current) current.classList.remove('active');
    const next = el.photosRailTrack.querySelector(`.photos-day-item[data-day="${activeDay}"]`);
    if (next) next.classList.add('active');
    scrollRailTo(activeDay);
    updatePhotoSummary(activeDay);
  }

  function scrollRailTo(day) {
    requestAnimationFrame(() => {
      const item = el.photosRailTrack.querySelector(`[data-day="${day}"]`);
      const rail = el.photosRailTrack.parentElement;
      if (!item || !rail) return;
      const targetTop = item.offsetTop - rail.clientHeight / 2 + item.offsetHeight / 2;
      rail.scrollTop = Math.max(0, targetTop);
    });
  }

  async function showPhotoDay(day, opts = {}) {
    if (!day) return;
    const url = await fetchPhotoURL(day);
    if (!url) return;
    await preloadImage(url);
    const alignment = state.photos?.[day]?.alignment;
    const ref = defaultRef();
    const W = el.photosImageWrap.clientWidth;
    const H = el.photosImageWrap.clientHeight;
    const transformStr = alignment ? alignmentMatrixCSS(alignment, ref, W, H) : '';

    const layers = photoLayers();
    const backIdx = 1 - photoFrontLayer;
    const backEl = layers[backIdx];
    const frontEl = layers[photoFrontLayer];

    // Z-index swap so the back layer (new image) always paints on TOP of the
    // front. Without this, half the cycles would fade an invisible layer
    // underneath an opaque one and the image wouldn't appear to change.
    backEl.style.zIndex = '2';
    frontEl.style.zIndex = '1';

    // Snap both layers to a clean known state (kills any in-flight fade).
    frontEl.style.transition = 'none';
    frontEl.style.opacity = '1';
    backEl.style.transition = 'none';
    backEl.style.opacity = '0';
    void backEl.offsetWidth; // flush

    // Load the new image on the back layer (still invisible)
    backEl.src = url;
    backEl.style.transform = transformStr;

    el.photosImageWrap.classList.add('has-photo');
    el.photosDayTag.textContent = `Day ${day}`;
    if (opts.lightRail) updatePhotoRailActive(day);
    else renderPhotoRail(day);

    if (opts.instant) {
      // Hard swap — opacity flips to 1 with no transition, so the new image
      // appears immediately while the old layer stays at opacity 1
      // underneath. No fade duration, no flicker.
      backEl.style.opacity = '1';
    } else {
      // Crossfade — restore the CSS transition and animate to 1
      backEl.style.transition = '';
      requestAnimationFrame(() => {
        backEl.style.opacity = '1';
      });
    }

    photoFrontLayer = backIdx;
  }

  function clearCarousel() {
    if (carouselTimer) { clearTimeout(carouselTimer); carouselTimer = null; }
    if (carouselCancel) { carouselCancel(); carouselCancel = null; }
  }

  function setCarouselMode(label) {
    // The carousel calls this whenever it transitions between phases. It's
    // routed through renderPillLabel which respects the user's mode
    // (sequence/compare lock the label; auto follows the live phase).
    lastPhaseLabel = label || '';
    if (Date.now() < modeOverrideUntil) return; // override still showing
    renderPillLabel();
  }

  function renderPillLabel() {
    let text;
    if (carouselPaused) text = 'Paused';
    else if (userCarouselMode === 'sequence') text = 'Sequence';
    else if (userCarouselMode === 'compare') text = 'Then vs Now';
    else text = lastPhaseLabel; // auto — show whatever the carousel is doing right now
    if (!text) {
      el.photosModePill.textContent = '—';
      el.photosModePill.classList.add('hidden');
    } else {
      el.photosModePill.textContent = text;
      el.photosModePill.classList.remove('hidden');
    }
  }

  function cycleCarouselMode() {
    const order = ['auto', 'compare', 'sequence'];
    userCarouselMode = order[(order.indexOf(userCarouselMode) + 1) % order.length];
    carouselPaused = false;

    // Show the chosen mode for 500 ms so the user sees what they picked,
    // then settle into the normal live label.
    const overrideText =
      userCarouselMode === 'auto' ? 'Auto'
      : userCarouselMode === 'sequence' ? 'Sequence'
      : 'Then vs Now';
    el.photosModePill.textContent = overrideText;
    el.photosModePill.classList.remove('hidden');
    modeOverrideUntil = Date.now() + 500;
    setTimeout(() => {
      if (Date.now() >= modeOverrideUntil) renderPillLabel();
    }, 520);

    restartPhotoCarousel();
  }

  function togglePauseCarousel() {
    if (carouselPaused) {
      carouselPaused = false;
      restartPhotoCarousel();
    } else {
      carouselPaused = true;
      clearCarousel();
      el.photosImageWrap.style.removeProperty('--photo-fade-ms');
      renderPillLabel();
    }
  }

  async function runCarousel() {
    clearCarousel();
    const days = uploadedDays();
    if (days.length === 0) {
      el.photosImageWrap.classList.remove('has-photo');
      resetPhotoLayers();
      setCarouselMode(null);
      renderPhotoRail(null);
      return;
    }
    if (days.length === 1) {
      setCarouselMode(null);
      await showPhotoDay(days[0]);
      return;
    }

    // Build the rail once up front so updatePhotoRailActive() can just
    // toggle classes inside the hot loop instead of rebuilding HTML.
    renderPhotoRail(days[0]);

    let cancelled = false;
    carouselCancel = () => { cancelled = true; };
    const wait = (ms) => new Promise((r) => { carouselTimer = setTimeout(r, ms); });
    const setFade = (ms) => el.photosImageWrap.style.setProperty('--photo-fade-ms', `${ms}ms`);

    // Sequence pacing:
    //  - Each photo is shown for at most 500 ms (so a 7-day journey isn't
    //    needlessly stretched out).
    //  - The whole sequence is capped at 10 s total (so a finished 75-day
    //    journey doesn't take forever to watch).
    //  - Floor of 60 ms keeps the cycle in lockstep with the rail even at
    //    extreme photo counts (>166).
    //  - Fade duration scales with dwell — long enough to feel smooth at
    //    500 ms per photo, short enough to not blur the swap at 60 ms.
    const SEQ_PER_PHOTO_MAX = 500;
    const SEQ_TOTAL_MS = 10000;
    const seqPerPhoto = Math.min(
      SEQ_PER_PHOTO_MAX,
      Math.max(60, Math.round(SEQ_TOTAL_MS / days.length))
    );
    // Fade is a quarter of the dwell — short cross-fade, photos read as
    // distinct frames with a quick blend between them.
    const seqFadeMs = Math.min(200, Math.max(40, Math.round(seqPerPhoto * 0.25)));

    // "Then vs Now" gets a calmer dwell + smoother fade for contrast
    const compareDwellMs = 2000;
    const compareFadeMs = 280;

    while (!cancelled) {
      // Phase 1: "Then vs Now" — skipped in pure sequence mode
      if (userCarouselMode !== 'sequence') {
        setFade(compareFadeMs);
        setCarouselMode('Then vs Now');
        await showPhotoDay(days[0], { lightRail: true });
        if (cancelled) break;
        await wait(compareDwellMs);
        if (cancelled) break;
        await showPhotoDay(days[days.length - 1], { lightRail: true });
        if (cancelled) break;
        await wait(compareDwellMs);
        if (cancelled) break;
      }

      // Phase 2: Sequence — skipped in pure compare mode
      if (userCarouselMode !== 'compare') {
        setFade(seqFadeMs);
        setCarouselMode('Sequence');
        const seqOpts = { lightRail: true };
        const SEQ_INTRO_DWELL_MS = 1000; // pause on the starting frame
        for (let i = 0; i < days.length; i++) {
          if (cancelled) break;
          await showPhotoDay(days[i], seqOpts);
          if (cancelled) break;
          // Hold on the first photo a bit longer so the user has time to
          // register the starting point before the rapid playthrough.
          const dwell = i === 0 ? Math.max(seqPerPhoto, SEQ_INTRO_DWELL_MS) : seqPerPhoto;
          await wait(dwell);
        }
      }
    }
  }

  /* ----- Video export ------------------------------------------------ */

  let videoRecorder = null;
  let videoCancelled = false;

  function pickVideoMime() {
    if (typeof MediaRecorder === 'undefined') return null;
    const candidates = [
      { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
      { mime: 'video/mp4;codecs=avc1', ext: 'mp4' },
      { mime: 'video/mp4', ext: 'mp4' },
      { mime: 'video/webm;codecs=vp9', ext: 'webm' },
      { mime: 'video/webm;codecs=vp8', ext: 'webm' },
      { mime: 'video/webm', ext: 'webm' },
    ];
    for (const c of candidates) {
      try { if (MediaRecorder.isTypeSupported(c.mime)) return c; } catch {}
    }
    return null;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
  }

  function drawImageCover(ctx, img, dx, dy, dw, dh) {
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    if (!sw || !sh) return;
    const sourceRatio = sw / sh;
    const targetRatio = dw / dh;
    let sx, sy, sWidth, sHeight;
    if (sourceRatio > targetRatio) {
      sHeight = sh;
      sWidth = sh * targetRatio;
      sx = (sw - sWidth) / 2;
      sy = 0;
    } else {
      sWidth = sw;
      sHeight = sw / targetRatio;
      sx = 0;
      sy = (sh - sHeight) / 2;
    }
    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
  }

  // Read the live CSS theme tokens so the exported frame matches whatever
  // theme the user is currently on (light, dark, or auto-resolved).
  function getThemeTokens() {
    const cs = window.getComputedStyle(document.documentElement);
    const get = (name, fb) => {
      const v = cs.getPropertyValue(name);
      return (v && v.trim()) || fb;
    };
    return {
      bg:               get('--bg', '#000'),
      bgElevated:       get('--bg-elevated', '#1c1c1e'),
      bgSecondary:      get('--bg-secondary', 'rgba(118,118,128,0.24)'),
      bgTertiary:       get('--bg-tertiary', 'rgba(118,118,128,0.32)'),
      text:             get('--text', '#f5f5f7'),
      textSecondary:    get('--text-secondary', '#a1a1a6'),
      textTertiary:     get('--text-tertiary', '#6e6e73'),
      accent:           get('--accent', '#ff9f0a'),
      accentSoft:       get('--accent-soft', 'rgba(255,159,10,0.16)'),
      accentSoftStrong: get('--accent-soft-strong', 'rgba(255,159,10,0.28)'),
      separator:        get('--separator', 'rgba(84,84,88,0.4)'),
    };
  }

  function pathRoundedRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }

  const SYS_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

  function drawTimelineFrame(ctx, opts) {
    const {
      W, H, theme, currentDay, headline, modePill, img, alignment,
      allDays, photoSet, ref, phaseStartJourney, phaseName, phaseDuration,
    } = opts;

    // 1. Page background (matches body bg)
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Card
    const cardPad = 24;
    const cardX = cardPad, cardY = cardPad;
    const cardW = W - cardPad * 2, cardH = H - cardPad * 2;
    fillRect(ctx, cardX, cardY, cardW, cardH, 22, theme.bgElevated);

    // 3. Card padding for inner content
    const padding = 28;
    const innerX = cardX + padding;
    const innerY = cardY + padding;
    const innerW = cardW - padding * 2;
    const innerH = cardH - padding * 2;

    // 4. Header (eyebrow + title + mode pill)
    drawHeaderRow(ctx, innerX, innerY, innerW, theme, modePill);
    const HEADER_H = 80;

    // 5. Stage area below header
    const stageY = innerY + HEADER_H;
    const stageH = innerH - HEADER_H;

    // 5a. Photo on the left — fits stage height, width derived from aspect
    const aspect = (state.photoAspectRatio && state.photoAspectRatio > 0)
      ? state.photoAspectRatio : (4 / 5);
    let imgH = stageH;
    let imgW = imgH * aspect;
    const maxImgWFraction = 0.42;
    if (imgW > innerW * maxImgWFraction) {
      imgW = innerW * maxImgWFraction;
      imgH = imgW / aspect;
    }
    const imgX = innerX;
    const imgY = stageY + (stageH - imgH) / 2;
    drawPhotoBlock(ctx, imgX, imgY, imgW, imgH, img, alignment, ref, theme);

    // 5b. Side panel on the right
    const sideGap = 20;
    const sideX = imgX + imgW + sideGap;
    const sideW = innerW - imgW - sideGap;
    const summaryH = 130;
    drawSummaryBlock(ctx, sideX, stageY, sideW, summaryH, theme, {
      headline, currentDay, phaseStartJourney, phaseName, phaseDuration,
      uploadedCount: photoSet.size, todayDay: allDays[allDays.length - 1] || 0,
    });
    const railY = stageY + summaryH + 12;
    const railH = stageH - summaryH - 12;
    drawRailBlock(ctx, sideX, railY, sideW, railH, theme, {
      currentDay, allDays, photoSet, phaseStartJourney,
    });
  }

  function fillRect(ctx, x, y, w, h, r, color) {
    ctx.save();
    pathRoundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawHeaderRow(ctx, x, y, w, theme, modePill) {
    ctx.textBaseline = 'top';
    // Eyebrow PROGRESS
    ctx.fillStyle = theme.textTertiary;
    ctx.font = `600 12px ${SYS_FONT}`;
    ctx.fillText('PROGRESS', x, y);
    // Title
    ctx.fillStyle = theme.text;
    ctx.font = `700 26px ${SYS_FONT}`;
    ctx.fillText('Photo timeline', x, y + 22);
    // Mode pill (top-right)
    if (modePill) drawModePill(ctx, x + w, y + 14, modePill.toUpperCase(), theme);
  }

  function drawModePill(ctx, rightX, y, text, theme) {
    const fontSize = 12;
    ctx.font = `700 ${fontSize}px ${SYS_FONT}`;
    ctx.textBaseline = 'middle';
    const padX = 16, padY = 10;
    const textW = ctx.measureText(text).width;
    const pillW = textW + padX * 2;
    const pillH = fontSize + padY * 2;
    const x = rightX - pillW;
    fillRect(ctx, x, y, pillW, pillH, pillH / 2, theme.accentSoft);
    ctx.fillStyle = theme.accent;
    ctx.fillText(text, x + padX, y + pillH / 2 + 1);
  }

  function drawPhotoBlock(ctx, x, y, w, h, img, alignment, ref, theme) {
    ctx.save();
    pathRoundedRect(ctx, x, y, w, h, 14);
    ctx.clip();
    ctx.fillStyle = theme.bgSecondary;
    ctx.fillRect(x, y, w, h);
    if (img) {
      ctx.save();
      ctx.translate(x, y);
      const m = alignment ? alignmentMatrixObject(alignment, ref, w, h) : null;
      if (m) ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      drawImageCover(ctx, img, 0, 0, w, h);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSummaryBlock(ctx, x, y, w, h, theme, data) {
    fillRect(ctx, x, y, w, h, 14, theme.bgSecondary);
    const padX = 20, padY = 20;
    const innerX = x + padX;
    let cy = y + padY;
    ctx.textBaseline = 'top';

    // Headline ("Day N" or "THEN" / "NOW")
    ctx.fillStyle = theme.text;
    ctx.font = `700 34px ${SYS_FONT}`;
    ctx.fillText(data.headline, innerX, cy);
    cy += 42;

    // Date
    ctx.fillStyle = theme.textSecondary;
    ctx.font = `500 14px ${SYS_FONT}`;
    if (state.startDate) {
      const dateISO = addDays(state.startDate, data.currentDay - 1);
      ctx.fillText(formatFullDate(dateISO), innerX, cy);
    }
    cy += 24;

    // Phase line (e.g. "75 HARD · DAY 5 OF 75")
    if (data.phaseName) {
      const phaseDayNum = data.currentDay - data.phaseStartJourney + 1;
      ctx.fillStyle = theme.accent;
      ctx.font = `700 12px ${SYS_FONT}`;
      ctx.fillText(`${data.phaseName.toUpperCase()} · DAY ${phaseDayNum} OF ${data.phaseDuration}`, innerX, cy);
    }
    // Note: the "X of Y photos uploaded · N to catch up" line is shown
    // in the live app but omitted from the exported video — it's
    // ephemeral progress info that doesn't belong in a shareable export.
  }

  function drawRailBlock(ctx, x, y, w, h, theme, data) {
    ctx.save();
    pathRoundedRect(ctx, x, y, w, h, 14);
    ctx.clip();
    ctx.fillStyle = theme.bgSecondary;
    ctx.fillRect(x, y, w, h);

    const itemH = 44;
    const allDays = data.allDays;
    const currentIdx = allDays.indexOf(data.currentDay);
    const totalH = allDays.length * itemH;
    let scrollY = currentIdx * itemH - h / 2 + itemH / 2;
    scrollY = Math.max(0, Math.min(Math.max(0, totalH - h), scrollY));

    const startIdx = Math.max(0, Math.floor(scrollY / itemH));
    const endIdx = Math.min(allDays.length, Math.ceil((scrollY + h) / itemH) + 1);

    for (let i = startIdx; i < endIdx; i++) {
      const day = allDays[i];
      const itemY = y + (i * itemH - scrollY);
      drawRailItem(ctx, x, itemY, w, itemH, day, day === data.currentDay,
        data.photoSet.has(day), data.phaseStartJourney, theme);
    }

    // Top/bottom fade gradients for the wheel feel
    const fadeH = 36;
    const topGrad = ctx.createLinearGradient(0, y, 0, y + fadeH);
    topGrad.addColorStop(0, theme.bgSecondary);
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(x, y, w, fadeH);
    const botGrad = ctx.createLinearGradient(0, y + h - fadeH, 0, y + h);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(1, theme.bgSecondary);
    ctx.fillStyle = botGrad;
    ctx.fillRect(x, y + h - fadeH, w, fadeH);
    ctx.restore();
  }

  function drawRailItem(ctx, x, y, w, h, day, isActive, hasPhoto, phaseStartJourney, theme) {
    if (isActive) {
      ctx.fillStyle = theme.accentSoft;
      ctx.fillRect(x, y, w, h);
    }
    const padding = 18;
    const cy = y + h / 2;
    ctx.textBaseline = 'middle';
    const phaseDay = day - phaseStartJourney + 1;

    // Day number
    ctx.fillStyle = isActive ? theme.accent : theme.text;
    ctx.font = `700 15px ${SYS_FONT}`;
    ctx.fillText(String(phaseDay), x + padding, cy + 1);

    // Date — start ~52 px in to leave room for 2-digit day numbers
    ctx.fillStyle = isActive ? theme.accent : theme.textSecondary;
    ctx.font = `500 13px ${SYS_FONT}`;
    if (state.startDate) {
      ctx.fillText(formatShortDate(addDays(state.startDate, day - 1)), x + padding + 52, cy + 1);
    }

    // Dot (right side)
    const dotR = 4;
    const dotX = x + w - padding - dotR;
    ctx.beginPath();
    ctx.arc(dotX, cy, dotR, 0, Math.PI * 2);
    if (hasPhoto || isActive) {
      ctx.fillStyle = theme.accent;
    } else {
      ctx.fillStyle = theme.textTertiary;
      ctx.globalAlpha = 0.35;
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawLabel(ctx, text, W, H) {
    if (!text) return;
    ctx.save();
    const fontSize = Math.max(20, Math.round(H * 0.045));
    ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif`;
    ctx.textBaseline = 'middle';
    const padX = Math.round(fontSize * 0.7);
    const padY = Math.round(fontSize * 0.4);
    const textW = ctx.measureText(text).width;
    const pillW = textW + padX * 2;
    const pillH = fontSize + padY * 2;
    const margin = Math.round(H * 0.025);
    // Top-right corner
    const x = W - margin - pillW;
    const y = margin;
    const r = pillH / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + pillW, y, x + pillW, y + r, r);
    ctx.arcTo(x + pillW, y + pillH, x + pillW - r, y + pillH, r);
    ctx.arcTo(x, y + pillH, x, y + pillH - r, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x + padX, y + pillH / 2);
    ctx.restore();
  }

  function drawVideoFrame(ctx, img, alignment, ref, W, H, label) {
    // Black backdrop (visible if the photo doesn't cover the whole frame
    // after alignment — e.g. heavy crops or rotations)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const m = alignment ? alignmentMatrixObject(alignment, ref, W, H) : null;
    if (m) ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
    drawImageCover(ctx, img, 0, 0, W, H);
    ctx.restore();
    drawLabel(ctx, label, W, H);
  }

  function openVideoSheet() {
    videoCancelled = false;
    el.videoSheet.setAttribute('aria-hidden', 'false');
    setVideoProgress(0, 'Preparing photos…');
  }

  function closeVideoSheet() {
    el.videoSheet.setAttribute('aria-hidden', 'true');
  }

  function setVideoProgress(pct, status) {
    el.videoProgressFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (status) el.videoStatus.textContent = status;
  }

  function cancelVideoExport() {
    videoCancelled = true;
    if (videoRecorder && videoRecorder.state !== 'inactive') {
      try { videoRecorder.stop(); } catch {}
    }
    closeVideoSheet();
  }

  async function downloadProgressVideo() {
    const fmt = pickVideoMime();
    if (!fmt) {
      showToast('Video export isn\'t supported in this browser.');
      return;
    }
    const days = uploadedDays();
    if (days.length < 2) {
      showToast('You need at least 2 photos to make a video.');
      return;
    }

    openVideoSheet();

    // Square canvas: uniform, friendly for social sharing, and the
    // window won't get blown up by desktop video players the way a
    // portrait frame would. Photo + side-panel layout is sized
    // proportionally to fit the square.
    const W = 1080;
    const H = 1080;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Fill black so the first captured frame isn't transparent
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Pre-load every uploaded photo (with progress)
    const photos = {};
    for (let i = 0; i < days.length; i++) {
      if (videoCancelled) return;
      const d = days[i];
      try {
        const url = await fetchPhotoURL(d);
        if (url) photos[d] = await loadImage(url);
      } catch { /* ignore */ }
      setVideoProgress(Math.round((i + 1) / days.length * 25), `Loading photos (${i + 1}/${days.length})…`);
    }
    if (videoCancelled) return;

    // Phase day number helper (same numbering as the rail)
    const phaseStartJourney = state.phaseStartDate
      ? daysBetween(state.startDate, state.phaseStartDate) + 1
      : 1;
    const phaseDay = (d) => d - phaseStartJourney + 1;
    const ref = defaultRef();

    // Pacing
    const SEQ_TOTAL_MS = 8000;
    const seqPerPhoto = Math.max(120, Math.min(450, Math.round(SEQ_TOTAL_MS / days.length)));
    const SEQ_INTRO_MS = 1000;
    const THEN_NOW_MS = 2000;
    const totalEstMs = SEQ_INTRO_MS + (days.length - 1) * seqPerPhoto + THEN_NOW_MS * 2;

    // Set up the recorder
    const stream = canvas.captureStream(30);
    let chunks = [];
    try {
      videoRecorder = new MediaRecorder(stream, {
        mimeType: fmt.mime,
        videoBitsPerSecond: 7_500_000, // 7.5 Mbps — sharp 720p, modest file size
      });
    } catch (e) {
      showToast('Could not start the recorder.');
      closeVideoSheet();
      return;
    }
    videoRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    const finished = new Promise((resolve) => { videoRecorder.onstop = resolve; });
    videoRecorder.start(250); // emit a chunk every 250ms

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const elapsed = { ms: 0 };
    const tick = (ms, status) => {
      elapsed.ms += ms;
      const pct = 25 + Math.min(70, (elapsed.ms / totalEstMs) * 70);
      setVideoProgress(pct, status);
    };

    // Pre-compute timeline frame inputs once (theme + day list + phase info)
    const theme = getThemeTokens();
    const phase = PHASES[state.currentPhase];
    const phaseDuration = phase ? phase.duration : days.length;
    const phaseName = phase ? phase.name : '';
    const allPhaseDays = [];
    for (let i = 0; i < phaseDuration; i++) allPhaseDays.push(phaseStartJourney + i);
    const photoSet = new Set(Object.keys(state.photos || {}).map(Number).filter(Boolean));
    const baseOpts = {
      W, H, theme, ref, allDays: allPhaseDays, photoSet,
      phaseStartJourney, phaseName, phaseDuration,
    };

    try {
      // Phase 1: Sequence — side panel reads "Day N", mode pill "SEQUENCE"
      for (let i = 0; i < days.length; i++) {
        if (videoCancelled) break;
        const d = days[i];
        const img = photos[d];
        if (!img) continue;
        drawTimelineFrame(ctx, {
          ...baseOpts,
          img,
          alignment: state.photos[d]?.alignment,
          currentDay: d,
          headline: `Day ${phaseDay(d)}`,
          modePill: 'Sequence',
        });
        const dwell = i === 0 ? SEQ_INTRO_MS : seqPerPhoto;
        await delay(dwell);
        tick(dwell, `Recording sequence (${i + 1}/${days.length})…`);
      }

      // Phase 2: THEN — first photo, headline replaced with "THEN"
      if (!videoCancelled) {
        const firstD = days[0];
        const firstImg = photos[firstD];
        if (firstImg) {
          drawTimelineFrame(ctx, {
            ...baseOpts,
            img: firstImg,
            alignment: state.photos[firstD]?.alignment,
            currentDay: firstD,
            headline: 'THEN',
            modePill: 'Then vs Now',
          });
          await delay(THEN_NOW_MS);
          tick(THEN_NOW_MS, 'Recording THEN…');
        }
      }

      // Phase 3: NOW — last photo, headline replaced with "NOW"
      if (!videoCancelled) {
        const lastD = days[days.length - 1];
        const lastImg = photos[lastD];
        if (lastImg) {
          drawTimelineFrame(ctx, {
            ...baseOpts,
            img: lastImg,
            alignment: state.photos[lastD]?.alignment,
            currentDay: lastD,
            headline: 'NOW',
            modePill: 'Then vs Now',
          });
          await delay(THEN_NOW_MS);
          tick(THEN_NOW_MS, 'Recording NOW…');
        }
      }
    } finally {
      try { if (videoRecorder.state !== 'inactive') videoRecorder.stop(); } catch {}
      await finished;
      videoRecorder = null;
    }

    if (videoCancelled) {
      closeVideoSheet();
      return;
    }

    setVideoProgress(98, 'Finalizing…');
    const blob = new Blob(chunks, { type: fmt.mime });
    chunks = null;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-hard-progress-${todayISO()}.${fmt.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    setVideoProgress(100, 'Done!');
    setTimeout(() => closeVideoSheet(), 600);
    showToast('Video saved.');
  }

  function restartPhotoCarousel() {
    if (!state.startDate || !firestore || !currentUser) {
      clearCarousel();
      el.photosImageWrap?.classList.remove('has-photo');
      resetPhotoLayers();
      setCarouselMode(null);
      renderPhotoRail(null);
      return;
    }
    if (carouselPaused) {
      // Stay paused — don't restart the loop
      clearCarousel();
      renderPillLabel();
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
        if (alignState) closeAlignView();
        else if (!photoUploadInProgress) closePhotoSheet();
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
      case 'open-align': openAlignView(); break;
      case 'photo-align-cancel': closeAlignView(); break;
      case 'photo-align-save': savePhotoAlignment(); break;
      case 'photo-align-preview':
        if (alignState && alignState.pins.filter(Boolean).length >= 2) {
          alignState.previewMode = !alignState.previewMode;
          renderAlignView();
        }
        break;
      case 'photo-align-reset-rotate':
        if (alignState) {
          alignState.transform.rotate = 0;
          el.photoAlignRotateSlider.value = 0;
          renderAlignView();
        }
        break;
      case 'photo-align-reset-zoom':
        if (alignState) {
          alignState.transform.scale = 1;
          el.photoAlignZoomSlider.value = 1;
          renderAlignView();
        }
        break;
      case 'select-photo-day': {
        const d = Number(t.dataset.day);
        if (!d) break;
        if (state.photos && state.photos[d]) {
          carouselPaused = true;
          clearCarousel();
          el.photosImageWrap.style.removeProperty('--photo-fade-ms');
          renderPillLabel();
          showPhotoDay(d);
        } else {
          openPhotoSheet(d);
        }
        break;
      }
      case 'cycle-photo-mode': cycleCarouselMode(); break;
      case 'toggle-photo-pause': togglePauseCarousel(); break;
      case 'download-video': downloadProgressVideo(); break;
      case 'cancel-video': cancelVideoExport(); break;
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

  // Photo alignment sliders + calibrate toggle + gestures
  el.photoAlignRotateSlider.addEventListener('input', onAlignSlider);
  el.photoAlignZoomSlider.addEventListener('input', onAlignSlider);
  el.photoAlignCalibrate.addEventListener('change', onAlignCalibrateToggle);
  setupAlignGestures();

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
      if (el.videoSheet?.getAttribute('aria-hidden') === 'false') { cancelVideoExport(); return; }
      if (el.confirmModal.getAttribute('aria-hidden') === 'false') closeConfirm();
      else if (alignState) closeAlignView();
      else if (el.waterSheet.getAttribute('aria-hidden') === 'false') closeWaterSheet();
      else if (el.photoSheet.getAttribute('aria-hidden') === 'false' && !photoUploadInProgress) closePhotoSheet();
      else if (el.settingsSheet.getAttribute('aria-hidden') === 'false') closeSettings();
    }
  });

  // The rail-frame is absolutely positioned to fill .photos-side. On desktop
  // the summary widget sits at the top in normal flow, so we have to push
  // the rail-frame down by the summary's height + gap so it doesn't overlap.
  // On mobile the summary is display: none, so top stays at 0.
  function syncRailFrameTop() {
    const railFrame = document.querySelector('.photos-rail-frame');
    if (!railFrame || !el.photosSummary) return;
    const cs = window.getComputedStyle(el.photosSummary);
    if (cs.display === 'none') {
      railFrame.style.top = '0px';
    } else {
      railFrame.style.top = `${el.photosSummary.offsetHeight + 12}px`;
    }
  }
  if (typeof ResizeObserver !== 'undefined' && el.photosSummary) {
    new ResizeObserver(syncRailFrameTop).observe(el.photosSummary);
  }
  window.addEventListener('resize', syncRailFrameTop);
  requestAnimationFrame(syncRailFrameTop);

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
