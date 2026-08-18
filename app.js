import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"; // <-- Utvidet med de ekstra funksjonene

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
import { getBirthdayEvents, ALLOWED_USER_EMAILS } from './ansatte.js'; // 🔑 Samlet på én linje
import { getKartleggingerSomEvents } from './Kartlegging.js';
import { getMoteAktiviteterSomEvents } from './moter.js';
import { getUiAAktiviteterSomEvents } from './uia.js';

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

// 1. INITIALISER FIREBASE OG FIRESTORE FØRST!
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const eventsRef = collection(db, "school_events");

const categoryColors = {
  // Trinn
  "1. trinn": "#e74c3c", // Rød
  "2. trinn": "#e67e22", // Oransje
  "3. trinn": "#f1c40f", // Gul
  "4. trinn": "#2ecc71", // Grønn
  "5. trinn": "#1abc9c", // Turkis
  "6. trinn": "#3498db", // Blå
  "7. trinn": "#9b59b6", // Lila

  // Spesifikke fag og aktiviteter
  "DKS": "#d35400",              // Mørk oransje / brent murtone
  "Svømming": "#00cec9",        // Klar cyan / vannblå
  "Fellesaktiviteter": "#2c3e50",// Mørk skiferblå
  "SFO": "#ff7675",              // Korall / varm rosa
  "Kartlegging": "#6c5ce7",   // Dyp indigo / lilla-blå
  "Møter": "#c0392b",          // Dyp rød (signal/varselfarge)
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

// ==========================================
// TILGANGER OG INNLOGGINGSHÅNDTERING
// ==========================================

// --- ADMIN OG TILGANGSBEGRENSNING ---
const ADMIN_EMAILS = [
  '77tor@ikrs.no',
  '75thomas@ikrs.no',
  '72janne@ikrs.no',
  '62marit3@ikrs.no'
];

let deletedStaticEventIds = new Set();

// 1. Sjekker om nåværende bruker har Hoved-Admin rettigheter
function isCurrentUserAdmin() {
  const user = auth.currentUser;
  return Boolean(user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

// 2. 🔑 Sjekker om bruker har lov til å OPPRETTE nye hendelser (må stå i enten ADMIN_EMAILS eller ALLOWED_USER_EMAILS)
function canUserCreateEvent() {
  const user = auth.currentUser;
  if (!user || !user.email) return false;

  const userEmail = user.email.toLowerCase();
  
  // Sjekker om e-posten finnes i admin-listen ELLER i den importerte listen fra ansatte.js
  const isAdmin = ADMIN_EMAILS.includes(userEmail);
  const isAllowedUser = typeof ALLOWED_USER_EMAILS !== 'undefined' && ALLOWED_USER_EMAILS.some(e => e.toLowerCase() === userEmail);

  return isAdmin || isAllowedUser;
}

// 3. 🔑 TILGANGSKONTROLL FOR ENDRING/SLETTING
function canUserModifyEvent(eventObj) {
  // Sjekk først om brukeren i det hele tatt har skrivetilgang
  if (!canUserCreateEvent()) return false; 
  
  // Hoved-Admin kan alt (inkl. .js-hendelser)
  if (isCurrentUserAdmin()) return true;  

  // Rene skoleruter (fridager/planleggingsdager) kan aldri endres
  if (eventObj?.isSchoolRoute || eventObj?.extendedProps?.isSchoolRoute) return false;

  // Sjekk om hendelsen kommer fra en statisk .js-fil (DKS, Svømming, Kartlegging osv.)
  const isStaticJsEvent = Boolean(eventObj?.isStatic || eventObj?.extendedProps?.isStatic);

  // Godkjente ansatte kan endre/slette alt UNNTATT .js-hendelser
  return !isStaticJsEvent;
}

// 🔑 Lytter på innloggingsstatus fra Firebase Auth
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logget inn i Firebase som:", user.email);
  } else {
    console.log("Ingen bruker er logget inn i Firebase Auth ennå.");
  }

  // Oppdaterer knapp og e-post i sidepanelet
  updateAuthUI(user);

  // Tvinger en oppdatering av kalenderen når Firebase har avklart hvem du er
  if (typeof updateCalendarEvents === 'function') {
    updateCalendarEvents();
  }
});

// Lytter på slettede statiske hendelser
onSnapshot(collection(db, 'deleted_static_events'), (snapshot) => {
  deletedStaticEventIds = new Set(snapshot.docs.map(doc => doc.id));
  if (typeof updateCalendarEvents === 'function') {
    updateCalendarEvents();
  }
});

// 🔑 INNLOGGING / UTLOGGINGSHÅNDTERING
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');

// Oppdaterer brukergrensesnittet basert på om noen er logget inn
function updateAuthUI(user) {
  if (!loginBtn || !userInfo) return;

  if (user) {
    const displayName = user.email ? user.email.split('@')[0] : 'Bruker';
    userInfo.textContent = `👤 ${displayName}`;
    loginBtn.textContent = '🚪 Logg ut';
    loginBtn.onclick = handleLogout;
  } else {
    userInfo.textContent = '';
    loginBtn.textContent = '🔑 Logg inn';
    loginBtn.onclick = handleLogin;
  }
}

// Logg inn med Google Popup
async function handleLogin() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Feil ved innlogging:", error);
    alert("Klarte ikke å logge inn: " + error.message);
  }
}

// Logg ut
async function handleLogout() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Feil ved utlogging:", error);
  }
}



function parseSchoolYearsData() {
  if (typeof schoolYearsData === 'undefined' || !schoolYearsData) return;
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
const ansatteEventsFromJs = typeof getBirthdayEvents === 'function'
  ? getBirthdayEvents(2026)
  : [];
const kartleggingEventsFromJs = typeof getKartleggingerSomEvents === 'function'
  ? getKartleggingerSomEvents()
  : [];
const moterEventsFromJs = typeof getMoteAktiviteterSomEvents === 'function'
  ? getMoteAktiviteterSomEvents()
  : [];

let rawEvents = [];
let selectedCategories = Object.keys(categoryColors);
let calendar;
let activeEvent = null;
let currentSelection = null;
const contextMenu = document.getElementById('contextMenu');

let miniCalCurrentDate = new Date();


// GENERER KATEGORI-LISTE I SIDEPANELET (Med synlige farger og 🔍)
function renderCategoryFilters() {
  const filterList = document.getElementById('filterList');
  if (!filterList) return;

  filterList.innerHTML = '';

  Object.entries(categoryColors).forEach(([categoryName, color]) => {
    const catItem = document.createElement('div');
    catItem.className = 'category-row';
    catItem.style.cssText = 'display: flex !important; align-items: center !important; justify-content: space-between !important; width: 100% !important; padding: 4px 6px; margin-bottom: 3px; border-radius: 4px; cursor: pointer;';

    const safeId = categoryName.replace(/[^a-zA-Z0-9]/g, '_');

    catItem.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
        <input type="checkbox" id="cat_${safeId}" value="${categoryName}" checked style="cursor: pointer; margin: 0;" />
        <span style="background-color: ${color} !important; width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0;"></span>
        <label for="cat_${safeId}" style="cursor: pointer; font-size: 0.85rem; color: #334155; margin: 0; user-select: none;">${categoryName}</label>
      </div>
      <span class="preview-btn" title="Se ukeoversikt for ${categoryName}" style="cursor: pointer; font-size: 14px; padding: 2px 4px; user-select: none; line-height: 1;">
        🔍
      </span>
    `;

    catItem.addEventListener('mouseenter', () => { catItem.style.backgroundColor = '#f1f5f9'; });
    catItem.addEventListener('mouseleave', () => { catItem.style.backgroundColor = 'transparent'; });

    // Sjekkboks-filtrering
    catItem.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!selectedCategories.includes(categoryName)) selectedCategories.push(categoryName);
      } else {
        selectedCategories = selectedCategories.filter(c => c !== categoryName);
      }
      if (typeof calendar !== 'undefined' && calendar) calendar.refetchEvents();
    });

    // Åpne MODALEN ved klikk på forstørrelsesglasset 🔍 eller selve raden
    catItem.querySelector('.preview-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openCategoryModal(categoryName);
    });

    filterList.appendChild(catItem);
  });
}


// Bygger en enkel, kompakt linjeliste for enkeltkategorier (DKS, Fellesaktiviteter osv.)
function renderCategorySimpleList(categoryName, events) {
  const container = document.getElementById('categoryEventsList');
  if (!container) return;

  const catLower = categoryName.trim().toLowerCase();

  // 1. Filtrer ut hendelser som tilhører denne kategorien
  let matchedEvents = events.filter(evt => {
    if (typeof deletedStaticEventIds !== 'undefined' && deletedStaticEventIds && deletedStaticEventIds.has(evt.id)) return false;

    const ext = evt.extendedProps || {};
    const grp = (ext.group || evt.group || '').trim().toLowerCase();
    const cat = (ext.category || evt.category || '').trim().toLowerCase();
    const title = (evt.title || ext.rawTitle || '').toLowerCase();
    const desc = (ext.description || '').toLowerCase();

    // Sjekk om kategorinavnet matcher enten gruppe, kategori, tittel eller beskrivelse
    return grp === catLower || cat === catLower || title.includes(catLower) || desc.includes(catLower) ||
           (catLower === 'fellesaktiviteter' && (grp.includes('felles') || title.includes('felles'))) ||
           (catLower === 'dks' && (grp.includes('dks') || title.includes('dks'))) ||
           (catLower === 'kartlegging' && (grp.includes('kartlegg') || title.includes('kartlegg'))) ||
           (catLower === 'svømming' && (grp.includes('svømm') || title.includes('svømm'))) ||
           (catLower === 'møter' && (grp.includes('møte') || title.includes('møte'))) ||
           (catLower === 'uia' && (grp.includes('uia') || title.includes('uia'))) ||
           (catLower === 'sfo' && (grp.includes('sfo') || title.includes('sfo'))) ||
           (catLower === 'sosialt' && (grp.includes('sosialt') || title.includes('sosialt'))) ||
           (catLower === 'bursdag' && (grp.includes('bursdag') || title.includes('bursdag')));
  });

  // 2. Sorter kronologisk fra skolestart (august / uke 33 og utover)
  matchedEvents.sort((a, b) => {
    const dateA = new Date(a.extendedProps?.startDate || a.start || 0);
    const dateB = new Date(b.extendedProps?.startDate || b.start || 0);
    return dateA - dateB;
  });

  if (matchedEvents.length === 0) {
    container.innerHTML = `<div style="padding: 24px; text-align: center; color: #64748b; font-style: italic;">Ingen aktiviteter registrert for ${categoryName}.</div>`;
    return;
  }

  // 3. Bygg linjeliste
  let html = `<div class="category-simple-list" style="display: flex; flex-direction: column; gap: 8px; padding: 4px;">`;

  matchedEvents.forEach(evt => {
    const ext = evt.extendedProps || {};
    
    // Hent dato
    const startDateStr = ext.startDate || (evt.start ? String(evt.start).split('T')[0] : '');
    let dateFormatted = '';
    let weekNum = '';
    
    if (startDateStr) {
      const startObj = new Date(startDateStr + 'T00:00:00');
      if (!isNaN(startObj.getTime())) {
        dateFormatted = startObj.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' });
        // Beregn ukenummer
        const d = new Date(Date.UTC(startObj.getFullYear(), startObj.getMonth(), startObj.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      }
    }

    const startTime = ext.startTime || (evt.start && String(evt.start).includes('T') ? String(evt.start).split('T')[1].substring(0, 5) : '');
    const titleText = evt.title || ext.rawTitle || 'Uten tittel';
    
    let trinnInfo = ext.trinn || evt.trinn || ext.trinnOptions || ext.deltakere || ext.participants || '';
    if (Array.isArray(trinnInfo)) trinnInfo = trinnInfo.join(', ');
    
    const sted = ext.location || ext.sted || '';
    const ansvar = ext.responsible || ext.ansvar || '';
    const desc = ext.description || evt.description || '';

    html += `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 6px; padding: 10px 14px; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${weekNum ? `<span style="background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">Uke ${weekNum}</span>` : ''}
            <strong style="font-size: 0.92rem; color: #0f172a;">${titleText}</strong>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: #475569;">📅 ${dateFormatted} ${startTime ? '⏰ kl. ' + startTime : ''}</span>
        </div>
        <div style="font-size: 0.8rem; color: #334155; display: flex; flex-wrap: wrap; gap: 12px; margin-top: 2px;">
          ${trinnInfo ? `<span>👥 <strong>Målgruppe/Trinn:</strong> ${trinnInfo}</span>` : ''}
          ${sted ? `<span>📍 <strong>Sted:</strong> ${sted}</span>` : ''}
          ${ansvar ? `<span>👤 <strong>Ansvar:</strong> ${ansvar}</span>` : ''}
        </div>
        ${desc ? `<div style="font-size: 0.8rem; color: #475569; background: #f8fafc; padding: 6px 8px; border-radius: 4px; border-left: 2px solid #cbd5e1; margin-top: 4px; white-space: pre-line;">${desc}</div>` : ''}
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}


// Åpne kategorimodal og hent hendelser fra ALLE JS-kilder
function openCategoryModal(categoryInput) {
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('categoryModalTitle');
  
  if (!modal) return;

  const catName = typeof categoryInput === 'object' ? categoryInput.name : categoryInput;
  const isTrinn = /^([1-7]\.\s*trinn)$/i.test(catName.trim());

  // 1. Sett tittel
  if (title) title.textContent = isTrinn ? `📅 Kalender for ${catName}` : `📋 Oversikt: ${catName}`;

  // 2. VELG VISNING
  if (isTrinn) {
    // Trinn beholder ukeskalenderen / tabellen sin
    if (typeof renderCategoryTimeline === 'function') {
      renderCategoryTimeline(catName);
    } else if (typeof renderTrinnTimeline === 'function') {
      renderTrinnTimeline(catName);
    }
  } else {
    // Hent hendelser fra alle .js-kildene dine
    const moterEvents = typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents() : [];
    const uiaEvents = typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents() : [];
    const fellesEvents = typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents('2026-2027') : [];
    const dksEvents = typeof getDKSAktiviteterSomEvents === 'function' ? getDKSAktiviteterSomEvents() : [];
    const svommeEvents = typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents('2026-2027') : [];
    const bursdagEvents = typeof getBirthdayEvents === 'function' ? getBirthdayEvents(2026) : [];
    const kartleggingEvents = typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents() : [];

    const allCombinedEvents = [
      ...fellesEvents,
      ...dksEvents,
      ...svommeEvents,
      ...bursdagEvents,
      ...kartleggingEvents,
      ...moterEvents,
      ...uiaEvents,
      ...(typeof schoolEventsFromJs !== 'undefined' ? schoolEventsFromJs : []),
      ...(typeof rawEvents !== 'undefined' ? rawEvents : [])
    ];

    renderCategorySimpleList(catName, allCombinedEvents);
  }

  // 3. GENERER FOOTER OG KOBLE KNAPPER RIKTIG
  const modalFooter = modal.querySelector('.modal-footer');
  if (modalFooter) {
    modalFooter.style.display = 'flex';
    modalFooter.style.justifyContent = 'space-between';
    modalFooter.style.alignItems = 'center';

    modalFooter.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <button id="btnPrintCategory" type="button" class="btn btn-outline" style="font-size: 0.85rem; padding: 6px 12px;">
          🖨️ Skriv ut
        </button>
        ${isTrinn ? `<button id="btnCategoryModalGrid" type="button" class="btn btn-outline" style="font-size: 0.85rem; padding: 6px 12px;">📊 Matrise for ${catName}</button>` : ''}
      </div>
      <button id="btnCategoryModalClose" type="button" class="btn btn-secondary" style="font-size: 0.85rem; padding: 6px 12px;">
        Lukk
      </button>
    `;

    // Koble til hendelser ETTER at HTML er satt inn
    const printBtn = document.getElementById('btnPrintCategory');
    if (printBtn) {
      printBtn.onclick = () => {
        document.body.classList.add('printing-category');
        window.print();
        setTimeout(() => { document.body.classList.remove('printing-category'); }, 500);
      };
    }

    const gridBtn = document.getElementById('btnCategoryModalGrid');
    if (gridBtn && isTrinn) {
      gridBtn.onclick = () => {
        if (typeof openCategoryGridModal === 'function') openCategoryGridModal(catName);
        else if (typeof openGridOverview === 'function') openGridOverview(catName);
      };
    }

    const closeBtn = document.getElementById('btnCategoryModalClose');
    if (closeBtn) closeBtn.onclick = closeCategoryModal;
  }

  // 4. Åpne modalen
  modal.style.display = 'flex';
  modal.classList.add('show', 'active');
}

// 1. Ny liste med eksakt de 5 faste под-kategoriene (i riktig rekkefølge):
const TRINN_SUB_CATEGORIES = [
  "Fellesaktiviteter",
  "DKS", 
  "Kartlegging", 
  "Svømming", 
  "Møter"
];

// Åpne Rutenett / Matrise-modalen KUN for det valgte trinnet
function openCategoryGridModal(targetTrinn) {
  const gridModal = document.getElementById('gridOverviewModal');
  const gridContainer = document.getElementById('categoryGridContainer');
  const gridTitle = document.getElementById('gridOverviewTitle');
  if (!gridModal || !gridContainer) return;

  gridContainer.innerHTML = '';
  if (gridTitle) gridTitle.textContent = `Matriseoversikt: ${targetTrinn}`;

  // Kolonne 1 kaller vi "Trinn/Annet", etterfulgt av de 5 faste kategoriene:
  const columnsToDisplay = ["Trinn/Annet", ...TRINN_SUB_CATEGORIES];

  // 1. Hent alle hendelser fra alle kilder
  const moterEvents = typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents() : [];
  const uiaEvents = typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents() : [];
  const fellesEvents = typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents('2026-2027') : [];
  const dksEvents = typeof getDKSAktiviteterSomEvents === 'function' ? getDKSAktiviteterSomEvents() : [];
  const svommeEvents = typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents('2026-2027') : [];
  const bursdagEvents = typeof getBirthdayEvents === 'function' ? getBirthdayEvents(2026) : [];
  const kartleggingEvents = typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents() : [];

  const allRawEvents = [
    ...fellesEvents,
    ...dksEvents,
    ...svommeEvents,
    ...bursdagEvents,
    ...kartleggingEvents,
    ...moterEvents,
    ...uiaEvents,
    ...(typeof schoolEventsFromJs !== 'undefined' ? schoolEventsFromJs : []),
    ...(typeof rawEvents !== 'undefined' ? rawEvents : [])
  ];

  const trinnLower = targetTrinn.trim().toLowerCase();
  const trinnNum = targetTrinn.replace(/\D/g, '');

  // 2. Filtrer hendelser som tilhører det valgte trinnet
  const trinnEvents = allRawEvents.filter(evt => {
    if (typeof deletedStaticEventIds !== 'undefined' && deletedStaticEventIds && deletedStaticEventIds.has(evt.id)) return false;

    const ext = evt.extendedProps || {};
    const grp = (ext.group || evt.group || '').trim().toLowerCase();

    let trinnList = ext.trinn || evt.trinn || ext.trinnOptions || [];
    if (typeof trinnList === 'string') {
      trinnList = trinnList.split(',').map(s => s.trim().toLowerCase());
    } else if (Array.isArray(trinnList)) {
      trinnList = trinnList.map(s => String(s).trim().toLowerCase());
    }

    const title = (evt.title || ext.rawTitle || '').toLowerCase();
    const desc = (ext.description || '').toLowerCase();
    const deltakere = (ext.deltakere || ext.participants || '').toLowerCase();

    const isDirectGroup = grp === trinnLower;
    const isIncludedInTrinnList = trinnList.some(t => t.includes(trinnLower) || (trinnNum && t.includes(`${trinnNum}.`)));
    const isMentionedInText = deltakere.includes(trinnLower) || desc.includes(trinnLower) || title.includes(trinnLower) ||
                              (trinnNum && (deltakere.includes(`${trinnNum}. trinn`) || desc.includes(`${trinnNum}. trinn`)));
    const isAllTrinn = deltakere.includes('alle trinn') || desc.includes('alle trinn') || desc.includes('1.-7. trinn');

    return isDirectGroup || isIncludedInTrinnList || isMentionedInText || isAllTrinn;
  });

  // Hjelpefunksjon for å koble hendelse til kolonne
  function mapCategory(evt) {
    const ext = evt.extendedProps || {};
    const grp = (ext.group || evt.group || '').trim().toLowerCase();
    const text = `${evt.title || ''} ${ext.description || ''} ${grp}`.toLowerCase();

    if (grp.includes('felles') || text.includes('felles') || text.includes('samling') || text.includes('beintøft') || text.includes('fadder')) return 'Fellesaktiviteter';
    if (grp.includes('dks') || text.includes('dks') || text.includes('kultur')) return 'DKS';
    if (grp.includes('kartlegging') || text.includes('kartlegg') || text.includes('prøv') || text.includes('nasjonal')) return 'Kartlegging';
    if (grp.includes('svømming') || text.includes('svømm')) return 'Svømming';
    if (grp.includes('møte') || text.includes('møte') || text.includes('foreldre') || text.includes('samtale')) return 'Møter';
    
    // Alt annet som tilhører trinnet rutes til første kolonne:
    return 'Trinn/Annet';
  }


// 3. Bygg de 6 kolonnene bortover
  columnsToDisplay.forEach(colName => {
    const colColor = (typeof categoryColors !== 'undefined' && categoryColors[colName]) ? categoryColors[colName] : '#0284c7';

    // Filtrer ut hendelser for denne kolonnen
    const matchedEvents = trinnEvents.filter(evt => mapCategory(evt) === colName);

    // Sorter kronologisk
    matchedEvents.sort((a, b) => {
      const dateA = new Date(a.extendedProps?.startDate || a.start || 0);
      const dateB = new Date(b.extendedProps?.startDate || b.start || 0);
      return dateA - dateB;
    });

    // Lag kolonne-element
    const col = document.createElement('div');
    col.className = 'category-grid-column';

    const header = document.createElement('div');
    header.className = 'category-grid-header';
    header.style.backgroundColor = colColor;
    header.textContent = `${colName} (${matchedEvents.length})`;
    col.appendChild(header);

    const content = document.createElement('div');
    content.className = 'category-grid-content';
    content.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 8px; overflow-y: auto; width: 100%; box-sizing: border-box; min-height: 150px;';

    // Vis hendelser ELLER melding om at kolonnen er tom
    if (matchedEvents.length === 0) {
      content.innerHTML = `<div style="font-size: 0.75rem; color: #94a3b8; text-align: center; font-style: italic; padding: 10px;">Ingen aktiviteter</div>`;
    } else {
      matchedEvents.forEach(evt => {
        const ext = evt.extendedProps || {};
        const card = document.createElement('div');
        card.className = 'grid-event-card';
        card.style.cssText = `border-left: 4px solid ${colColor}; width: 100%; box-sizing: border-box;`;

        const titleText = evt.title || ext.rawTitle || 'Uten tittel';
        const descText = ext.description || '';
        const startDateStr = ext.startDate || (evt.start ? String(evt.start).split('T')[0] : '');

        let dateFormatted = '';
        if (startDateStr) {
          const startObj = new Date(startDateStr + 'T00:00:00');
          dateFormatted = !isNaN(startObj.getTime()) ? startObj.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) : startDateStr;
        }

        const startTime = ext.startTime || (evt.start && String(evt.start).includes('T') ? String(evt.start).split('T')[1].substring(0, 5) : '');

        card.innerHTML = `
          <div class="grid-event-title">${titleText}</div>
          <div class="grid-event-time">📅 ${dateFormatted} ${startTime ? '⏰ kl. ' + startTime : ''}</div>
          ${descText ? `<div class="grid-event-desc">${descText}</div>` : ''}
        `;
        content.appendChild(card);
      });
    }

    col.appendChild(content);
    gridContainer.appendChild(col);
  });

  if (gridContainer.children.length === 0) {
    gridContainer.innerHTML = '<p style="color: #64748b; font-style: italic; padding: 20px;">Ingen avtaler registrert for dette trinnet.</p>';
  }

  gridModal.style.display = 'flex';
}



function closeCategoryGridModal() {
  const gridModal = document.getElementById('gridOverviewModal');
  if (gridModal) gridModal.style.display = 'none';
}

// Koble til hendelseslyttere ved oppstart
document.addEventListener('DOMContentLoaded', () => {
  const closeX = document.getElementById('gridOverviewCloseX');
  const closeBtn = document.getElementById('btnGridOverviewClose');
  const printBtn = document.getElementById('btnGridOverviewPrint');

  if (closeX) closeX.addEventListener('click', closeCategoryGridModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCategoryGridModal);

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});


function closeCategoryModal() {
  const modal = document.getElementById('categoryModal');
  if (modal) modal.style.display = 'none';
}

// Event-lyttere for lukking og utskrift i kategorimodalen
document.addEventListener('DOMContentLoaded', () => {
  const closeX = document.getElementById('categoryModalCloseX');
  const closeBtn = document.getElementById('btnCategoryModalClose');
  const printBtn = document.getElementById('btnCategoryModalPrint');

  if (closeX) closeX.addEventListener('click', closeCategoryModal);
  if (closeBtn) closeBtn.addEventListener('click', closeCategoryModal);

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Legger til utskriftsklasse slik at CSS vet at det er modalen som skal skrives ut
      document.body.classList.add('printing-category');
      
      window.print();

      // Fjerner klassen igjen rett etter utskriftsdialogen lukkes/skrives ut
      setTimeout(() => {
        document.body.classList.remove('printing-category');
      }, 500);
    });
  }
});

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

  // 🔑 NULLSTILL TRINN KUN DERSOM DET ER EN NY AVTALE (eventId er tom)
  const isEditing = Boolean(document.getElementById('eventId').value);
  if (!isEditing) {
    document.querySelectorAll('input[name="trinnOption"]').forEach(cb => cb.checked = false);
  }

  const recurringGroup = document.getElementById('recurringGroup');
  if (recurringGroup) recurringGroup.style.display = isRecurring ? 'block' : 'none';

  document.getElementById('viewEditBtn').style.display = 'none';
  document.getElementById('viewDeleteBtn').style.display = 'none';
  document.getElementById('viewCancelBtn').style.display = 'none';
  document.getElementById('formCancelBtn').style.display = 'inline-block';
  document.getElementById('formSubmitBtn').style.display = 'inline-block';

  document.getElementById('eventModal').style.display = 'flex';
  setTimeout(() => document.getElementById('title')?.focus(), 50);
}

function showViewMode() {
  console.log("Aktiv hendelse:", activeEvent.id, activeEvent.extendedProps);
  hideContextMenu();
  document.getElementById('modalHeaderTitle').textContent = "Avtaledetaljer";
  document.getElementById('eventForm').style.display = 'none';
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('deleteConfirmMode').style.display = 'none';
  document.getElementById('normalFooter').style.display = 'flex';

  document.getElementById('formCancelBtn').style.display = 'none';
  document.getElementById('formSubmitBtn').style.display = 'none';
  document.getElementById('viewCancelBtn').style.display = 'inline-block';

  // 🔑 Sjekk rettigheter med den nye tilgangsfunksjonen:
  // - Admin: Kan redigere/slette Alt (også .js-filer)
  // - Vanlig bruker: Kan redigere/slette Alt UNNTATT .js-filer og skoleruter
  // - Ikke innlogget: Kan ikke redigere/slette noe
  const canEditOrDelete = typeof canUserModifyEvent === 'function' && canUserModifyEvent(activeEvent);

  // Vis eller skjul knapper basert på tilgang
  const editBtn = document.getElementById('viewEditBtn');
  const deleteBtn = document.getElementById('viewDeleteBtn');

  if (editBtn) editBtn.style.display = canEditOrDelete ? 'inline-block' : 'none';
  if (deleteBtn) deleteBtn.style.display = canEditOrDelete ? 'inline-block' : 'none';

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




/* --- VIS UKE --- */
let currentWeekPrintEvents = [];
let currentWeekPrintTitle = "";

// Hjelpefunksjon: Sjekker om en hendelse rammer / gjelder for en spesifikk dato
function isEventOnDate(evt, targetDate) {
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();

  // Hent startdato
  const startRaw = evt.extendedProps?.startDate || evt.start;
  const startDate = new Date(startRaw);
  const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();

  // Hent sluttdato (fallback til startdato hvis end ikke er definert)
  const endRaw = evt.extendedProps?.endDate || evt.end || evt.start;
  const endDate = new Date(endRaw);

  // Korriger for FullCalendar: hvis sluttid er midnatt (00:00:00), er siste gyldige dag dagen før
  if (endDate.getHours() === 0 && endDate.getMinutes() === 0 && endDate.getSeconds() === 0 && endDate > startDate) {
    endDate.setDate(endDate.getDate() - 1);
  }

  const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

  // Sjekk om måldatoen ligger innenfor tidsrommet
  return target >= eventStart && target <= eventEnd;
}

// Hjelpefunksjon for å samle trinnene til "Alle trinn" eller pen visning
function formatTrinnDisplay(rawTrinn) {
  if (!rawTrinn) return '';

  let trinnArray = [];

  if (Array.isArray(rawTrinn)) {
    trinnArray = rawTrinn.map(t => String(t).trim().toLowerCase());
  } else if (typeof rawTrinn === 'string') {
    trinnArray = rawTrinn.split(',').map(t => t.trim().toLowerCase());
  }

  const rawString = String(rawTrinn).toLowerCase();
  if (rawString.includes('alle trinn') || rawString.includes('1.-7. trinn') || rawString.includes('1-7')) {
    return 'Alle trinn';
  }

  // Trekk ut kun tallene (1, 2, 3, osv.)
  const numbers = trinnArray
    .map(t => t.replace(/\D/g, ''))
    .filter(t => t !== '');

  // Sjekk om alle 7 trinnene er representert
  const hasAllSeven = [1, 2, 3, 4, 5, 6, 7].every(n => numbers.includes(String(n)));
  if (hasAllSeven) {
    return 'Alle trinn';
  }

  if (Array.isArray(rawTrinn)) {
    return rawTrinn.join(', ');
  }
  return rawTrinn;
}

// Åpne modalen for ukesutskrift
function openWeekPrintModal() {
  const modal = document.getElementById('weekPrintModal');
  if (!modal || typeof calendar === 'undefined') return;

  // Hent aktiv uke og datospenn fra FullCalendar
  const currentDate = calendar.getDate();
  const startOfWeek = new Date(currentDate);
  
  // Sett til mandag i gjeldende uke
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  // Beregn ukenummer
  const d = new Date(Date.UTC(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);

  const dateStartStr = startOfWeek.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
  const dateEndStr = endOfWeek.toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' });
  
  currentWeekPrintTitle = `Uke ${weekNum} (${dateStartStr} - ${dateEndStr})`;
  
  const titleEl = document.getElementById('weekPrintModalTitle');
  if (titleEl) {
    titleEl.textContent = `🖨️ ${currentWeekPrintTitle}`;
  }

  // Hent alle hendelser fra alle kilder
  const moterEvents = typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents() : [];
  const uiaEvents = typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents() : [];
  const fellesEvents = typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents('2026-2027') : [];
  const dksEvents = typeof getDKSAktiviteterSomEvents === 'function' ? getDKSAktiviteterSomEvents() : [];
  const svommeEvents = typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents('2026-2027') : [];
  const bursdagEvents = typeof getBirthdayEvents === 'function' ? getBirthdayEvents(2026) : [];
  const kartleggingEvents = typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents() : [];

  const allCombined = [
    ...fellesEvents, ...dksEvents, ...svommeEvents, ...bursdagEvents,
    ...kartleggingEvents, ...moterEvents, ...uiaEvents,
    ...(typeof schoolEventsFromJs !== 'undefined' ? schoolEventsFromJs : []),
    ...(typeof rawEvents !== 'undefined' ? rawEvents : [])
  ];

  // Hent hendelser som har MINST ÉN dag innenfor uken
  currentWeekPrintEvents = allCombined.filter(evt => {
    if (typeof deletedStaticEventIds !== 'undefined' && deletedStaticEventIds && deletedStaticEventIds.has(evt.id)) return false;
    
    const evtStart = new Date(evt.extendedProps?.startDate || evt.start);
    const evtEnd = new Date(evt.extendedProps?.endDate || evt.end || evtStart);

    return evtStart <= endOfWeek && evtEnd >= startOfWeek;
  });

  // Nullstill filterknappene til "Alle trinn"
  document.querySelectorAll('#weekPrintModal .week-filter-bar button').forEach(btn => btn.classList.remove('active'));
  const allBtn = document.querySelector('#weekPrintModal .week-filter-bar button');
  if (allBtn) allBtn.classList.add('active');

  // Generer A4-arket for alle trinn som standard
  renderWeekPrintSheet('alle', startOfWeek);

  modal.style.display = 'flex';
  modal.classList.add('show', 'active');
}

// Filtrer visningen når brukeren trykker på en trinn-knapp
function filterWeekPrint(trinnTarget, btnEl) {
  document.querySelectorAll('#weekPrintModal .week-filter-bar button').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const currentDate = calendar.getDate();
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);

  renderWeekPrintSheet(trinnTarget, startOfWeek);
}

// Bygg opp A4-oppsettet fordelt på ukedager (Mandag-Fredag)
function renderWeekPrintSheet(trinnTarget, startOfWeek) {
  const sheet = document.getElementById('weekPrintSheet');
  if (!sheet) return;

  const trinnLower = trinnTarget.toLowerCase().trim();

  // Filtrer på valgt trinn
  let filtered = currentWeekPrintEvents.filter(evt => {
    if (trinnTarget === 'alle') return true;
    
    const ext = evt.extendedProps || {};
    const grp = (ext.group || evt.group || '').toLowerCase();
    const title = (evt.title || ext.rawTitle || '').toLowerCase();
    const desc = (ext.description || '').toLowerCase();
    const deltakere = (ext.deltakere || ext.participants || '').toLowerCase();
    
    let trinnList = ext.trinn || evt.trinn || ext.trinnOptions || [];
    if (typeof trinnList === 'string') trinnList = trinnList.split(',').map(s => s.trim().toLowerCase());
    else if (Array.isArray(trinnList)) trinnList = trinnList.map(s => String(s).trim().toLowerCase());

    const trinnNum = trinnTarget.replace(/\D/g, '');

    const isMatch = grp.includes(trinnLower) || 
                    trinnList.some(t => t.includes(trinnLower) || (trinnNum && t.includes(`${trinnNum}.`))) ||
                    deltakere.includes(trinnLower) || title.includes(trinnLower) || desc.includes(trinnLower) ||
                    deltakere.includes('alle trinn') || desc.includes('alle trinn') || desc.includes('1.-7. trinn');

    return isMatch;
  });

  // Bygg 5 dager (Mandag - Fredag)
  const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];
  let daysHtml = '';

  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(startOfWeek.getDate() + i);
    const dayDateStr = dayDate.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });

    const dayEvents = filtered.filter(evt => isEventOnDate(evt, dayDate));

    // SORTERING: Heldags/Uten klokkeslett øverst, deretter kronologisk
    dayEvents.sort((a, b) => {
      const extA = a.extendedProps || {};
      const extB = b.extendedProps || {};

      const isAllDayA = a.allDay || extA.isAllDay || !extA.startTime;
      const isAllDayB = b.allDay || extB.isAllDay || !extB.startTime;

      if (isAllDayA && !isAllDayB) return -1;
      if (!isAllDayA && isAllDayB) return 1;

      const timeA = extA.startTime || '00:00';
      const timeB = extB.startTime || '00:00';
      return timeA.localeCompare(timeB);
    });

    let eventsHtml = '';
    if (dayEvents.length === 0) {
      eventsHtml = `<div class="print-empty-day" style="color: #94a3b8; font-style: italic; font-size: 13px; padding: 8px 0;">Ingen planer</div>`;
    } else {
      dayEvents.forEach(evt => {
        const ext = evt.extendedProps || {};
        let rawTitle = evt.title || ext.rawTitle || 'Uten tittel';

        let cleanTitle = rawTitle.replace(/^(?:\[.*?\]\s*)+/, '').trim();
        const startTime = ext.startTime || (evt.start && String(evt.start).includes('T') ? String(evt.start).split('T')[1].substring(0, 5) : '');
        const sted = ext.location || ext.sted || '';
        
        // Hent rå-verdi for trinn/deltakere og formater
        let rawTrinn = ext.trinn || evt.trinn || ext.group || ext.deltakere || '';
        let trinnDisplay = formatTrinnDisplay(rawTrinn);

        const isAllDay = evt.allDay || ext.isAllDay || !startTime;
        const borderStyle = isAllDay ? 'border-left: 3px solid #ea580c; background: #fff7ed;' : 'border-left: 3px solid #0284c7; background: #f8fafc;';
        
        eventsHtml += `
          <div class="print-event-item" style="margin-bottom: 8px; padding: 6px 8px; ${borderStyle} border-radius: 4px;">
            <div class="print-event-header" style="font-size: 13px; font-weight: 600; color: #1e293b;">
              ${startTime ? `<span class="print-event-time" style="font-weight: 700; color: #0284c7; margin-right: 4px;">${startTime}</span>` : `<span style="font-size: 11px; font-weight: 700; color: #ea580c; margin-right: 4px;">[HELE DAGEN]</span>`}
              <span class="print-event-title">${cleanTitle}</span>
            </div>
            
            ${trinnDisplay ? `<div class="print-event-trinn" style="font-size: 11px; color: #475569; margin-top: 3px; font-weight: 500;">🏷️ ${trinnDisplay}</div>` : ''}
            ${sted ? `<div class="print-event-sub" style="font-size: 11px; color: #64748b; margin-top: 1px;">📍 ${sted}</div>` : ''}
          </div>
        `;
      });
    }

    daysHtml += `
      <div class="print-day-column">
        <div class="print-day-header">
          <strong>${days[i]}</strong>
          <span>${dayDateStr}</span>
        </div>
        <div class="print-day-body">
          ${eventsHtml}
        </div>
      </div>
    `;
  }

  sheet.innerHTML = `
    <div class="print-sheet-header">
      <h2>Skolekalender - ${currentWeekPrintTitle}</h2>
      <span class="print-sheet-subtitle">Visning: ${trinnTarget === 'alle' ? 'Alle trinn' : trinnTarget}</span>
    </div>
    <div class="print-days-grid">
      ${daysHtml}
    </div>
  `;
}

function closeWeekPrintModal() {
  const modal = document.getElementById('weekPrintModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('show', 'active');
  }
}

function triggerWeekPrint() {
  window.print();
}

// Koble hendelser når siden lastes
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('weekPrintModal');
  if (!modal) return;

  const filterButtons = modal.querySelectorAll('.week-filter-bar button');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnText = e.target.textContent.trim();
      const targetGrade = btnText === 'Alle trinn' ? 'alle' : btnText;
      filterWeekPrint(targetGrade, e.target);
    });
  });

  const closeButtons = modal.querySelectorAll('.btn-close, .btn-secondary, [data-bs-dismiss="modal"]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeWeekPrintModal);
  });

  const printBtn = modal.querySelector('.btn-primary, #btnPrintA4Modal');
  if (printBtn) {
    printBtn.addEventListener('click', triggerWeekPrint);
  }
});


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

document.getElementById('miniPrevBtn')?.addEventListener('click', () => {
  miniCalCurrentDate.setMonth(miniCalCurrentDate.getMonth() - 1);
  renderMiniCalendar();
});

document.getElementById('miniNextBtn')?.addEventListener('click', () => {
  miniCalCurrentDate.setMonth(miniCalCurrentDate.getMonth() + 1);
  renderMiniCalendar();
});



/* TRINN- OG KATEGORIKALENDER (TABELLVISNING) */
let activeSelectedCategory = "";

// Endre del 1 fra din kode til dette:
window.openCategoryModal = window.openCategoryCalendar = window.showCategoryModal = function(categoryName) {
  activeSelectedCategory = categoryName || "1. trinn";

  // Sett tittelen
  const titleEl = document.getElementById('categoryModalTitle');
  if (titleEl) {
    titleEl.textContent = `📅 Kalender for ${activeSelectedCategory}`;
  }

  // Styrer om "Vis matrise"-knappen skal vises (kun for 1.-7. trinn)
  const isTrinn = /([1-7]\.\s*trinn)/i.test(activeSelectedCategory);
  const gridBtn = document.getElementById('btnCategoryModalGrid');
  if (gridBtn) {
    gridBtn.style.display = isTrinn ? 'inline-flex' : 'none';
  }

  // Generer tabellinnholdet direkte i kategorilisten
  renderCategoryTimeline(activeSelectedCategory);

  // Vis modalen
  const modal = document.getElementById('categoryModal');
  if (modal) {
    modal.classList.add('active', 'show');
    modal.style.display = 'flex';
  }
};


// 2. Global listener for knappene i modalen
window.addEventListener('click', (e) => {
  // Lukk modal
  if (e.target.closest('#categoryModalCloseX') || e.target.closest('#btnCategoryModalClose')) {
    const modal = document.getElementById('categoryModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show', 'active');
    }
  }

  // Skriv ut (sjekker nå for BÅDE #btnPrintCategory og #btnCategoryModalPrint)
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


// 3. Render-funksjon som bygger tidslinjen i #categoryEventsList
function renderCategoryTimeline(selectedCat, filterSearch = '') {
  const container = document.getElementById('categoryEventsList');
  if (!container) return;
  container.innerHTML = '';

  // EKSAGT DE 6 ØNSKEDE KATEGORIENE I VALGT REKKEFØLGE:
  const categories = ['Trinn/Annet', 'Fellesaktiviteter', 'DKS', 'Kartlegging', 'Svømming', 'Møter'];

  // Generer uker for skoleåret (Uke 32–52 -> Uke 1–25)
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

  const monthsNO = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

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

    // Tekst-fallback
    const strText = `${evt.title || ''} ${ext.description || ''}`.toLowerCase();
    const ukeMatch = strText.match(/uke\s*(\d+)/);
    if (ukeMatch) return { week: parseInt(ukeMatch[1], 10), dateStr: '' };

    return { week: null, dateStr: '' };
  }

  // RUTINGS-LOGIKK FOR DE 6 KATEGORIENE
  function mapCategory(evt) {
    const ext = evt.extendedProps || evt;
    const grp = (ext.group || evt.group || '').toLowerCase();
    const text = `${evt.title || ''} ${ext.description || ''} ${grp}`.toLowerCase();

    if (grp.includes('felles') || text.includes('felles') || text.includes('samling') || text.includes('beintøft') || text.includes('fadder')) return 'Fellesaktiviteter';
    if (grp.includes('dks') || text.includes('dks') || text.includes('kultur')) return 'DKS';
    if (grp.includes('kartlegging') || text.includes('kartlegg') || text.includes('prøv') || text.includes('nasjonal')) return 'Kartlegging';
    if (grp.includes('svømming') || text.includes('svømm')) return 'Svømming';
    if (grp.includes('møte') || text.includes('møte') || text.includes('foreldre') || text.includes('samtale')) return 'Møter';
    
    // Alt annet (inkludert UiA, faste trinnaktiviteter osv.) rutes hit:
    return 'Trinn/Annet';
  }

  // 1. SAMLE ALLE EVENT-KILDER DYNAMISK
  const moter = typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents() : [];
  const uia = typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents() : [];
  const felles = typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents('2026-2027') : [];
  const dks = typeof getDKSAktiviteterSomEvents === 'function' ? getDKSAktiviteterSomEvents() : [];
  const svomme = typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents('2026-2027') : [];
  const kartlegging = typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents() : [];
  const calEvents = (window.calendar && typeof window.calendar.getEvents === 'function') ? window.calendar.getEvents() : [];

  const rawList = [
    ...felles, ...dks, ...svomme, ...kartlegging, ...moter, ...uia, ...calEvents,
    ...(typeof rawEvents !== 'undefined' ? rawEvents : [])
  ];

  const targetName = selectedCat.trim().toLowerCase();
  const trinnNum = selectedCat.replace(/\D/g, '');

  let eventsList = [];

  // 2. FILTRER MED DUBLETT-SJEKK
  const seenIds = new Set();

  rawList.forEach(evt => {
    const ext = evt.extendedProps || evt;
    const title = evt.title || ext.title || ext.rawTitle || '';
    const desc = ext.description || '';
    const group = (ext.group || evt.group || '').toLowerCase();
    
    // Håndter om trinn er lagret som matrise/array eller tekststreng
    let trinnValues = ext.trinn || evt.trinn || [];
    if (typeof trinnValues === 'string') {
      trinnValues = trinnValues.split(',').map(s => s.trim());
    }

    // Unngå dubletter
    const uniqueKey = `${title}_${ext.startDate || evt.start}`;
    if (seenIds.has(uniqueKey)) return;

    const fullText = `${title} ${desc} ${group} ${trinnValues.join(' ')}`.toLowerCase();

    // Sjekk om det valgte trinnet (f.eks. "4. trinn") er med i avkrysningene
    const matchesSelectedTrinn = trinnValues.some(t => {
      const cleanT = String(t).toLowerCase();
      return cleanT.includes(targetName) || (trinnNum && cleanT.includes(`${trinnNum}. trinn`));
    });

    // Sjekk om det er en generell avtale ("alle trinn") eller treffer på kategori/gruppe
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

  // 3. GENERER TABELL-HTML
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

/* OPPSTART & FULLCALENDAR */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof populateGroupDropdown === 'function') {
    populateGroupDropdown();
  }

  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  // Hjelpefunksjon for presis ISO-ukenummerberegning
  function getISOWeekNumber(d) {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    // initialDate er fjernet herfra!
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
          if (typeof hideContextMenu === 'function') hideContextMenu();
          if (typeof hideSelectionPopover === 'function') hideSelectionPopover();

          if (typeof openWeekPrintModal === 'function') {
            openWeekPrintModal();
          }
        }
      } // <-- Rettet: Kommaet manglet rett etter denne parantesen
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
    slotDuration: '00:30:00',

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

      // Legg til ukenummer i tittelen for ukesvisninger
      const view = info.view;
      if (view.type === 'timeGridWeek' || view.type === 'dayGridWeek' || view.type === 'listWeek') {
        const weekNum = getISOWeekNumber(view.currentStart);

// Oppdater overskriften i kalenderen (Kompakt versjon for å spare plass)
const titleEl = document.querySelector('.fc-toolbar-title');
if (titleEl) {
  const startDay = view.currentStart.getDate();
  const endDate = new Date(view.currentEnd);
  endDate.setDate(endDate.getDate() - 1); // FullCalendar setter end til lørdag/søndag
  const endDay = endDate.getDate();
  
  // Henter kort månedsnavn på norsk (f.eks. "aug.")
  const monthName = view.currentStart.toLocaleDateString('no-NO', { month: 'short' });

  titleEl.textContent = `Uke ${weekNum}: ${startDay}.–${endDay}. ${monthName}`;
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
      if (info.jsEvent) info.jsEvent.preventDefault();
      if (typeof hideContextMenu === 'function') hideContextMenu();
      if (typeof hideSelectionPopover === 'function') hideSelectionPopover();

      const ext = info.event.extendedProps || {};
      const isSchoolRoute = ext.isSchoolRoute || false;
      const isReadOnly = ext.isReadOnly || isSchoolRoute;

// 🔑 Hent ut trinn (sjekker både ext.trinn og direkte felt)
const rawTrinn = ext.trinn || info.event.trinn || [];
const trinnArray = Array.isArray(rawTrinn) ? rawTrinn : (rawTrinn ? [rawTrinn] : []);

      activeEvent = {
        id: info.event.id || '',
        title: ext.rawTitle || info.event.title || '',
        group: ext.group || '',
        trinn: trinnArray, // 🔑 Lagre trinn-arrayet her
        startDate: ext.startDate || (info.event.startStr ? info.event.startStr.split('T')[0] : ''),
        startTime: ext.startTime || '',
        endDate: ext.endDate || (info.event.endStr ? info.event.endStr.split('T')[0] : ''),
        endTime: ext.endTime || '',
        description: ext.description || '',
        repeatPattern: ext.repeatPattern || '',
        recurringSeriesId: ext.recurringSeriesId || null,
        isSchoolRoute: isSchoolRoute,
        isReadOnly: isReadOnly,
        isStatic: ext.isStatic || false,
        url: ext.url || null,
        regUrl: ext.regUrl || null,
        regTekst: ext.regTekst || null
      };

      const viewTitle = document.getElementById('viewTitle');
      const viewGroup = document.getElementById('viewGroup');
      const viewTime = document.getElementById('viewTime');
      const viewDescription = document.getElementById('viewDescription');

      if (viewTitle) viewTitle.textContent = activeEvent.title;
      if (viewGroup) viewGroup.textContent = activeEvent.group;

      // 🔑 2. VIS TRINN I VISNINGSMODUS (#viewTrinn)
      const viewTrinnEl = document.getElementById('viewTrinn');
      if (viewTrinnEl) {
        viewTrinnEl.textContent = trinnArray.length > 0 ? trinnArray.join(', ') : 'Ingen trinn valgt';
      }

      // 🔑 3. KRYSS AV I SKJEMAET (Dersom brukeren velger å redigere denne hendelsen)
      document.querySelectorAll('input[name="trinnOption"]').forEach(cb => {
        cb.checked = trinnArray.some(t => String(t).trim().toLowerCase() === cb.value.trim().toLowerCase());
      });

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

      // Viser beskrivelse + lenker dersom de finnes
      if (viewDescription) {
        let content = activeEvent.description || "Ingen beskrivelse oppgitt.";
        
        // Hovedlenke (Informasjonsside)
        if (activeEvent.url) {
          content += `<br><br>🔗 <strong>Informasjon:</strong> <a href="${activeEvent.url}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-weight: 600; text-decoration: underline;">Les mer ↗</a>`;
        }
        
        // Registreringslenke (f.eks. Conexus eller GitHub)
        if (activeEvent.regUrl) {
          content += `<br>📝 <strong>Registrering:</strong> <a href="${activeEvent.regUrl}" target="_blank" rel="noopener noreferrer" style="color: #059669; font-weight: 600; text-decoration: underline;">${activeEvent.regTekst || 'Åpne registrering ↗'}</a>`;
        }

viewDescription.innerHTML = content;
      }

      // 🔑 OPPDATER SYNLIGHET PÅ REDIGER/SLETT-KNAPPER BASERT PÅ ADMIN-E-POST
      if (typeof updateModalAdminButtons === 'function') {
        updateModalAdminButtons();
      }

      if (typeof showViewMode === 'function') showViewMode(activeEvent);
    },

// ERSTATT events: [] MED DETTE:
    events: function(fetchInfo, successCallback, failureCallback) {
      if (typeof getCombinedEvents === 'function') {
        const events = getCombinedEvents();
        const filtered = typeof isEventInSelectedCategories === 'function' 
          ? events.filter(isEventInSelectedCategories)
          : events;
        successCallback(filtered);
      } else if (typeof allRawEvents !== 'undefined') {
        successCallback(allRawEvents);
      } else {
        successCallback([]);
      }
    }
  });

calendar.render();
  
  // 🔑 LEGG TIL DENNE LINJEN FOR Å TVINGE TIL DAGENS DATO:
  calendar.today();

  if (typeof renderFilters === 'function') renderFilters();
  if (typeof renderMiniCalendar === 'function') renderMiniCalendar();

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




// --- FIRESTORE REALTIME LYTTER ---
onSnapshot(eventsRef, (snapshot) => {
  rawEvents = snapshot.docs.map(doc => {
    const data = doc.data();
    
    let startIso = data.startDate;
    if (data.startTime) startIso += `T${data.startTime}`;

    let endIso = data.endDate || data.startDate;
    if (data.endTime) endIso += `T${data.endTime}`;

    const isRecurring = Boolean(data.repeatPattern || data.recurringSeriesId);
    const iconPrefix = isRecurring ? "🔁 " : "";

    const eventGroup = data.group || '';
    // Bruker getCategoryColor-funksjonen for å fange opp aliases (f.eks. "Felles" -> "Fellesaktiviteter")
    const eventColor = getCategoryColor(eventGroup);

    return {
      id: doc.id,
      title: `${iconPrefix}${eventGroup ? '[' + eventGroup + '] ' : ''}${data.title}`,
      start: startIso,
      end: endIso,
      backgroundColor: eventColor,
      borderColor: eventColor,
      extendedProps: { 
        group: eventGroup,
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
  updateCalendarEvents();
});


// --- ALIASES & FARGE-HJELPERE ---
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

function getCategoryColor(groupName) {
  if (!groupName) return '#3788d8';
  const rawGroup = groupName.toLowerCase().trim();
  const targetCategory = categoryAliases[rawGroup] || groupName;
  
  const matchedKey = Object.keys(categoryColors).find(
    k => k.toLowerCase() === targetCategory.toLowerCase()
  );
  return categoryColors[matchedKey] || categoryColors[groupName] || '#3788d8';
}

// --- PRESIS TRINN- OG KATEGORIVALIDERINGS-LOGIKK ---
function isEventInSelectedCategories(event) {
  if (!selectedCategories || selectedCategories.length === 0) return false;

  const ext = event.extendedProps || event;
  const rawGroup = (ext.group || event.group || '').trim();
  const mappedGroup = (categoryAliases[rawGroup.toLowerCase()] || rawGroup).toLowerCase();
  
  // Håndter trinn enten det er matrise eller tekststreng
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
      // A) Eksplisitt trinn valgt i skjemaboksene
      if (Array.isArray(trinnArray) && trinnArray.some(t => t.toLowerCase().trim() === catLower)) {
        return true;
      }

      // B) Felles for alle trinn
      const altInnhold = `${title} ${description}`.toLowerCase();
      if (altInnhold.includes("alle trinn") || altInnhold.includes("1.-7. trinn") || mappedGroup === "fellesaktiviteter") {
        return true;
      }

      const trinnNummer = parseInt(cat.split('.')[0].trim(), 10);

      if (!isNaN(trinnNummer)) {
        // C) Presis søk etter trinn (unngår treff på klokkeslett/datoer)
        const trinnRegex = new RegExp(`\\b${trinnNummer}\\.\\s*trinn\\b|\\b${trinnNummer}[a-d]\\b`, 'i');
        if (trinnRegex.test(title) || trinnRegex.test(description)) {
          return true;
        }

        // D) Sjekk områder (f.eks. "1.-3. trinn")
        const rangeMatch = altInnhold.match(/(\d+)\s*[\.\-]\s*(\d+)\.?\s*trinn/i);
        if (rangeMatch) {
          const startTrinn = parseInt(rangeMatch[1], 10);
          const sluttTrinn = parseInt(rangeMatch[2], 10);
          if (trinnNummer >= startTrinn && trinnNummer <= sluttTrinn) {
            return true;
          }
        }

        // E) Sjekk stedsbaserte tilhørigheter
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
  const isAdmin = isCurrentUserAdmin();

  let filteredBursdagEvents = [];
  if (typeof getBirthdayEvents === 'function' && calendar) {
    const currentYear = calendar.getDate().getFullYear();
    const rawBursdager = getBirthdayEvents(currentYear);
    filteredBursdagEvents = rawBursdager.filter(event => isEventInSelectedCategories(event));
  }

  // Hent hendelser trygt fra globale funksjoner/variabler
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

  // Vasker, fargelegger og merker statiske hendelser
  const processStaticEvents = (events) => {
    return events
      .filter(evt => !deletedStaticEventIds.has(evt.id))
      .filter(event => isEventInSelectedCategories(event))
      .map(evt => {
        const grp = evt.extendedProps?.group || evt.group || '';
        const colorKey = Object.keys(categoryColors).find(k => k.toLowerCase() === grp.toLowerCase());
        const c = categoryColors[colorKey] || evt.backgroundColor || evt.color || '#3788d8';
        
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

function updateModalAdminButtons() {
  const editBtn = document.getElementById('viewEditBtn');
  const deleteBtn = document.getElementById('viewDeleteBtn');

  if (!activeEvent || activeEvent.isSchoolRoute) {
    if (editBtn) editBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    return;
  }

  // Sjekker om innlogget bruker har lov til å endre/slette DENNE spesifikke hendelsen
  const canModify = canUserModifyEvent(activeEvent);

  if (editBtn) editBtn.style.display = canModify ? 'inline-block' : 'none';
  if (deleteBtn) deleteBtn.style.display = canModify ? 'inline-block' : 'none';
}

document.getElementById('viewEditBtn')?.addEventListener('click', () => {
  if (!canUserModifyEvent(activeEvent)) {
    alert("Du har ikke tilgang til å redigere denne hendelsen.");
    return;
  }

  if (activeEvent && !activeEvent.isSchoolRoute) {
    // 1. Sett eventId FØRST (slik at showFormMode skjønner at dette er redigering)
    document.getElementById('eventId').value = activeEvent.id || '';
    
    // 2. Fyll inn de andre feltene
    document.getElementById('title').value = activeEvent.title || '';
    document.getElementById('group').value = activeEvent.group || '';
    document.getElementById('startDate').value = activeEvent.startDate || '';
    document.getElementById('startTime').value = activeEvent.startTime || '';
    document.getElementById('endDate').value = activeEvent.endDate || '';
    document.getElementById('endTime').value = activeEvent.endTime || '';
    document.getElementById('description').value = activeEvent.description || '';

    // 3. Hent trinnene (sjekker både activeEvent.trinn og extendedProps)
    const rawTrinn = activeEvent.trinn || activeEvent.extendedProps?.trinn || [];
    const trinnArray = Array.isArray(rawTrinn) ? rawTrinn : [rawTrinn];

    // 4. Huk av boksene
    document.querySelectorAll('input[name="trinnOption"]').forEach(cb => {
      cb.checked = trinnArray.some(t => String(t).trim().toLowerCase() === cb.value.trim().toLowerCase());
    });

    // 5. Åpne skjemaet (nå vil IKKE showFormMode tømme boksene fordi eventId er satt!)
    showFormMode("Rediger avtale", false);
  }
});

document.getElementById('viewDeleteBtn')?.addEventListener('click', async () => {
  if (!canUserModifyEvent(activeEvent)) {
    alert("Du har ikke tilgang til å slette denne hendelsen.");
    return;
  }

  if (!activeEvent || activeEvent.isSchoolRoute) return;

  if (activeEvent.extendedProps?.isStatic || activeEvent.isStatic) {
    if (confirm(`Vil du slette den faste hendelsen "${activeEvent.title}" for alle?`)) {
      const targetId = activeEvent.id;
      closeModal();
      try {
        await setDoc(doc(db, "deleted_static_events", targetId), {
          deletedBy: firebase.auth().currentUser.email,
          deletedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Feil ved sletting av statisk hendelse:", err);
        alert("Kunne ikke slette hendelsen.");
      }
    }
    return;
  }

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

document.getElementById('cancelDeleteModeBtn')?.addEventListener('click', () => {
  document.getElementById('deleteConfirmMode').style.display = 'none';
  document.getElementById('normalFooter').style.display = 'flex';
});

document.getElementById('deleteSingleBtn')?.addEventListener('click', async () => {
  if (!activeEvent || !isCurrentUserAdmin()) return;
  const targetId = activeEvent.id;
  closeModal();
  try {
    await deleteDoc(doc(db, "school_events", targetId));
  } catch (err) {
    console.error("Feil ved sletting:", err);
    alert("Kunne ikke slette hendelsen.");
  }
});

document.getElementById('deleteFutureBtn')?.addEventListener('click', async () => {
  if (!activeEvent || !activeEvent.recurringSeriesId || !isCurrentUserAdmin()) return;
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

document.getElementById('deleteAllSeriesBtn')?.addEventListener('click', async () => {
  if (!activeEvent || !activeEvent.recurringSeriesId || !isCurrentUserAdmin()) return;
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


// --- LAGRE/OPPDATERE SKJEMA ---
document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const eventId = document.getElementById('eventId').value;

  // 🔑 SJEKK TILGANG:
  // Hvis eventId finnes -> vi redigerer (sjekk modify-rettighet)
  // Hvis eventId er tom -> vi oppretter ny (sjekk create-rettighet)
  const hasPermission = eventId ? canUserModifyEvent(activeEvent) : canUserCreateEvent();

  if (!hasPermission) {
    alert("Du har ikke tilgang til å lagre denne hendelsen.");
    return;
  }

  const isRecurring = document.getElementById('isRecurringMode').value === "true";
  const repeatPattern = document.getElementById('repeatPattern').value;
  
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
      await updateDoc(doc(db, "school_events", eventId), singleData);
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

      await Promise.all(eventsToCreate.map(evt => addDoc(eventsRef, evt)));

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
      await addDoc(eventsRef, singleData);
    }
  } catch (error) {
    console.error("Feil ved lagring: ", error);
    alert("Feil ved lagring til databasen.");
  }
});

// --- RENDER MENSY / FILTRE ---
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
      } else if (typeof showCategoryModal === 'function') {
        showCategoryModal(cat);
      } else {
        console.warn('Fant ingen modal-funksjon for kategorien:', cat);
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

// --- UTSKRIFT KATEGORI (RETTET MOT DOBBELTUTSKRIFT & FLERE KATEGORIER) ---
const btnPrintCat = document.getElementById('btnPrintCategory');

if (btnPrintCat) {
  // 1. Fjern eventuelle gamle event-lyttere ved å erstatte knappen med en klon
  const newBtnPrintCat = btnPrintCat.cloneNode(true);
  btnPrintCat.parentNode.replaceChild(newBtnPrintCat, btnPrintCat);

  newBtnPrintCat.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Sjekk om valgte kategorier finnes, ellers bruk tom liste
    const activeCategories = (typeof selectedCategories !== 'undefined') ? selectedCategories : [];
    const originalDate = (typeof calendar !== 'undefined' && calendar) ? calendar.getDate() : new Date();

    // 2. Hent ALLE aktive hendelser direkte fra kalenderen
    const allCalendarEvents = (typeof calendar !== 'undefined' && calendar) ? calendar.getEvents() : [];
    
    // 3. Filtrer ut hendelser som matcher valgte kategorier/trinn
    const matchingEvents = allCalendarEvents.filter(evt => {
      const ext = evt.extendedProps || {};
      const trinnArray = ext.trinn || [];
      const catGroup = ext.group || ext.category || '';
      
      // Hvis ingen filtre er valgt, vis alt
      if (activeCategories.length === 0) return true;

      // Sjekk om hendelsens trinn eller kategori treffer de avhukede filtrene
      const matchesTrinn = Array.isArray(trinnArray) && trinnArray.some(t => activeCategories.includes(t));
      const matchesCat = activeCategories.includes(catGroup);

      if (matchesTrinn || matchesCat) return true;

      return typeof isEventInSelectedCategories === 'function' 
        ? isEventInSelectedCategories(evt) 
        : false;
    });

    // 4. Sorter kronologisk etter startdato
    const sortedItems = matchingEvents.map(evt => {
      const start = evt.start ? new Date(evt.start) : new Date();
      const end = evt.end ? new Date(evt.end) : start;
      const ext = evt.extendedProps || {};

      return {
        title: ext.rawTitle || evt.title || 'Uten tittel',
        start: start,
        end: end,
        allDay: evt.allDay,
        desc: ext.description || '',
        color: evt.backgroundColor || evt.ui?.color || '#0284c7'
      };
    }).sort((a, b) => a.start - b.start);

    // 5. Oppdater DOM i modalen
    const modalTitle = document.getElementById('categoryModalTitle');
    const eventsContainer = document.getElementById('categoryEventsList');

    if (modalTitle) {
      const year = originalDate.getFullYear();
      const titleText = activeCategories.length === 1 ? activeCategories[0] : 'Valgte aktiviteter';
      modalTitle.textContent = `Oversikt – ${titleText} (${year})`;
    }

    if (eventsContainer) {
      if (sortedItems.length === 0) {
        eventsContainer.innerHTML = '<div style="padding:20px; text-align:center;">Ingen hendelser funnet for valgte kategorier.</div>';
      } else {
        eventsContainer.innerHTML = sortedItems.map(item => {
          const startStr = item.start.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
          const endStr = item.end.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
          
          const isMultiDay = item.start.toDateString() !== item.end.toDateString();
          const dateLabel = isMultiDay ? `${startStr}. – ${endStr}.` : `${startStr}.`;

          let timeLabel = '';
          if (!item.allDay) {
            const startTimeStr = item.start.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = item.end.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
            timeLabel = (startTimeStr !== endTimeStr && item.end) ? ` kl. ${startTimeStr}–${endTimeStr}` : ` kl. ${startTimeStr}`;
          }

          const descHtml = item.desc ? `<div class="event-desc">${item.desc}</div>` : '';

          return `
            <div class="category-event-card" style="border-left-color: ${item.color};">
              <div class="event-title">${item.title}</div>
              <div class="event-time">📅 ${dateLabel}${timeLabel ? ' | ' + timeLabel : ''}</div>
              ${descHtml}
            </div>
          `;
        }).join('');
      }
    }

    // 6. Aktiver utskriftsmodus via klasse på body
    document.body.classList.add('printing-category');

    // 7. Rydd opp når utskriftsdialogen lukkes/avbrytes
    const cleanupAfterPrint = () => {
      document.body.classList.remove('printing-category');
      window.removeEventListener('afterprint', cleanupAfterPrint);
    };

    window.addEventListener('afterprint', cleanupAfterPrint);

    // 8. Trigger utskrift
    setTimeout(() => {
      window.print();
    }, 150);
  });
}