import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { schoolYearsData } from "./fridager.js";
import { getFellesaktiviteterSomEvents } from "./fellesaktiviteter.js";
import { getDKSAktiviteterSomEvents } from './DKS.js';
import { getSvommeAktiviteterSomEvents } from './svomming.js';
import { getBirthdayEvents } from './ansatte.js';

// Firebase-konfigurasjon
const firebaseConfig = {
  apiKey: "AIzaSyBFIOEfe6g7QfJppfOHTvhnNpd1XWMFpv0",
  authDomain: "aarshjul-b4a2a.firebaseapp.com",
  databaseURL: "https://aarshjul-b4a2a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aarshjul-b4a2a",
  storageBucket: "aarshjul-b4a2a.firebasestorage.app",
  messagingSenderId: "186927305986",
  appId: "1:186927305986:web:c8534d5733dcfd2f2c9e1b",
  measurementId: "G-M02DFGGH3R"
};

// Initialiser Firebase og Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventsRef = collection(db, "school_events");

const ALLOWED_ADMINS = [
  "77tor@ikrs.no",
  "tor.skarprud@gmail.com",
  "75thomas@ikrs.no",
  "62marit3@ikrs.no",
  "72janne@ikrs.no"
];

// Funksjon for å sjekke om innlogget bruker har administratorrettigheter
function isUserAdmin() {
  // Bytter du ut denne med din faktiske innloggingssjekk (f.eks. localStorage.getItem('userEmail'))
  const currentUserEmail = localStorage.getItem('userEmail') || ''; 
  return ALLOWED_ADMINS.includes(currentUserEmail.toLowerCase());
}


const categoryColors = {
  // Trinn (En tydelig regnbueskala gjør at trinnene skiller seg klart fra hverandre)
  "1. trinn": "#e74c3c", // Rød
  "2. trinn": "#e67e22", // Oransje
  "3. trinn": "#f1c40f", // Gul
  "4. trinn": "#2ecc71", // Grønn
  "5. trinn": "#1abc9c", // Turkis
  "6. trinn": "#3498db", // Blå
  "7. trinn": "#9b59b6", // Lila

  // Spesifikke fag og aktiviteter (Unike farger som skiller seg fra trinnene)
  "DKS": "#d35400",             // Mørk oransje / brent murtone
  "Svømming": "#00cec9",        // Klar cyan / vannblå
  "Fellesaktiviteter": "#2c3e50",// Mørk skiferblå
  "SFO": "#ff7675",              // Korall / varm rosa
  "Kartlegginger": "#6c5ce7",   // Dyp indigo / lilla-blå
  "Frister": "#c0392b",         // Dyp rød (signal/varselfarge)
  "UiA": "#00b894",              // Mørk myntgrønn
  "Sosialt": "#e84393",          // Knall knallrosa
  "Bursdag": "#f59e0b"          // Varm amber / fest-oransje
};

const repeatLabels = {
  "weekly": "Hver uke",
  "biweekly": "Annenhver uke",
  "monthly": "Hver måned"
};

const redDateSet = new Set();
const offDateSet = new Set();
const schoolEventsFromJs = [];

function parseSchoolYearsData() {
  if (!schoolYearsData) return;
  Object.values(schoolYearsData).flat().forEach(item => {
    let cur = new Date(item.startDate + "T00:00:00");
    const last = new Date(item.endDate + "T00:00:00");

    while (cur <= last) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (item.type === 'roddag') {
        redDateSet.add(dateStr);
      } else if (item.type === 'ferie' || item.type.startsWith('planlegging')) {
        offDateSet.add(dateStr);
      }
      cur.setDate(cur.getDate() + 1);
    }

    let endAdjusted = new Date(item.endDate + "T00:00:00");
    endAdjusted.setDate(endAdjusted.getDate() + 1);
    
    const yyyy = endAdjusted.getFullYear();
    const mm = String(endAdjusted.getMonth() + 1).padStart(2, '0');
    const dd = String(endAdjusted.getDate()).padStart(2, '0');
    const endStr = `${yyyy}-${mm}-${dd}`;

    let bgColor = '#95a5a6';
    if (item.type === 'roddag') bgColor = '#e74c3c';
    else if (item.type === 'ferie') bgColor = '#7f8c8d';

    schoolEventsFromJs.push({
      id: 'school_route_' + Math.random().toString(36).substring(2, 7),
      title: `📌 ${item.title}`,
      start: item.startDate,
      end: endStr,
      allDay: true,
      backgroundColor: bgColor,
      borderColor: bgColor,
      isSchoolRoute: true,
      extendedProps: {
        group: 'Skolerute',
        rawTitle: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        description: `Skolerute/Fridag (${item.type})`,
        isSchoolRoute: true
      }
    });
  });
}

parseSchoolYearsData();

const fellesEventsFromJs = typeof getFellesaktiviteterSomEvents === 'function' 
  ? getFellesaktiviteterSomEvents('2026-2027') 
  : [];
const dksEventsFromJs = typeof getDKSAktiviteterSomEvents === 'function' 
  ? getDKSAktiviteterSomEvents() 
  : [];
const svommeEventsFromJs = typeof getSvommeAktiviteterSomEvents === 'function' 
  ? getSvommeAktiviteterSomEvents('2026-2027') 
  : [];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventsRef = collection(db, "school_events");

let rawEvents = [];
let selectedCategories = Object.keys(categoryColors);
let calendar;
let activeEvent = null;
let currentSelection = null;
const contextMenu = document.getElementById('contextMenu');

let miniCalCurrentDate = new Date();

function populateGroupDropdown() {
  const groupSelect = document.getElementById('group');
  if (!groupSelect) return;
  groupSelect.innerHTML = '';
  Object.keys(categoryColors).forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    groupSelect.appendChild(option);
  });
}

function hideContextMenu() {
  if (contextMenu) contextMenu.style.display = 'none';
}

function showSelectionPopover(jsEvent) {
  const popover = document.getElementById('selectionPopover');
  if (!popover || !jsEvent) return;

  popover.style.position = 'fixed';
  popover.style.left = `${jsEvent.clientX}px`;
  popover.style.top = `${jsEvent.clientY - 45}px`;
  popover.style.display = 'flex';
}

function hideSelectionPopover() {
  const popover = document.getElementById('selectionPopover');
  if (popover) {
    popover.style.display = 'none';
  }
}

function closeModal() {
  document.getElementById('eventModal').style.display = 'none';
  document.getElementById('deleteConfirmMode').style.display = 'none';
  document.getElementById('normalFooter').style.display = 'flex';
  activeEvent = null;
  hideContextMenu();
  if (calendar) calendar.unselect();
}

function showFormMode(title = "Ny avtale", isRecurring = false) {
  hideContextMenu();
  document.getElementById('modalHeaderTitle').textContent = title;
  document.getElementById('viewMode').style.display = 'none';
  document.getElementById('eventForm').style.display = 'block';
  document.getElementById('isRecurringMode').value = isRecurring ? "true" : "false";

  const recurringGroup = document.getElementById('recurringGroup');
  recurringGroup.style.display = isRecurring ? 'block' : 'none';

  document.getElementById('viewEditBtn').style.display = 'none';
  document.getElementById('viewDeleteBtn').style.display = 'none';
  document.getElementById('viewCancelBtn').style.display = 'none';
  document.getElementById('formCancelBtn').style.display = 'inline-block';
  document.getElementById('formSubmitBtn').style.display = 'inline-block';

  document.getElementById('eventModal').style.display = 'flex';
  setTimeout(() => document.getElementById('title').focus(), 50);
}

function showViewMode() {
  hideContextMenu();
  document.getElementById('modalHeaderTitle').textContent = "Avtaledetaljer";
  document.getElementById('eventForm').style.display = 'none';
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('deleteConfirmMode').style.display = 'none';
  document.getElementById('normalFooter').style.display = 'flex';

  document.getElementById('formCancelBtn').style.display = 'none';
  document.getElementById('formSubmitBtn').style.display = 'none';
  document.getElementById('viewCancelBtn').style.display = 'inline-block';

  // --- LOGIKK FOR Å SKJULE/VISE REDIGER OG SLETT ---
  const isRoute = activeEvent && activeEvent.isSchoolRoute;
  const lockedGroups = ["DKS", "Svømming", "Fellesaktiviteter", "Kartlegginger", "Bursdag"];
  const isLockedGroup = activeEvent && lockedGroups.includes(activeEvent.group);

  // Hvis det er en skolerute, ELLER en låst gruppe og brukeren IKKE er admin -> Skjul knappene
  if (isRoute || (isLockedGroup && !isUserAdmin())) {
    document.getElementById('viewEditBtn').style.display = 'none';
    document.getElementById('viewDeleteBtn').style.display = 'none';
  } else {
    document.getElementById('viewEditBtn').style.display = 'inline-block';
    document.getElementById('viewDeleteBtn').style.display = 'inline-block';
  }

  document.getElementById('eventModal').style.display = 'flex';
}

function formatDate(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(dateObj) {
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatNorwegianDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}.${month}.${year}`;
}

function populateFormFromSelection() {
  if (!currentSelection) return;

  document.getElementById('eventId').value = '';
  document.getElementById('eventForm').reset();

  let startDate = currentSelection.start;
  let endDate = currentSelection.end;

  if (currentSelection.allDay) {
    endDate = new Date(endDate.getTime() - 1);
  }

  document.getElementById('startDate').value = formatDate(startDate);
  document.getElementById('endDate').value = formatDate(endDate);

  if (!currentSelection.allDay) {
    document.getElementById('startTime').value = formatTime(startDate);
    document.getElementById('endTime').value = formatTime(endDate);
  } else {
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
  }
}

/* Mini-kalender */
const monthNamesNorwegian = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni", 
  "Juli", "August", "September", "Oktober", "November", "Desember"
];

function highlightDateInHeader(selectedDateStr) {
  document.querySelectorAll('.selected-highlight-day').forEach(el => {
    el.classList.remove('selected-highlight-day');
  });

  const headerCell = document.querySelector(`.fc-col-header-cell[data-date="${selectedDateStr}"]`);
  if (headerCell) {
    headerCell.classList.add('selected-highlight-day');
  }
}


// Hjelpefunksjon for å beregne ISO-ukenummer
function getISOWeekNumber(d) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function renderMiniCalendar() {
  const grid = document.getElementById('miniCalGrid');
  const title = document.getElementById('miniCalTitle');
  if (!grid || !title) return;
  grid.innerHTML = '';

  const year = miniCalCurrentDate.getFullYear();
  const month = miniCalCurrentDate.getMonth();

  title.textContent = `${monthNamesNorwegian[month]} ${year}`;

  // 1. Overskrifter: Ekstra `#` i starten for ukenummer-kolonnen
  const dayHeaders = ['#', 'M', 'T', 'O', 'T', 'F', 'L', 'S'];
  dayHeaders.forEach((dh, index) => {
    const div = document.createElement('div');
    div.className = index === 0 ? 'mini-day-name mini-week-header' : 'mini-day-name';
    div.textContent = dh;
    grid.appendChild(div);
  });

  const firstDayOfMonth = new Date(year, month, 1);
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay === -1) startingDay = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const todayStr = formatDate(new Date());
  const selectedStr = calendar ? formatDate(calendar.getDate()) : todayStr;

  // Samle alle dagene som skal inn i rutenettet (forrige mnd, denne mnd, neste mnd)
  const allDays = [];

  // Dager fra forrige måned
  for (let i = startingDay - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const dateObj = new Date(year, month - 1, dayNum);
    allDays.push({ dayNum, type: 'other-month', dateObj });
  }

  // Dager fra denne måneden
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    allDays.push({ dayNum: day, type: 'current', dateObj });
  }

  // Fyll ut med neste måneds dager slik at alle uker (rader) blir komplette (multipler av 7)
  let nextMonthDay = 1;
  while (allDays.length % 7 !== 0) {
    const dateObj = new Date(year, month + 1, nextMonthDay);
    allDays.push({ dayNum: nextMonthDay, type: 'other-month', dateObj });
    nextMonthDay++;
  }

  // 2. Bygg rutenettet uke for uke (7 dager av gangen)
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    
    // Beregn ukenummer ut fra mandagen i denne uken (første element i uken)
    const mondayDate = weekDays[0].dateObj;
    const weekNum = getISOWeekNumber(mondayDate);

    // Legg til ukenummer-celle helt først i raden
    const weekDiv = document.createElement('div');
    weekDiv.className = 'mini-week-num';
    weekDiv.textContent = weekNum;
    grid.appendChild(weekDiv);

    // Legg til de 7 dagene for denne uken
    weekDays.forEach(item => {
      const div = document.createElement('div');
      div.textContent = item.dayNum;

      if (item.type === 'other-month') {
        div.className = 'mini-day-cell other-month';
      } else {
        div.className = 'mini-day-cell';
        const dateStr = formatDate(item.dateObj);

        if (dateStr === todayStr) div.classList.add('today');
        if (dateStr === selectedStr) div.classList.add('selected-day');

        if (redDateSet.has(dateStr) || item.dateObj.getDay() === 0) {
          div.classList.add('red-day');
        } else if (offDateSet.has(dateStr)) {
          div.classList.add('off-day');
        }

        div.addEventListener('click', () => {
          if (calendar) {
            calendar.gotoDate(item.dateObj);
            renderMiniCalendar();
            
            setTimeout(() => {
              highlightDateInHeader(dateStr);
            }, 50);
          }
        });
      }
      grid.appendChild(div);
    });
  }
}


document.getElementById('miniPrevBtn').addEventListener('click', () => {
  miniCalCurrentDate.setMonth(miniCalCurrentDate.getMonth() - 1);
  renderMiniCalendar();
});

document.getElementById('miniNextBtn').addEventListener('click', () => {
  miniCalCurrentDate.setMonth(miniCalCurrentDate.getMonth() + 1);
  renderMiniCalendar();
});


/* Oppstart & FullCalendar */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof populateGroupDropdown === 'function') {
    populateGroupDropdown();
  }

  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    initialDate: '2026-08-17',
    selectable: true,
    selectMirror: true,
    unselectAuto: false,

    // Skjul helg som standard (viser man-fre)
    weekends: false,

    views: {
      schoolYearList: {
        type: 'list',
        duration: { months: 12 },
        buttonText: 'Skoleår'
      }
    },

    customButtons: {
      toggleWeekend: {
        text: 'Vis helg',
        click: function() {
          const showWeekends = calendar.getOption('weekends');
          const nextState = !showWeekends;

          // Oppdater kalenderens status og knappe-tekst synkronisert
          calendar.setOption('weekends', nextState);
          calendar.setOption('customButtons', {
            ...calendar.getOption('customButtons'),
            toggleWeekend: {
              ...calendar.getOption('customButtons').toggleWeekend,
              text: nextState ? 'Skjul helg' : 'Vis helg'
            }
          });
        }
      },

      printWeekBtn: {
        text: '🖨️ Skriv ut uke',
        click: function() {
          const originalView = calendar.view.type;

          // Bytt til listevisning for uken
          calendar.changeView('listWeek');

          const view = calendar.view;
          const start = view.currentStart;
          const end = new Date(view.currentEnd.getTime() - 1);

          // Beregn ISO-ukenummer
          const target = new Date(start.valueOf());
          const dayNr = (start.getDay() + 6) % 7;
          target.setDate(target.getDate() - dayNr + 3);
          const firstThursday = target.valueOf();
          target.setMonth(0, 1);
          if (target.getDay() !== 4) {
            target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
          }
          const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

          const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
          const startStr = start.toLocaleDateString('no-NO', options);
          const endStr = end.toLocaleDateString('no-NO', options);

          const titleEl = document.getElementById('printTitle');
          const subTitleEl = document.getElementById('printSubTitle');
          if (titleEl) titleEl.textContent = `Ukeplan – Uke ${weekNum}`;
          if (subTitleEl) subTitleEl.textContent = `${startStr} – ${endStr}`;

          if (typeof hideContextMenu === 'function') hideContextMenu();
          if (typeof hideSelectionPopover === 'function') hideSelectionPopover();

          requestAnimationFrame(() => {
            setTimeout(() => {
              const currentEvents = calendar.getEvents();
              const multiDayMap = new Map();

              // Bygg kart over flerdagershendelser med start- og sluttdato
              currentEvents.forEach(evt => {
                const titleKey = evt.title.trim();
                let isMultiDay = false;
                let startD = evt.start;
                let endD = evt.end ? new Date(evt.end.getTime() - 1) : evt.start;

                if (evt.start && evt.end) {
                  const diffDays = (evt.end.getTime() - evt.start.getTime()) / (1000 * 3600 * 24);
                  if (diffDays > 1) isMultiDay = true;
                } else if (evt.allDay) {
                  isMultiDay = true;
                }

                if (isMultiDay && startD) {
                  const fmt = { day: '2-digit', month: '2-digit' };
                  const rangeText = `${startD.toLocaleDateString('no-NO', fmt)} – ${endD.toLocaleDateString('no-NO', fmt)}`;
                  multiDayMap.set(titleKey, rangeText);
                }
              });

              const eventRows = document.querySelectorAll('.fc-list-event');
              const seenMultiDayTitles = new Set();

              eventRows.forEach(row => {
                const titleText = row.querySelector('.fc-list-event-title')?.textContent?.trim();
                const timeCell = row.querySelector('.fc-list-event-time');

                if (titleText && multiDayMap.has(titleText)) {
                  if (seenMultiDayTitles.has(titleText)) {
                    // Skjul rad fra dag 2, 3 osv.
                    row.style.display = 'none';
                  } else {
                    seenMultiDayTitles.add(titleText);
                    // Sett inn til/fra dato i klokkeslett-cellen
                    if (timeCell) {
                      timeCell.textContent = multiDayMap.get(titleText);
                    }
                  }
                }
              });

              // Kjør utskrift dialog
              window.print();

              // Tilbakekall opprinnelig visning etter utskrift
              calendar.changeView(originalView);
            }, 300);
          });
        }
      }
    },

    headerToolbar: {
      left: 'prev,next today toggleWeekend',
      center: 'title',
      right: 'printWeekBtn timeGridWeek,dayGridMonth,listMonth'
    },
    buttonText: { today: 'I dag', month: 'Måned', week: 'Uke', list: 'Liste' },
    locale: 'no',
    firstDay: 1,
    scrollTime: '08:00:00',
    slotDuration: '00:30:00', // <-- Komma må være her!

    datesSet: function(info) {
      if (typeof miniCalCurrentDate !== 'undefined') {
        miniCalCurrentDate = new Date(info.view.currentStart);
      }
      if (typeof renderMiniCalendar === 'function') renderMiniCalendar();
      
      if (calendar && typeof formatDate === 'function' && typeof highlightDateInHeader === 'function') {
        const currentSelectedStr = formatDate(calendar.getDate());
        setTimeout(() => {
          highlightDateInHeader(currentSelectedStr);
        }, 50);
      }

      // --- NYTT: Oppdater bursdager hvis vi blar til et nytt år ---
      if (typeof getBirthdayEvents === 'function' && typeof updateCalendarEvents === 'function') {
        updateCalendarEvents();
      }

      // Legg til ukenummer i tittelen for ukesvisninger
      const view = info.view;
      if (view.type === 'timeGridWeek' || view.type === 'dayGridWeek' || view.type === 'listWeek') {
        const start = view.currentStart;
        
        // Beregn ISO-ukenummer
        const target = new Date(start.valueOf());
        const dayNr = (start.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
        }
        const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

        // Oppdater overskriften i kalenderen
        const titleEl = document.querySelector('.fc-toolbar-title');
        if (titleEl) {
          titleEl.textContent = `Uke ${weekNum}: ${view.title}`;
        }
      }
    },
    
    dayCellClassNames: function(arg) {
      if (typeof formatDate !== 'function') return [];
      const dateStr = formatDate(arg.date);
      if (typeof redDateSet !== 'undefined' && redDateSet.has(dateStr)) return ['day-red-day'];
      if (typeof offDateSet !== 'undefined' && offDateSet.has(dateStr)) return ['day-off-day'];
      return [];
    },

    slotLaneClassNames: function(arg) {
      const timeStr = arg.date.toTimeString().substring(0, 5);
      if (timeStr >= "08:30" && timeStr < "14:30") return ['fc-school-hours'];
      return [];
    },

    select: function(info) {
      currentSelection = info;
      if (typeof hideContextMenu === 'function') hideContextMenu();
      if (typeof showSelectionPopover === 'function') showSelectionPopover(info.jsEvent);
    },

    unselect: function() {
      if (typeof hideContextMenu === 'function') hideContextMenu();
    },

    eventClick: function(info) {
      if (typeof hideContextMenu === 'function') hideContextMenu();
      if (typeof hideSelectionPopover === 'function') hideSelectionPopover();

      activeEvent = {
        id: info.event.id,
        title: info.event.extendedProps.rawTitle || info.event.title,
        group: info.event.extendedProps.group,
        startDate: info.event.extendedProps.startDate || info.event.startStr,
        startTime: info.event.extendedProps.startTime || '',
        endDate: info.event.extendedProps.endDate || info.event.endStr,
        endTime: info.event.extendedProps.endTime || '',
        description: info.event.extendedProps.description,
        repeatPattern: info.event.extendedProps.repeatPattern,
        recurringSeriesId: info.event.extendedProps.recurringSeriesId,
        isSchoolRoute: info.event.extendedProps.isSchoolRoute || false
      };

      const viewTitle = document.getElementById('viewTitle');
      const viewGroup = document.getElementById('viewGroup');
      const viewTime = document.getElementById('viewTime');
      const viewDescription = document.getElementById('viewDescription');

      if (viewTitle) viewTitle.textContent = activeEvent.title;
      if (viewGroup) viewGroup.textContent = activeEvent.group;
      
      let timeText = typeof formatNorwegianDate === 'function' ? formatNorwegianDate(activeEvent.startDate) : activeEvent.startDate;
      if (activeEvent.startTime) timeText += ` kl. ${activeEvent.startTime}`;
      if (activeEvent.endTime) timeText += ` - ${activeEvent.endTime}`;
      if (activeEvent.endDate && activeEvent.endDate !== activeEvent.startDate) {
        timeText += ` til ${typeof formatNorwegianDate === 'function' ? formatNorwegianDate(activeEvent.endDate) : activeEvent.endDate}`;
      }
      if (viewTime) viewTime.textContent = timeText;

      const recurringRow = document.getElementById('viewRecurringRow');
      const viewRecurring = document.getElementById('viewRecurring');
      if (recurringRow && viewRecurring) {
        if (activeEvent.repeatPattern && typeof repeatLabels !== 'undefined' && repeatLabels[activeEvent.repeatPattern]) {
          viewRecurring.textContent = `🔁 ${repeatLabels[activeEvent.repeatPattern]}`;
          recurringRow.style.display = 'block';
        } else {
          recurringRow.style.display = 'none';
        }
      }

      if (viewDescription) viewDescription.textContent = activeEvent.description || "Ingen beskrivelse oppgitt.";

      if (typeof showViewMode === 'function') showViewMode();
    },

    events: []
  });

  calendar.render();
  if (typeof renderFilters === 'function') renderFilters();
  if (typeof renderMiniCalendar === 'function') renderMiniCalendar();

  // Tvinger hendelsene inn i kalenderen ved oppstart
  if (typeof updateCalendarEvents === 'function') {
    updateCalendarEvents();
  }

  const btnToggleAll = document.getElementById('btnToggleAllCategories');
  if (btnToggleAll) {
    btnToggleAll.addEventListener('click', (e) => {
      const filterContainer = document.getElementById('filterList');
      if (!filterContainer) return;

      const checkboxes = filterContainer.querySelectorAll('input[type="checkbox"]');
      if (checkboxes.length === 0) return;

      const isAnyChecked = Array.from(checkboxes).some(cb => cb.checked);
      const shouldCheck = !isAnyChecked;

      checkboxes.forEach(cb => {
        cb.checked = shouldCheck;
        cb.dispatchEvent(new Event('change'));
      });

      e.target.textContent = shouldCheck ? 'Velg ingen' : 'Velg alle';
    });
  }

  calendarEl.addEventListener('contextmenu', (e) => {
    if (typeof currentSelection !== 'undefined' && currentSelection) {
      e.preventDefault();
      
      const menu = document.getElementById('contextMenu');
      if (!menu) return;

      const rect = calendarEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menu.style.display = 'block';
    }
  });

  document.addEventListener('click', (e) => {
    const popover = document.getElementById('selectionPopover');
    const menu = document.getElementById('contextMenu');
    
    if (menu && !menu.contains(e.target) && typeof hideContextMenu === 'function') {
      hideContextMenu();
    }

    if (popover && !popover.contains(e.target) && !e.target.closest('.fc') && typeof hideSelectionPopover === 'function') {
      hideSelectionPopover();
    }
  });

  const menuNewEvent = document.getElementById('menuNewEvent');
  if (menuNewEvent) {
    menuNewEvent.addEventListener('click', () => {
      if (typeof populateFormFromSelection === 'function') populateFormFromSelection();
      if (typeof showFormMode === 'function') showFormMode("Ny avtale", false);
    });
  }

  const menuNewRecurringEvent = document.getElementById('menuNewRecurringEvent');
  if (menuNewRecurringEvent) {
    menuNewRecurringEvent.addEventListener('click', () => {
      if (typeof populateFormFromSelection === 'function') populateFormFromSelection();
      if (typeof showFormMode === 'function') showFormMode("Ny regelmessig avtale", true);
    });
  }

  const btnQuickNewEvent = document.getElementById('btnQuickNewEvent');
  if (btnQuickNewEvent) {
    btnQuickNewEvent.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof hideSelectionPopover === 'function') hideSelectionPopover();
      if (typeof populateFormFromSelection === 'function') populateFormFromSelection();
      if (typeof showFormMode === 'function') showFormMode("Ny avtale", false);
    });
  }

  const btnQuickNewRecurring = document.getElementById('btnQuickNewRecurring');
  if (btnQuickNewRecurring) {
    btnQuickNewRecurring.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof hideSelectionPopover === 'function') hideSelectionPopover();
      if (typeof populateFormFromSelection === 'function') populateFormFromSelection();
      if (typeof showFormMode === 'function') showFormMode("Ny regelmessig avtale", true);
    });
  }

});


// Firestore Realtime Lytter
onSnapshot(eventsRef, (snapshot) => {
  const colors = (typeof categoryColors !== 'undefined') ? categoryColors : {};

  rawEvents = snapshot.docs.map(doc => {
    const data = doc.data();
    
    let startIso = data.startDate;
    if (data.startTime) startIso += `T${data.startTime}`;

    let endIso = data.endDate || data.startDate;
    if (data.endTime) endIso += `T${data.endTime}`;

    const isAllDay = !data.startTime;
    const isRecurring = Boolean(data.repeatPattern || data.recurringSeriesId);
    const iconPrefix = isRecurring ? "🔁 " : "";
    const color = colors[data.group] || '#3788d8';

    return {
      id: doc.id,
      title: `${iconPrefix}[${data.group}] ${data.title}`,
      start: startIso,
      // Hvis heledagshendelse på samme dag, dropp 'end' så FullCalendar viser den riktig
      end: (isAllDay && endIso === data.startDate) ? undefined : endIso,
      allDay: isAllDay,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { 
        group: data.group,
        rawTitle: data.title,
        startDate: data.startDate,
        startTime: data.startTime || '',
        endDate: data.endDate || data.startDate,
        endTime: data.endTime || '',
        description: data.description || '',
        repeatPattern: data.repeatPattern || null,
        recurringSeriesId: data.recurringSeriesId || null,
        trinn: Array.isArray(data.trinn) ? data.trinn : []
      }
    };
  });

  if (typeof updateCalendarEvents === 'function') {
    updateCalendarEvents();
  }
});

// <-- BRUK DENNE UTGAVEN:
function isEventInSelectedCategories(event) {
  if (selectedCategories.length === 0) return false;

  const group = (event.extendedProps?.group || '').toLowerCase();
  const trinnArray = event.extendedProps?.trinn || [];
  
  const title = (event.title || event.extendedProps?.rawTitle || '').toLowerCase();
  const description = (event.extendedProps?.description || '').toLowerCase();
  const altInnhold = `${group} ${title} ${description}`.toLowerCase();

  for (const cat of selectedCategories) {
    const isTrinnCategory = cat.endsWith('. trinn');

    // A) HVIS MAN FILTRERER PÅ ET TRINN (f.eks. "1. trinn")
    if (isTrinnCategory) {
      // 1. Sjekk direkte i trinn-arrayen
      if (Array.isArray(trinnArray) && trinnArray.length > 0) {
        if (trinnArray.includes(cat)) return true;
      }

      // 2. Skoleomfattende hendelser
      if (altInnhold.includes("alle trinn") || altInnhold.includes("1.-7. trinn") || altInnhold.includes("1-7. trinn")) {
        return true;
      }

      // 3. Fallback for manuelle hendelser uten trinnArray
      if (!Array.isArray(trinnArray) || trinnArray.length === 0) {
        const trinnNummer = parseInt(cat.split('.')[0].trim(), 10);
        
        if (altInnhold.includes("heståsen") && trinnNummer >= 1 && trinnNummer <= 3) return true;
        if (altInnhold.includes("brattbakken") && trinnNummer >= 4 && trinnNummer <= 7) return true;

        const trinnRegex = new RegExp(`\\b${trinnNummer}(\\.|a|b|c|d|\\s*-\\s*|\\s*\\.\\s*trinn)`, 'i');
        if (trinnRegex.test(altInnhold)) return true;

        const rangeMatch = altInnhold.match(/(\d+)\s*[\.\-]\s*(\d+)\.?\s*trinn/i);
        if (rangeMatch) {
          const startTrinn = parseInt(rangeMatch[1], 10);
          const sluttTrinn = parseInt(rangeMatch[2], 10);
          if (trinnNummer >= startTrinn && trinnNummer <= sluttTrinn) return true;
        }
      }

      // Dersom det var et trinn-filter og eventet ikke matchet trinnet, hopp videre
      continue; 
    }

    // B) HVIS MAN FILTRERER PÅ EN KATEGORI/GRUPPE (f.eks. "Svømming", "DKS")
    if (group === cat.toLowerCase()) {
      return true;
    }

    // C) SAMLEKATEGORIER
    if (cat === "Alle på Heståsen" && (altInnhold.includes("heståsen") || trinnArray.some(t => ["1. trinn", "2. trinn", "3. trinn"].includes(t)))) {
      return true;
    }
    if (cat === "Alle på Brattbakken" && (altInnhold.includes("brattbakken") || trinnArray.some(t => ["4. trinn", "5. trinn", "6. trinn", "7. trinn"].includes(t)))) {
      return true;
    }
  }

  return false;
}

function updateCalendarEvents() {
  // 1. Hent bursdager fra ansatte.js basert på hvilket år kalenderen viser
  let filteredBursdagEvents = [];
  if (typeof getBirthdayEvents === 'function' && calendar) {
    const currentYear = calendar.getDate().getFullYear();
    const rawBursdager = getBirthdayEvents(currentYear);
    
    // Filtrer bursdagene gjennom valgte kategorier
    filteredBursdagEvents = rawBursdager.filter(event => 
      isEventInSelectedCategories(event)
    );
  }

  const filteredUserEvents = rawEvents.filter(event => 
    isEventInSelectedCategories(event)
  );

  const filteredFellesEvents = (typeof fellesEventsFromJs !== 'undefined' ? fellesEventsFromJs : []).filter(event => 
    isEventInSelectedCategories(event)
  );

  const filteredDksEvents = (typeof dksEventsFromJs !== 'undefined' ? dksEventsFromJs : []).filter(event => 
    isEventInSelectedCategories(event)
  );

  const filteredSvommeEvents = (typeof svommeEventsFromJs !== 'undefined' ? svommeEventsFromJs : []).filter(event => 
    isEventInSelectedCategories(event)
  );

  const schoolEvents = typeof schoolEventsFromJs !== 'undefined' ? schoolEventsFromJs : [];

  // 2. Legg til filteredBursdagEvents i listen over alle hendelser
  const allEvents = [
    ...schoolEvents, 
    ...filteredFellesEvents, 
    ...filteredDksEvents, 
    ...filteredSvommeEvents, 
    ...filteredBursdagEvents, // <-- Bursdager lagt til her
    ...filteredUserEvents
  ];

  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(allEvents);
  }
}

// Modal Lyttere
document.getElementById('modalCloseX').addEventListener('click', closeModal);
document.getElementById('formCancelBtn').addEventListener('click', closeModal);
document.getElementById('viewCancelBtn').addEventListener('click', closeModal);

document.getElementById('viewEditBtn').addEventListener('click', () => {
  if (activeEvent && !activeEvent.isSchoolRoute) {
    document.getElementById('eventId').value = activeEvent.id;
    document.getElementById('title').value = activeEvent.title;
    document.getElementById('group').value = activeEvent.group;
    document.getElementById('startDate').value = activeEvent.startDate;
    document.getElementById('startTime').value = activeEvent.startTime;
    document.getElementById('endDate').value = activeEvent.endDate;
    document.getElementById('endTime').value = activeEvent.endTime;
    document.getElementById('description').value = activeEvent.description;

    showFormMode("Rediger avtale", false);
  }
});

document.getElementById('viewDeleteBtn').addEventListener('click', async () => {
  if (!activeEvent || activeEvent.isSchoolRoute) return;

  if (activeEvent.recurringSeriesId) {
    document.getElementById('normalFooter').style.display = 'none';
    document.getElementById('deleteConfirmMode').style.display = 'flex';
  } else {
    if (confirm(`Er du sikker på at du vil slette "${activeEvent.title}"?`)) {
      const targetId = activeEvent.id;
      closeModal();
      try {
        await deleteDoc(doc(db, "school_events", targetId));
      } catch (err) {
        console.error("Feil ved sletting:", err);
        alert("Kunne ikke slette hendelsen.");
      }
    }
  }
});

document.getElementById('cancelDeleteModeBtn').addEventListener('click', () => {
  document.getElementById('deleteConfirmMode').style.display = 'none';
  document.getElementById('normalFooter').style.display = 'flex';
});

document.getElementById('deleteSingleBtn').addEventListener('click', async () => {
  if (!activeEvent) return;
  const targetId = activeEvent.id;
  closeModal();
  try {
    await deleteDoc(doc(db, "school_events", targetId));
  } catch (err) {
    console.error("Feil ved sletting:", err);
    alert("Kunne ikke slette hendelsen.");
  }
});

document.getElementById('deleteFutureBtn').addEventListener('click', async () => {
  if (!activeEvent || !activeEvent.recurringSeriesId) return;
  const seriesId = activeEvent.recurringSeriesId;
  const currentDate = activeEvent.startDate;

  closeModal();

  try {
    const q = query(
      eventsRef, 
      where("recurringSeriesId", "==", seriesId),
      where("startDate", ">=", currentDate)
    );
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "school_events", d.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error("Feil ved sletting av fremtidige hendelser:", err);
    alert("Kunne ikke slette hendelsene.");
  }
});

document.getElementById('deleteAllSeriesBtn').addEventListener('click', async () => {
  if (!activeEvent || !activeEvent.recurringSeriesId) return;
  const seriesId = activeEvent.recurringSeriesId;

  closeModal();

  try {
    const q = query(eventsRef, where("recurringSeriesId", "==", seriesId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "school_events", d.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error("Feil ved sletting av serien:", err);
    alert("Kunne ikke slette hendelsene.");
  }
});

document.getElementById('eventForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const eventId = document.getElementById('eventId').value;
  const isRecurring = document.getElementById('isRecurringMode').value === "true";
  const repeatPattern = document.getElementById('repeatPattern').value;
  
  const title = document.getElementById('title').value;
  const group = document.getElementById('group').value;
  const startDateStr = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endDateStr = document.getElementById('endDate').value;
  const endTime = document.getElementById('endTime').value;
  const description = document.getElementById('description').value;

  closeModal();

  try {
    if (eventId) {
      const singleData = {
        title, group, startDate: startDateStr, startTime: startTime || null,
        endDate: endDateStr || startDateStr, endTime: endTime || null,
        description: description || '', updatedAt: new Date().toISOString()
      };
      await updateDoc(doc(db, "school_events", eventId), singleData);
    } else if (isRecurring) {
      const eventsToCreate = [];
      let currentStart = new Date(startDateStr + "T00:00:00");
      let currentEnd = new Date((endDateStr || startDateStr) + "T00:00:00");

      const daySpan = Math.round((currentEnd - currentStart) / (1000 * 60 * 60 * 24));
      const iterations = (repeatPattern === 'monthly') ? 10 : (repeatPattern === 'biweekly' ? 20 : 40);
      const seriesId = 'series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

      for (let i = 0; i < iterations; i++) {
        const nextStart = new Date(currentStart);
        const nextEnd = new Date(currentEnd);

        if (repeatPattern === 'weekly') {
          nextStart.setDate(currentStart.getDate() + (i * 7));
          nextEnd.setDate(currentStart.getDate() + (i * 7) + daySpan);
        } else if (repeatPattern === 'biweekly') {
          nextStart.setDate(currentStart.getDate() + (i * 14));
          nextEnd.setDate(currentStart.getDate() + (i * 14) + daySpan);
        } else if (repeatPattern === 'monthly') {
          const targetMonth = currentStart.getMonth() + i;
          nextStart.setFullYear(currentStart.getFullYear(), targetMonth, currentStart.getDate());
          nextEnd.setTime(nextStart.getTime() + (daySpan * 24 * 60 * 60 * 1000));
        }

        eventsToCreate.push({
          title: title,
          group: group,
          startDate: formatDate(nextStart),
          startTime: startTime || null,
          endDate: formatDate(nextEnd),
          endTime: endTime || null,
          description: description || '',
          repeatPattern: repeatPattern,
          recurringSeriesId: seriesId,
          createdAt: new Date().toISOString()
        });
      }

      await Promise.all(eventsToCreate.map(evt => addDoc(eventsRef, evt)));

    } else {
      const singleData = {
        title, group, startDate: startDateStr, startTime: startTime || null,
        endDate: endDateStr || startDateStr, endTime: endTime || null,
        description: description || '', createdAt: new Date().toISOString()
      };
      await addDoc(eventsRef, singleData);
    }
  } catch (error) {
    console.error("Feil ved lagring: ", error);
    alert("Feil ved lagring til databasen.");
  }
});

function renderFilters() {
  const filterContainer = document.getElementById('filterList');
  if (!filterContainer) return;
  filterContainer.innerHTML = '';

  Object.keys(categoryColors).forEach(cat => {
    const item = document.createElement('label');
    item.className = 'filter-item-vert';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedCategories.includes(cat);
    checkbox.value = cat;
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!selectedCategories.includes(cat)) selectedCategories.push(cat);
      } else {
        selectedCategories = selectedCategories.filter(c => c !== cat);
      }
      
      updateCalendarEvents();
      checkSingleCategorySelection();
    });

    const colorDot = document.createElement('span');
    colorDot.className = 'color-dot';
    colorDot.style.backgroundColor = categoryColors[cat];

    const labelText = document.createElement('span');
    labelText.className = 'filter-label';
    labelText.textContent = cat;

    item.appendChild(checkbox);
    item.appendChild(colorDot);
    item.appendChild(labelText);
    filterContainer.appendChild(item);
  });

  checkSingleCategorySelection();
}

function checkSingleCategorySelection() {
  const printBtn = document.getElementById('btnPrintCategory');
  if (!printBtn) return;

  if (selectedCategories.length === 1) {
    const activeCat = selectedCategories[0];
    printBtn.textContent = `🖨️ Skriv ut liste for "${activeCat}"`;
    printBtn.style.display = 'block';
  } else {
    printBtn.style.display = 'none';
  }
}

// Lytter på utskriftsknappen for valgt kategori (Oppdatert med trinn-array sjekk)
document.getElementById('btnPrintCategory')?.addEventListener('click', () => {
  if (selectedCategories.length !== 1) return;

  const selectedCategory = selectedCategories[0];
  const originalView = calendar.view.type;
  const originalDate = calendar.getDate();

  const currentMonth = originalDate.getMonth();
  const startYear = currentMonth >= 7 ? originalDate.getFullYear() : originalDate.getFullYear() - 1;
  const schoolYearStart = `${startYear}-08-01`;

  calendar.changeView('schoolYearList');
  calendar.gotoDate(schoolYearStart);

  const shouldIncludeEvent = (evt) => {
    // Sjekk om trinn-arrayen inneholder den valgte kategorien direkte
    const trinnArray = evt.extendedProps?.trinn || [];
    if (Array.isArray(trinnArray) && trinnArray.includes(selectedCategory)) {
      return true;
    }

    // Standard kategorisjekk
    return isEventInSelectedCategories(evt);
  };

  const filteredUserEvents = rawEvents.filter(shouldIncludeEvent);
  const filteredFellesEvents = (typeof fellesEventsFromJs !== 'undefined' ? fellesEventsFromJs : []).filter(shouldIncludeEvent);
  const filteredDksEvents = (typeof dksEventsFromJs !== 'undefined' ? dksEventsFromJs : []).filter(shouldIncludeEvent);
  const filteredSvommeEvents = (typeof svommeEventsFromJs !== 'undefined' ? svommeEventsFromJs : []).filter(shouldIncludeEvent);

  const allRawEvents = [
    ...filteredFellesEvents, 
    ...filteredDksEvents, 
    ...filteredSvommeEvents, 
    ...filteredUserEvents
  ];

  const isOnlyFelles = selectedCategory.toLowerCase().includes('felles');
  const consolidatedMap = new Map();

  allRawEvents.forEach((evt, idx) => {
    const rawTitle = (evt.title || evt.extendedProps?.rawTitle || '').trim();
    if (!rawTitle) return;

    const evtStart = new Date(evt.start);
    const evtEnd = evt.end ? new Date(evt.end) : evtStart;

    const key = isOnlyFelles 
      ? rawTitle.toLowerCase().replace(/^\[.*?\]\s*/, '')
      : `${rawTitle}_${evtStart.getTime()}_${idx}`;

    if (!consolidatedMap.has(key)) {
      consolidatedMap.set(key, {
        displayTitle: rawTitle,
        minStart: evtStart,
        maxEnd: evtEnd,
        allDay: evt.allDay || false,
        originalEvt: evt
      });
    } else {
      const existing = consolidatedMap.get(key);
      if (evtStart < existing.minStart) existing.minStart = evtStart;
      if (evtEnd > existing.maxEnd) existing.maxEnd = evtEnd;
    }
  });

  const sortedItems = Array.from(consolidatedMap.values()).sort((a, b) => a.minStart - b.minStart);

  const singleRowEvents = sortedItems.map((item, index) => {
    const startStr = item.minStart.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
    const endStr = item.maxEnd.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
    
    const isMultiDay = item.minStart.toDateString() !== item.maxEnd.toDateString();
    const dateLabel = isMultiDay ? `${startStr}. – ${endStr}.` : `${startStr}.`;

    let timeLabel = '';
    const hours = item.minStart.getHours();
    const isRealTime = !item.allDay && hours >= 7 && hours <= 20;

    if (isRealTime) {
      const startTimeStr = item.minStart.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
      const endTimeStr = item.maxEnd.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
      timeLabel = item.maxEnd && startTimeStr !== endTimeStr ? ` | kl. ${startTimeStr}–${endTimeStr}` : ` | kl. ${startTimeStr}`;
    }

    return {
      id: `print_evt_${index}`,
      title: `[${dateLabel}${timeLabel}]  ${item.displayTitle}`,
      start: item.minStart.toISOString().split('T')[0],
      end: item.minStart.toISOString().split('T')[0],
      allDay: true,
      color: item.originalEvt.color || item.originalEvt.backgroundColor
    };
  });

  calendar.removeAllEvents();
  calendar.addEventSource(singleRowEvents);

  const titleEl = document.getElementById('printTitle');
  const subTitleEl = document.getElementById('printSubTitle');
  if (titleEl) titleEl.textContent = `Oversikt – ${selectedCategory}`;
  if (subTitleEl) subTitleEl.textContent = `Skoleåret ${startYear}/${startYear + 1}`;

  if (typeof hideContextMenu === 'function') hideContextMenu();
  if (typeof hideSelectionPopover === 'function') hideSelectionPopover();

  requestAnimationFrame(() => {
    setTimeout(() => {
      window.print();
      
      calendar.changeView(originalView);
      calendar.gotoDate(originalDate);
      updateCalendarEvents(); 
    }, 400);
  });
});
