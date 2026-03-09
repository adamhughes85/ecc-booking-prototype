/**
 * @typedef {Object} RuleConfig
 * @property {number} maxConcurrentBookings
 * @property {"days"|"current-month"} bookingHorizonMode
 * @property {number} bookingHorizonDays
 * @property {number} lessonDurationMinutes
 * @property {number} slotIntervalMinutes
 */

/**
 * @typedef {Object} Subscription
 * @property {string} startDateISO
 * @property {string} endDateISO
 * @property {number} creditsPerMonth
 */

/**
 * @typedef {Object} PromoCouponGrant
 * @property {string} id
 * @property {string} label
 * @property {number} quantity
 * @property {string} validFromISO
 * @property {string} validThroughISO
 */

/**
 * @typedef {Object} Coupon
 * @property {string} id
 * @property {"monthly"|"promo"} sourceType
 * @property {string} sourceId
 * @property {string} validFromISO
 * @property {string} validToExclusiveISO
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} dateISO
 * @property {string} startTime
 * @property {string} endTime
 * @property {string} topicId
 * @property {string} teacherId
 * @property {"booked"} status
 * @property {string|null} allocatedCouponId
 */

/**
 * @typedef {Object} TimeSlot
 * @property {string} startTime
 * @property {string} endTime
 * @property {boolean} isAvailable
 * @property {string} reason
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} reasons
 */

/**
 * @typedef {Object} CouponAllocationResult
 * @property {Map<string, string>} bookingToCoupon
 * @property {Set<string>} usedCouponIds
 * @property {string[]} invalidBookingIds
 */

const ROUTES = Object.freeze({
  DATE_TIME: "#/book/date-time",
  TOPIC: "#/book/topic",
  CONFIRM: "#/book/confirm",
  BOOKINGS: "#/bookings",
});

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const TIMEZONE_LABEL = "Asia/Shanghai (China Standard Time)";
const LEVEL_OPTIONS = ["1-Beginner *", "2-Elementary", "3-Intermediate"];
const START_TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "17:00", "18:00", "19:00", "20:00"];

/** @type {Subscription} */
const DEFAULT_SUBSCRIPTION = {
  startDateISO: "2026-01-01",
  endDateISO: "2026-07-01",
  creditsPerMonth: 4,
};

/** @type {RuleConfig} */
const DEFAULT_RULE_CONFIG = {
  maxConcurrentBookings: 2,
  bookingHorizonMode: "days",
  bookingHorizonDays: 14,
  lessonDurationMinutes: 40,
  slotIntervalMinutes: 60,
};

const DEFAULT_DEMO_TODAY = "2026-03-09";
const DEFAULT_DEMO_TIME = "09:00";

/** @type {PromoCouponGrant[]} */
const DEFAULT_PROMO_COUPON_GRANTS = [];

const TEACHERS = [
  { id: "teacher-1", name: "Cleo R." },
  { id: "teacher-2", name: "Blair I." },
  { id: "teacher-3", name: "Max K." },
];

const TOPICS = [
  {
    id: "topic-1",
    unit: "UNIT 1",
    title: "Introducing yourself",
    description: "Learn how to greet and introduce yourself appropriately in different contexts, both formally and informally.",
    isCurrent: true,
  },
  {
    id: "topic-2",
    unit: "UNIT 1",
    title: "Exchanging phone numbers",
    description: "Practice asking for and sharing phone numbers with clear pronunciation and confidence.",
    isCurrent: false,
  },
  {
    id: "topic-3",
    unit: "UNIT 2",
    title: "Giving personal information",
    description: "Use common sentence patterns to share personal details accurately in different situations.",
    isCurrent: false,
  },
  {
    id: "topic-4",
    unit: "UNIT 2",
    title: "Describing your office",
    description: "Describe office objects and routines using useful vocabulary and everyday expressions.",
    isCurrent: false,
  },
  {
    id: "topic-5",
    unit: "UNIT 3",
    title: "Saying where you live",
    description: "Talk about neighborhoods and directions while practicing complete answers.",
    isCurrent: false,
  },
];

/** @type {Booking[]} */
const SEED_BOOKINGS = [];

const appEl = document.getElementById("app");
const topConfigContainer = document.getElementById("top-config");
const topConfigToggleBtn = document.getElementById("top-config-toggle");
const topConfigPanel = document.getElementById("config-panel");
const topConfigCloseBtn = document.getElementById("top-config-close");

const longDateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
const rangeDateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
const shortMonthDayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

let state = createInitialState();

function createInitialState() {
  return {
    route: ROUTES.DATE_TIME,
    demoTodayISO: DEFAULT_DEMO_TODAY,
    demoNowTime: DEFAULT_DEMO_TIME,
    subscription: { ...DEFAULT_SUBSCRIPTION },
    ruleConfig: { ...DEFAULT_RULE_CONFIG },
    promoCouponGrants: DEFAULT_PROMO_COUPON_GRANTS.map((grant) => ({ ...grant })),
    topics: TOPICS.map((topic) => ({ ...topic })),
    teachers: TEACHERS.map((teacher) => ({ ...teacher })),
    bookings: SEED_BOOKINGS.map((booking) => ({ ...booking })),
    consumedCreditsThisMonth: 0,
    selectedDateISO: maxDateISO(DEFAULT_SUBSCRIPTION.startDateISO, DEFAULT_DEMO_TODAY),
    selectedStartTime: null,
    selectedTopicId: TOPICS[0].id,
    selectedTeacherId: TEACHERS[0].id,
    selectedLevel: LEVEL_OPTIONS[0],
    teacherSearch: "",
    ui: {
      configPanelOpen: false,
      showConfirmationModal: false,
      lastBookedId: null,
      toastMessage: "",
    },
  };
}

function init() {
  appEl.addEventListener("click", onAppClick);
  appEl.addEventListener("input", onAppInput);

  if (topConfigToggleBtn) {
    topConfigToggleBtn.addEventListener("click", onTopConfigToggleClick);
  }
  if (topConfigCloseBtn) {
    topConfigCloseBtn.addEventListener("click", onTopConfigCloseClick);
  }
  if (topConfigPanel) {
    topConfigPanel.addEventListener("input", onConfigPanelInput);
    topConfigPanel.addEventListener("click", onConfigPanelClick);
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onDocumentClick);

  const route = parseRoute(window.location.hash);
  if (route === ROUTES.DATE_TIME && window.location.hash !== ROUTES.DATE_TIME) {
    window.location.hash = ROUTES.DATE_TIME;
    return;
  }

  render();
}

function parseRoute(hash) {
  if (hash === ROUTES.TOPIC || hash === ROUTES.CONFIRM) {
    return ROUTES.TOPIC;
  }
  if (hash === ROUTES.BOOKINGS) {
    return ROUTES.BOOKINGS;
  }
  return ROUTES.DATE_TIME;
}

function navigate(route) {
  if (window.location.hash === route) {
    render();
    return;
  }
  window.location.hash = route;
}

function render() {
  state.route = parseRoute(window.location.hash);
  reconcileSelectionState();

  if (state.route === ROUTES.TOPIC && (!state.selectedDateISO || !state.selectedStartTime)) {
    navigate(ROUTES.DATE_TIME);
    return;
  }

  let viewHTML = "";
  if (state.route === ROUTES.DATE_TIME) {
    viewHTML = renderDateTimeView();
  } else if (state.route === ROUTES.TOPIC) {
    viewHTML = renderTopicView();
  } else {
    viewHTML = renderBookingsView();
  }

  const toastHTML = state.ui.toastMessage ? `<div class="status-banner">${state.ui.toastMessage}</div>` : "";
  const modalHTML = state.ui.showConfirmationModal ? renderConfirmationModal() : "";

  appEl.innerHTML = `${toastHTML}${viewHTML}${modalHTML}`;
  syncConfigPanelInputs();
  applyConfigPanelVisibility();
}

function renderDateTimeView() {
  const bookingWindow = getBookingWindow(state);
  const calendarDays = buildCalendarDays(state.demoTodayISO);
  const rangeLabel = formatCalendarRange(calendarDays);
  const selectedDateISO = state.selectedDateISO;
  const slots = selectedDateISO ? getTimeSlotsForDate(selectedDateISO, state) : [];
  const noBookableDates = !bookingWindow || !calendarDays.some((day) => canBookOnDate(day.iso, state));

  return `
    <section class="date-time-view">
      <h1 class="page-title">Private classes</h1>
      <h2 class="page-subtitle">Book a Private class</h2>
      <div class="booking-layout">
        <div>
          <h2 class="section-heading">Select a date</h2>
          <div class="card">
            <h3 class="calendar-range">${rangeLabel}</h3>
            <div class="weekday-row">
              ${WEEKDAYS.map((day) => `<div class="weekday">${day}</div>`).join("")}
            </div>
            <div class="calendar-grid">
              ${calendarDays
                .map((day) => {
                  const classes = ["calendar-day"];
                  if (!day.isInMonth) classes.push("is-outside");
                  if (day.iso === selectedDateISO) classes.push("is-selected");
                  if (day.iso === state.demoTodayISO) classes.push("is-today");
                  if (!canBookOnDate(day.iso, state)) classes.push("is-disabled");
                  const reason = getDateDisabledReason(day.iso, state);
                  const title = reason || `Book ${formatLongDate(day.iso)}`;
                  return `
                    <button
                      type="button"
                      class="${classes.join(" ")}"
                      data-action="select-date"
                      data-date-iso="${day.iso}"
                      title="${title}"
                      ${canBookOnDate(day.iso, state) ? "" : "disabled"}
                    >${day.dayOfMonth}</button>
                  `;
                })
                .join("")}
            </div>
            ${
              noBookableDates
                ? `<div class="status-banner">No dates are currently bookable. Adjust demo settings.</div>`
                : ""
            }
          </div>
          <section class="teacher-section">
            <h3 class="teacher-heading">&#9881; Teacher options</h3>
            <p class="teacher-copy">Filter availability by teacher</p>
            <label class="search-row">
              <input
                type="text"
                id="teacher-search"
                value="${escapeAttribute(state.teacherSearch)}"
                placeholder="Search by teacher name"
                autocomplete="off"
              />
              <span aria-hidden="true">&#128269;</span>
            </label>
          </section>
        </div>
        <div>
          <h2 class="section-heading">Select a time</h2>
          <p class="timezone-copy">All times are displayed in your time zone:<br /><strong>${TIMEZONE_LABEL}</strong></p>
          <div class="slot-grid">
            ${slots
              .map((slot) => {
                const validation = validateBookingCandidate(
                  {
                    dateISO: selectedDateISO,
                    startTime: slot.startTime,
                    topicId: state.selectedTopicId,
                    teacherId: state.selectedTeacherId,
                  },
                  state,
                  { requireTopic: false }
                );
                const disabled = !validation.valid;
                const selectedClass = slot.startTime === state.selectedStartTime ? "is-selected" : "";
                const label = `${slot.startTime} - ${slot.endTime}`;
                const tooltip = disabled ? validation.reasons[0] : `Book ${label}`;
                return `
                  <button
                    type="button"
                    class="slot-button ${selectedClass}"
                    data-action="select-slot"
                    data-start-time="${slot.startTime}"
                    title="${tooltip}"
                    ${disabled ? "disabled" : ""}
                  ><span class="slot-start">${slot.startTime}</span> - <span class="slot-end">${slot.endTime}</span></button>
                `;
              })
              .join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderTopicView() {
  const selectedTopic = getSelectedTopic();
  const selectedTeacher = getSelectedTeacher();
  const candidate = {
    dateISO: state.selectedDateISO,
    startTime: state.selectedStartTime,
    topicId: selectedTopic ? selectedTopic.id : null,
    teacherId: selectedTeacher ? selectedTeacher.id : null,
  };
  const validation = validateBookingCandidate(candidate, state);
  const availableCredits = state.selectedDateISO ? getSelectedDateRemainingCredits(state.selectedDateISO, state) : 0;

  return `
    <section>
      <div class="booking-layout">
        <div>
          <button type="button" class="back-link" data-action="back-to-date-time" aria-label="Back to date and time">&#8592;</button>
        </div>
        <div><h1 class="page-title">Private classes</h1></div>
      </div>
      <div class="topic-layout">
        <div class="topic-column">
          <h2 class="section-heading">Select a topic</h2>
          <p class="section-subcopy">Topics are related to your current study content.</p>
          <select class="select-level" id="level-select">
            ${LEVEL_OPTIONS.map((option) => `<option ${option === state.selectedLevel ? "selected" : ""}>${option}</option>`).join("")}
          </select>
          <div class="topic-list">
            ${state.topics
              .map((topic, index) => {
                const classes = ["topic-card"];
                if (topic.id === state.selectedTopicId) classes.push("is-selected");
                return `
                  <button
                    type="button"
                    class="${classes.join(" ")}"
                    data-action="topic-select"
                    data-topic-id="${topic.id}"
                  >
                    <div class="topic-thumb topic-thumb-${(index % 5) + 1}" aria-hidden="true"></div>
                    <div class="topic-meta">
                      <div class="topic-unit">${topic.unit}</div>
                      <div class="topic-title">${topic.title}</div>
                    </div>
                    ${topic.isCurrent ? '<span class="topic-pill">Current</span>' : '<span class="topic-pill topic-pill-placeholder" aria-hidden="true"></span>'}
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
        <aside>
          <h2 class="confirm-title">Confirm class booking</h2>
          <div class="confirm-card">
            <h3 class="confirm-topic">${selectedTopic ? selectedTopic.title : "Choose a topic"}</h3>
            <p class="confirm-description">${selectedTopic ? selectedTopic.description : ""}</p>
            <div class="summary-row">
              <div class="summary-info">&#128197; ${formatLongDate(state.selectedDateISO)} &nbsp; &#128339; ${state.selectedStartTime} - ${addMinutesToTime(
                state.selectedStartTime,
                state.ruleConfig.lessonDurationMinutes
              )}</div>
              <button type="button" class="summary-action" data-action="change-time">Change</button>
            </div>
            <div class="summary-row">
              <div class="summary-info">&#128100; ${selectedTeacher ? selectedTeacher.name : "Unassigned"}</div>
              <button type="button" class="summary-action" data-action="change-teacher">Change teacher</button>
            </div>
            <button
              type="button"
              class="book-button"
              data-action="book-class"
              ${validation.valid ? "" : "disabled"}
            >Book this class</button>
            <p class="remaining-copy">Credits available for this date: <strong>${availableCredits}</strong></p>
            ${!validation.valid ? `<div class="status-banner">${validation.reasons[0]}</div>` : ""}
          </div>
          <div class="note-card">
            Note: You can cancel a private class up to 8 hours before its starting time to keep your class coupon.
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderBookingsView() {
  const sortedBookings = getActiveBookings(state.bookings, state.demoTodayISO, state.demoNowTime).sort((a, b) =>
    `${a.dateISO}-${a.startTime}`.localeCompare(`${b.dateISO}-${b.startTime}`)
  );
  const bookingCount = sortedBookings.length;
  const bookingLabel = bookingCount === 1 ? "current booking" : "current bookings";
  const canBookMore = hasAvailableConcurrentBookingCapacity(
    state.bookings,
    state.ruleConfig.maxConcurrentBookings,
    state.demoTodayISO,
    state.demoNowTime
  );

  return `
    <section>
      <h1 class="bookings-title">My class bookings</h1>
      <p class="bookings-timezone">All times are displayed in your time zone: <strong>${TIMEZONE_LABEL}</strong></p>
      <p class="bookings-count">You have <strong>${bookingCount}</strong> ${bookingLabel}.</p>
      ${canBookMore ? "" : `<p class="bookings-limit">You have reached the maximum number of current bookings.</p>`}
      <div class="bookings-grid">
        ${sortedBookings.map((booking) => renderBookingCard(booking)).join("")}
        ${
          canBookMore
            ? `<button type="button" class="add-card" data-action="start-booking">
          <span class="add-icon">+</span>
          Book a class
        </button>`
            : ""
        }
      </div>
    </section>
  `;
}

function renderBookingCard(booking) {
  const topic = findTopic(booking.topicId);
  const teacher = findTeacher(booking.teacherId);
  return `
    <article class="booking-card">
      <div class="booking-image"></div>
      <div class="booking-body">
        <h3 class="booking-topic">${topic ? topic.title : "Topic"}</h3>
        <div class="booking-row">
          <div class="booking-inline">&#128197; ${formatLongDate(booking.dateISO)}</div>
          <div class="booking-inline">&#128339; ${booking.startTime} - ${booking.endTime}</div>
        </div>
        <div class="booking-row">
          <div class="booking-inline">&#128100; ${teacher ? teacher.name : "Teacher"}</div>
          <button type="button" class="cancel-link" data-action="cancel-booking">Cancel</button>
        </div>
        <p class="booking-line">This classroom is not yet available.</p>
        <button type="button" class="disabled-button" disabled>Enter classroom</button>
        <button type="button" class="sub-link" data-action="add-calendar">Add to calendar</button>
      </div>
    </article>
  `;
}

function renderConfirmationModal() {
  const booking = state.bookings.find((item) => item.id === state.ui.lastBookedId);
  if (!booking) {
    return "";
  }

  const topic = findTopic(booking.topicId);
  const teacher = findTeacher(booking.teacherId);

  return `
    <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Booking confirmed">
      <div class="modal-card">
        <h2 class="modal-heading">Your private class booking is confirmed.</h2>
        <div class="modal-image"></div>
        <div class="modal-body">
          <p class="modal-meta">${topic ? topic.unit : "UNIT"} </p>
          <h3 class="modal-topic">${topic ? topic.title : "Class booked"}</h3>
          <p class="modal-meta">&#128197; ${formatLongDate(booking.dateISO)}</p>
          <p class="modal-meta">&#128100; ${teacher ? teacher.name : "Teacher"} &nbsp; &#128339; ${booking.startTime} - ${booking.endTime}</p>
          <div class="modal-actions">
            <button type="button" class="book-button" data-action="modal-continue">Continue</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function onAppClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  if (action === "select-date") {
    state.selectedDateISO = target.dataset.dateIso || state.selectedDateISO;
    state.selectedStartTime = null;
    state.ui.toastMessage = "";
    render();
    return;
  }

  if (action === "select-slot") {
    const startTime = target.dataset.startTime;
    const result = validateBookingCandidate(
      {
        dateISO: state.selectedDateISO,
        startTime,
        topicId: state.selectedTopicId,
        teacherId: state.selectedTeacherId,
      },
      state,
      { requireTopic: false }
    );

    if (!result.valid) {
      state.ui.toastMessage = result.reasons[0];
      render();
      return;
    }

    state.selectedStartTime = startTime;
    state.ui.toastMessage = "";
    navigate(ROUTES.TOPIC);
    return;
  }

  if (action === "topic-select") {
    state.selectedTopicId = target.dataset.topicId || state.selectedTopicId;
    state.ui.toastMessage = "";
    render();
    return;
  }

  if (action === "back-to-date-time" || action === "change-time") {
    state.ui.toastMessage = "";
    navigate(ROUTES.DATE_TIME);
    return;
  }

  if (action === "change-teacher") {
    state.ui.toastMessage = "Teacher switching is a visual stub in this prototype.";
    render();
    return;
  }

  if (action === "book-class") {
    completeBooking();
    return;
  }

  if (action === "modal-continue") {
    state.ui.showConfirmationModal = false;
    state.ui.toastMessage = "";
    navigate(ROUTES.BOOKINGS);
    return;
  }

  if (action === "start-booking") {
    state.selectedStartTime = null;
    state.ui.toastMessage = "";
    state.ui.showConfirmationModal = false;
    navigate(ROUTES.DATE_TIME);
    return;
  }

  if (action === "cancel-booking") {
    state.ui.toastMessage = "Cancel action is shown for demonstration only.";
    render();
    return;
  }

  if (action === "add-calendar") {
    state.ui.toastMessage = "Add to calendar is a non-persistent demo stub.";
    render();
  }
}

function onAppInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  if (target.id === "teacher-search") {
    state.teacherSearch = target.value;
    return;
  }

  if (target.id === "level-select") {
    state.selectedLevel = target.value;
  }
}

function onTopConfigToggleClick(event) {
  event.preventDefault();
  event.stopPropagation();
  state.ui.configPanelOpen = !state.ui.configPanelOpen;
  applyConfigPanelVisibility();
}

function onTopConfigCloseClick(event) {
  event.preventDefault();
  event.stopPropagation();
  state.ui.configPanelOpen = false;
  applyConfigPanelVisibility();
}

function onConfigPanelClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  if (action === "add-promo-grant") {
    event.preventDefault();
    if (areCouponSettingsLocked(state)) {
      return;
    }
    addPromoGrant();
    render();
    return;
  }

  if (action === "remove-promo-grant") {
    event.preventDefault();
    if (areCouponSettingsLocked(state)) {
      return;
    }
    removePromoGrant(target.dataset.promoId || "");
    render();
    return;
  }

  if (action === "clear-bookings") {
    event.preventDefault();
    clearCurrentBookings();
  }
}

function onConfigPanelInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) {
    return;
  }

  const couponSettingsLocked = areCouponSettingsLocked(state);

  if (target.id === "debug-demo-today") {
    if (isValidISODate(target.value)) {
      state.demoTodayISO = target.value;
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (target.id === "debug-demo-time") {
    if (isValidTime(target.value)) {
      state.demoNowTime = target.value;
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (target.id === "debug-max-concurrent") {
    const value = Number.parseInt(target.value, 10);
    if (Number.isFinite(value) && value >= 1) {
      state.ruleConfig.maxConcurrentBookings = Math.min(12, value);
      state.ui.toastMessage = "";
      render();
    }
    return;
  }

  if (target.id === "debug-horizon-mode") {
    if (target.value === "days" || target.value === "current-month") {
      state.ruleConfig.bookingHorizonMode = target.value;
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (target.id === "debug-horizon-days") {
    const value = Number.parseInt(target.value, 10);
    if (Number.isFinite(value) && value >= 1) {
      state.ruleConfig.bookingHorizonDays = Math.min(31, value);
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (couponSettingsLocked) {
    return;
  }

  if (target.id === "debug-subscription-start") {
    if (isValidISODate(target.value)) {
      state.subscription.startDateISO = target.value;
      if (compareDateISO(state.subscription.endDateISO, state.subscription.startDateISO) < 0) {
        state.subscription.endDateISO = state.subscription.startDateISO;
      }
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (target.id === "debug-subscription-end") {
    if (isValidISODate(target.value)) {
      state.subscription.endDateISO = maxDateISO(target.value, state.subscription.startDateISO);
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (target.id === "debug-credits-per-month") {
    const value = Number.parseInt(target.value, 10);
    if (Number.isFinite(value) && value >= 1) {
      state.subscription.creditsPerMonth = Math.min(12, value);
      state.consumedCreditsThisMonth = Math.min(state.consumedCreditsThisMonth, state.subscription.creditsPerMonth);
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  if (target.id === "debug-consumed-this-month") {
    const value = Number.parseInt(target.value, 10);
    if (Number.isFinite(value) && value >= 0) {
      state.consumedCreditsThisMonth = Math.min(12, Math.min(value, state.subscription.creditsPerMonth));
      state.ui.toastMessage = "";
      reconcileSelectionState();
      render();
    }
    return;
  }

  const promoId = target.dataset.promoId;
  const promoField = target.dataset.promoField;
  if (!promoId || !promoField) {
    return;
  }

  const grant = state.promoCouponGrants.find((item) => item.id === promoId);
  if (!grant) {
    return;
  }

  if (promoField === "label") {
    grant.label = target.value;
  }
  if (promoField === "quantity") {
    const quantity = Number.parseInt(target.value, 10);
    if (Number.isFinite(quantity) && quantity >= 1) {
      grant.quantity = Math.min(20, quantity);
    }
  }
  if (promoField === "validFrom" && isValidISODate(target.value)) {
    grant.validFromISO = target.value;
    if (compareDateISO(grant.validThroughISO, grant.validFromISO) < 0) {
      grant.validThroughISO = grant.validFromISO;
    }
  }
  if (promoField === "validThrough" && isValidISODate(target.value)) {
    grant.validThroughISO = maxDateISO(target.value, grant.validFromISO);
  }

  state.ui.toastMessage = "";
  reconcileSelectionState();
  render();
}

function onDocumentClick(event) {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) {
    return;
  }

  if (target.closest('[data-action="top-nav-classes"]')) {
    event.preventDefault();
    restartBookingFlow();
    return;
  }

  if (state.ui.configPanelOpen && topConfigContainer && !topConfigContainer.contains(target)) {
    state.ui.configPanelOpen = false;
    applyConfigPanelVisibility();
  }
}

function onKeyDown(event) {
  if (event.key === "Escape" && state.ui.configPanelOpen) {
    state.ui.configPanelOpen = false;
    applyConfigPanelVisibility();
  }
}

function applyConfigPanelVisibility() {
  if (!topConfigPanel || !topConfigToggleBtn) {
    return;
  }

  topConfigPanel.hidden = !state.ui.configPanelOpen;
  topConfigPanel.style.display = state.ui.configPanelOpen ? "grid" : "none";
  topConfigToggleBtn.setAttribute("aria-expanded", state.ui.configPanelOpen ? "true" : "false");
}

function syncConfigPanelInputs() {
  const demoTodayInput = document.getElementById("debug-demo-today");
  const demoTimeInput = document.getElementById("debug-demo-time");
  const maxConcurrentInput = document.getElementById("debug-max-concurrent");
  const horizonModeInput = document.getElementById("debug-horizon-mode");
  const horizonDaysInput = document.getElementById("debug-horizon-days");
  const subscriptionStartInput = document.getElementById("debug-subscription-start");
  const subscriptionEndInput = document.getElementById("debug-subscription-end");
  const creditsPerMonthInput = document.getElementById("debug-credits-per-month");
  const consumedThisMonthInput = document.getElementById("debug-consumed-this-month");
  const promoList = document.getElementById("promo-grants-list");
  const promoEmpty = document.getElementById("promo-grants-empty");
  const couponSettingsNote = document.getElementById("coupon-settings-note");
  const addPromoButton = document.getElementById("add-promo-grant");
  const clearBookingsButton = document.getElementById("clear-bookings");

  if (!demoTodayInput || !demoTimeInput || !maxConcurrentInput || !horizonModeInput || !horizonDaysInput || !subscriptionStartInput || !subscriptionEndInput || !creditsPerMonthInput || !consumedThisMonthInput || !promoList || !promoEmpty || !couponSettingsNote || !addPromoButton || !clearBookingsButton) {
    return;
  }

  const couponSettingsLocked = areCouponSettingsLocked(state);

  demoTodayInput.value = state.demoTodayISO;
  demoTimeInput.value = state.demoNowTime;
  maxConcurrentInput.value = String(state.ruleConfig.maxConcurrentBookings);
  horizonModeInput.value = state.ruleConfig.bookingHorizonMode;
  horizonDaysInput.value = String(state.ruleConfig.bookingHorizonDays);
  horizonDaysInput.disabled = state.ruleConfig.bookingHorizonMode === "current-month";

  subscriptionStartInput.value = state.subscription.startDateISO;
  subscriptionEndInput.value = state.subscription.endDateISO;
  creditsPerMonthInput.value = String(state.subscription.creditsPerMonth);
  consumedThisMonthInput.value = String(state.consumedCreditsThisMonth);

  subscriptionStartInput.disabled = couponSettingsLocked;
  subscriptionEndInput.disabled = couponSettingsLocked;
  creditsPerMonthInput.disabled = couponSettingsLocked;
  consumedThisMonthInput.disabled = couponSettingsLocked;
  addPromoButton.disabled = couponSettingsLocked;
  clearBookingsButton.disabled = state.bookings.length === 0;
  couponSettingsNote.hidden = !couponSettingsLocked;
  promoEmpty.hidden = state.promoCouponGrants.length > 0;

  promoList.innerHTML = state.promoCouponGrants
    .map((grant) => renderPromoGrantRow(grant, couponSettingsLocked))
    .join("");
}

function renderPromoGrantRow(grant, disabled) {
  return `
    <div class="promo-grant-row">
      <label class="config-field">
        <span>Label</span>
        <input type="text" value="${escapeAttribute(grant.label)}" data-promo-id="${grant.id}" data-promo-field="label" ${disabled ? "disabled" : ""} />
      </label>
      <label class="config-field promo-quantity-field">
        <span>Quantity</span>
        <input type="number" min="1" max="20" step="1" value="${grant.quantity}" data-promo-id="${grant.id}" data-promo-field="quantity" ${disabled ? "disabled" : ""} />
      </label>
      <label class="config-field">
        <span>Valid from</span>
        <input type="date" value="${grant.validFromISO}" data-promo-id="${grant.id}" data-promo-field="validFrom" ${disabled ? "disabled" : ""} />
      </label>
      <label class="config-field">
        <span>Valid through</span>
        <input type="date" value="${grant.validThroughISO}" data-promo-id="${grant.id}" data-promo-field="validThrough" ${disabled ? "disabled" : ""} />
      </label>
      <button type="button" class="config-secondary-button promo-remove-button" data-action="remove-promo-grant" data-promo-id="${grant.id}" ${disabled ? "disabled" : ""}>Remove</button>
    </div>
  `;
}

function addPromoGrant() {
  const nextIndex = state.promoCouponGrants.length + 1;
  state.promoCouponGrants = [
    ...state.promoCouponGrants,
    {
      id: `promo-${Date.now()}-${nextIndex}`,
      label: `Promo coupon ${nextIndex}`,
      quantity: 1,
      validFromISO: state.demoTodayISO,
      validThroughISO: addDaysISO(state.demoTodayISO, 364),
    },
  ];
}

function removePromoGrant(promoId) {
  state.promoCouponGrants = state.promoCouponGrants.filter((grant) => grant.id !== promoId);
}

function clearCurrentBookings() {
  state.bookings = [];
  state.ui.lastBookedId = null;
  state.ui.showConfirmationModal = false;
  state.ui.toastMessage = "";
  reconcileSelectionState();
  render();
}

function areCouponSettingsLocked(currentState) {
  return currentState.bookings.some((booking) => booking.status === "booked");
}

function completeBooking() {
  const candidate = {
    dateISO: state.selectedDateISO,
    startTime: state.selectedStartTime,
    topicId: state.selectedTopicId,
    teacherId: state.selectedTeacherId,
  };

  const validation = validateBookingCandidate(candidate, state);
  if (!validation.valid) {
    state.ui.toastMessage = validation.reasons[0];
    render();
    return;
  }

  const availableCoupons = getAvailableCouponsForDate(candidate.dateISO, state);
  const allocatedCoupon = availableCoupons[0] || null;
  if (!allocatedCoupon) {
    state.ui.toastMessage = getNoCouponMessage(candidate.dateISO);
    render();
    return;
  }

  const booking = {
    id: `booking-${state.bookings.length + 1}`,
    dateISO: candidate.dateISO,
    startTime: candidate.startTime,
    endTime: addMinutesToTime(candidate.startTime, state.ruleConfig.lessonDurationMinutes),
    topicId: candidate.topicId,
    teacherId: candidate.teacherId,
    status: "booked",
    allocatedCouponId: allocatedCoupon.id,
  };

  state.bookings = [...state.bookings, booking];
  state.ui.lastBookedId = booking.id;
  state.ui.showConfirmationModal = true;
  state.ui.toastMessage = "";
  render();
}

function restartBookingFlow() {
  state.selectedDateISO = getInitialSelectedDate(state);
  state.selectedStartTime = null;
  state.selectedTopicId = TOPICS[0].id;
  state.selectedTeacherId = TEACHERS[0].id;
  state.selectedLevel = LEVEL_OPTIONS[0];
  state.ui.showConfirmationModal = false;
  state.ui.toastMessage = "";
  navigate(ROUTES.DATE_TIME);
}

function reconcileSelectionState() {
  const bookingWindow = getBookingWindow(state);
  if (!bookingWindow) {
    state.selectedDateISO = null;
    state.selectedStartTime = null;
    return;
  }

  if (!state.selectedDateISO || compareDateISO(state.selectedDateISO, bookingWindow.startDateISO) < 0) {
    state.selectedDateISO = bookingWindow.startDateISO;
    state.selectedStartTime = null;
  }

  if (compareDateISO(state.selectedDateISO, bookingWindow.endDateISO) > 0) {
    state.selectedDateISO = bookingWindow.endDateISO;
    state.selectedStartTime = null;
  }

  if (state.selectedDateISO && !canBookOnDate(state.selectedDateISO, state)) {
    const fallbackDate = findFirstBookableDate(state);
    state.selectedDateISO = fallbackDate;
    state.selectedStartTime = null;
  }

  if (state.selectedStartTime && state.selectedDateISO) {
    const slot = getTimeSlot(state.selectedDateISO, state.selectedStartTime, state);
    if (!slot || !slot.isAvailable) {
      state.selectedStartTime = null;
    }
  }
}

function getInitialSelectedDate(currentState) {
  const bookingWindow = getBookingWindow(currentState);
  if (!bookingWindow) {
    return null;
  }
  return bookingWindow.startDateISO;
}

function findFirstBookableDate(currentState) {
  const bookingWindow = getBookingWindow(currentState);
  if (!bookingWindow) {
    return null;
  }

  let pointer = bookingWindow.startDateISO;
  while (compareDateISO(pointer, bookingWindow.endDateISO) <= 0) {
    if (canBookOnDate(pointer, currentState)) {
      return pointer;
    }
    pointer = addDaysISO(pointer, 1);
  }
  return bookingWindow.startDateISO;
}

function getBookingWindow(currentState) {
  const earliest = maxDateISO(currentState.subscription.startDateISO, currentState.demoTodayISO);
  const horizonEnd = getBookingHorizonEndDate(currentState);
  const latest = minDateISO(currentState.subscription.endDateISO, horizonEnd);
  if (compareDateISO(earliest, latest) > 0) {
    return null;
  }
  return { startDateISO: earliest, endDateISO: latest };
}

function getBookingHorizonEndDate(currentState) {
  if (currentState.ruleConfig.bookingHorizonMode === "current-month") {
    return endOfMonthISO(currentState.demoTodayISO);
  }
  const clampedDays = Math.min(31, Math.max(1, currentState.ruleConfig.bookingHorizonDays));
  return addDaysISO(currentState.demoTodayISO, clampedDays);
}

function getDemoNowDate(currentState) {
  return combineISODateAndTime(currentState.demoTodayISO, currentState.demoNowTime);
}

function getBookingHorizonEndDateTime(currentState) {
  if (currentState.ruleConfig.bookingHorizonMode === "current-month") {
    return endOfDayDate(endOfMonthISO(currentState.demoTodayISO));
  }
  const demoNow = getDemoNowDate(currentState);
  return new Date(demoNow.getTime() + Math.min(31, Math.max(1, currentState.ruleConfig.bookingHorizonDays)) * 24 * 60 * 60 * 1000);
}

function getBookingHorizonMessage(ruleConfig) {
  if (ruleConfig.bookingHorizonMode === "current-month") {
    return "You can only book within the current month.";
  }
  const clampedDays = Math.min(31, Math.max(1, ruleConfig.bookingHorizonDays));
  return `You can only book within ${clampedDays} days (${clampedDays * 24} hours) from now.`;
}

function isWithinSubscriptionWindow(dateISO, subscription) {
  return compareDateISO(dateISO, subscription.startDateISO) >= 0 && compareDateISO(dateISO, subscription.endDateISO) <= 0;
}

function isWithinBookingHorizon(dateISO, currentState) {
  const endDateISO = getBookingHorizonEndDate(currentState);
  return compareDateISO(dateISO, currentState.demoTodayISO) >= 0 && compareDateISO(dateISO, endDateISO) <= 0;
}

function isSlotWithinBookingHorizon(dateISO, startTime, currentState) {
  const slotStart = combineISODateAndTime(dateISO, startTime);
  const demoNow = getDemoNowDate(currentState);
  const horizonEnd = getBookingHorizonEndDateTime(currentState);
  return slotStart.getTime() >= demoNow.getTime() && slotStart.getTime() <= horizonEnd.getTime();
}

function hasPotentialFutureSlotOnDate(dateISO, currentState) {
  return START_TIMES.some((startTime) => isSlotWithinBookingHorizon(dateISO, startTime, currentState));
}

function getDateDisabledReason(dateISO, currentState) {
  if (!isWithinSubscriptionWindow(dateISO, currentState.subscription)) {
    return "This date is outside your subscription period.";
  }
  if (!isWithinBookingHorizon(dateISO, currentState)) {
    return getBookingHorizonMessage(currentState.ruleConfig);
  }
  if (!hasPotentialFutureSlotOnDate(dateISO, currentState)) {
    return "No times remain available on this date.";
  }
  if (!hasCouponAvailableForDate(dateISO, currentState)) {
    return getNoCouponMessage(dateISO);
  }
  return "";
}

function canBookOnDate(dateISO, currentState) {
  return !getDateDisabledReason(dateISO, currentState);
}

function validateBookingCandidate(candidate, currentState, options = {}) {
  const requireTime = options.requireTime !== false;
  const requireTopic = options.requireTopic !== false;
  const reasons = [];

  if (!candidate.dateISO) {
    reasons.push("Choose a date first.");
  }

  if (candidate.dateISO && !isWithinSubscriptionWindow(candidate.dateISO, currentState.subscription)) {
    reasons.push("This date is outside your subscription period.");
  }

  if (candidate.dateISO && !isWithinBookingHorizon(candidate.dateISO, currentState)) {
    reasons.push(getBookingHorizonMessage(currentState.ruleConfig));
  }

  if (candidate.dateISO && !hasCouponAvailableForDate(candidate.dateISO, currentState)) {
    reasons.push(getNoCouponMessage(candidate.dateISO));
  }

  if (!hasAvailableConcurrentBookingCapacity(currentState.bookings, currentState.ruleConfig.maxConcurrentBookings, currentState.demoTodayISO, currentState.demoNowTime)) {
    reasons.push(`Maximum of ${currentState.ruleConfig.maxConcurrentBookings} active bookings reached.`);
  }

  if (requireTime && !candidate.startTime) {
    reasons.push("Choose a time slot.");
  }

  if (candidate.dateISO && candidate.startTime) {
    const slot = getTimeSlot(candidate.dateISO, candidate.startTime, currentState);
    if (!slot || !slot.isAvailable) {
      reasons.push(slot ? slot.reason : "This slot is unavailable.");
    }
    if (hasBookingAtDateTime(currentState.bookings, candidate.dateISO, candidate.startTime)) {
      reasons.push("You already have a booking at this time.");
    }
  }

  if (requireTopic && !candidate.topicId) {
    reasons.push("Choose a topic.");
  }

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}

function getTimeSlotsForDate(dateISO, currentState) {
  return START_TIMES.map((startTime) => {
    const endTime = addMinutesToTime(startTime, currentState.ruleConfig.lessonDurationMinutes);
    const withinSubscription = isWithinSubscriptionWindow(dateISO, currentState.subscription);
    const withinHorizon = isSlotWithinBookingHorizon(dateISO, startTime, currentState);
    const hasCoupon = hasCouponAvailableForDate(dateISO, currentState);
    const hasConflict = hasBookingAtDateTime(currentState.bookings, dateISO, startTime);
    const availablePattern = deterministicSlotOpen(dateISO, startTime);

    if (!withinSubscription) {
      return { startTime, endTime, isAvailable: false, reason: "Outside subscription window." };
    }
    if (!withinHorizon) {
      return { startTime, endTime, isAvailable: false, reason: getBookingHorizonMessage(currentState.ruleConfig) };
    }
    if (!hasCoupon) {
      return { startTime, endTime, isAvailable: false, reason: getNoCouponMessage(dateISO) };
    }
    if (hasConflict) {
      return { startTime, endTime, isAvailable: false, reason: "Already booked for this time." };
    }
    if (!availablePattern) {
      return { startTime, endTime, isAvailable: false, reason: "No teacher availability for this slot." };
    }
    return { startTime, endTime, isAvailable: true, reason: "" };
  });
}

function getTimeSlot(dateISO, startTime, currentState) {
  return getTimeSlotsForDate(dateISO, currentState).find((slot) => slot.startTime === startTime) || null;
}

function deterministicSlotOpen(dateISO, startTime) {
  return Boolean(dateISO && startTime);
}

function hasAvailableConcurrentBookingCapacity(bookings, maxConcurrentBookings, demoTodayISO, demoNowTime = "00:00") {
  const activeBookings = getActiveBookings(bookings, demoTodayISO, demoNowTime);
  return activeBookings.length < maxConcurrentBookings;
}

function getActiveBookings(bookings, demoTodayISO, demoNowTime = "00:00") {
  const demoNow = combineISODateAndTime(demoTodayISO, demoNowTime);
  return bookings.filter((booking) => booking.status === "booked" && combineISODateAndTime(booking.dateISO, booking.startTime).getTime() >= demoNow.getTime());
}

function hasBookingAtDateTime(bookings, dateISO, startTime) {
  return bookings.some((booking) => booking.status === "booked" && booking.dateISO === dateISO && booking.startTime === startTime);
}

function getSelectedDateRemainingCredits(dateISO, currentState) {
  return getAvailableCouponsForDate(dateISO, currentState).length;
}

function hasCouponAvailableForDate(dateISO, currentState) {
  return getAvailableCouponsForDate(dateISO, currentState).length > 0;
}

function getAvailableCouponsForDate(dateISO, currentState) {
  const coupons = generateCoupons(currentState.subscription, currentState.promoCouponGrants);
  const simulatedConsumedCouponIds = getSimulatedConsumedCouponIds(currentState, coupons);
  const allocation = allocateCouponsToBookings(currentState.bookings, coupons, simulatedConsumedCouponIds);
  return coupons
    .filter((coupon) => !allocation.usedCouponIds.has(coupon.id) && isCouponValidForDate(coupon, dateISO))
    .sort(compareCouponsByAllocationPriority);
}

function generateCoupons(subscription, promoCouponGrants) {
  const coupons = [];
  const periods = generateMonthlyCouponPeriods(subscription);

  periods.forEach((period, periodIndex) => {
    for (let index = 0; index < subscription.creditsPerMonth; index += 1) {
      coupons.push({
        id: `monthly-${periodIndex + 1}-${index + 1}`,
        sourceType: "monthly",
        sourceId: `period-${periodIndex + 1}`,
        validFromISO: period.validFromISO,
        validToExclusiveISO: period.validToExclusiveISO,
      });
    }
  });

  promoCouponGrants.forEach((grant) => {
    const quantity = Math.max(1, Math.min(20, grant.quantity || 1));
    if (!isValidISODate(grant.validFromISO) || !isValidISODate(grant.validThroughISO)) {
      return;
    }
    const validFromISO = grant.validFromISO;
    const validThroughISO = maxDateISO(grant.validThroughISO, validFromISO);
    for (let index = 0; index < quantity; index += 1) {
      coupons.push({
        id: `${grant.id}-${index + 1}`,
        sourceType: "promo",
        sourceId: grant.id,
        validFromISO,
        validToExclusiveISO: addDaysISO(validThroughISO, 1),
      });
    }
  });

  return coupons.sort(compareCouponsByAllocationPriority);
}

function generateMonthlyCouponPeriods(subscription) {
  const periods = [];
  const subscriptionEndExclusiveISO = addDaysISO(subscription.endDateISO, 1);
  let currentStartISO = subscription.startDateISO;
  let monthOffset = 0;

  while (compareDateISO(currentStartISO, subscriptionEndExclusiveISO) < 0 && monthOffset < 240) {
    const nextStartISO = addAnchoredMonthsISO(subscription.startDateISO, monthOffset + 1);
    periods.push({
      validFromISO: currentStartISO,
      validToExclusiveISO: minDateISO(nextStartISO, subscriptionEndExclusiveISO),
    });
    currentStartISO = nextStartISO;
    monthOffset += 1;
  }

  return periods;
}

function allocateCouponsToBookings(bookings, coupons, initialUsedCouponIds = new Set()) {
  /** @type {Map<string, string>} */
  const bookingToCoupon = new Map();
  /** @type {Set<string>} */
  const usedCouponIds = new Set(initialUsedCouponIds);
  /** @type {string[]} */
  const invalidBookingIds = [];

  const sortedBookings = bookings
    .filter((booking) => booking.status === "booked")
    .slice()
    .sort((left, right) => compareBookingOrder(left, right));

  sortedBookings.forEach((booking) => {
    if (booking.allocatedCouponId) {
      const allocatedCoupon = coupons.find((coupon) => coupon.id === booking.allocatedCouponId);
      if (allocatedCoupon && !usedCouponIds.has(allocatedCoupon.id) && isCouponValidForDate(allocatedCoupon, booking.dateISO)) {
        bookingToCoupon.set(booking.id, allocatedCoupon.id);
        usedCouponIds.add(allocatedCoupon.id);
        return;
      }
    }

    const nextCoupon = coupons.find((coupon) => !usedCouponIds.has(coupon.id) && isCouponValidForDate(coupon, booking.dateISO));
    if (!nextCoupon) {
      invalidBookingIds.push(booking.id);
      return;
    }

    bookingToCoupon.set(booking.id, nextCoupon.id);
    usedCouponIds.add(nextCoupon.id);
  });

  return { bookingToCoupon, usedCouponIds, invalidBookingIds };
}

function getSimulatedConsumedCouponIds(currentState, coupons) {
  const consumedCount = Math.max(
    0,
    Math.min(currentState.consumedCreditsThisMonth || 0, currentState.subscription.creditsPerMonth)
  );
  if (consumedCount === 0) {
    return new Set();
  }

  const consumedCoupons = coupons
    .filter((coupon) => coupon.sourceType === "monthly" && isCouponValidForDate(coupon, currentState.demoTodayISO))
    .sort(compareCouponsByAllocationPriority)
    .slice(0, consumedCount);

  return new Set(consumedCoupons.map((coupon) => coupon.id));
}

function compareBookingOrder(left, right) {
  const dateTimeOrder = `${left.dateISO}-${left.startTime}`.localeCompare(`${right.dateISO}-${right.startTime}`);
  if (dateTimeOrder !== 0) {
    return dateTimeOrder;
  }
  return left.id.localeCompare(right.id);
}

function compareCouponsByAllocationPriority(left, right) {
  const expiryOrder = left.validToExclusiveISO.localeCompare(right.validToExclusiveISO);
  if (expiryOrder !== 0) {
    return expiryOrder;
  }
  const startOrder = left.validFromISO.localeCompare(right.validFromISO);
  if (startOrder !== 0) {
    return startOrder;
  }
  return left.id.localeCompare(right.id);
}

function isCouponValidForDate(coupon, dateISO) {
  return compareDateISO(coupon.validFromISO, dateISO) <= 0 && compareDateISO(dateISO, coupon.validToExclusiveISO) < 0;
}

function getNoCouponMessage(dateISO) {
  return `No coupons are available for lessons on ${shortMonthDayFormatter.format(isoToDate(dateISO))}.`;
}

function getSelectedTopic() {
  return findTopic(state.selectedTopicId);
}

function getSelectedTeacher() {
  return findTeacher(state.selectedTeacherId);
}

function findTopic(topicId) {
  return state.topics.find((topic) => topic.id === topicId) || null;
}

function findTeacher(teacherId) {
  return state.teachers.find((teacher) => teacher.id === teacherId) || null;
}

function buildCalendarDays(currentDateISO) {
  const currentDate = isoToDate(currentDateISO);
  const dayOfWeek = currentDate.getUTCDay();
  const mondayOffset = (dayOfWeek + 6) % 7;
  const currentWeekMonday = addDaysDate(currentDate, -mondayOffset);
  const gridStart = addDaysDate(currentWeekMonday, -7);

  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const date = addDaysDate(gridStart, index);
    cells.push({
      iso: dateToISO(date),
      dayOfMonth: date.getUTCDate(),
      isInMonth: true,
    });
  }
  return cells;
}

function formatLongDate(dateISO) {
  return longDateFormatter.format(isoToDate(dateISO));
}

function formatCalendarRange(calendarDays) {
  if (!calendarDays.length) {
    return "";
  }
  const first = calendarDays[0].iso;
  const last = calendarDays[calendarDays.length - 1].iso;
  return `${rangeDateFormatter.format(isoToDate(first))} - ${rangeDateFormatter.format(isoToDate(last))}`;
}

function addMinutesToTime(time, minutesToAdd) {
  if (!time) return "--:--";
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalizedHours = Math.floor(totalMinutes / 60) % 24;
  const normalizedMinutes = totalMinutes % 60;
  return `${String(normalizedHours).padStart(2, "0")}:${String(normalizedMinutes).padStart(2, "0")}`;
}

function compareDateISO(leftISO, rightISO) {
  if (leftISO === rightISO) return 0;
  return leftISO < rightISO ? -1 : 1;
}

function maxDateISO(leftISO, rightISO) {
  return compareDateISO(leftISO, rightISO) >= 0 ? leftISO : rightISO;
}

function minDateISO(leftISO, rightISO) {
  return compareDateISO(leftISO, rightISO) <= 0 ? leftISO : rightISO;
}

function addDaysISO(dateISO, days) {
  const date = isoToDate(dateISO);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToISO(date);
}

function startOfMonthISO(dateISO) {
  const date = isoToDate(dateISO);
  date.setUTCDate(1);
  return dateToISO(date);
}

function endOfMonthISO(dateISO) {
  const date = isoToDate(startOfMonthISO(dateISO));
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return dateToISO(date);
}

function addAnchoredMonthsISO(anchorISO, monthsToAdd) {
  const anchorDate = isoToDate(anchorISO);
  const anchorYear = anchorDate.getUTCFullYear();
  const anchorMonthIndex = anchorDate.getUTCMonth();
  const anchorDay = anchorDate.getUTCDate();
  const totalMonthIndex = anchorMonthIndex + monthsToAdd;
  const targetYear = anchorYear + Math.floor(totalMonthIndex / 12);
  const targetMonthIndex = ((totalMonthIndex % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  return dateToISO(new Date(Date.UTC(targetYear, targetMonthIndex, Math.min(anchorDay, lastDayOfMonth))));
}

function isoToDate(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDaysDate(date, days) {
  const clone = new Date(date.getTime());
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
}

function combineISODateAndTime(dateISO, time) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}

function endOfDayDate(dateISO) {
  const date = isoToDate(dateISO);
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

function dateToISO(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value);
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

init();
