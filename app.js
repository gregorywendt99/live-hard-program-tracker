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
  const photoDataCache = new Map(); // dayNum -> displayed data URL (composited or original)
  const cutoutDataCache = new Map(); // dayNum -> { data: transparent cut-out URL, transparent }
  let photoSheetDay = null;
  let photoUploadInProgress = false;
  let authMode = 'signin';
  // Which day of the current phase the checklist is editing.
  // null = follow "today"; a number = a past day the user clicked to backfill.
  let viewDayIndex = null;

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
    photos: {}, // { [epochDay: number 1-indexed]: { uploadedAt: string, alignment?: { p1, p2 } } }
    // Date of the FIRST ever Day 1. Photo keys count from here and, unlike
    // startDate, this never moves when the program is restarted — so the
    // photo history survives a failed run.
    photoEpochDate: null,
    photoScope: 'current', // photo timeline scope: 'current' run | 'all' time
    carouselMode: 'auto', // photo carousel display: 'auto' | 'compare' | 'sequence'
    photoAlignmentRef: { r1: { x: 0.5, y: 0.22 }, r2: { x: 0.5, y: 0.5 }, r3: { x: 0.5, y: 0.78 } },
    photoAspectRatio: null, // width / height of the first uploaded photo
    matchExposure: false, // normalize each photo's brightness to the reference
    crossfade: false, // dissolve between photos in the timeline (off = hard cut)
    alignmentReferenceDay: null, // journey day whose photo set the alignment reference
    removeBg: false, // cut the subject out of new photos and place on a backdrop
    hasBgImage: false, // whether a background image has been uploaded
    // Position of the fixed background behind the cut-outs (set via the
    // "Align background" tool). scale = zoom, tx/ty = pan (fraction of size),
    // rotate = degrees.
    bgImageTransform: { scale: 1, tx: 0, ty: 0, rotate: 0 },
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
  // The default day to show: today, but never past the phase's final day.
  function anchorDayIndex() {
    const phase = PHASES[state.currentPhase];
    const today = getCurrentDayIndex();
    if (!phase) return today;
    return Math.min(today, phase.duration - 1);
  }
  // The day the checklist is currently editing. Clamped so it is never in the
  // future and never past the phase's final day.
  function getViewDayIndex() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return getCurrentDayIndex();
    const anchor = anchorDayIndex();
    if (viewDayIndex === null) return anchor;
    return Math.max(0, Math.min(viewDayIndex, anchor));
  }
  // 1-indexed photo (epoch) day for whichever day the checklist is editing
  // (photos are keyed by epoch day, not per-phase day index).
  function journeyDayForViewedDay() {
    const dayIdx = getViewDayIndex();
    if (!state.startDate || !state.phaseStartDate || dayIdx < 0) return journeyDayForToday();
    return daysBetween(photoEpochISO(), addDays(state.phaseStartDate, dayIdx)) + 1;
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
    tasksEyebrow: $('#tasksEyebrow'),
    todayHeading: $('#todayHeading'),
    completionBadge: $('#completionBadge'),
    tasksContainer: $('#tasksContainer'),
    resetDayBtn: $('#resetDayBtn'),
    failDayBtn: $('#failDayBtn'),
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
    matchExposureToggle: $('#matchExposureToggle'),
    crossfadeToggle: $('#crossfadeToggle'),
    removeBgToggle: $('#removeBgToggle'),
    bgImageRow: $('#bgImageRow'),
    bgImagePreview: $('#bgImagePreview'),
    bgImagePickBtn: $('#bgImagePickBtn'),
    bgImageAlignBtn: $('#bgImageAlignBtn'),
    bgImageRemoveBtn: $('#bgImageRemoveBtn'),
    bgImageInput: $('#bgImageInput'),
    bgAlignSheet: $('#bgAlignSheet'),
    bgAlignStage: $('#bgAlignStage'),
    bgAlignImg: $('#bgAlignImg'),
    bgAlignGhost: $('#bgAlignGhost'),
    bgAlignZoom: $('#bgAlignZoom'),
    bgAlignRotate: $('#bgAlignRotate'),
    photosBgStatus: $('#photosBgStatus'),
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
    waterTitle: $('#waterTitle'),
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
    photoEditBtn: $('#photoEditBtn'),
    photoEditStage: $('#photoEditStage'),
    photoEditActions: $('#photoEditActions'),
    photoEditCanvas: $('#photoEditCanvas'),
    photoEditSaved: $('#photoEditSaved'),
    photoEditMagnifier: $('#photoEditMagnifier'),
    photoEditMagnifierCanvas: $('#photoEditMagnifierCanvas'),
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
    photosBgLayer: $('#photosBgLayer'),
    photosImageWrap: $('.photos-image-wrap'),
    photosEmpty: $('#photosEmpty'),
    photosDayTag: $('#photosDayTag'),
    photosRailTrack: $('#photosRailTrack'),
    photosModePill: $('#photosModePill'),
    photosScopePill: $('#photosScopePill'),
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
    // A full re-render always returns the checklist to today. Day-level edits
    // (toggling a task, logging water) use the partial render* helpers instead,
    // so a clicked-into past day stays put while you edit it.
    viewDayIndex = null;
    applyTheme();
    applyPhotoAspect();
    if (appPhase === 'loading') { showSection('boot'); return; }
    if (appPhase === 'setup') { showSection('setup'); return; }
    if (appPhase === 'auth') { showSection('auth'); updateAuthUI(); return; }

    // appPhase === 'app'
    updateAccountUI();
    ensurePhotoEpoch();
    if (!state.currentPhase) { showSection('welcome'); return; }
    if (state.currentPhase === 'phase1-wait') { showSection('wait'); renderWait(); return; }
    showSection('dashboard');
    renderHero();
    renderTasks();
    renderCalendar();
    renderJourney();
    restartPhotoCarousel();
    autoAdvanceIfPossible();
    // If removal is on, backfill any photos still missing a cut-out (e.g. ones
    // imported before, or a run interrupted by a reload). Idempotent: it skips
    // days that already have a cut-out or are already queued.
    if (state.removeBg) enqueueAllCutouts();
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
    const today = getCurrentDayIndex();
    const dayIdx = getViewDayIndex();
    const isOtherDay = dayIdx !== anchorDayIndex();
    el.todayHeading.textContent = `Day ${Math.max(1, dayIdx + 1)} checklist`;
    if (el.tasksEyebrow) el.tasksEyebrow.textContent = isOtherDay ? 'Catching up' : 'Today';
    if (el.resetDayBtn) el.resetDayBtn.textContent = isOtherDay ? 'Reset this day' : 'Reset today';

    if (dayIdx < 0) {
      el.tasksContainer.innerHTML = '<div class="settings-hint" style="text-align:center;padding:24px;">This phase hasn\'t started yet.</div>';
      el.completionBadge.textContent = '0 / ' + phase.tasks.length;
      return;
    }

    const dayState = state.days[state.currentPhase][dayIdx] || { tasks: {} };
    const checkedCount = phase.tasks.filter((t) => dayState.tasks?.[t]).length;
    el.completionBadge.textContent = `${checkedCount} / ${phase.tasks.length}`;
    el.completionBadge.classList.toggle('complete', checkedCount === phase.tasks.length);

    const journeyDayNum = journeyDayForViewedDay();

    let banner = '';
    if (isOtherDay) {
      const dateISO = state.phaseStartDate ? addDays(state.phaseStartDate, dayIdx) : null;
      const backLabel = anchorDayIndex() === today ? 'Back to today' : 'Back to latest';
      banner = `
        <div class="day-edit-banner">
          <span class="day-edit-banner-text">Editing Day ${dayIdx + 1}${dateISO ? ' · ' + formatDate(dateISO) : ''}</span>
          <button type="button" class="day-edit-back" data-action="view-today">${backLabel}</button>
        </div>`;
    }

    const tasksHTML = phase.tasks.map((taskId) => {
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
        const photoNoun = isOtherDay ? "this day's photo" : "today's photo";
        detail = hasPhoto ? `Tap to view or replace ${photoNoun}` : `Tap to upload ${photoNoun}`;
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

    el.tasksContainer.innerHTML = banner + tasksHTML;
  }

  function renderCalendar() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const today = getCurrentDayIndex();
    const viewIdx = getViewDayIndex();
    el.calendarHeading.textContent = `${phase.name} calendar`;
    const cells = [];
    for (let i = 0; i < phase.duration; i++) {
      const isComplete = isDayComplete(state.currentPhase, i);
      const isToday = i === today;
      const isFuture = i > today;
      const isSelected = i === viewIdx && !isFuture && !isToday;
      const cls = ['cal-day'];
      if (isComplete) cls.push('complete');
      if (isToday) cls.push('today');
      else if (isFuture) cls.push('future');
      if (isSelected) cls.push('selected');
      const dateLabel = state.phaseStartDate ? formatShortDate(addDays(state.phaseStartDate, i)) : '';
      const title = `Day ${i + 1}${dateLabel ? ' · ' + dateLabel : ''}${isComplete ? ' · Complete' : ''}${isFuture ? '' : ' · tap to edit'}`;
      if (isFuture) {
        cells.push(`<div class="${cls.join(' ')}" title="${title}">${i + 1}</div>`);
      } else {
        cells.push(`<button type="button" class="${cls.join(' ')}" data-action="select-day" data-day-index="${i}" aria-pressed="${i === viewIdx}" title="${title}">${i + 1}</button>`);
      }
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

  // Jump the checklist to a day of the current phase (clicked in the calendar).
  function selectDay(idx) {
    viewDayIndex = (idx === anchorDayIndex()) ? null : idx;
    renderTasks(); renderCalendar();
    // The checklist sits above the calendar, so bring it back into view.
    const card = el.tasksContainer.closest('.tasks-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleTask(taskId) {
    const dayIdx = getViewDayIndex();
    const phase = PHASES[state.currentPhase];
    if (!phase || dayIdx < 0 || dayIdx >= phase.duration) return;
    if (!state.days[state.currentPhase][dayIdx]) {
      state.days[state.currentPhase][dayIdx] = { tasks: {} };
    }
    const day = state.days[state.currentPhase][dayIdx];
    day.tasks[taskId] = !day.tasks[taskId];
    saveState();
    renderTasks(); renderHero(); renderCalendar(); renderJourney();
    if (phase.tasks.every((t) => day.tasks[t])) {
      const isLast = dayIdx === phase.duration - 1;
      if (isLast) { showToast(`${phase.name} complete — incredible work.`); autoAdvanceIfPossible(); }
      else { showToast(`Day ${dayIdx + 1} done. Keep going.`); }
    }
  }

  /* ----- Water tracking ------------------------------------------------ */

  function ensureViewDay() {
    const dayIdx = getViewDayIndex();
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
    const dayIdx = getViewDayIndex();
    const day = state.days[state.currentPhase]?.[dayIdx] || { tasks: {} };
    const total = day.water_oz || 0;
    const pct = Math.min(100, Math.round((total / WATER_TARGET) * 100));

    if (el.waterTitle) {
      el.waterTitle.textContent = dayIdx === anchorDayIndex() ? 'Water log' : `Water log · Day ${dayIdx + 1}`;
    }
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
    const day = ensureViewDay();
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
    const dayIdx = getViewDayIndex();
    if (dayIdx < 0) return;
    const day = state.days[state.currentPhase][dayIdx];
    if (!day) return;
    day.water_oz = 0;
    if (day.tasks) day.tasks.water = false;
    saveState();
    renderWaterSheet();
    renderTasks(); renderHero(); renderCalendar(); renderJourney();
    showToast(dayIdx === anchorDayIndex() ? 'Today\'s water cleared.' : `Day ${dayIdx + 1} water cleared.`);
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

  // The date photo day 1 counts from. Falls back to startDate for states
  // saved before photoEpochDate existed (their keys were startDate-relative,
  // so the fallback preserves every existing key).
  function photoEpochISO() {
    return state.photoEpochDate || state.startDate;
  }

  // How many days the current run starts after the epoch. 0 until the
  // program has been restarted at least once.
  function currentRunOffset() {
    const epoch = photoEpochISO();
    if (!epoch || !state.startDate) return 0;
    return Math.max(0, daysBetween(epoch, state.startDate));
  }

  // Adopt startDate as the epoch for states saved before it existed.
  function ensurePhotoEpoch() {
    if (state.startDate && !state.photoEpochDate) {
      state.photoEpochDate = state.startDate;
      saveState();
    }
  }

  // "Day N" label for a photo day in the upload sheet / toasts: run-relative
  // when the day belongs to the current run, date-based when it predates it.
  function photoDayLabel(dayNum) {
    const runDay = dayNum - currentRunOffset();
    if (runDay >= 1) return `Day ${runDay}`;
    const date = dateForJourneyDay(dayNum);
    return date ? formatShortDate(date) : `Day ${dayNum}`;
  }

  function journeyDayForToday() {
    const epoch = photoEpochISO();
    if (!epoch) return null;
    return daysBetween(epoch, todayISO()) + 1;
  }

  function dateForJourneyDay(dayNum) {
    const epoch = photoEpochISO();
    if (!epoch || !dayNum) return null;
    return addDays(epoch, dayNum - 1);
  }

  // Map a photo (epoch) day (1-indexed) back to its phase + dayIndex within
  // that phase. Days from a previous run map to nothing and return null.
  function phaseDayFromJourneyDay(dayNum) {
    if (!photoEpochISO() || !dayNum) return null;
    const target = addDays(photoEpochISO(), dayNum - 1);
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

  /* ----- Background removal ------------------------------------------- */

  // Subject cut-out runs entirely on-device. Only the model *code/weights* are
  // fetched (from a CDN, then browser-cached); photos never leave the device.
  //
  // Primary remover: RMBG-1.4 via Transformers.js, on WebGPU when available
  // (~2s/photo) and WASM otherwise (~10s). Fallback: imgly's IS-Net, if
  // Transformers.js/RMBG can't load. Last resort: keep the original photo.

  // --- Primary: RMBG-1.4 (Transformers.js) ---
  const TRANSFORMERS_CDNS = [
    'https://esm.sh/@huggingface/transformers@3',
    'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/+esm',
  ];
  const RMBG_MODEL = 'briaai/RMBG-1.4';
  let transformersLibP = null;
  let rmbgSeg = null;        // the loaded pipeline
  let rmbgDevice = null;     // 'webgpu' | 'wasm'
  let rmbgReady = false;
  let rmbgDownloadPct = 0;   // model weight download progress (0–100)

  function loadTransformers() {
    if (transformersLibP) return transformersLibP;
    transformersLibP = (async () => {
      let lib, lastErr;
      for (const url of TRANSFORMERS_CDNS) {
        try { lib = await import(url); break; } catch (e) { lastErr = e; }
      }
      if (!lib) throw lastErr || new Error('Transformers.js unavailable');
      lib.env.allowLocalModels = false;
      return lib;
    })();
    transformersLibP.catch(() => { transformersLibP = null; });
    return transformersLibP;
  }

  async function makeRmbgPipeline(device) {
    const lib = await loadTransformers();
    return lib.pipeline('image-segmentation', RMBG_MODEL, {
      device,
      progress_callback: (p) => {
        if (p && p.status === 'progress' && typeof p.progress === 'number') {
          rmbgDownloadPct = Math.round(p.progress);
          updateBgStatus();
        }
      },
    });
  }

  async function getRmbgSegmenter() {
    if (rmbgSeg) return rmbgSeg;
    const device = (typeof navigator !== 'undefined' && navigator.gpu) ? 'webgpu' : 'wasm';
    rmbgSeg = await makeRmbgPipeline(device);
    rmbgDevice = device;
    rmbgReady = true;
    rmbgDownloadPct = 100;
    updateBgStatus();
    return rmbgSeg;
  }

  // Run RMBG and return the foreground matte (grayscale RawImage). If a WebGPU
  // run throws at inference time (a known issue for some models), rebuild once
  // on WASM and retry.
  async function rmbgMask(imageInput) {
    const seg = await getRmbgSegmenter();
    try {
      return (await seg(imageInput))[0].mask;
    } catch (e) {
      if (rmbgDevice === 'webgpu') {
        console.warn('RMBG WebGPU run failed; falling back to WASM.', e);
        rmbgSeg = await makeRmbgPipeline('wasm');
        rmbgDevice = 'wasm';
        return (await rmbgSeg(imageInput))[0].mask;
      }
      throw e;
    }
  }

  // --- Fallback: imgly IS-Net ---
  const BG_REMOVAL_CDNS = [
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
    'https://esm.sh/@imgly/background-removal@1.7.0',
  ];
  let bgRemovalModuleP = null;

  function loadBgRemover() {
    if (bgRemovalModuleP) return bgRemovalModuleP;
    bgRemovalModuleP = (async () => {
      let lastErr;
      for (const url of BG_REMOVAL_CDNS) {
        try { return await import(url); }
        catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('Background remover unavailable');
    })();
    // Don't cache a rejected load — let the next upload retry from scratch.
    bgRemovalModuleP.catch(() => { bgRemovalModuleP = null; });
    return bgRemovalModuleP;
  }

  function decodeBlobToImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Cut-out decode failed')); };
      img.src = url;
    });
  }

  // Produce the transparent cut-out for `file` and return it as a size-bounded
  // blob (lossless PNG when it fits, else high-quality WebP). The flat color is
  // applied later at display time, so the subject is only ever cut out once and
  // recoloring never re-runs the model. Tries RMBG-1.4, then imgly; throws if
  // both fail so the caller can keep the original photo.
  async function segmentToCutoutBlob(file) {
    let canvas, model;
    try {
      canvas = await rmbgCutoutCanvas(file);
      model = 'rmbg';
    } catch (e) {
      console.warn('RMBG cut-out failed; trying imgly fallback.', e);
      canvas = await imglyCutoutCanvas(file);
      model = 'imgly';
    }
    return { blob: await encodeCutout(canvas), model };
  }

  // Draw `img` onto a fresh canvas, downscaled so its long edge ≤ PHOTO_MAX_DIM.
  function makeSizedCanvas(img) {
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const longer = Math.max(w, h);
    if (longer > PHOTO_MAX_DIM) {
      const scale = PHOTO_MAX_DIM / longer;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    return { canvas, ctx, w, h };
  }

  // RMBG-1.4: run the matte, apply it as the original's alpha channel, clean it.
  async function rmbgCutoutCanvas(file) {
    const dataUrl = await blobToDataURL(file);
    const [img, mask] = await Promise.all([decodeBlobToImage(file), rmbgMask(dataUrl)]);
    const { canvas, ctx, w, h } = makeSizedCanvas(img);
    const id = ctx.getImageData(0, 0, w, h);
    let m = mask.resize(w, h);
    if (m && typeof m.then === 'function') m = await m;
    const md = m.data, mch = m.channels || 1;
    for (let i = 0, p = 3; i < w * h; i++, p += 4) id.data[p] = md[i * mch];
    refineAlpha(id, w, h);
    ctx.putImageData(id, 0, 0);
    return canvas;
  }

  // imgly fallback: returns a transparent PNG; decode, size, clean.
  async function imglyCutoutCanvas(file) {
    const mod = await loadBgRemover();
    const removeBackground = mod.removeBackground || mod.default?.removeBackground;
    if (typeof removeBackground !== 'function') throw new Error('Remover API missing');
    const cutPng = await removeBackground(file, { output: { format: 'image/png' } });
    const img = await decodeBlobToImage(cutPng);
    const { canvas, ctx, w, h } = makeSizedCanvas(img);
    const id = ctx.getImageData(0, 0, w, h);
    refineAlpha(id, w, h);
    ctx.putImageData(id, 0, 0);
    return canvas;
  }

  // Tier A — clean the matte's alpha channel in place:
  //   1. Island removal: drop foreground blobs far smaller than the main
  //      subject (kills stray background chunks, e.g. a piece of couch).
  //   2. A 1px edge erode: shave the thin background "halo" clinging to edges.
  function refineAlpha(imageData, w, h) {
    const data = imageData.data;
    const n = w * h;
    const ALPHA_T = 128;
    const fg = new Uint8Array(n);
    for (let i = 0; i < n; i++) fg[i] = data[i * 4 + 3] > ALPHA_T ? 1 : 0;

    // Connected components (4-connected), iterative flood fill.
    const label = new Int32Array(n).fill(-1);
    const stack = new Int32Array(n);
    const sizes = [];
    let cur = 0;
    for (let s = 0; s < n; s++) {
      if (!fg[s] || label[s] !== -1) continue;
      let sp = 0; stack[sp++] = s; label[s] = cur; let size = 0;
      while (sp > 0) {
        const idx = stack[--sp]; size++;
        const x = idx % w, y = (idx / w) | 0;
        if (x > 0)     { const k = idx - 1; if (fg[k] && label[k] === -1) { label[k] = cur; stack[sp++] = k; } }
        if (x < w - 1) { const k = idx + 1; if (fg[k] && label[k] === -1) { label[k] = cur; stack[sp++] = k; } }
        if (y > 0)     { const k = idx - w; if (fg[k] && label[k] === -1) { label[k] = cur; stack[sp++] = k; } }
        if (y < h - 1) { const k = idx + w; if (fg[k] && label[k] === -1) { label[k] = cur; stack[sp++] = k; } }
      }
      sizes[cur++] = size;
    }
    if (cur > 0) {
      let maxSize = 0;
      for (let l = 0; l < cur; l++) if (sizes[l] > maxSize) maxSize = sizes[l];
      const keepMin = Math.max(64, maxSize * 0.02); // keep blobs ≥2% of the largest
      for (let i = 0; i < n; i++) {
        if (fg[i] && sizes[label[i]] < keepMin) data[i * 4 + 3] = 0;
      }
    }
    erodeAlpha(data, w, h);
  }

  // Shave one pixel off the foreground edge (removes the background halo).
  function erodeAlpha(data, w, h) {
    const n = w * h;
    const a = new Uint8Array(n);
    for (let i = 0; i < n; i++) a[i] = data[i * 4 + 3];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (a[i] === 0) continue;
        const edge =
          x === 0 || y === 0 || x === w - 1 || y === h - 1 ||
          a[i - 1] < 16 || a[i + 1] < 16 || a[i - w] < 16 || a[i + w] < 16;
        if (edge) data[i * 4 + 3] = 0;
      }
    }
  }

  // Tier B — encode the transparent cut-out at full fidelity: lossless PNG when
  // it fits Firestore's 1MB per-doc cap, otherwise a high-quality WebP ladder.
  async function encodeCutout(canvas) {
    const png = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    if (png && png.size <= PHOTO_MAX_BYTES) return png;
    for (const q of [0.92, 0.85, 0.75, 0.6]) {
      const out = await new Promise((r) => canvas.toBlob(r, 'image/webp', q));
      if (out && out.size <= PHOTO_MAX_BYTES) return out;
    }
    return (await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.5))) || png;
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Read failed'));
      reader.readAsDataURL(blob);
    });
  }

  // Paint a transparent cut-out onto a solid color → JPEG data URL. Cheap (no
  // model): this is what makes recoloring instant.
  // Neutral backdrop used until/unless a background image is uploaded.
  const BG_FALLBACK_COLOR = '#ededf0';

  // Background image (a green-screen-style backdrop placed behind every
  // cut-out). Stored once in its own Firestore doc; cached here.
  let bgImageDataUrl = null;
  let bgImageEl = null;

  function bgImageDocRef() {
    if (!firestore || !currentUser) return null;
    return firestore.collection('users').doc(currentUser.uid).collection('meta').doc('background');
  }

  async function getBgImageDataUrl() {
    if (bgImageDataUrl) return bgImageDataUrl;
    if (!state.hasBgImage) return null;
    const ref = bgImageDocRef();
    if (!ref) return null;
    try {
      const snap = await ref.get();
      bgImageDataUrl = snap.exists ? (snap.data()?.data || null) : null;
      return bgImageDataUrl;
    } catch (e) { console.error('Background image fetch failed', e); return null; }
  }

  async function getBgImage() {
    if (!state.hasBgImage) return null;
    if (bgImageEl) return bgImageEl;
    const url = await getBgImageDataUrl();
    if (!url) return null;
    try { bgImageEl = await loadImage(url); return bgImageEl; }
    catch { return null; }
  }

  // Draw `img` to fill w×h, cropping overflow (object-fit: cover).
  function drawImageCover(ctx, img, w, h) {
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  // Paint a transparent cut-out onto the backdrop (uploaded image, else a
  // neutral color) and return a JPEG data URL. Cheap (no model) — changing the
  // background just re-composites.
  async function compositeCutoutDataURL(cutoutDataUrl) {
    const img = await loadImage(cutoutDataUrl);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const bg = await getBgImage();
    if (bg) {
      drawImageCover(ctx, bg, w, h);
    } else {
      ctx.fillStyle = BG_FALLBACK_COLOR;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  async function uploadBgImage(file) {
    if (!firestore || !currentUser) { showToast('Sign in first to set a background.'); return; }
    try {
      const { dataUrl } = await compressImageToDataURL(file);
      const ref = bgImageDocRef();
      if (ref) await ref.set({ data: dataUrl, uploadedAt: new Date().toISOString() });
      bgImageDataUrl = dataUrl;
      bgImageEl = null; // re-decode on next composite
      state.hasBgImage = true;
      saveState();
      // Re-composite every cut-out onto the new background (no model rerun).
      photoDataCache.clear();
      luminanceCache.clear();
      renderBgImageSettings();
      restartPhotoCarousel();
      showToast('Background image set.');
    } catch (e) {
      console.error('Background image upload failed', e);
      showToast(e?.message || 'Couldn’t set that background.');
    }
  }

  function removeBgImage() {
    bgImageDocRef()?.delete().catch((e) => console.warn('Bg image delete failed', e));
    bgImageDataUrl = null;
    bgImageEl = null;
    state.hasBgImage = false;
    saveState();
    photoDataCache.clear();
    luminanceCache.clear();
    renderBgImageSettings();
    restartPhotoCarousel();
    showToast('Background image removed.');
  }

  function renderBgImageSettings() {
    if (el.bgImageRow) el.bgImageRow.hidden = !state.removeBg;
    const has = !!state.hasBgImage;
    if (el.bgImageRemoveBtn) el.bgImageRemoveBtn.hidden = !has;
    if (el.bgImageAlignBtn) el.bgImageAlignBtn.hidden = !has;
    if (el.bgImagePickBtn) el.bgImagePickBtn.textContent = has ? 'Replace image' : 'Choose image';
    if (!el.bgImagePreview) return;
    if (!has) {
      el.bgImagePreview.hidden = true;
      el.bgImagePreview.removeAttribute('src');
      return;
    }
    getBgImageDataUrl().then((url) => {
      if (url && el.bgImagePreview) { el.bgImagePreview.src = url; el.bgImagePreview.hidden = false; }
    });
  }

  /* ----- Align background tool ---------------------------------------- */

  // Position the fixed backdrop behind the cut-outs by dragging/zooming it
  // against a faded "ghost" of the reference photo (the one all photos align
  // to). The saved transform is what the carousel's bg layer uses.
  let bgAlignState = null;

  // Shared so the tool preview and the carousel backdrop move identically.
  function bgTransformCSS(t) {
    const s = (t && t.scale) || 1;
    const tx = (t && t.tx) || 0;
    const ty = (t && t.ty) || 0;
    const r = (t && t.rotate) || 0;
    return `translate(${tx * 100}%, ${ty * 100}%) rotate(${r}deg) scale(${s})`;
  }

  function applyBgAlignTransform() {
    if (!bgAlignState || !el.bgAlignImg) return;
    el.bgAlignImg.style.transform = bgTransformCSS(bgAlignState);
  }

  async function openBgAlignView() {
    if (!state.hasBgImage) return;
    const bgUrl = await getBgImageDataUrl();
    if (!bgUrl) { showToast('No background image to align.'); return; }
    const refDay = exposureReferenceDay();
    // Show the full original reference photo (with its scene) as the ghost, so
    // you can see where everything is and line the background up to it.
    const ghostUrl = refDay ? await fetchOriginalDataURL(refDay) : null;
    const t = state.bgImageTransform || { scale: 1, tx: 0, ty: 0, rotate: 0 };
    bgAlignState = {
      scale: t.scale || 1, tx: t.tx || 0, ty: t.ty || 0, rotate: t.rotate || 0,
      // The reference photo's own alignment, so the ghost previews it the way
      // the carousel displays it (zoomed/cropped), not the raw upload.
      ghostAlignment: (refDay && state.photos?.[refDay]?.alignment) || null,
      dragging: false, lastX: 0, lastY: 0,
    };
    el.bgAlignImg.src = bgUrl;
    if (ghostUrl) { el.bgAlignGhost.src = ghostUrl; el.bgAlignGhost.style.display = 'block'; }
    else el.bgAlignGhost.style.display = 'none';
    if (el.bgAlignZoom) el.bgAlignZoom.value = String(bgAlignState.scale);
    if (el.bgAlignRotate) el.bgAlignRotate.value = String(bgAlignState.rotate);
    applyBgAlignTransform();
    el.bgAlignSheet.setAttribute('aria-hidden', 'false');
    // Apply the ghost's alignment once the stage has its dimensions.
    requestAnimationFrame(applyGhostTransform);
  }

  // Match the carousel: show the reference photo with its alignment transform
  // so you align the background to where the body actually appears.
  function applyGhostTransform() {
    if (!bgAlignState || !el.bgAlignGhost || !el.bgAlignStage) return;
    const W = el.bgAlignStage.clientWidth;
    const H = el.bgAlignStage.clientHeight;
    const a = bgAlignState.ghostAlignment;
    el.bgAlignGhost.style.transform = (a && W && H) ? alignmentMatrixCSS(a, defaultRef(), W, H) : '';
  }

  function closeBgAlignView() {
    bgAlignState = null;
    el.bgAlignSheet.setAttribute('aria-hidden', 'true');
  }

  function saveBgAlign() {
    if (!bgAlignState) return;
    state.bgImageTransform = { scale: bgAlignState.scale, tx: bgAlignState.tx, ty: bgAlignState.ty, rotate: bgAlignState.rotate };
    saveState();
    closeBgAlignView();
    photoDataCache.clear();
    restartPhotoCarousel(); // re-positions the bg layer via showPhotoDay
    showToast('Background aligned.');
  }

  function bgAlignPointerDown(e) {
    if (!bgAlignState) return;
    e.preventDefault();
    try { el.bgAlignStage.setPointerCapture(e.pointerId); } catch {}
    bgAlignState.dragging = true;
    bgAlignState.lastX = e.clientX;
    bgAlignState.lastY = e.clientY;
  }

  function bgAlignPointerMove(e) {
    if (!bgAlignState || !bgAlignState.dragging) return;
    const r = el.bgAlignStage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    bgAlignState.tx += (e.clientX - bgAlignState.lastX) / r.width;
    bgAlignState.ty += (e.clientY - bgAlignState.lastY) / r.height;
    bgAlignState.lastX = e.clientX;
    bgAlignState.lastY = e.clientY;
    applyBgAlignTransform();
  }

  function bgAlignPointerUp() {
    if (bgAlignState) bgAlignState.dragging = false;
  }

  /* ----- Background-removal queue ------------------------------------- */

  // Cut-outs are produced lazily, off the critical path. Uploads save the
  // original immediately and enqueue the day; enabling the feature enqueues
  // every existing photo — first then last first, so "Then vs Now" gets clean
  // shots soonest, then the rest in order. One day is processed at a time so
  // the heavy model work never piles up.
  const bgQueue = [];
  const bgQueued = new Set();
  let bgWorkerRunning = false;
  // Days we've already attempted to upgrade this session — caps re-processing
  // to once per day so a device that can't run RMBG doesn't loop forever.
  const cutoutUpgradeTried = new Set();
  const CUTOUT_MODEL = 'rmbg'; // the current best method

  function needsCutout(day) {
    const p = state.photos?.[day];
    if (!p) return false;
    // Never overwrite a hand-edited cut-out.
    if (p.cutoutEdited) return false;
    // No cut-out yet, or a legacy baked one (no stored transparency).
    if (!p.hasCutout || !p.cutoutTransparent) return true;
    // Re-run cut-outs made by an older method (e.g. the previous imgly version)
    // through the current best model — once per day per session.
    if (p.cutoutModel !== CUTOUT_MODEL && !cutoutUpgradeTried.has(day)) return true;
    return false;
  }

  function enqueueCutout(day) {
    if (!state.removeBg || !needsCutout(day) || bgQueued.has(day)) return;
    bgQueued.add(day);
    bgQueue.push(day);
    runBgQueue();
  }

  function enqueueAllCutouts() {
    if (!state.removeBg) return;
    const days = uploadedDays(); // ascending
    if (!days.length) return;
    const first = days[0];
    const last = days[days.length - 1];
    // Priority: first, then last, then everything else in order.
    const ordered = [first];
    if (last !== first) ordered.push(last);
    for (const d of days) if (d !== first && d !== last) ordered.push(d);
    for (const d of ordered) {
      if (needsCutout(d) && !bgQueued.has(d)) { bgQueued.add(d); bgQueue.push(d); }
    }
    runBgQueue();
  }

  function clearBgQueue() {
    bgQueue.length = 0;
    bgQueued.clear();
    updateBgStatus();
  }

  // Always reads the ORIGINAL doc (bypassing the cut-out variant), so we feed
  // the model the real photo even once a cut-out exists.
  async function fetchOriginalDataURL(day) {
    const ref = photoDocRef(day);
    if (!ref) return null;
    try {
      const snap = await ref.get();
      return snap.exists ? (snap.data()?.data || null) : null;
    } catch (e) { console.error('Original fetch failed', e); return null; }
  }

  async function processCutoutForDay(day) {
    // Mark before the heavy work so a failure still counts as "attempted" and
    // we don't re-queue the same day repeatedly this session.
    cutoutUpgradeTried.add(day);
    const originalUrl = await fetchOriginalDataURL(day);
    if (!originalUrl) return;
    const srcBlob = await (await fetch(originalUrl)).blob();
    const { blob: cutoutBlob, model } = await segmentToCutoutBlob(srcBlob);
    const cutoutDataUrl = await blobToDataURL(cutoutBlob);
    const cref = cutoutDocRef(day);
    // Store the TRANSPARENT cut-out; the color is applied at display time.
    if (cref) await cref.set({ data: cutoutDataUrl, transparent: true, model, uploadedAt: new Date().toISOString() });
    if (!state.photos[day]) state.photos[day] = {};
    state.photos[day].hasCutout = true;
    state.photos[day].cutoutTransparent = true;
    state.photos[day].cutoutModel = model;
    saveState();
    // Cache the cut-out so recoloring is instant; drop the composited + luminance
    // caches so the cut-out shows on the next carousel pass.
    cutoutDataCache.set(day, { data: cutoutDataUrl, transparent: true });
    photoDataCache.delete(day);
    luminanceCache.delete(day);
    if (photoSheetDay === day) renderPhotoSheet();
  }

  async function runBgQueue() {
    if (bgWorkerRunning || !bgQueue.length) return;
    if (!state.removeBg || !firestore || !currentUser) return;
    bgWorkerRunning = true;
    updateBgStatus();
    // Warm a remover once up front (RMBG preferred, imgly fallback); if neither
    // loads, don't hammer per photo.
    try {
      await getRmbgSegmenter();
    } catch (e) {
      console.warn('RMBG unavailable; trying imgly fallback.', e);
      try {
        await loadBgRemover();
      } catch (e2) {
        console.error('No background remover available', e2);
        showToast('Background remover unavailable right now.');
        bgWorkerRunning = false;
        clearBgQueue();
        return;
      }
    }
    try {
      while (bgQueue.length && state.removeBg) {
        const day = bgQueue.shift();
        bgQueued.delete(day);
        updateBgStatus();
        if (!needsCutout(day)) continue;
        try { await processCutoutForDay(day); }
        catch (e) { console.error('Background cut-out failed for day', day, e); }
        // Yield between heavy items so the UI stays responsive.
        await new Promise((r) => setTimeout(r, 30));
      }
    } finally {
      bgWorkerRunning = false;
      updateBgStatus();
      restartPhotoCarousel(); // reflect the finished cut-outs
    }
  }

  function updateBgStatus() {
    const node = el.photosBgStatus;
    if (!node) return;
    const remaining = bgQueue.length + (bgWorkerRunning ? 1 : 0);
    if (!(state.removeBg && bgWorkerRunning && remaining > 0)) {
      node.hidden = true;
      return;
    }
    node.hidden = false;
    if (!rmbgReady && rmbgDownloadPct > 0 && rmbgDownloadPct < 100) {
      // First-ever use: the model weights are still downloading.
      node.textContent = `Downloading remover… ${rmbgDownloadPct}%`;
    } else {
      node.textContent = remaining > 1 ? `Removing backgrounds… ${remaining} left` : 'Removing background…';
    }
  }

  function photoDocRef(dayNum) {
    if (!firestore || !currentUser) return null;
    return firestore.collection('users').doc(currentUser.uid).collection('photos').doc(String(dayNum));
  }

  // The background-removed copy lives in its own doc so the original and the
  // cut-out never share Firestore's 1 MB per-document limit.
  function cutoutDocRef(dayNum) {
    if (!firestore || !currentUser) return null;
    return firestore.collection('users').doc(currentUser.uid).collection('photoCutouts').doc(String(dayNum));
  }

  // Show the background-removed version for this day only when the feature is on
  // AND a cut-out was saved for it. The original is always kept, so turning the
  // feature off restores it — background removal is never permanent.
  function showCutoutFor(dayNum) {
    return !!(state.removeBg && state.photos?.[dayNum]?.hasCutout);
  }

  async function fetchPhotoURL(dayNum) {
    // photoDataCache holds the *displayed* image (composited cut-out, or the
    // original). It's cleared when the color or the on/off choice changes.
    if (photoDataCache.has(dayNum)) return photoDataCache.get(dayNum);

    if (showCutoutFor(dayNum)) {
      // Fetch the stored cut-out once (kept in cutoutDataCache), then paint the
      // CURRENT color onto it. Recoloring later just re-composites from this
      // cache — no model, no re-fetch.
      let cutout = cutoutDataCache.get(dayNum);
      if (cutout === undefined) {
        cutout = null;
        try {
          const snap = await cutoutDocRef(dayNum)?.get();
          if (snap && snap.exists) cutout = snap.data() || null;
        } catch (e) { console.error('Cut-out fetch failed', e); }
        if (cutout && cutout.data) cutoutDataCache.set(dayNum, cutout);
      }
      if (cutout && cutout.data) {
        // Transparent cut-outs get the backdrop applied now; legacy baked ones
        // (pre-transparency) are already flat JPEGs.
        const url = cutout.transparent
          ? await compositeCutoutDataURL(cutout.data)
          : cutout.data;
        photoDataCache.set(dayNum, url);
        return url;
      }
      // Cut-out missing (e.g. mid-backfill) — fall through to the original.
    }

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

  /* ----- Exposure matching ------------------------------------------- */

  // Cache mean luminance per journey day so we don't re-decode each time.
  const luminanceCache = new Map();

  function meanLuminanceOf(img) {
    try {
      const S = 48;
      const c = document.createElement('canvas');
      c.width = S; c.height = S;
      const cctx = c.getContext('2d', { willReadFrequently: true });
      cctx.drawImage(img, 0, 0, S, S);
      const data = cctx.getImageData(0, 0, S, S).data;
      let sum = 0;
      const n = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      return n ? sum / n : 128;
    } catch {
      return 128;
    }
  }

  async function getDayLuminance(day) {
    if (luminanceCache.has(day)) return luminanceCache.get(day);
    try {
      const url = await fetchPhotoURL(day);
      if (!url) return 128;
      const img = await loadImage(url);
      const lum = meanLuminanceOf(img);
      luminanceCache.set(day, lum);
      return lum;
    } catch {
      return 128;
    }
  }

  function exposureReferenceDay() {
    if (state.alignmentReferenceDay && state.photos?.[state.alignmentReferenceDay]) {
      return state.alignmentReferenceDay;
    }
    const days = uploadedDays();
    return days.length ? days[0] : null;
  }

  // Returns a CSS/canvas filter string ('' = none) that brightens or dims
  // `day`'s photo so its average luminance matches the reference photo.
  async function exposureFilterFor(day) {
    if (!state.matchExposure) return '';
    const refDay = exposureReferenceDay();
    if (!refDay || day === refDay) return '';
    const [refLum, dayLum] = await Promise.all([getDayLuminance(refDay), getDayLuminance(day)]);
    if (dayLum <= 1) return '';
    let mult = refLum / dayLum;
    mult = Math.max(0.5, Math.min(2.0, mult)); // clamp extreme corrections
    if (Math.abs(mult - 1) < 0.01) return '';
    return `brightness(${mult.toFixed(3)})`;
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
      const nowISO = new Date().toISOString();

      // Compress + store the ORIGINAL. This is all the user waits for — the
      // background removal (if on) runs afterward, off the critical path.
      const { dataUrl: originalUrl, aspectRatio } = await compressImageToDataURL(file);
      el.photoProgressFill.style.width = '75%';
      el.photoProgressLabel.textContent = 'Saving…';
      await photoDocRef(dayNum).set({ data: originalUrl, uploadedAt: nowISO });

      // A fresh original supersedes any cut-out from a previous photo this day.
      const staleCutout = cutoutDocRef(dayNum);
      if (staleCutout) await staleCutout.delete().catch(() => {});
      cutoutDataCache.delete(dayNum);

      el.photoProgressFill.style.width = '100%';
      el.photoProgressLabel.textContent = 'Done';
      photoDataCache.set(dayNum, originalUrl);
      luminanceCache.delete(dayNum);

      if (!state.photos) state.photos = {};
      // hasCutout starts false; the queue flips it to true once the cut-out is
      // produced. Until then the original shows.
      state.photos[dayNum] = { uploadedAt: nowISO, hasCutout: false, cutoutTransparent: false };

      // Lock in the viewport aspect ratio to the first photo uploaded.
      if (!state.photoAspectRatio && Number.isFinite(aspectRatio) && aspectRatio > 0) {
        state.photoAspectRatio = aspectRatio;
        applyPhotoAspect();
      }

      // Tick the photo task for whichever day this photo belongs to (today or
      // a past day being backfilled), as long as it maps to the current phase.
      const target = phaseDayFromJourneyDay(dayNum);
      if (target && state.currentPhase === target.phaseId) {
        if (!state.days[target.phaseId][target.dayIndex]) {
          state.days[target.phaseId][target.dayIndex] = { tasks: {} };
        }
        state.days[target.phaseId][target.dayIndex].tasks.photo = true;
      }

      saveState();
      renderPhotoSheet();
      renderTasks(); renderHero(); renderCalendar(); renderJourney();
      restartPhotoCarousel();
      showToast(state.removeBg ? `${photoDayLabel(dayNum)} photo saved — removing background…` : `${photoDayLabel(dayNum)} photo saved.`);

      // Kick off the cut-out in the background (no await) so saving felt instant.
      if (state.removeBg) enqueueCutout(dayNum);
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
      title: `Remove ${photoDayLabel(dayNum)} photo?`,
      body: 'This permanently deletes the photo from your account.',
      onConfirm: async () => {
        try {
          const ref = photoDocRef(dayNum);
          if (ref) await ref.delete();
          const cref = cutoutDocRef(dayNum);
          if (cref) await cref.delete();
        } catch (e) { console.warn('Delete failed (may not exist)', e); }
        photoDataCache.delete(dayNum);
        cutoutDataCache.delete(dayNum);
        luminanceCache.delete(dayNum);
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
    // Days kept from a previous run sit below the current run's Day 1; label
    // those by date instead of a (negative) run day number.
    const runDay = dayNum - currentRunOffset();
    el.photoDayLine.textContent = runDay >= 1
      ? (date ? `Day ${runDay} · ${formatFullDate(date)}` : `Day ${runDay}`)
      : (date ? `Earlier run · ${formatFullDate(date)}` : 'Earlier run');
    el.photoTitle.textContent = dayNum === todayDay
      ? 'Progress photo'
      : (runDay >= 1 ? `Day ${runDay} photo` : 'Earlier photo');
    el.photoPrevBtn.disabled = dayNum <= 1;
    el.photoNextBtn.disabled = dayNum >= todayDay;

    const has = state.photos && state.photos[dayNum];
    el.photoRemoveBtn.hidden = !has;
    el.photoAlignBtn.hidden = !has;
    el.photoAlignBtn.textContent = has?.alignment ? 'Re-align this photo' : 'Align this photo';
    el.photoPickBtn.textContent = has ? 'Replace photo' : 'Choose photo';
    // Touch-up only makes sense once a cut-out exists for the day.
    if (el.photoEditBtn) el.photoEditBtn.hidden = !has?.hasCutout;

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

  /* ----- Cut-out touch-up editor --------------------------------------- */

  // Manual brush to fix what the model misses: erase leftover bits, or restore
  // over-trimmed areas. Works on the cut-out's ALPHA mask while always sourcing
  // RGB from the kept original, so Restore reveals real pixels (not black).
  // Saved with edited:true so auto-reprocessing never overwrites the edits.
  let editState = null;
  let editSaveTimer = null;
  // { day, w, h, work, wctx, baseImg, initialAlpha, tool, brush, drawing, last, undo:[] }

  async function fetchCutoutData(day) {
    let c = cutoutDataCache.get(day);
    if (c === undefined) {
      c = null;
      try { const s = await cutoutDocRef(day)?.get(); if (s && s.exists) c = s.data() || null; } catch (e) { console.error(e); }
      if (c && c.data) cutoutDataCache.set(day, c);
    }
    return c;
  }

  async function openEditView() {
    const day = photoSheetDay;
    if (!day || !state.photos?.[day]?.hasCutout) return;
    const [origUrl, cutout] = await Promise.all([fetchOriginalDataURL(day), fetchCutoutData(day)]);
    if (!origUrl || !cutout || !cutout.data) { showToast('Couldn’t open the editor.'); return; }
    let origImg, cutImg;
    try { [origImg, cutImg] = await Promise.all([loadImage(origUrl), loadImage(cutout.data)]); }
    catch { showToast('Couldn’t open the editor.'); return; }

    const w = cutImg.naturalWidth || cutImg.width;
    const h = cutImg.naturalHeight || cutImg.height;
    const work = document.createElement('canvas');
    work.width = w; work.height = h;
    const wctx = work.getContext('2d', { willReadFrequently: true });
    wctx.drawImage(origImg, 0, 0, w, h);
    const baseImg = wctx.getImageData(0, 0, w, h); // original RGB
    // Seed alpha from the current cut-out.
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.drawImage(cutImg, 0, 0, w, h);
    const ca = tctx.getImageData(0, 0, w, h).data;
    for (let i = 3; i < baseImg.data.length; i += 4) baseImg.data[i] = ca[i];

    editState = {
      day, w, h, work, wctx, baseImg,
      initialAlpha: baseImg.data.slice(0), // for Reset (whole RGBA copy is fine)
      smoothing: 50, // fixed at the halfway point; not adjustable
      lassoPts: null, lassoLastRaw: null, lassoSmooth: null,
      drawing: false, dirty: false, undo: [],
    };

    const cv = el.photoEditCanvas;
    cv.width = w; cv.height = h;
    if (el.photoEditSaved) el.photoEditSaved.hidden = true;
    el.photoPreview.style.display = 'none';
    el.photoSheetActions.style.display = 'none';
    el.photoEditStage.hidden = false;
    el.photoEditActions.hidden = false;
    renderEdit();
  }

  // Edits auto-save as you go, so closing just flushes any pending save.
  function closeEditView() {
    clearTimeout(editSaveTimer);
    if (editState && editState.dirty) persistEdit();
    editState = null;
    hideEditMagnifier();
    el.photoEditStage.hidden = true;
    el.photoEditActions.hidden = true;
    el.photoPreview.style.display = '';
    el.photoSheetActions.style.display = '';
    renderPhotoSheet();
    restartPhotoCarousel();
  }

  // Trace a smooth curve through the points (quadratic through midpoints) so
  // the outline reads as a flowing line, not chunky segments.
  function traceLassoPath(ctx, pts) {
    if (!pts.length) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length < 3) {
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const n = pts.length;
    ctx.quadraticCurveTo(pts[n - 2].x, pts[n - 2].y, pts[n - 1].x, pts[n - 1].y);
  }

  // Composite + the in-progress lasso outline.
  function renderLasso() {
    renderEdit();
    const pts = editState.lassoPts;
    if (!pts || pts.length < 1) return;
    const ctx = el.photoEditCanvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = '#ff9500';
    ctx.lineWidth = Math.max(1.5, editState.w / 320);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    traceLassoPath(ctx, pts);
    ctx.stroke();
    ctx.restore();
  }

  // Erase everything enclosed by the lasso curve (rasterized via canvas fill).
  function lassoApply() {
    const { lassoPts, baseImg, w, h } = editState;
    if (!lassoPts || lassoPts.length < 3) return;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tctx = tmp.getContext('2d', { willReadFrequently: true });
    tctx.fillStyle = '#fff';
    tctx.beginPath();
    traceLassoPath(tctx, lassoPts);
    tctx.closePath();
    tctx.fill();
    const mask = tctx.getImageData(0, 0, w, h).data;
    const data = baseImg.data;
    for (let i = 0; i < w * h; i++) if (mask[i * 4 + 3] > 0) data[i * 4 + 3] = 0;
  }

  function renderEdit() {
    if (!editState) return;
    const { work, wctx, baseImg } = editState;
    wctx.putImageData(baseImg, 0, 0);
    const cv = el.photoEditCanvas;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = BG_FALLBACK_COLOR;
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(work, 0, 0, cv.width, cv.height);
  }

  function editPointerPos(e) {
    const cv = el.photoEditCanvas;
    const rect = cv.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (cv.width / rect.width),
      y: (e.clientY - rect.top) * (cv.height / rect.height),
    };
  }

  function pushEditUndo() {
    editState.undo.push(editState.baseImg.data.slice(0));
    if (editState.undo.length > 20) editState.undo.shift();
  }

  // Loupe magnifier — same look/behavior as the alignment pin magnifier, but it
  // zooms a live copy of the edit canvas (so you see the snapped lasso outline
  // and the exact pixel under your finger).
  const EDIT_MAG_SIZE = 150;
  const EDIT_MAG_ZOOM = 3.5;

  function showEditMagnifier(e) {
    if (!el.photoEditMagnifier) return;
    el.photoEditMagnifier.hidden = false;
    updateEditMagnifier(e);
  }

  function updateEditMagnifier(e) {
    const mag = el.photoEditMagnifier;
    const mc = el.photoEditMagnifierCanvas;
    if (!mag || mag.hidden || !mc || !editState) return;
    const cv = el.photoEditCanvas;
    const rect = cv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const M = EDIT_MAG_SIZE, S = EDIT_MAG_ZOOM;
    const dispScale = rect.width / cv.width;       // display px per native px
    const nx = (e.clientX - rect.left) / dispScale; // native canvas coords
    const ny = (e.clientY - rect.top) / dispScale;
    const srcW = M / (S * dispScale);              // native px shown in the loupe
    const scale = M / srcW;

    const ctx = mc.getContext('2d');
    ctx.fillStyle = BG_FALLBACK_COLOR;
    ctx.fillRect(0, 0, M, M);
    let sx = nx - srcW / 2, sy = ny - srcW / 2, sw = srcW, sh = srcW, dx = 0, dy = 0;
    if (sx < 0) { dx = -sx * scale; sw += sx; sx = 0; }
    if (sy < 0) { dy = -sy * scale; sh += sy; sy = 0; }
    if (sx + sw > cv.width) sw = cv.width - sx;
    if (sy + sh > cv.height) sh = cv.height - sy;
    if (sw > 0 && sh > 0) ctx.drawImage(cv, sx, sy, sw, sh, dx, dy, sw * scale, sh * scale);

    // Place near the finger (above, else below), clamped to the viewport.
    const MARGIN = 12, GAP = 40;
    let mx = e.clientX - M / 2;
    let my = e.clientY - M - GAP;
    if (my < MARGIN) my = e.clientY + GAP;
    mx = Math.max(MARGIN, Math.min(window.innerWidth - M - MARGIN, mx));
    my = Math.max(MARGIN, Math.min(window.innerHeight - M - MARGIN, my));
    mag.style.left = `${mx}px`;
    mag.style.top = `${my}px`;
  }

  function hideEditMagnifier() {
    if (el.photoEditMagnifier) el.photoEditMagnifier.hidden = true;
  }

  // EMA factor from the smoothing setting: higher smoothing → smaller alpha →
  // smoother (but laggier) line.
  function lassoAlpha() {
    return Math.max(0.05, 0.5 - (editState.smoothing / 100) * 0.45);
  }

  function editPointerDown(e) {
    if (!editState) return;
    e.preventDefault();
    try { el.photoEditCanvas.setPointerCapture(e.pointerId); } catch {}
    const p = editPointerPos(e);
    // Start a smoothed freehand outline; the erase happens on release.
    editState.drawing = true;
    editState.lassoSmooth = { x: p.x, y: p.y };
    editState.lassoPts = [{ x: p.x, y: p.y }];
    editState.lassoLastRaw = p;
    renderLasso();
    showEditMagnifier(e);
  }

  function editPointerMove(e) {
    if (!editState || !editState.drawing) return;
    const p = editPointerPos(e);
    // Add an exponentially-smoothed vertex once the finger has moved a bit, so
    // hand-shake is damped and the line flows instead of zig-zagging.
    const last = editState.lassoLastRaw;
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 2) {
      const sm = editState.lassoSmooth;
      const a = lassoAlpha();
      sm.x += a * (p.x - sm.x);
      sm.y += a * (p.y - sm.y);
      editState.lassoPts.push({ x: sm.x, y: sm.y });
      editState.lassoLastRaw = p;
      renderLasso();
    }
    updateEditMagnifier(e);
  }

  function editPointerUp() {
    if (!editState) return;
    if (editState.drawing) {
      if (editState.lassoPts && editState.lassoPts.length >= 3) {
        pushEditUndo();
        lassoApply();
        scheduleEditSave();
      }
      editState.lassoPts = null;
      editState.lassoLastRaw = null;
      renderEdit();
    }
    editState.drawing = false;
    hideEditMagnifier();
  }

  function editUndo() {
    if (!editState || !editState.undo.length) return;
    editState.baseImg.data.set(editState.undo.pop());
    renderEdit();
    scheduleEditSave();
  }

  function editReset() {
    if (!editState) return;
    editState.undo.push(editState.baseImg.data.slice(0));
    editState.baseImg.data.set(editState.initialAlpha);
    renderEdit();
    scheduleEditSave();
  }

  // Auto-save: mark dirty and persist a short moment after the last edit (so a
  // burst of lassos coalesces into one write). Flushed immediately on close.
  function scheduleEditSave() {
    if (!editState) return;
    editState.dirty = true;
    if (el.photoEditSaved) { el.photoEditSaved.hidden = false; el.photoEditSaved.textContent = 'Saving…'; }
    clearTimeout(editSaveTimer);
    editSaveTimer = setTimeout(() => { persistEdit(); }, 500);
  }

  // Persist the current cut-out. Captures what it needs up front so it finishes
  // even if the editor closes mid-write. No UI close (that's the Done button).
  async function persistEdit() {
    if (!editState || !editState.dirty) return;
    editState.dirty = false;
    clearTimeout(editSaveTimer);
    const day = editState.day;
    const work = editState.work;
    editState.wctx.putImageData(editState.baseImg, 0, 0);
    let blob;
    try { blob = await encodeCutout(work); }
    catch (e) { console.error('Touch-up encode failed', e); if (editState) editState.dirty = true; return; }
    const dataUrl = await blobToDataURL(blob);
    try {
      const cref = cutoutDocRef(day);
      if (cref) await cref.set({ data: dataUrl, transparent: true, model: 'manual', edited: true, uploadedAt: new Date().toISOString() });
    } catch (e) { console.error('Touch-up save failed', e); if (editState) editState.dirty = true; return; }
    if (!state.photos[day]) state.photos[day] = {};
    state.photos[day].hasCutout = true;
    state.photos[day].cutoutTransparent = true;
    state.photos[day].cutoutModel = 'manual';
    state.photos[day].cutoutEdited = true;
    saveState();
    cutoutDataCache.set(day, { data: dataUrl, transparent: true });
    photoDataCache.delete(day);
    luminanceCache.delete(day);
    if (el.photoEditSaved) { el.photoEditSaved.hidden = false; el.photoEditSaved.textContent = 'Saved ✓'; }
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
      state.alignmentReferenceDay = day; // also the exposure baseline
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
  let carouselPaused = false;
  let modeOverrideUntil = 0; // ms timestamp — pill shows the chosen mode until then
  let lastPhaseLabel = '';   // the carousel's current live phase ('Then vs Now', 'Sequence', etc.)

  function photoLayers() { return [el.photosImageA, el.photosImageB]; }

  function resetPhotoLayers() {
    if (el.photosBgLayer) { el.photosBgLayer.style.display = 'none'; el.photosBgLayer.removeAttribute('src'); }
    for (const layer of photoLayers()) {
      layer.style.transition = 'none';
      layer.style.opacity = '0';
      layer.style.transform = '';
      layer.style.filter = '';
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

  // Photos kept from before the current run (a restarted program).
  function hasPriorRunPhotos() {
    const off = currentRunOffset();
    return off > 0 && uploadedDays().some((d) => d <= off);
  }

  // Effective timeline scope. 'all' only means something once photos from a
  // previous run exist; otherwise both scopes are the same set.
  function photoScope() {
    return state.photoScope === 'all' && hasPriorRunPhotos() ? 'all' : 'current';
  }

  function scopedUploadedDays() {
    const days = uploadedDays();
    if (photoScope() === 'all') return days;
    const off = currentRunOffset();
    return days.filter((d) => d > off);
  }

  // The day number shown on the stage tag / summary: run-relative in Current
  // scope, all-time (epoch) numbering in All time scope.
  function displayDayNum(day) {
    return photoScope() === 'all' ? day : day - currentRunOffset();
  }

  function renderPhotoRail(activeDay) {
    renderScopePill();
    const phase = PHASES[state.currentPhase];
    if (!phase || !state.startDate || !state.phaseStartDate) {
      el.photosRailTrack.innerHTML = '';
      updatePhotoSummary(null);
      return;
    }
    const todayDay = journeyDayForToday() || 0;
    const items = [];
    if (photoScope() === 'all') {
      // All time: one slot per uploaded photo, across every run — no empty
      // slots (you can't backfill a previous run from the rail).
      for (const d of uploadedDays()) {
        const cls = ['photos-day-item', 'has-photo'];
        if (d === activeDay) cls.push('active');
        const dateISO = dateForJourneyDay(d);
        items.push(`
          <button class="${cls.join(' ')}" type="button" data-action="select-photo-day" data-day="${d}">
            <span class="photos-day-num">${d}</span>
            <span class="photos-day-date">${dateISO ? formatShortDate(dateISO) : ''}</span>
            <span class="photos-day-dot" aria-hidden="true"></span>
          </button>
        `);
      }
    } else {
      // Current run: every day of the current phase, even days without
      // photos. The carousel only plays uploaded days (via
      // scopedUploadedDays()), so empties are just visible slots — they
      // don't get auto-played but the user can tap one to upload a photo.
      const phaseStartJourney = daysBetween(photoEpochISO(), state.phaseStartDate) + 1;
      const phaseEndJourney = phaseStartJourney + phase.duration - 1;
      for (let d = phaseStartJourney; d <= phaseEndJourney; d++) {
        const phaseDayNum = d - phaseStartJourney + 1;
        const has = !!(state.photos && state.photos[d]);
        const isFuture = d > todayDay;
        const cls = ['photos-day-item'];
        if (has) cls.push('has-photo');
        if (d === activeDay) cls.push('active');
        if (isFuture) cls.push('future');
        const dateISO = dateForJourneyDay(d);
        const dateStr = dateISO ? formatShortDate(dateISO) : '';
        items.push(`
          <button class="${cls.join(' ')}" type="button" data-action="select-photo-day" data-day="${d}">
            <span class="photos-day-num">${phaseDayNum}</span>
            <span class="photos-day-date">${dateStr}</span>
            <span class="photos-day-dot" aria-hidden="true"></span>
          </button>
        `);
      }
    }
    el.photosRailTrack.innerHTML = items.join('');
    scrollRailTo(activeDay || todayDay);
    updatePhotoSummary(activeDay || todayDay);
    updateDownloadButtonState();
  }

  function updateDownloadButtonState() {
    if (!el.photosDownloadBtn) return;
    const count = scopedUploadedDays().length;
    el.photosDownloadBtn.disabled = count < 2;
    el.photosDownloadBtn.title = count < 2
      ? 'Upload at least 2 photos to download a GIF'
      : 'Download as GIF';
  }

  function updatePhotoSummary(day) {
    if (!el.photosSummary) return;
    const target = day || journeyDayForToday();
    if (!target || !photoEpochISO()) {
      el.photosSummaryDay.textContent = '—';
      el.photosSummaryDate.textContent = '';
      el.photosSummaryPhase.textContent = '';
      el.photosSummaryStats.textContent = '';
      return;
    }
    el.photosSummaryDay.textContent = `Day ${displayDayNum(target)}`;
    const dateISO = dateForJourneyDay(target);
    el.photosSummaryDate.textContent = dateISO ? formatFullDate(dateISO) : '';
    const phaseInfo = phaseDayFromJourneyDay(target);
    if (phaseInfo) {
      const phase = PHASES[phaseInfo.phaseId];
      el.photosSummaryPhase.textContent = `${phase.name} · Day ${phaseInfo.dayIndex + 1} of ${phase.duration}`;
    } else {
      el.photosSummaryPhase.textContent = photoScope() === 'all' && target <= currentRunOffset() ? 'Earlier run' : '';
    }
    if (photoScope() === 'all') {
      const total = uploadedDays().length;
      el.photosSummaryStats.textContent = `${total} photo${total === 1 ? '' : 's'} all time`;
    } else {
      const uploaded = scopedUploadedDays().length;
      const runToday = Math.max(1, (journeyDayForToday() || 1) - currentRunOffset());
      el.photosSummaryStats.textContent =
        `${uploaded} of ${runToday} photo${runToday === 1 ? '' : 's'} uploaded · ${Math.max(0, runToday - uploaded)} to catch up`;
    }
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

  // True when the carousel should overlay the transparent cut-out on the fixed
  // background layer instead of a baked composite.
  function useFixedBg(day) {
    return state.removeBg && state.hasBgImage && showCutoutFor(day);
  }

  // The transparent cut-out (subject only) for `day`, for overlaying on the
  // fixed background. Null if there isn't a transparent one.
  async function getCutoutTransparentURL(day) {
    let cutout = cutoutDataCache.get(day);
    if (cutout === undefined) {
      cutout = null;
      try { const snap = await cutoutDocRef(day)?.get(); if (snap && snap.exists) cutout = snap.data() || null; }
      catch (e) { console.error('Cut-out fetch failed', e); }
      if (cutout && cutout.data) cutoutDataCache.set(day, cutout);
    }
    return (cutout && cutout.transparent && cutout.data) ? cutout.data : null;
  }

  // Show + position the fixed background layer, or hide it.
  async function updateBgLayer(show) {
    const layer = el.photosBgLayer;
    if (!layer) return;
    if (!show) { layer.style.display = 'none'; return; }
    const url = await getBgImageDataUrl();
    if (!url) { layer.style.display = 'none'; return; }
    if (layer.getAttribute('src') !== url) layer.setAttribute('src', url);
    layer.style.transform = bgTransformCSS(state.bgImageTransform);
    layer.style.display = 'block';
  }

  async function showPhotoDay(day, opts = {}) {
    if (!day) return;
    // In fixed-background mode, show the transparent cut-out over the bg layer;
    // otherwise the composited/original image as before.
    const fixedBg = useFixedBg(day);
    let url = null, transparentSubject = false;
    if (fixedBg) {
      url = await getCutoutTransparentURL(day);
      if (url) transparentSubject = true;
    }
    if (!url) url = await fetchPhotoURL(day);
    if (!url) return;
    await preloadImage(url);
    await updateBgLayer(transparentSubject);
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
    backEl.style.filter = await exposureFilterFor(day);

    el.photosImageWrap.classList.add('has-photo');
    el.photosDayTag.textContent = `Day ${displayDayNum(day)}`;
    if (opts.lightRail) updatePhotoRailActive(day);
    else renderPhotoRail(day);

    if (opts.instant) {
      // Hard swap — opacity flips to 1 with no transition. For opaque images
      // the old layer can stay at 1 underneath (it's covered); transparent
      // cut-outs don't cover it, so hide it to avoid two subjects at once.
      backEl.style.opacity = '1';
      if (transparentSubject) frontEl.style.opacity = '0';
    } else {
      // Crossfade — restore the CSS transition and animate to 1. In transparent
      // mode also fade the previous subject out (a real cross-dissolve), so it
      // doesn't linger showing through the new one.
      backEl.style.transition = '';
      if (transparentSubject) frontEl.style.transition = '';
      requestAnimationFrame(() => {
        backEl.style.opacity = '1';
        if (transparentSubject) frontEl.style.opacity = '0';
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
    else if (state.carouselMode === 'sequence') text = 'Sequence';
    else if (state.carouselMode === 'compare') text = 'Then vs Now';
    else text = lastPhaseLabel; // auto — show whatever the carousel is doing right now
    if (!text) {
      el.photosModePill.textContent = '—';
      el.photosModePill.classList.add('hidden');
    } else {
      el.photosModePill.textContent = text;
      el.photosModePill.classList.remove('hidden');
    }
  }

  // The Current / All time pill. Only shown once photos from a previous run
  // exist — until a restart happens there's nothing to switch between.
  function renderScopePill() {
    if (!el.photosScopePill) return;
    if (!hasPriorRunPhotos()) {
      el.photosScopePill.classList.add('hidden');
      return;
    }
    const all = photoScope() === 'all';
    el.photosScopePill.textContent = all ? 'All time' : 'Current';
    el.photosScopePill.classList.toggle('scope-all', all);
    el.photosScopePill.title = all
      ? 'Showing every run — tap for the current run only'
      : 'Showing the current run — tap for all time';
    el.photosScopePill.classList.remove('hidden');
  }

  function togglePhotoScope() {
    state.photoScope = photoScope() === 'all' ? 'current' : 'all';
    saveState();
    carouselPaused = false;
    renderScopePill();
    restartPhotoCarousel();
  }

  function cycleCarouselMode() {
    const order = ['auto', 'compare', 'sequence'];
    state.carouselMode = order[(order.indexOf(state.carouselMode) + 1) % order.length];
    saveState();
    carouselPaused = false;

    // Show the chosen mode for 500 ms so the user sees what they picked,
    // then settle into the normal live label.
    const overrideText =
      state.carouselMode === 'auto' ? 'Auto'
      : state.carouselMode === 'sequence' ? 'Sequence'
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
    const days = scopedUploadedDays();
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
    //  - The whole playthrough is capped at 5 s, no matter how many photos.
    //  - A photo never dwells longer than 5000/75 ≈ 66.7 ms — the rate a full
    //    75-day journey plays at. That's the "slowest" a photo can go, so a
    //    short journey flips through just as briskly instead of crawling.
    //  => dwell = 5000 / max(75, count): a flat ~66.7 ms each up to 75 photos
    //     (total grows with count, e.g. 5 photos ≈ 0.33 s), then shrinking
    //     past 75 photos so the total stays pinned at 5 s.
    const SEQ_TOTAL_MS = 5000;
    const SEQ_PACE_DAYS = 75;
    // Floor (not round) so 75 photos × dwell never tips over the 5 s ceiling
    // and a photo never dwells longer than 5000/75 ≈ 66 ms.
    const seqPerPhoto = Math.floor(SEQ_TOTAL_MS / Math.max(SEQ_PACE_DAYS, days.length));
    // Keep the cross-fade under half the (short) dwell so frames stay distinct.
    const seqFadeMs = Math.max(16, Math.min(60, Math.round(seqPerPhoto * 0.5)));

    // "Then vs Now" gets a calmer dwell + smoother fade for contrast
    const compareDwellMs = 2000;
    const compareFadeMs = 280;

    // In pure Sequence mode the playthrough loops; hold on the first photo for
    // a beat each pass so it's clear where the loop restarts / begins.
    const SEQ_LOOP_HOLD_MS = 2000;

    while (!cancelled) {
      // When crossfade is off, swap photos instantly (a hard cut).
      const noFade = !state.crossfade;
      // Phase 1: "Then vs Now" — skipped in pure sequence mode
      if (state.carouselMode !== 'sequence') {
        setFade(compareFadeMs);
        setCarouselMode('Then vs Now');
        await showPhotoDay(days[0], { lightRail: true, instant: noFade });
        if (cancelled) break;
        await wait(compareDwellMs);
        if (cancelled) break;
        await showPhotoDay(days[days.length - 1], { lightRail: true, instant: noFade });
        if (cancelled) break;
        await wait(compareDwellMs);
        if (cancelled) break;
      }

      // Phase 2: Sequence — skipped in pure compare mode
      if (state.carouselMode !== 'compare') {
        setFade(seqFadeMs);
        setCarouselMode('Sequence');
        const seqOpts = { lightRail: true, instant: noFade };
        // Only pause on the first frame when Sequence is the looping mode.
        const firstHold = state.carouselMode === 'sequence' ? SEQ_LOOP_HOLD_MS : seqPerPhoto;
        for (let i = 0; i < days.length; i++) {
          if (cancelled) break;
          await showPhotoDay(days[i], seqOpts);
          if (cancelled) break;
          await wait(i === 0 ? firstHold : seqPerPhoto);
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

    // 5a. Photo on the left — fills the full stage height with no gaps.
    //     Width = height × aspect, capped so very wide photos don't
    //     overflow the inner area.
    const aspect = (state.photoAspectRatio && state.photoAspectRatio > 0)
      ? state.photoAspectRatio : (4 / 5);
    const sideGap = 20;
    const minSideW = 320;
    const maxImgW = innerW - sideGap - minSideW;
    let imgH = stageH;
    let imgW = Math.min(maxImgW, imgH * aspect);
    imgH = imgW / aspect;
    if (imgH > stageH) { imgH = stageH; imgW = imgH * aspect; }
    const imgX = innerX;
    const imgY = stageY;
    drawPhotoBlock(ctx, imgX, imgY, imgW, imgH, img, alignment, ref, theme, opts.exposureFilter);

    // 5b. Side panel on the right
    const sideX = imgX + imgW + sideGap;
    const sideW = innerW - imgW - sideGap;
    const summaryH = 124;
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

  function drawPhotoBlock(ctx, x, y, w, h, img, alignment, ref, theme, filter) {
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
      if (filter) ctx.filter = filter; // exposure match
      drawImageCover(ctx, img, 0, 0, w, h);
      ctx.filter = 'none';
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
    const dateISO = dateForJourneyDay(data.currentDay);
    if (dateISO) ctx.fillText(formatFullDate(dateISO), innerX, cy);
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
    const itemDateISO = dateForJourneyDay(day);
    if (itemDateISO) {
      ctx.fillText(formatShortDate(itemDateISO), x + padding + 52, cy + 1);
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
    closeVideoSheet();
  }

  async function downloadProgressVideo() {
    if (typeof GIF === 'undefined') {
      showToast('GIF encoder failed to load — check your connection.');
      return;
    }
    const days = scopedUploadedDays();
    if (days.length < 2) {
      showToast('You need at least 2 photos to make a GIF.');
      return;
    }

    videoCancelled = false;
    openVideoSheet();
    setVideoProgress(0, 'Preparing photos…');

    // Render each frame at full resolution (1080 tall) where the layout
    // proportions/fonts are tuned, then DOWNSCALE to the GIF size. This
    // keeps the card looking exactly like the app instead of having
    // oversized padding/fonts from drawing straight at a small size.
    const TARGET_H = 1080;
    const CARD_PAD = 24;
    const INNER_PAD = 28;
    const HEADER_H = 80;
    const STAGE_GAP = 20;
    const SIDE_W = 380;
    const innerH = TARGET_H - CARD_PAD * 2 - INNER_PAD * 2;
    const stageH = innerH - HEADER_H;
    const aspect = (state.photoAspectRatio && state.photoAspectRatio > 0)
      ? state.photoAspectRatio : (4 / 5);
    let photoH = stageH;
    let photoW = photoH * aspect;
    const MAX_PHOTO_W = 800;
    if (photoW > MAX_PHOTO_W) { photoW = MAX_PHOTO_W; photoH = photoW / aspect; }
    let W = Math.round(photoW + STAGE_GAP + SIDE_W + (INNER_PAD + CARD_PAD) * 2);
    let H = TARGET_H;
    if (W % 2) W++;
    if (H % 2) H++;

    // Full-res render canvas
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // Downscaled GIF output canvas (~0.5x → still readable, much smaller)
    const GIF_SCALE = 0.5;
    let gifW = Math.round(W * GIF_SCALE);
    let gifH = Math.round(H * GIF_SCALE);
    if (gifW % 2) gifW++;
    if (gifH % 2) gifH++;
    const gifCanvas = document.createElement('canvas');
    gifCanvas.width = gifW;
    gifCanvas.height = gifH;
    const gifCtx = gifCanvas.getContext('2d');
    gifCtx.imageSmoothingEnabled = true;
    gifCtx.imageSmoothingQuality = 'high';

    // Pre-load every uploaded photo (with progress)
    const photos = {};
    for (let i = 0; i < days.length; i++) {
      if (videoCancelled) return;
      const d = days[i];
      try {
        const url = await fetchPhotoURL(d);
        if (url) photos[d] = await loadImage(url);
      } catch { /* ignore */ }
      setVideoProgress(Math.round((i + 1) / days.length * 15), `Loading photos (${i + 1}/${days.length})…`);
    }
    if (videoCancelled) return;

    // Load the gif.js worker as a same-origin blob (avoids CORS on the
    // cross-origin worker script).
    let workerUrl;
    try {
      const resp = await fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
      workerUrl = URL.createObjectURL(await resp.blob());
    } catch {
      showToast('Could not load the GIF encoder.');
      closeVideoSheet();
      return;
    }
    if (videoCancelled) { URL.revokeObjectURL(workerUrl); return; }

    // All time scope numbers days from the epoch (phaseStartJourney = 1), so
    // labels and the drawn rail span every run instead of the current phase.
    const allTime = photoScope() === 'all';
    const phaseStartJourney = !allTime && state.phaseStartDate
      ? daysBetween(photoEpochISO(), state.phaseStartDate) + 1
      : 1;
    const phaseDay = (d) => d - phaseStartJourney + 1;
    const ref = defaultRef();

    // Pacing — total forward pass ~6 s, capped per-frame
    const seqPerPhoto = Math.max(120, Math.min(450, Math.round(6000 / days.length)));
    const SEQ_INTRO_MS = 900;
    const THEN_NOW_MS = 2000;

    const theme = getThemeTokens();
    const phase = PHASES[state.currentPhase];
    const phaseDuration = allTime
      ? (journeyDayForToday() || days[days.length - 1])
      : (phase ? phase.duration : days.length);
    const phaseName = allTime ? 'All time' : (phase ? phase.name : '');
    const allPhaseDays = [];
    if (allTime) allPhaseDays.push(...days); // photo days only, across runs
    else for (let i = 0; i < phaseDuration; i++) allPhaseDays.push(phaseStartJourney + i);
    const photoSet = new Set(Object.keys(state.photos || {}).map(Number).filter(Boolean));
    const baseOpts = {
      W, H, theme, ref, allDays: allPhaseDays, photoSet,
      phaseStartJourney, phaseName, phaseDuration,
    };

    const exposureFilters = {};
    if (state.matchExposure) {
      for (const d of days) {
        if (videoCancelled) { URL.revokeObjectURL(workerUrl); return; }
        exposureFilters[d] = await exposureFilterFor(d);
      }
    }

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: gifW,
      height: gifH,
      workerScript: workerUrl,
      repeat: 0, // loop forever
      background: theme.bg && theme.bg.startsWith('#') ? theme.bg : '#000',
    });

    // Forward loop: every day in order, then THEN (first photo) and NOW
    // (last photo). The GIF loops, so it plays through once and restarts.
    const frames = days.map((d, i) => ({
      day: d,
      headline: `Day ${phaseDay(d)}`,
      pill: 'Sequence',
      delay: i === 0 ? SEQ_INTRO_MS : seqPerPhoto,
    }));
    frames.push({ day: days[0], headline: 'THEN', pill: 'Then vs Now', delay: THEN_NOW_MS });
    frames.push({ day: days[days.length - 1], headline: 'NOW', pill: 'Then vs Now', delay: THEN_NOW_MS });

    const yield0 = () => new Promise((r) => setTimeout(r, 0));
    for (let i = 0; i < frames.length; i++) {
      if (videoCancelled) { try { gif.abort(); } catch {} URL.revokeObjectURL(workerUrl); closeVideoSheet(); return; }
      const f = frames[i];
      const img = photos[f.day];
      if (!img) continue;
      drawTimelineFrame(ctx, {
        ...baseOpts,
        img,
        alignment: state.photos[f.day]?.alignment,
        currentDay: f.day,
        headline: f.headline,
        modePill: f.pill,
        exposureFilter: exposureFilters[f.day] || '',
      });
      // Downscale full-res frame onto the GIF canvas
      gifCtx.clearRect(0, 0, gifW, gifH);
      gifCtx.drawImage(canvas, 0, 0, gifW, gifH);
      gif.addFrame(gifCtx, { delay: f.delay, copy: true });
      setVideoProgress(15 + Math.round((i + 1) / frames.length * 45), `Building frames (${i + 1}/${frames.length})…`);
      if (i % 3 === 0) await yield0(); // keep the UI responsive
    }

    gif.on('progress', (p) => {
      setVideoProgress(60 + Math.round(p * 38), 'Encoding GIF…');
    });
    gif.on('finished', (blob) => {
      URL.revokeObjectURL(workerUrl);
      if (videoCancelled) { closeVideoSheet(); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `live-hard-progress${allTime ? '-all-time' : ''}-${todayISO()}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setVideoProgress(100, 'Done!');
      setTimeout(() => closeVideoSheet(), 600);
      showToast('GIF saved.');
    });
    gif.render();
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
    // A restart (e.g. failing in Phase 3) must never erase the photo
    // history: carry every photo-related field across. Keys count from the
    // epoch, so the new run simply uploads at higher day numbers.
    const keep = {
      photos: state.photos,
      photoEpochDate: photoEpochISO(),
      photoScope: state.photoScope,
      photoAlignmentRef: state.photoAlignmentRef,
      photoAspectRatio: state.photoAspectRatio,
      matchExposure: state.matchExposure,
      crossfade: state.crossfade,
      alignmentReferenceDay: state.alignmentReferenceDay,
      removeBg: state.removeBg,
      hasBgImage: state.hasBgImage,
      bgImageTransform: state.bgImageTransform,
    };
    state = { ...defaultState(), ...keep, settings };
    state.startDate = todayISO();
    state.currentPhase = '75hard';
    state.phaseStartDate = todayISO();
    if (!state.photoEpochDate) state.photoEpochDate = state.startDate;
    saveState(); render();
    showToast('Day 1 of 75 HARD. Let\'s go.');
  }

  function resetToday() {
    const dayIdx = getViewDayIndex();
    if (dayIdx < 0) return;
    if (state.days[state.currentPhase][dayIdx]) {
      state.days[state.currentPhase][dayIdx] = { tasks: {} };
      saveState();
      // Partial render so a clicked-into past day stays in view after reset.
      renderTasks(); renderHero(); renderCalendar(); renderJourney();
      showToast(dayIdx === anchorDayIndex() ? 'Today reset.' : `Day ${dayIdx + 1} reset.`);
    }
  }

  function failToday() {
    const phase = PHASES[state.currentPhase];
    if (!phase) return;
    const isPhase3 = state.currentPhase === 'phase3';
    // The button is available on past days too (a miss is often noticed
    // later); name the day being failed so the confirm is unambiguous. The
    // consequence is the same either way: the restart begins today.
    const dayIdx = getViewDayIndex();
    const missedPastDay = dayIdx !== anchorDayIndex();
    const missedLabel = missedPastDay ? `Missed a task on Day ${dayIdx + 1}? ` : '';
    askConfirm({
      title: isPhase3 ? 'Restart entire program?' : `Restart ${phase.name}?`,
      body: missedLabel + (isPhase3
        ? 'Per the Live Hard rules, missing a task during Phase 3 resets the entire program back to Day 1 of 75 HARD.'
        : `You will lose all progress in ${phase.name} and restart from Day 1 today.`),
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
      if (phaseId === '75hard') {
        // Pin the photo epoch before moving startDate, so existing photo
        // keys keep their dates and the restarted run can't overwrite them.
        if (!state.photoEpochDate) state.photoEpochDate = state.startDate;
        state.startDate = todayISO();
      }
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
    if (el.matchExposureToggle) el.matchExposureToggle.checked = !!state.matchExposure;
    if (el.crossfadeToggle) el.crossfadeToggle.checked = !!state.crossfade;
    if (el.removeBgToggle) el.removeBgToggle.checked = !!state.removeBg;
    renderBgImageSettings();
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
        // Never restarted → the epoch tracks the start date, so photo keys
        // keep meaning "day N of the run". After a restart the epoch stays
        // pinned to the first run and photo dates are unaffected.
        if (state.photoEpochDate === oldStart || !state.photoEpochDate) state.photoEpochDate = newDate;
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

  // A full backup bundles the state JSON with every image the account keeps in
  // Firestore — original photos, background-removed cut-outs, and the carousel
  // backdrop — embedded as data URLs, so one file can rebuild the whole
  // account. Backups from before images were included (bare state, no
  // wrapper) still import.
  const EXPORT_FORMAT = 2;
  // Import-side guard: never try to write a doc from a backup file that
  // Firestore's 1,048,576-byte cap would reject (also bounds what a
  // hand-edited file can push into an account). Docs read from the server at
  // export time are NOT size-checked — anything the server stored fits it.
  const IMAGE_DOC_MAX_BYTES = 1040 * 1024;
  // Offline, Firestore write promises never settle — stop waiting after this
  // long instead of hanging the restore forever.
  const RESTORE_TIMEOUT_MS = 90 * 1000;

  let exportInProgress = false;
  let importInProgress = false;

  // Export and import touch the same docs and the same `state` — never let
  // them overlap.
  function backupBusy() {
    if (exportInProgress || importInProgress) {
      showToast('Another backup operation is still running.');
      return true;
    }
    return false;
  }

  // Run fn over items with at most `limit` in flight at once.
  async function mapLimit(items, limit, fn) {
    let next = 0;
    const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    });
    await Promise.all(lanes);
  }

  // Resolves true when `promise` settles (either way), false on timeout.
  function settledWithin(promise, ms) {
    return Promise.race([
      promise.then(() => true, () => true),
      new Promise((resolve) => setTimeout(() => resolve(false), ms)),
    ]);
  }

  function sanitizeImageDoc(doc, { checkSize = true } = {}) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
    if (typeof doc.data !== 'string' || !doc.data.startsWith('data:image/')) return null;
    if (checkSize) {
      try { if (JSON.stringify(doc).length > IMAGE_DOC_MAX_BYTES) return null; } catch { return null; }
    }
    return doc;
  }

  // Keep only image entries that are safe to write back: numeric day keys and
  // docs that pass sanitizeImageDoc.
  function sanitizeImages(images) {
    const clean = { photos: {}, cutouts: {}, background: sanitizeImageDoc(images.background) };
    for (const [day, doc] of Object.entries(images.photos || {})) {
      const d = /^\d+$/.test(day) ? sanitizeImageDoc(doc) : null;
      if (d) clean.photos[day] = d;
    }
    for (const [day, doc] of Object.entries(images.cutouts || {})) {
      // A cut-out without its original is dead weight — never restore one.
      const d = clean.photos[day] ? sanitizeImageDoc(doc) : null;
      if (d) clean.cutouts[day] = d;
    }
    return clean;
  }

  async function collectImagesForExport() {
    const images = { photos: {}, cutouts: {} };
    let missingPhotos = 0;
    const days = Object.keys(state.photos || {});
    await mapLimit(days, 8, async (day) => {
      try {
        const snap = await photoDocRef(day).get();
        const doc = snap.exists ? sanitizeImageDoc(snap.data(), { checkSize: false }) : null;
        if (doc) images.photos[day] = doc;
      } catch (e) { console.error('Export: photo fetch failed for day', day, e); }
      if (!images.photos[day]) { missingPhotos++; return; } // no orphaned cut-outs
      if (!state.photos[day]?.hasCutout) return;
      try {
        const snap = await cutoutDocRef(day).get();
        const doc = snap.exists ? sanitizeImageDoc(snap.data(), { checkSize: false }) : null;
        if (doc) images.cutouts[day] = doc;
      } catch (e) { console.error('Export: cut-out fetch failed for day', day, e); }
    });
    if (state.hasBgImage) {
      try {
        const snap = await bgImageDocRef().get();
        const doc = snap.exists ? sanitizeImageDoc(snap.data(), { checkSize: false }) : null;
        if (doc) images.background = doc;
      } catch (e) { console.error('Export: background fetch failed', e); }
    }
    return {
      images,
      missingPhotos,
      photoTotal: days.length,
      missingBackground: !!state.hasBgImage && !images.background,
    };
  }

  async function exportData() {
    if (backupBusy()) return;
    exportInProgress = true;
    try {
      const backup = {
        app: 'live-hard',
        exportFormat: EXPORT_FORMAT,
        exportedAt: new Date().toISOString(),
        account: currentUser?.email || null,
        state,
      };

      let note = '';
      if (firestore && currentUser) {
        if (Object.keys(state.photos || {}).length || state.hasBgImage) showToast('Preparing backup…');
        const { images, missingPhotos, photoTotal, missingBackground } = await collectImagesForExport();
        backup.images = images;
        // Mark incomplete backups in the file itself so a later import can
        // warn before it removes what's missing here.
        if (missingPhotos || missingBackground) {
          backup.missing = { photos: missingPhotos, background: missingBackground };
        }
        const got = photoTotal - missingPhotos;
        if (missingPhotos) note = ` — only ${got} of ${photoTotal} photos could be included`;
        else if (photoTotal) note = ` — ${got} photo${got === 1 ? '' : 's'} included`;
        if (missingBackground) note += '; the background image could not be included';
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `live-hard-${todayISO()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Backup downloaded${note}.`);
    } catch (e) {
      console.error('Export failed', e);
      showToast('Could not create the backup.');
    } finally {
      exportInProgress = false;
    }
  }

  function importData(file) {
    const reader = new FileReader();
    reader.onerror = () => showToast('Couldn’t read that file from your device.');
    reader.onload = (e) => {
      let parsed;
      try {
        parsed = JSON.parse(e.target.result);
      } catch (err) {
        console.error('Import: file is not valid JSON', err);
        showToast('That file isn’t readable as a backup — it may be incomplete or modified.');
        return;
      }
      try {
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          showToast('That file doesn’t look like a Live Hard backup.');
          return;
        }
        // Full backups wrap the state; older exports ARE the state.
        const isFullBackup = Number.isFinite(parsed.exportFormat) && parsed.state && typeof parsed.state === 'object';
        const stateObj = isFullBackup ? parsed.state : parsed;
        const images = isFullBackup && parsed.images && typeof parsed.images === 'object'
          ? sanitizeImages(parsed.images)
          : null;
        if (!stateObj || typeof stateObj !== 'object' || stateObj.version !== STATE_VERSION) {
          console.error('Import: unrecognized backup shape/version', stateObj && stateObj.version);
          showToast('That file doesn’t look like a Live Hard backup.');
          return;
        }
        const photoCount = images ? Object.keys(images.photos).length : 0;
        const canRestoreImages = !!(images && firestore && currentUser);
        let body;
        if (!images) {
          body = 'This will overwrite your current data with the contents of the backup file.';
        } else if (!canRestoreImages) {
          body = 'This will overwrite your current data. Photos can’t be restored while you’re not signed in — sign in and import this file again to bring them back.';
        } else if (photoCount) {
          body = `This will replace your current data and progress photos with the backup file (${photoCount} photo${photoCount === 1 ? '' : 's'}).`;
        } else {
          body = 'This will replace your current data with the backup file. The backup contains no photos, so existing photos will be removed.';
        }
        if (canRestoreImages && parsed.missing && typeof parsed.missing === 'object') {
          const m = [];
          if (parsed.missing.photos) m.push(`${parsed.missing.photos} photo${parsed.missing.photos === 1 ? '' : 's'}`);
          if (parsed.missing.background) m.push('the background image');
          if (m.length) body += ` Note: this backup was created incomplete — ${m.join(' and ')} could not be saved into it, and importing will remove what’s missing from your account.`;
        }
        askConfirm({
          title: 'Replace current progress?',
          body,
          onConfirm: () => applyImport(stateObj, images),
        });
      } catch (err) {
        console.error('Import failed', err);
        showToast('Could not read that file.');
      }
    };
    reader.readAsText(file);
  }

  async function applyImport(stateObj, images) {
    if (backupBusy()) return;
    importInProgress = true; // also mutes the Firestore snapshot listener
    closeSettings();
    try {
      const def = defaultState();
      state = { ...def, ...stateObj, days: { ...def.days, ...(stateObj.days || {}) }, settings: { ...def.settings, ...(stateObj.settings || {}) } };

      // Stop the carousel NOW — left running, it would refill the caches with
      // pre-import images while the restore is still writing.
      clearCarousel();
      photoDataCache.clear();
      cutoutDataCache.clear();
      cutoutUpgradeTried.clear();
      luminanceCache.clear();
      bgImageDataUrl = null; bgImageEl = null;

      // Persist the imported state before the (long, network-bound) image
      // restore, so an interruption can't leave the old state on disk.
      saveStateLocal();

      // Offline, Firestore write promises never settle — restore images only
      // when the browser thinks it's online, and watchdog it regardless.
      const signedIn = !!(firestore && currentUser);
      const canRestoreImages = !!images && signedIn && navigator.onLine !== false;
      const written = { failed: 0 };
      let timedOut = false;

      if (canRestoreImages) {
        showToast('Restoring backup…');
        const ok = await settledWithin(writeImagesFromBackup(images, written), RESTORE_TIMEOUT_MS);
        // Deletions run only after every write is acknowledged, so a dropped
        // connection can never queue deletes for a restore that didn't land.
        if (ok) timedOut = !(await settledWithin(deleteDocsNotInBackup(images), RESTORE_TIMEOUT_MS));
        else timedOut = true;

        // Keep the metadata honest about what the file actually contained: a
        // photo day with no image in the backup has nothing to show, and a
        // missing cut-out should be regenerated by the backfill queue.
        for (const [day, meta] of Object.entries(state.photos || {})) {
          if (!images.photos[day]) { delete state.photos[day]; continue; }
          if (meta?.hasCutout && !images.cutouts[day]) {
            meta.hasCutout = false;
            meta.cutoutTransparent = false;
            delete meta.cutoutModel;
            delete meta.cutoutEdited;
          }
        }
        state.hasBgImage = !!images.background;
        if (images.background) bgImageDataUrl = images.background.data;
      }

      saveStateLocal();
      // Push the state doc directly: saveStateRemote's empty-state guard must
      // not strand a deliberately imported (possibly pre-journey) state.
      if (signedIn) {
        await settledWithin(
          firestore.collection('users').doc(currentUser.uid).set(state)
            .catch((e) => console.error('Import: state sync failed', e)),
          RESTORE_TIMEOUT_MS,
        );
      }
      render();

      const n = images ? Object.keys(images.photos).length : 0;
      if (timedOut) showToast('Backup restored, but syncing photos stalled — check your connection and import the file again.');
      else if (written.failed) showToast(`Backup restored, but ${written.failed} image${written.failed === 1 ? '' : 's'} couldn't be saved.`);
      else if (canRestoreImages && n) showToast(`Backup restored — ${n} photo${n === 1 ? '' : 's'}.`);
      else if (images && signedIn && !canRestoreImages) showToast('Data restored. You appear to be offline — import the file again once connected to restore photos.');
      else if (images && !signedIn && n) showToast('Data restored. Sign in and import again to restore photos.');
      else showToast('Backup restored.');
    } catch (e) {
      console.error('Import failed', e);
      saveStateLocal(); render();
      showToast('Backup restored, but some photos may be missing.');
    } finally {
      importInProgress = false;
    }
  }

  // Write every image doc the backup contains; failures land in out.failed.
  async function writeImagesFromBackup(images, out) {
    await mapLimit(Object.keys(images.photos), 6, async (day) => {
      try { await photoDocRef(day).set(images.photos[day]); }
      catch (e) { console.error('Import: photo restore failed for day', day, e); out.failed++; }
    });
    await mapLimit(Object.keys(images.cutouts), 6, async (day) => {
      try { await cutoutDocRef(day).set(images.cutouts[day]); }
      catch (e) { console.error('Import: cut-out restore failed for day', day, e); out.failed++; }
    });
    if (images.background) {
      try { await bgImageDocRef().set(images.background); }
      catch (e) { console.error('Import: background restore failed', e); out.failed++; }
    }
  }

  // Remove docs the backup doesn't have, so the account ends up matching the
  // file — a photo deleted after the backup was taken shouldn't survive a
  // restore. Runs strictly AFTER the writes are acknowledged (see applyImport).
  async function deleteDocsNotInBackup(images) {
    try {
      const userDoc = firestore.collection('users').doc(currentUser.uid);
      const [photosSnap, cutoutsSnap] = await Promise.all([
        userDoc.collection('photos').get(),
        userDoc.collection('photoCutouts').get(),
      ]);
      const stale = [
        ...photosSnap.docs.filter((d) => !images.photos[d.id]).map((d) => d.ref),
        ...cutoutsSnap.docs.filter((d) => !images.cutouts[d.id]).map((d) => d.ref),
      ];
      await mapLimit(stale, 8, (ref) => ref.delete().catch(() => {}));
      if (!images.background) await bgImageDocRef().delete().catch(() => {});
    } catch (e) { console.warn('Import: stale doc cleanup failed', e); }
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
      cutoutDataCache.clear();
      cutoutUpgradeTried.clear();
      bgImageDataUrl = null; bgImageEl = null;
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
      // A running import is authoritative — a snapshot arriving mid-restore
      // is pre-import data and would clobber the state the user just chose.
      if (importInProgress) return;
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
        if (tid) toggleTask(tid);
        break;
      }
      case 'select-day': {
        const idx = Number(t.dataset.dayIndex);
        if (Number.isInteger(idx)) selectDay(idx);
        break;
      }
      case 'view-today': selectDay(anchorDayIndex()); break;
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
      case 'pick-bg-image': el.bgImageInput?.click(); break;
      case 'remove-bg-image': removeBgImage(); break;
      case 'align-bg-image': openBgAlignView(); break;
      case 'close-bg-align': closeBgAlignView(); break;
      case 'save-bg-align': saveBgAlign(); break;
      case 'open-photo': openPhotoSheet(journeyDayForViewedDay()); break;
      case 'close-photo':
        if (editState) closeEditView();
        else if (alignState) closeAlignView();
        else if (!photoUploadInProgress) closePhotoSheet();
        break;
      case 'pick-photo': el.photoInput.click(); break;
      case 'remove-photo':
        if (photoSheetDay) removePhotoForDay(photoSheetDay);
        break;
      case 'photo-prev-day':
        if (photoSheetDay && photoSheetDay > 1 && !photoUploadInProgress && !editState) {
          photoSheetDay--;
          renderPhotoSheet();
        }
        break;
      case 'photo-next-day': {
        const todayDay = journeyDayForToday() || 1;
        if (photoSheetDay && photoSheetDay < todayDay && !photoUploadInProgress && !editState) {
          photoSheetDay++;
          renderPhotoSheet();
        }
        break;
      }
      case 'open-touchup': openEditView(); break;
      case 'touchup-finish': closeEditView(); break;
      case 'touchup-undo': editUndo(); break;
      case 'touchup-reset': editReset(); break;
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
      case 'toggle-photo-scope': togglePhotoScope(); break;
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

  // Cut-out touch-up: brush size + drawing on the edit canvas
  if (el.photoEditCanvas) {
    el.photoEditCanvas.style.touchAction = 'none';
    el.photoEditCanvas.addEventListener('pointerdown', editPointerDown);
    el.photoEditCanvas.addEventListener('pointermove', editPointerMove);
    el.photoEditCanvas.addEventListener('pointerup', editPointerUp);
    el.photoEditCanvas.addEventListener('pointercancel', editPointerUp);
  }
  // Re-parent the loupe to <body> so position:fixed escapes the sheet's
  // clipping/scroll (same as the alignment magnifier).
  if (el.photoEditMagnifier && el.photoEditMagnifier.parentElement !== document.body) {
    document.body.appendChild(el.photoEditMagnifier);
  }

  // Start date
  el.startDateInput.addEventListener('change', (e) => changeStartDate(e.target.value));

  if (el.matchExposureToggle) {
    el.matchExposureToggle.addEventListener('change', (e) => {
      state.matchExposure = e.target.checked;
      saveState();
      restartPhotoCarousel();
      showToast(state.matchExposure ? 'Brightness matching on' : 'Brightness matching off');
    });
  }

  if (el.crossfadeToggle) {
    el.crossfadeToggle.addEventListener('change', (e) => {
      state.crossfade = e.target.checked;
      saveState();
      restartPhotoCarousel();
      showToast(state.crossfade ? 'Crossfade on' : 'Crossfade off (instant cut)');
    });
  }

  if (el.removeBgToggle) {
    el.removeBgToggle.addEventListener('change', (e) => {
      state.removeBg = e.target.checked;
      renderBgImageSettings();
      saveState();
      // The display variant just changed for every day that has a cut-out, so
      // drop cached images/luminance and re-render — existing photos flip
      // between their cut-out and their original (removal is reversible).
      photoDataCache.clear();
      luminanceCache.clear();
      restartPhotoCarousel();
      if (state.removeBg) {
        // Backfill any photos that don't have a cut-out yet (first + last first).
        enqueueAllCutouts();
        showToast(bgQueue.length ? 'Removing backgrounds — first and last photo first' : 'Background removal on');
      } else {
        clearBgQueue();
        showToast('Original backgrounds restored');
      }
    });
  }

  // Background image: choose / replace / remove
  if (el.bgImageInput) {
    el.bgImageInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) uploadBgImage(file);
      e.target.value = '';
    });
  }

  // Align background tool: drag to pan, slider to zoom
  if (el.bgAlignStage) {
    el.bgAlignStage.addEventListener('pointerdown', bgAlignPointerDown);
    el.bgAlignStage.addEventListener('pointermove', bgAlignPointerMove);
    el.bgAlignStage.addEventListener('pointerup', bgAlignPointerUp);
    el.bgAlignStage.addEventListener('pointercancel', bgAlignPointerUp);
  }
  if (el.bgAlignZoom) {
    el.bgAlignZoom.addEventListener('input', (e) => {
      if (bgAlignState) { bgAlignState.scale = Number(e.target.value) || 1; applyBgAlignTransform(); }
    });
  }
  if (el.bgAlignRotate) {
    el.bgAlignRotate.addEventListener('input', (e) => {
      if (bgAlignState) { bgAlignState.rotate = Number(e.target.value) || 0; applyBgAlignTransform(); }
    });
  }

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
