/* ==========================================================================
   DEL 1 & DEL 2: GLOBALE VARIABLER, HJELPEFUNKSJONER OG TIMELINE-RENDER
   ========================================================================== */

"use strict";

// 1. Globale variabler og tilstander
let calendar = null;
let activeEvent = null;
let selectedCategories = [];
let rawEvents = [];
let deletedStaticEventIds = new Set();
let activeSelectedCategory = "";
let miniCalCurrentDate = new Date();
let currentSelection = null;

// Fargekart for kategorier
const categoryColors = {
  '1. trinn': '#ef4444',
  '2. trinn': '#f97316',
  '3. trinn': '#f59e0b',
  '4. trinn': '#10b981',
  '5. trinn': '#06b6d4',
  '6. trinn': '#3b82f6',
  '7. trinn': '#8b5cf6',
  'Fellesaktiviteter': '#ec4899',
  'DKS': '#6366f1',
  'Kartlegging': '#14b8a6',
  'Svømming': '#0284c7',
  'Møter': '#64748b',
  'UiA': '#a855f7',
  'Bursdag': '#f43f5e'
};

// Alias-kartlegging for kategorier
const categoryAliases = {
  'felles': 'Fellesaktiviteter',
  'fellesaktiviteter': 'Fellesaktiviteter',
  'fellesaktivitet': 'Fellesaktiviteter',
  'svømming': 'Svømming',
  'svomme': 'Svømming',
  'dks': 'DKS',
  'bursdag': 'Bursdag',
  'bursdager': 'Bursdag',
  'kartlegging': 'Kartlegging',
  'kartlegginger': 'Kartlegging',
  'prøve': 'Kartlegging',
  'test': 'Kartlegging',
  'møter': 'Møter',
  'møte': 'Møter',
  'foreldremøte': 'Møter',
  'fellesmøte': 'Møter',
  'samtaler': 'Møter',
  'uia': 'UiA',
  'praksis': 'UiA',
  'student': 'UiA',
  'studenter': 'UiA'
};

// 2. Hjelpefunksjon for å hente kategorifarge
function getCategoryColor(groupName) {
  if (!groupName) return '#3788d8';
  const rawGroup = String(groupName).toLowerCase().trim();
  const targetCategory = categoryAliases[rawGroup] || groupName;
  
  const matchedKey = Object.keys(categoryColors).find(
    k => k.toLowerCase() === targetCategory.toLowerCase()
  );
  return categoryColors[matchedKey] || categoryColors[groupName] || '#3788d8';
}

// 3. Åpne kategori-modal
window.openCategoryModal = window.openCategoryCalendar = window.showCategoryModal = function(categoryName) {
  activeSelectedCategory = categoryName || "1. trinn";

  const titleEl = document.getElementById('categoryModalTitle');
  if (titleEl) {
    titleEl.textContent = `📅 Kalender for ${activeSelectedCategory}`;
  }

  const isTrinn = /([1-7]\.\s*trinn)/i.test(activeSelectedCategory);
  const gridBtn = document.getElementById('btnCategoryModalGrid');
  if (gridBtn) {
    gridBtn.style.display = isTrinn ? 'inline-flex' : 'none';
  }

  renderCategoryTimeline(activeSelectedCategory);

  const modal = document.getElementById('categoryModal');
  if (modal) {
    modal.classList.add('active', 'show');
    modal.style.display = 'flex';
  }
};

// 4. Global listener for modal-knapper
window.addEventListener('click', (e) => {
  // Lukk modal
  if (e.target.closest('#categoryModalCloseX') || e.target.closest('#btnCategoryModalClose')) {
    const modal = document.getElementById('categoryModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show', 'active');
    }
  }

  // Utskrift
  if (e.target.closest('#btnPrintCategory') || e.target.closest('#btnCategoryModalPrint')) {
    document.body.classList.add('printing-category');
    
    const cleanup = () => {
      document.body.classList.remove('printing-category');
      window.removeEventListener('afterprint', cleanup);
    };
    
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 150);
  }

  // Matrise-knapp
  if (e.target.closest('#btnCategoryModalGrid')) {
    if (typeof openGridOverview === 'function') {
      openGridOverview(activeSelectedCategory);
    } else {
      console.warn("Funksjonen openGridOverview er ikke definert.");
    }
  }
});

// 5. Render-funksjon som bygger tidslinjen i #categoryEventsList
function renderCategoryTimeline(selectedCat, filterSearch = '') {
  const container = document.getElementById('categoryEventsList');
  if (!container) return;
  container.innerHTML = '';

  const categories = ['Trinn/Annet', 'Fellesaktiviteter', 'DKS', 'Kartlegging', 'Svømming', 'Møter'];

  // Skoleår-uker (Uke 32–52 -> Uke 1–25)
  const schoolWeeks = [];
  for (let w = 32; w <= 52; w++) schoolWeeks.push(w);
  for (let w = 1; w <= 25; w++) schoolWeeks.push(w);

  function getISOWeek(d) {
    if (!d || isNaN(d.getTime())) return null;
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  function extractDateAndWeek(evt) {
    const ext = evt.extendedProps || evt;
    const raw = evt.start || evt.startDate || evt.startStr || ext.start || ext.startDate;

    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return { 
          week: getISOWeek(d), 
          dateStr: d.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) 
        };
      }
    }

    const strText = `${evt.title || ''} ${ext.description || ''}`.toLowerCase();
    const ukeMatch = strText.match(/uke\s*(\d+)/);
    if (ukeMatch) return { week: parseInt(ukeMatch[1], 10), dateStr: '' };

    return { week: null, dateStr: '' };
  }

  function mapCategory(evt) {
    const ext = evt.extendedProps || evt;
    const grp = (ext.group || evt.group || '').toLowerCase();
    const text = `${evt.title || ''} ${ext.description || ''} ${grp}`.toLowerCase();

    if (grp.includes('felles') || text.includes('felles') || text.includes('samling') || text.includes('beintøft') || text.includes('fadder')) return 'Fellesaktiviteter';
    if (grp.includes('dks') || text.includes('dks') || text.includes('kultur')) return 'DKS';
    if (grp.includes('kartlegging') || text.includes('kartlegg') || text.includes('prøv') || text.includes('nasjonal')) return 'Kartlegging';
    if (grp.includes('svømming') || text.includes('svømm')) return 'Svømming';
    if (grp.includes('møte') || text.includes('møte') || text.includes('foreldre') || text.includes('samtale')) return 'Møter';
    
    return 'Trinn/Annet';
  }

  // Hent alle event-kilder
  const moter = typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents() : [];
  const uia = typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents() : [];
  const felles = typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents('2026-2027') : [];
  const dks = typeof getDKSAktiviteterSomEvents === 'function' ? getDKSAktiviteterSomEvents() : [];
  const svomme = typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents('2026-2027') : [];
  const kartlegging = typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents() : [];
  const calEvents = (calendar && typeof calendar.getEvents === 'function') ? calendar.getEvents() : [];

  const rawList = [
    ...felles, ...dks, ...svomme, ...kartlegging, ...moter, ...uia, ...calEvents,
    ...(typeof rawEvents !== 'undefined' ? rawEvents : [])
  ];

  const targetName = (selectedCat || '').trim().toLowerCase();
  const trinnNum = (selectedCat || '').replace(/\D/g, '');

  let eventsList = [];
  const seenIds = new Set();

  rawList.forEach(evt => {
    const ext = evt.extendedProps || evt;
    const title = evt.title || ext.title || ext.rawTitle || '';
    const desc = ext.description || '';
    const group = (ext.group || evt.group || '').toLowerCase();
    
    let trinnValues = ext.trinn || evt.trinn || [];
    if (typeof trinnValues === 'string') {
      trinnValues = trinnValues.split(',').map(s => s.trim());
    }

    const uniqueKey = `${title}_${ext.startDate || evt.start}`;
    if (seenIds.has(uniqueKey)) return;

    const fullText = `${title} ${desc} ${group} ${trinnValues.join(' ')}`.toLowerCase();

    const matchesSelectedTrinn = trinnValues.some(t => {
      const cleanT = String(t).toLowerCase();
      return cleanT.includes(targetName) || (trinnNum && cleanT.includes(`${trinnNum}. trinn`));
    });

    const matchesGeneral = fullText.includes('alle trinn') || fullText.includes('1.-7. trinn');
    const matchesGroup = group === targetName;

    if (matchesSelectedTrinn || matchesGeneral || matchesGroup) {
      seenIds.add(uniqueKey);
      const parsed = extractDateAndWeek(evt);

      eventsList.push({
        title: title,
        week: parsed.week,
        category: mapCategory(evt),
        dateStr: parsed.dateStr,
        fullText: fullText
      });
    }
  });

  if (filterSearch) {
    eventsList = eventsList.filter(e => e.fullText.includes(filterSearch.toLowerCase()));
  }

  // Generer Tabell-HTML
  let tableHtml = `
    <div style="overflow-x: auto; max-height: 520px; overflow-y: auto; border: 1px solid #cbd5e1; border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: left; background: #fff;">
        <thead>
          <tr style="background: #f1f5f9; color: #334155; position: sticky; top: 0; z-index: 10; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; width: 70px; border-right: 1px solid #cbd5e1; text-align: center;">Uke</th>
            ${categories.map(cat => `<th style="padding: 10px; border-right: 1px solid #cbd5e1; min-width: 110px;">${cat}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `;

  schoolWeeks.forEach(w => {
    const weekEvents = eventsList.filter(e => e.week === w);
    if (weekEvents.length === 0) return;

    tableHtml += `<tr style="border-bottom: 1px solid #e2e8f0;">`;
    tableHtml += `<td style="padding: 8px; font-weight: bold; background: #f8fafc; text-align: center; border-right: 1px solid #cbd5e1; color: #0284c7;">Uke ${w}</td>`;

    categories.forEach(cat => {
      const cellEvents = weekEvents.filter(e => e.category === cat);
      tableHtml += `<td style="padding: 6px; border-right: 1px solid #e2e8f0; vertical-align: top;">`;
      cellEvents.forEach(evt => {
        tableHtml += `
          <div style="background: #f0f9ff; border-left: 3px solid #0284c7; padding: 6px; margin-bottom: 4px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div style="font-weight: 600; color: #0f172a;">${evt.title}</div>
            ${evt.dateStr ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">📅 ${evt.dateStr}</div>` : ''}
          </div>
        `;
      });
      tableHtml += `</td>`;
    });

    tableHtml += `</tr>`;
  });

  const noWeekEvents = eventsList.filter(e => e.week === null);
  if (noWeekEvents.length > 0) {
    tableHtml += `<tr style="border-bottom: 1px solid #e2e8f0; background: #fffbebfb;">`;
    tableHtml += `<td style="padding: 8px; font-weight: bold; background: #fef3c7; text-align: center; border-right: 1px solid #cbd5e1; color: #b45309;">Uten uke</td>`;

    categories.forEach(cat => {
      const cellEvents = noWeekEvents.filter(e => e.category === cat);
      tableHtml += `<td style="padding: 6px; border-right: 1px solid #e2e8f0; vertical-align: top;">`;
      cellEvents.forEach(evt => {
        tableHtml += `
          <div style="background: #ffffff; border-left: 3px solid #f59e0b; padding: 6px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #fde68a;">
            <div style="font-weight: 600; color: #0f172a;">${evt.title}</div>
            ${evt.dateStr ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">📅 ${evt.dateStr}</div>` : ''}
          </div>
        `;
      });
      tableHtml += `</td>`;
    });

    tableHtml += `</tr>`;
  }

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHtml;
}

/* ==========================================================================
   DEL 3 & DEL 4: FULLCALENDAR, FIRESTORE REALTIME, VALIDERINGS- OG MODALLOGIKK
   ========================================================================== */

// --- HJELPEFUNKSJONER FOR ISO-UKE ---
function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function updateHeaderTitleWithWeek(date) {
  const titleEl = document.querySelector('.fc-toolbar-title');
  if (!titleEl || !date) return;
  const weekNum = getISOWeekNumber(date);
  const monthName = date.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' });
  titleEl.textContent = `Uke ${weekNum} – ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
}

// --- INITIALISER FULLCALENDAR ---
document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'nb',
    firstDay: 1,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,schoolYearList'
    },
    datesSet: (info) => {
      updateHeaderTitleWithWeek(info.view.currentStart);
    },
    selectable: true,
    select: (info) => {
      currentSelection = info;
      if (typeof openEventModalForCreate === 'function') {
        openEventModalForCreate(info.startStr, info.endStr);
      }
    },
    eventClick: (info) => {
      activeEvent = info.event;
      if (typeof openViewModal === 'function') {
        openViewModal(info.event);
      }
    }
  });

  calendar.render();

  // Initialiser Firestore Realtime-lytter dersom eventsRef og onSnapshot er tilgjengelig
  if (typeof eventsRef !== 'undefined' && typeof onSnapshot === 'function') {
    onSnapshot(eventsRef, (snapshot) => {
      rawEvents = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const grp = data.group || '';
        const color = getCategoryColor(grp);

        return {
          id: docSnap.id,
          title: data.title || 'Uten tittel',
          start: data.startTime ? `${data.startDate}T${data.startTime}` : data.startDate,
          end: data.endTime ? `${data.endDate || data.startDate}T${data.endTime}` : (data.endDate || data.startDate),
          allDay: !data.startTime,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            ...data,
            rawTitle: data.title
          }
        };
      });

      updateCalendarEvents();
    }, (error) => {
      console.error("Feil ved Firestore snapshot-lytting:", error);
    });
  }

  renderFilters();
});


// --- PRESIS TRINN- OG KATEGORIVALIDERINGS-LOGIKK ---
function isEventInSelectedCategories(event) {
  if (!selectedCategories || selectedCategories.length === 0) return false;

  const ext = event.extendedProps || event;
  const rawGroup = (ext.group || event.group || '').trim();
  const mappedGroup = (categoryAliases[rawGroup.toLowerCase()] || rawGroup).toLowerCase();
  
  let trinnArray = ext.trinn || event.trinn || [];
  if (typeof trinnArray === 'string') {
    trinnArray = trinnArray.split(',').map(s => s.trim());
  }
  
  const title = (event.title || ext.rawTitle || '').toLowerCase();
  const description = (ext.description || '').toLowerCase();

  for (const cat of selectedCategories) {
    const catLower = cat.toLowerCase().trim();
    const isTrinnCategory = catLower.endsWith('. trinn');

    // 1. Direkte match på Kategori/Gruppe
    if (mappedGroup === catLower) return true;

    // Spesialhåndtering: Kartlegging
    if ((mappedGroup === 'kartlegging' || mappedGroup === 'kartlegginger') && 
        (catLower === 'kartlegging' || catLower === 'kartlegginger')) {
      return true;
    }

    // 2. Sjekk om hendelsen gjelder et spesifikt trinn
    if (isTrinnCategory) {
      if (Array.isArray(trinnArray) && trinnArray.some(t => t.toLowerCase().trim() === catLower)) {
        return true;
      }

      const altInnhold = `${title} ${description}`.toLowerCase();
      if (altInnhold.includes("alle trinn") || altInnhold.includes("1.-7. trinn") || mappedGroup === "fellesaktiviteter") {
        return true;
      }

      const trinnNummer = parseInt(cat.split('.')[0].trim(), 10);

      if (!isNaN(trinnNummer)) {
        const trinnRegex = new RegExp(`\\b${trinnNummer}\\.\\s*trinn\\b|\\b${trinnNummer}[a-d]\\b`, 'i');
        if (trinnRegex.test(title) || trinnRegex.test(description)) {
          return true;
        }

        const rangeMatch = altInnhold.match(/(\d+)\s*[\.\-]\s*(\d+)\.?\s*trinn/i);
        if (rangeMatch) {
          const startTrinn = parseInt(rangeMatch[1], 10);
          const sluttTrinn = parseInt(rangeMatch[2], 10);
          if (trinnNummer >= startTrinn && trinnNummer <= sluttTrinn) {
            return true;
          }
        }

        const harEksplisittTrinn = /\b[1-7]\.\s*trinn\b/i.test(altInnhold);
        if (!harEksplisittTrinn) {
          if (altInnhold.includes("heståsen") && trinnNummer >= 1 && trinnNummer <= 3) return true;
          if (altInnhold.includes("brattbakken") && trinnNummer >= 4 && trinnNummer <= 7) return true;
        }
      }
    }

    // 3. Samlekategorier (Skolesteder)
    if (cat === "Alle på Heståsen" && 
       (title.includes("heståsen") || trinnArray.some(t => ["1. trinn", "2. trinn", "3. trinn"].includes(t)))) {
      return true;
    }
    if (cat === "Alle på Brattbakken" && 
       (title.includes("brattbakken") || trinnArray.some(t => ["4. trinn", "5. trinn", "6. trinn", "7. trinn"].includes(t)))) {
      return true;
    }
  }

  return false;
}


// --- KALENDER OPPDATERING ---
function updateCalendarEvents() {
  let filteredBursdagEvents = [];
  if (typeof getBirthdayEvents === 'function' && calendar) {
    const currentYear = calendar.getDate().getFullYear();
    const rawBursdager = getBirthdayEvents(currentYear);
    filteredBursdagEvents = rawBursdager.filter(event => isEventInSelectedCategories(event));
  }

  const getFellesFn = window.getFellesaktiviteterSomEvents || (typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents : null);
  const getDksFn = window.getDKSAktiviteterSomEvents || window.getDksAktiviteterSomEvents || (typeof getDKSAktiviteterSomEvents === 'function' ? getDKSAktiviteterSomEvents : (typeof getDksAktiviteterSomEvents === 'function' ? getDksAktiviteterSomEvents : null));
  const getSvommeFn = window.getSvommeAktiviteterSomEvents || (typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents : null);
  const getMoterFn = window.getMoteAktiviteterSomEvents || (typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents : null);
  const getUiaFn = window.getUiAAktiviteterSomEvents || (typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents : null);
  const getKartleggingFn = window.getKartleggingerSomEvents || (typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents : null);

  const rawFelles = getFellesFn ? getFellesFn() : (typeof fellesEventsFromJs !== 'undefined' ? fellesEventsFromJs : []);
  const rawDks = getDksFn ? getDksFn() : (typeof dksEventsFromJs !== 'undefined' ? dksEventsFromJs : []);
  const rawSvomme = getSvommeFn ? getSvommeFn() : (typeof svommeEventsFromJs !== 'undefined' ? svommeEventsFromJs : []);
  const rawMoter = getMoterFn ? getMoterFn() : (typeof moterEventsFromJs !== 'undefined' ? moterEventsFromJs : []);
  const rawUia = getUiaFn ? getUiaFn() : (typeof uiaEventsFromJs !== 'undefined' ? uiaEventsFromJs : []);
  const rawKartlegginger = getKartleggingFn ? getKartleggingFn() : (typeof kartleggingEventsFromJs !== 'undefined' ? kartleggingEventsFromJs : []);

  const schoolEvents = typeof schoolEventsFromJs !== 'undefined' ? schoolEventsFromJs : [];

  const processStaticEvents = (events) => {
    return events
      .filter(evt => !deletedStaticEventIds.has(evt.id))
      .filter(event => isEventInSelectedCategories(event))
      .map(evt => {
        const grp = evt.extendedProps?.group || evt.group || '';
        const c = getCategoryColor(grp) || evt.backgroundColor || evt.color || '#3788d8';
        
        return {
          ...evt,
          backgroundColor: c,
          borderColor: c,
          extendedProps: {
            ...evt.extendedProps,
            isStatic: true
          }
        };
      });
  };

  const filteredUserEvents = rawEvents.filter(event => isEventInSelectedCategories(event));

  const allEvents = [
    ...schoolEvents, 
    ...processStaticEvents(rawFelles), 
    ...processStaticEvents(rawDks), 
    ...processStaticEvents(rawSvomme), 
    ...processStaticEvents(filteredBursdagEvents), 
    ...processStaticEvents(rawKartlegginger), 
    ...processStaticEvents(rawMoter),
    ...processStaticEvents(rawUia),
    ...filteredUserEvents
  ];

  if (calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(allEvents);
  }
}


// --- MODAL & HANDLERE ---
document.getElementById('modalCloseX')?.addEventListener('click', closeModal);
document.getElementById('formCancelBtn')?.addEventListener('click', closeModal);
document.getElementById('viewCancelBtn')?.addEventListener('click', closeModal);

function closeModal() {
  const modal = document.getElementById('eventModal') || document.getElementById('categoryModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show', 'active');
  }
}

function updateModalAdminButtons() {
  const editBtn = document.getElementById('viewEditBtn');
  const deleteBtn = document.getElementById('viewDeleteBtn');

  if (!activeEvent || activeEvent.isSchoolRoute) {
    if (editBtn) editBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    return;
  }

  const canModify = typeof canUserModifyEvent === 'function' ? canUserModifyEvent(activeEvent) : true;

  if (editBtn) editBtn.style.display = canModify ? 'inline-block' : 'none';
  if (deleteBtn) deleteBtn.style.display = canModify ? 'inline-block' : 'none';
}

document.getElementById('viewEditBtn')?.addEventListener('click', () => {
  if (typeof canUserModifyEvent === 'function' && !canUserModifyEvent(activeEvent)) {
    alert("Du har ikke tilgang til å redigere denne hendelsen.");
    return;
  }

  if (activeEvent && !activeEvent.isSchoolRoute) {
    const ext = activeEvent.extendedProps || {};
    
    document.getElementById('eventId').value = activeEvent.id || '';
    document.getElementById('title').value = activeEvent.title || ext.title || '';
    document.getElementById('group').value = ext.group || activeEvent.group || '';
    document.getElementById('startDate').value = ext.startDate || '';
    document.getElementById('startTime').value = ext.startTime || '';
    document.getElementById('endDate').value = ext.endDate || '';
    document.getElementById('endTime').value = ext.endTime || '';
    document.getElementById('description').value = ext.description || '';

    const rawTrinn = ext.trinn || activeEvent.trinn || [];
    const trinnArray = Array.isArray(rawTrinn) ? rawTrinn : [rawTrinn];

    document.querySelectorAll('input[name="trinnOption"]').forEach(cb => {
      cb.checked = trinnArray.some(t => String(t).trim().toLowerCase() === cb.value.trim().toLowerCase());
    });

    if (typeof showFormMode === 'function') {
      showFormMode("Rediger avtale", false);
    }
  }
});

document.getElementById('viewDeleteBtn')?.addEventListener('click', async () => {
  if (typeof canUserModifyEvent === 'function' && !canUserModifyEvent(activeEvent)) {
    alert("Du har ikke tilgang til å slette denne hendelsen.");
    return;
  }

  if (!activeEvent || activeEvent.isSchoolRoute) return;

  const ext = activeEvent.extendedProps || {};

  if (ext.isStatic || activeEvent.isStatic) {
    if (confirm(`Vil du slette den faste hendelsen "${activeEvent.title}" for alle?`)) {
      const targetId = activeEvent.id;
      closeModal();
      try {
        if (typeof setDoc === 'function' && typeof doc === 'function' && typeof db !== 'undefined') {
          const currentUserEmail = (typeof firebase !== 'undefined' && firebase.auth().currentUser) ? firebase.auth().currentUser.email : 'ukjent';
          await setDoc(doc(db, "deleted_static_events", targetId), {
            deletedBy: currentUserEmail,
            deletedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Feil ved sletting av statisk hendelse:", err);
        alert("Kunne ikke slette hendelsen.");
      }
    }
    return;
  }

  if (ext.recurringSeriesId) {
    const normalFooter = document.getElementById('normalFooter');
    const deleteMode = document.getElementById('deleteConfirmMode');
    if (normalFooter) normalFooter.style.display = 'none';
    if (deleteMode) deleteMode.style.display = 'flex';
  } else {
    if (confirm(`Er du sikker på at du vil slette "${activeEvent.title}"?`)) {
      const targetId = activeEvent.id;
      closeModal();
      try {
        if (typeof deleteDoc === 'function' && typeof doc === 'function' && typeof db !== 'undefined') {
          await deleteDoc(doc(db, "school_events", targetId));
        }
      } catch (err) {
        console.error("Feil ved sletting:", err);
        alert("Kunne ikke slette hendelsen.");
      }
    }
  }
});

document.getElementById('cancelDeleteModeBtn')?.addEventListener('click', () => {
  const deleteMode = document.getElementById('deleteConfirmMode');
  const normalFooter = document.getElementById('normalFooter');
  if (deleteMode) deleteMode.style.display = 'none';
  if (normalFooter) normalFooter.style.display = 'flex';
});

document.getElementById('deleteSingleBtn')?.addEventListener('click', async () => {
  if (!activeEvent) return;
  const targetId = activeEvent.id;
  closeModal();
  try {
    if (typeof deleteDoc === 'function' && typeof doc === 'function' && typeof db !== 'undefined') {
      await deleteDoc(doc(db, "school_events", targetId));
    }
  } catch (err) {
    console.error("Feil ved sletting:", err);
    alert("Kunne ikke slette hendelsen.");
  }
});

document.getElementById('deleteFutureBtn')?.addEventListener('click', async () => {
  const ext = activeEvent?.extendedProps || {};
  if (!activeEvent || !ext.recurringSeriesId) return;
  
  const seriesId = ext.recurringSeriesId;
  const currentDate = ext.startDate;

  closeModal();

  try {
    if (typeof query === 'function' && typeof where === 'function' && typeof getDocs === 'function' && typeof db !== 'undefined') {
      const q = query(
        eventsRef, 
        where("recurringSeriesId", "==", seriesId),
        where("startDate", ">=", currentDate)
      );
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "school_events", d.id)));
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.error("Feil ved sletting av fremtidige hendelser:", err);
    alert("Kunne ikke slette hendelsene.");
  }
});

document.getElementById('deleteAllSeriesBtn')?.addEventListener('click', async () => {
  const ext = activeEvent?.extendedProps || {};
  if (!activeEvent || !ext.recurringSeriesId) return;
  
  const seriesId = ext.recurringSeriesId;
  closeModal();

  try {
    if (typeof query === 'function' && typeof where === 'function' && typeof getDocs === 'function' && typeof db !== 'undefined') {
      const q = query(eventsRef, where("recurringSeriesId", "==", seriesId));
      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(d => deleteDoc(doc(db, "school_events", d.id)));
      await Promise.all(deletePromises);
    }
  } catch (err) {
    console.error("Feil ved sletting av serien:", err);
    alert("Kunne ikke slette hendelsene.");
  }
});


// --- LAGRE/OPPDATERE SKJEMA ---
document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const eventId = document.getElementById('eventId').value;
  const canModify = typeof canUserModifyEvent === 'function' ? canUserModifyEvent(activeEvent) : true;
  const canCreate = typeof canUserCreateEvent === 'function' ? canUserCreateEvent() : true;
  const hasPermission = eventId ? canModify : canCreate;

  if (!hasPermission) {
    alert("Du har ikke tilgang til å lagre denne hendelsen.");
    return;
  }

  const isRecurring = document.getElementById('isRecurringMode')?.value === "true";
  const repeatPattern = document.getElementById('repeatPattern')?.value;
  
  const title = document.getElementById('title').value;
  const group = document.getElementById('group').value;
  const startDateStr = document.getElementById('startDate').value;
  const startTime = document.getElementById('startTime').value;
  const endDateStr = document.getElementById('endDate').value;
  const endTime = document.getElementById('endTime').value;
  const description = document.getElementById('description').value;

  const selectedTrinn = Array.from(document.querySelectorAll('input[name="trinnOption"]:checked'))
    .map(cb => cb.value);

  closeModal();

  const formatDate = (d) => d.toISOString().split('T')[0];

  try {
    if (eventId) {
      // Redigering
      const singleData = {
        title, 
        group, 
        trinn: selectedTrinn,
        startDate: startDateStr, 
        startTime: startTime || null,
        endDate: endDateStr || startDateStr, 
        endTime: endTime || null,
        description: description || '', 
        updatedAt: new Date().toISOString()
      };
      if (typeof updateDoc === 'function' && typeof doc === 'function' && typeof db !== 'undefined') {
        await updateDoc(doc(db, "school_events", eventId), singleData);
      }
    } else if (isRecurring) {
      // Opprettelse av repeterende serie
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
          trinn: selectedTrinn,
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

      if (typeof addDoc === 'function' && typeof eventsRef !== 'undefined') {
        await Promise.all(eventsToCreate.map(evt => addDoc(eventsRef, evt)));
      }
    } else {
      // Opprettelse av enkelthendelse
      const singleData = {
        title, 
        group, 
        trinn: selectedTrinn,
        startDate: startDateStr, 
        startTime: startTime || null,
        endDate: endDateStr || startDateStr, 
        endTime: endTime || null,
        description: description || '', 
        createdAt: new Date().toISOString()
      };
      if (typeof addDoc === 'function' && typeof eventsRef !== 'undefined') {
        await addDoc(eventsRef, singleData);
      }
    }
  } catch (error) {
    console.error("Feil ved lagring: ", error);
    alert("Feil ved lagring til databasen.");
  }
});


// --- RENDER MENY / FILTRE ---
function renderFilters() {
  const filterContainer = document.getElementById('filterList');
  if (!filterContainer) return;
  filterContainer.innerHTML = '';

  Object.keys(categoryColors).forEach(cat => {
    const item = document.createElement('div');
    item.className = 'filter-item-vert';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedCategories.includes(cat);
    checkbox.value = cat;
    
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
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
    const catColor = categoryColors[cat] || '#3788d8';
    colorDot.style.backgroundColor = catColor;

    const labelText = document.createElement('span');
    labelText.className = 'filter-label';
    labelText.textContent = cat;

    const clickArea = document.createElement('div');
    clickArea.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer;';
    clickArea.appendChild(colorDot);
    clickArea.appendChild(labelText);

    clickArea.addEventListener('click', () => {
      if (typeof openCategoryModal === 'function') {
        openCategoryModal(cat);
      }
    });

    item.appendChild(checkbox);
    item.appendChild(clickArea);
    
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