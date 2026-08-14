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
  setDoc, // <-- Legg til denne her!
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

// --- ADMIN TILGANGSBEGRENSNING ---
const ADMIN_EMAILS = [
  '77tor@ikrs.no',
  '75thomas@ikrs.no',
  '72janne@ikrs.no',
  '62marit3@ikrs.no'
];

let deletedStaticEventIds = new Set();

// Sjekker om nåværende bruker har admin-rettigheter
function isCurrentUserAdmin() {
  const user = auth.currentUser;
  return user && user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
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

// 2. NÅ KAN DENNE LYTTE UTEN FEIL, SIDEN db DOKUMENTERES OVENFOR
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
    // Viser kun første del av e-posten (f.eks. "tor.skarprud")
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
    
    // Tvinger en ren layout med spredning
    catItem.style.cssText = 'display: flex !important; align-items: center !important; justify-content: space-between !important; width: 100% !important; padding: 4px 6px; margin-bottom: 3px; border-radius: 4px; cursor: pointer;';

    const safeId = categoryName.replace(/[^a-zA-Z0-9]/g, '_');

    // Farge-sirkelen er tvingt med background-color: ${color} !important
    catItem.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
        <input type="checkbox" id="cat_${safeId}" value="${categoryName}" checked style="cursor: pointer; margin: 0;" />
        <span style="background-color: ${color} !important; width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex-shrink: 0;"></span>
        <label for="cat_${safeId}" style="cursor: pointer; font-size: 0.85rem; color: #334155; margin: 0; user-select: none;">${categoryName}</label>
      </div>
      <span class="preview-btn" title="Se alle avtaler for ${categoryName}" style="cursor: pointer; font-size: 14px; padding: 2px 4px; user-select: none; line-height: 1;">
        🔍
      </span>
    `;

    // Visuell hover-effekt på bakgrunnen
    catItem.addEventListener('mouseenter', () => {
      catItem.style.backgroundColor = '#f1f5f9';
    });
    catItem.addEventListener('mouseleave', () => {
      catItem.style.backgroundColor = 'transparent';
    });

    // Sjekkboks-filtrering
    catItem.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!selectedCategories.includes(categoryName)) selectedCategories.push(categoryName);
      } else {
        selectedCategories = selectedCategories.filter(c => c !== categoryName);
      }
      if (calendar) calendar.refetchEvents();
    });

    // Åpne modalen ved klikk på 🔍
    catItem.querySelector('.preview-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      openCategoryModal({ name: categoryName, color: color });
    });

    filterList.appendChild(catItem);
  });
}



// Åpne kategorimodal og vis ALLE avtaler for valgt kategori/trinn
function openCategoryModal(categoryName) {
  const modal = document.getElementById('categoryModal');
  const title = document.getElementById('categoryModalTitle');
  const listContainer = document.getElementById('categoryEventsList');

  if (!modal) return;

  const catName = typeof categoryName === 'object' ? categoryName.name : categoryName;
  const catColor = typeof categoryName === 'object' ? categoryName.color : (typeof categoryColors !== 'undefined' ? categoryColors[catName] : '#2563eb');

  if (title) title.textContent = `Kategorioversikt: ${catName}`;
  if (listContainer) listContainer.innerHTML = '';

  // 🔑 NYTT: Vis matriseknappen KUN hvis kategorien er et trinn (1. - 7. trinn)
  const isTrinn = /^([1-7]\.\s*trinn)$/i.test(catName.trim());
  const gridBtn = document.getElementById('btnCategoryModalGrid');

  if (gridBtn) {
    if (isTrinn) {
      gridBtn.style.display = 'inline-block';
      gridBtn.textContent = `📊 Matrise for ${catName}`;
      gridBtn.onclick = () => openCategoryGridModal(catName);
    } else {
      gridBtn.style.display = 'none';
    }
  }

  // Hent alle statiske og brukerdefinerte hendelser trygt
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
    ...rawEvents
  ];

  // Presis filtrering for det valgte trinnet eller kategorien
  const matchedEvents = allRawEvents.filter(evt => {
    // 1. Sjekk om det er slettet av admin
    if (deletedStaticEventIds && deletedStaticEventIds.has(evt.id)) return false;

    // 2. Hent ut gruppe/kategori og trinn-array
    const grp = (evt.extendedProps?.group || evt.group || '').trim().toLowerCase();
    const trinnArray = evt.extendedProps?.trinn || evt.trinn || [];
    const target = catName.trim().toLowerCase();

    // Sjekk om kategorien matcher (f.eks. "DKS", "Møter", osv.)
    const matchesGroup = grp === target;

    // Sjekk om trinnet matcher (f.eks. at "1. trinn" finnes i ["1. trinn", "2. trinn"])
    const matchesTrinn = Array.isArray(trinnArray) && trinnArray.some(t => t.trim().toLowerCase() === target);

    return matchesGroup || matchesTrinn;
  });

  // Sorter hendelsene kronologisk på startdato
  matchedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  if (matchedEvents.length === 0) {
    listContainer.innerHTML = '<p style="color: #64748b; font-style: italic; padding: 10px;">Ingen avtaler funnet i denne kategorien.</p>';
  } else {
    matchedEvents.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'category-event-card';
      card.style.cssText = `border-left: 4px solid ${catColor}; padding: 10px 14px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; border-left-width: 4px;`;

      const titleText = evt.title || evt.extendedProps?.rawTitle || 'Uten tittel';
      const descText = evt.extendedProps?.description || '';

      // --- DATO-FORMATERING ---
      const startDateStr = evt.extendedProps?.startDate || (evt.start ? evt.start.split('T')[0] : '');
      const endDateStr = evt.extendedProps?.endDate || (evt.end ? evt.end.split('T')[0] : '');

      let dateFormatted = '';
      if (startDateStr) {
        const startObj = new Date(startDateStr + 'T00:00:00');
        const startNor = !isNaN(startObj) ? startObj.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) : startDateStr;

        if (endDateStr && endDateStr !== startDateStr) {
          const endObj = new Date(endDateStr + 'T00:00:00');
          const endNor = !isNaN(endObj) ? endObj.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) : endDateStr;
          dateFormatted = `${startNor}. – ${endNor}.`;
        } else {
          dateFormatted = `${startNor}.`;
        }
      }

      // --- KLOKKESLETT-FORMATERING ---
      const startTime = evt.extendedProps?.startTime || (evt.start && evt.start.includes('T') ? evt.start.split('T')[1].substring(0, 5) : '');
      const endTime = evt.extendedProps?.endTime || (evt.end && evt.end.includes('T') ? evt.end.split('T')[1].substring(0, 5) : '');

      let timeFormatted = '';
      if (startTime) {
        timeFormatted = endTime ? `kl. ${startTime} - ${endTime}` : `kl. ${startTime}`;
      }

      let datetimeLabel = '';
      if (dateFormatted && timeFormatted) {
        datetimeLabel = `📅 ${dateFormatted} &nbsp;•&nbsp; ⏰ ${timeFormatted}`;
      } else if (dateFormatted) {
        datetimeLabel = `📅 ${dateFormatted}`;
      } else if (timeFormatted) {
        datetimeLabel = `⏰ ${timeFormatted}`;
      }

      card.innerHTML = `
        <div class="event-title" style="font-weight: 600; color: #0f172a; font-size: 0.95rem;">${titleText}</div>
        ${datetimeLabel ? `<div class="event-time" style="font-size: 0.82rem; color: #64748b; margin-top: 3px; display: flex; align-items: center; gap: 4px;">${datetimeLabel}</div>` : ''}
        ${descText ? `<div class="event-desc" style="font-size: 0.88rem; color: #334155; margin-top: 6px; white-space: pre-line;">${descText}</div>` : ''}
      `;

      listContainer.appendChild(card);
    });
  }

  modal.style.display = 'flex';
}


// Åpne Rutenett / Matrise-modalen med alle kategorier bortover
// Liste over fag/kategorier som skal vises som kolonner etter det valgte trinnet
const TRINN_SUB_CATEGORIES = [
  "DKS", 
  "Svømming", 
  "Fellesaktiviteter", 
  "SFO", 
  "Kartlegging", 
  "Møter", 
  "UiA", 
  "Sosialt"
];


// Åpne Rutenett / Matrise-modalen KUN for det valgte trinnet
function openCategoryGridModal(targetTrinn) {
  const gridModal = document.getElementById('gridOverviewModal');
  const gridContainer = document.getElementById('categoryGridContainer');
  const gridTitle = document.getElementById('gridOverviewTitle');
  if (!gridModal || !gridContainer) return;

  gridContainer.innerHTML = '';
  if (gridTitle) gridTitle.textContent = `Matriseoversikt: ${targetTrinn}`;

  // 1. Definer kolonnene: Først trinnet selv, deretter fag/kategoriene
  const columnsToDisplay = [targetTrinn, ...TRINN_SUB_CATEGORIES];

  // 2. Hent alle hendelser
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
    ...rawEvents
  ];

  // 3. Filtrer ut KUN hendelser som gjelder dette trinnet
  const trinnLower = targetTrinn.trim().toLowerCase();
  const trinnEvents = allRawEvents.filter(evt => {
    if (deletedStaticEventIds && deletedStaticEventIds.has(evt.id)) return false;

    const grp = (evt.extendedProps?.group || evt.group || '').trim().toLowerCase();
    const trinnArray = evt.extendedProps?.trinn || evt.extendedProps?.trinnArray || evt.trinn || [];

    const isDirectTrinn = grp === trinnLower;
    const isIncludedInTrinnArray = Array.isArray(trinnArray) && trinnArray.some(t => t.trim().toLowerCase() === trinnLower);

    return isDirectTrinn || isIncludedInTrinnArray;
  });

  // 4. Bygg kolonner bortover (vis KUN kolonner som har hendelser)
  columnsToDisplay.forEach(colName => {
    const colColor = (typeof categoryColors !== 'undefined' && categoryColors[colName]) ? categoryColors[colName] : '#2563eb';
    const colNameLower = colName.trim().toLowerCase();
    
    // 🔑 KJERNEENDRING: Sjekker riktig tilhørighet per kolonne
    const matchedEvents = trinnEvents.filter(evt => {
      const grp = (evt.extendedProps?.group || evt.group || '').trim().toLowerCase();

      // Første kolonne (f.eks. "1. trinn"): vis avtaler der Hovedkategorien er "1. trinn"
      if (colNameLower === trinnLower) {
        return grp === trinnLower;
      }
      
      // Fag-kolonnene (f.eks. "DKS", "Svømming", "Fellesaktiviteter"): 
      // Vis dersom hovedkategorien matcher faget ELLER om tittelen/teksten inneholder faget
      return grp === colNameLower;
    });

    // Hvis det IKKE finnes hendelser for denne kategorien på dette trinnet, hoppes kolonnen over
    if (matchedEvents.length === 0) return;

    // Sorter hendelsene kronologisk
    matchedEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Opprett kolonnen
    const col = document.createElement('div');
    col.className = 'category-grid-column';

    // Kolonne-overskrift
    const header = document.createElement('div');
    header.className = 'category-grid-header';
    header.style.backgroundColor = colColor;
    header.textContent = colName;
    col.appendChild(header);

    // Vertikal stabling for kortene
    const content = document.createElement('div');
    content.className = 'category-grid-content';
    content.style.cssText = 'display: flex; flex-direction: column; gap: 8px; padding: 8px; overflow-y: auto; width: 100%; box-sizing: border-box;';

    // Legg til kortene
    matchedEvents.forEach(evt => {
      const card = document.createElement('div');
      card.className = 'grid-event-card';
      card.style.cssText = `border-left: 4px solid ${colColor}; width: 100%; box-sizing: border-box;`;

      const titleText = evt.title || evt.extendedProps?.rawTitle || 'Uten tittel';
      const descText = evt.extendedProps?.description || evt.description || '';
      const startDateStr = evt.extendedProps?.startDate || (evt.start ? evt.start.split('T')[0] : '');
      
      let dateFormatted = '';
      if (startDateStr) {
        const startObj = new Date(startDateStr + 'T00:00:00');
        dateFormatted = !isNaN(startObj) ? startObj.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' }) : startDateStr;
      }

      const startTime = evt.extendedProps?.startTime || (evt.start && evt.start.includes('T') ? evt.start.split('T')[1].substring(0, 5) : '');

      card.innerHTML = `
        <div class="grid-event-title">${titleText}</div>
        <div class="grid-event-time">📅 ${dateFormatted} ${startTime ? '⏰ kl. ' + startTime : ''}</div>
        ${descText ? `<div class="grid-event-desc">${descText}</div>` : ''}
      `;
      content.appendChild(card);
    });

    col.appendChild(content);
    gridContainer.appendChild(col);
  });

  // Hvis INGEN av kategoriene har noen avtaler for trinnet
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

  // 🔑 NULLSTILL TRINN-SJEKKBOKSER VED NY AVTALE
  document.querySelectorAll('input[name="trinnOption"]').forEach(cb => cb.checked = false);

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
  console.log("Aktiv hendelse:", activeEvent?.id, activeEvent?.extendedProps);
  hideContextMenu();
  document.getElementById('modalHeaderTitle').textContent = "Avtaledetaljer";
  document.getElementById('eventForm').style.display = 'none';
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('deleteConfirmMode').style.display = 'none';
  document.getElementById('normalFooter').style.display = 'flex';

  document.getElementById('formCancelBtn').style.display = 'none';
  document.getElementById('formSubmitBtn').style.display = 'none';
  document.getElementById('viewCancelBtn').style.display = 'inline-block';

  // 1. Sjekk om dette er en skolerute (fridager/planleggingsdager)
  const isSchoolRoute = activeEvent?.isSchoolRoute || activeEvent?.extendedProps?.isSchoolRoute;

  // 2. Sjekk om innlogget bruker har admin-rettigheter
  const admin = typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin();

  // 3. Admin skal kunne slette/redigere ALT unntatt rene skoleruter/fridager
  const canEditOrDelete = admin && !isSchoolRoute;

  // Vis eller skjul knapper basert på rettigheter
  document.getElementById('viewEditBtn').style.display = canEditOrDelete ? 'inline-block' : 'none';
  document.getElementById('viewDeleteBtn').style.display = canEditOrDelete ? 'inline-block' : 'none';

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

  // 1. Tøm og tilbakestill skjemaet
  document.getElementById('eventId').value = '';
  document.getElementById('eventForm').reset();

  // 🔑 VIKTIG: Tving isRecurringMode til "false" for nye enkeltavtaler!
  const recInput = document.getElementById('isRecurringMode');
  if (recInput) recInput.value = "false";
  
  const repeatCheckbox = document.getElementById('isRecurringCheckbox');
  if (repeatCheckbox) repeatCheckbox.checked = false;

  let startDate = currentSelection.start;

  // 🔑 KJERNE-FIKSEN FOR DATO:
  // Vi tvinger at en ny avtale ALLTID har samme sluttdato som startdato 
  // når man oppretter en enkeltavtale fra kalenderen.
  const formattedStart = formatDate(startDate);
  
  document.getElementById('startDate').value = formattedStart;
  document.getElementById('endDate').value = formattedStart; // Satt lik startDate!

  if (!currentSelection.allDay) {
    document.getElementById('startTime').value = formatTime(startDate);
    
    // Hvis valget har et sluttidspunkt bruker vi det, ellers setter vi f.eks. +1 time
    let endDate = currentSelection.end || new Date(startDate.getTime() + (60 * 60 * 1000));
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

// Global hjelpefunksjon for å beregne ISO-ukenummer
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

  // Neste måneds dager
  let nextMonthDay = 1;
  while (allDays.length % 7 !== 0) {
    const dateObj = new Date(year, month + 1, nextMonthDay);
    allDays.push({ dayNum: nextMonthDay, type: 'other-month', dateObj });
    nextMonthDay++;
  }

  // 2. Bygg rutenettet uke for uke
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    const mondayDate = weekDays[0].dateObj;
    const weekNum = getISOWeekNumber(mondayDate);

    const weekDiv = document.createElement('div');
    weekDiv.className = 'mini-week-num';
    weekDiv.textContent = weekNum;
    grid.appendChild(weekDiv);

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

/* Oppstart & FullCalendar */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof populateGroupDropdown === 'function') {
    populateGroupDropdown();
  }

  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    selectable: true,
    selectMirror: true,
    unselectAuto: false,
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

          const view = calendar.view;
          const viewStart = view.activeStart;
          const viewEnd = view.activeEnd;
          const weekNum = getISOWeekNumber(view.currentStart);

          const titleEl = document.getElementById('categoryModalTitle');
          if (titleEl) {
            titleEl.textContent = `Ukeplan – Uke ${weekNum}`;
          }

          const currentEvents = calendar.getEvents().filter(evt => {
            const evtStart = evt.start;
            const evtEnd = evt.end || evtStart;
            return evtStart < viewEnd && evtEnd >= viewStart && evt.display !== 'none';
          });

          const uniqueEventsMap = new Map();
          currentEvents.forEach(evt => {
            const key = `${evt.title}_${evt.startStr}`;
            if (!uniqueEventsMap.has(key)) {
              uniqueEventsMap.set(key, evt);
            }
          });

          const sortedEvents = Array.from(uniqueEventsMap.values()).sort((a, b) => a.start - b.start);

          const listContainer = document.getElementById('categoryEventsList');
          if (listContainer) {
            listContainer.innerHTML = '';

            if (sortedEvents.length === 0) {
              listContainer.innerHTML = '<p style="color: #64748b; font-style: italic; padding: 6px;">Ingen avtaler funnet for denne uken i de valgte kategoriene.</p>';
            } else {
              sortedEvents.forEach(evt => {
                const ext = evt.extendedProps || {};
                const card = document.createElement('div');
                card.className = 'category-event-card';

                const titleText = evt.title || ext.rawTitle || 'Uten tittel';
                const startD = evt.start;
                const endD = evt.end ? new Date(evt.end.getTime() - (evt.allDay ? 86400000 : 0)) : startD;

                const fmt = { day: 'numeric', month: 'short' };
                let dateStr = startD.toLocaleDateString('no-NO', fmt);
                if (endD && endD.toDateString() !== startD.toDateString()) {
                  dateStr += ` – ${endD.toLocaleDateString('no-NO', fmt)}`;
                }

                let timeStr = '';
                if (!evt.allDay && evt.start) {
                  const startTime = evt.start.toTimeString().substring(0, 5);
                  const endTime = evt.end ? evt.end.toTimeString().substring(0, 5) : '';
                  timeStr = endTime ? `kl. ${startTime}-${endTime}` : `kl. ${startTime}`;
                }

                let datetimeLabel = `📅 ${dateStr}`;
                if (timeStr) datetimeLabel += ` &nbsp;•&nbsp; ⏰ ${timeStr}`;

                const descText = ext.description || '';

                card.innerHTML = `
                  <div class="event-title">${titleText}</div>
                  <div class="event-time">${datetimeLabel}</div>
                  ${descText ? `<div class="event-desc">${descText}</div>` : ''}
                `;

                listContainer.appendChild(card);
              });
            }
          }

          document.body.classList.add('printing-week');
          window.print();

          setTimeout(() => {
            document.body.classList.remove('printing-week');
          }, 500);
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

      const view = info.view;
      if (view.type === 'timeGridWeek' || view.type === 'dayGridWeek' || view.type === 'listWeek') {
        const weekNum = getISOWeekNumber(view.currentStart);
        const titleEl = document.querySelector('.fc-toolbar-title');
        if (titleEl) {
          const startDay = view.currentStart.getDate();
          const endDate = new Date(view.currentEnd);
          endDate.setDate(endDate.getDate() - 1);
          const endDay = endDate.getDate();
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

      // 🔑 SØRG FOR AT TRINN BLIR HENTET RIKTIG SOM ARRAY
      const rawTrinn = ext.trinn || ext.trinnArray || info.event.trinn || [];
      const trinnArray = Array.isArray(rawTrinn) ? rawTrinn : (rawTrinn ? [rawTrinn] : []);

      activeEvent = {
        id: info.event.id || '',
        title: ext.rawTitle || info.event.title || '',
        group: ext.group || info.event.group || '',
        trinn: trinnArray, 
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

      // 🔑 VIS TRINN I VISNINGSMODUS (#viewTrinn)
      const viewTrinnEl = document.getElementById('viewTrinn');
      if (viewTrinnEl) {
        viewTrinnEl.textContent = trinnArray.length > 0 ? trinnArray.join(', ') : 'Ingen trinn valgt';
      }

      // 🔑 KRYSS AV RIKTIGE BOKSER I SKJEMAET VED REDIGERING
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

      if (viewDescription) {
        let content = activeEvent.description || "Ingen beskrivelse oppgitt.";
        if (activeEvent.url) {
          content += `<br><br>🔗 <strong>Informasjon:</strong> <a href="${activeEvent.url}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-weight: 600; text-decoration: underline;">Les mer ↗</a>`;
        }
        if (activeEvent.regUrl) {
          content += `<br>📝 <strong>Registrering:</strong> <a href="${activeEvent.regUrl}" target="_blank" rel="noopener noreferrer" style="color: #059669; font-weight: 600; text-decoration: underline;">${activeEvent.regTekst || 'Åpne registrering ↗'}</a>`;
        }
        viewDescription.innerHTML = content;
      }

      showViewMode();
    },

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
  if (typeof renderCategoryFilters === 'function') renderCategoryFilters();
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

// Firestore Realtime Lytter
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
    const eventColor = typeof getCategoryColor === 'function' 
      ? getCategoryColor(eventGroup) 
      : (categoryColors[eventGroup] || '#2563eb');

    const trinnArray = Array.isArray(data.trinn) ? data.trinn : [];

    return {
      id: doc.id,
      title: `${iconPrefix}${eventGroup ? '[' + eventGroup + '] ' : ''}${data.title}`,
      rawTitle: data.title,
      group: eventGroup,
      startDate: data.startDate,
      startTime: data.startTime || '',
      endDate: data.endDate || data.startDate,
      endTime: data.endTime || '',
      description: data.description || '',
      trinn: trinnArray,
      
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
        trinn: trinnArray,
        trinnArray: trinnArray
      }
    };
  });
  if (typeof updateCalendarEvents === 'function') {
    updateCalendarEvents();
  }
});

// Sjekker om en hendelse tilhører de valgte kategoriene
// Alias-mapping for å koble ulike gruppenavn til menykategoriene
const categoryAliases = {
  'felles': 'Fellesaktiviteter',
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

// Hjelpefunksjon for å finne riktig farge basert på gruppenavn og alias
function getCategoryColor(groupName) {
  if (!groupName) return '#3788d8';
  
  const rawGroup = groupName.toLowerCase().trim();
  const targetCategory = categoryAliases[rawGroup] || groupName;
  
  const matchedKey = typeof categoryColors !== 'undefined' 
    ? Object.keys(categoryColors).find(k => k.toLowerCase() === targetCategory.toLowerCase())
    : null;
  
  return (categoryColors && categoryColors[matchedKey]) 
      || (categoryColors && categoryColors[groupName]) 
      || '#3788d8';
}

// Sjekker om en hendelse tilhører de valgte kategoriene
function isEventInSelectedCategories(event) {
  if (typeof selectedCategories === 'undefined' || !selectedCategories || selectedCategories.length === 0) return false;

  const rawGroup = (event.extendedProps?.group || event.group || '').trim();
  
  // Sørger for at "kartlegging" og "kartlegginger" blir behandlet likt i categoryAliases
  const mappedGroup = (categoryAliases[rawGroup.toLowerCase()] || rawGroup).toLowerCase();
  
  // 🔑 HENTER UT TRINN TRYGT FRA ALLE MULIGE STEDER (trinn, trinnArray eller direkte)
  const trinnArray = event.extendedProps?.trinn 
                  || event.extendedProps?.trinnArray 
                  || event.trinn 
                  || [];

  const title = (event.title || event.extendedProps?.rawTitle || '').toLowerCase();
  const description = (event.extendedProps?.description || event.description || '').toLowerCase();
  const altInnhold = `${rawGroup} ${title} ${description}`.toLowerCase();

  for (const cat of selectedCategories) {
    const catLower = cat.toLowerCase().trim();
    const isTrinnCategory = catLower.endsWith('. trinn');

    // 1. Direkte match på Kategori/Gruppe (f.eks. "Fellesaktiviteter", "Svømming" eller "Kartlegginger")
    if (mappedGroup === catLower) {
      return true;
    }

    // SPESIALHÅNDTERING: Entall vs. flertall for Kartlegging(er)
    if ((mappedGroup === 'kartlegging' || mappedGroup === 'kartlegginger') && 
        (catLower === 'kartlegging' || catLower === 'kartlegginger')) {
      return true;
    }

    // 2. SJEKK DIREKTE PÅ VALGTE TRINN I SKJEMAET (Uavhengig av om cat slutter på '. trinn')
    if (Array.isArray(trinnArray) && trinnArray.some(t => String(t).toLowerCase().trim() === catLower)) {
      return true;
    }

    // 3. Sjekk om hendelsen matcher et spesifikt TRINN (f.eks. "3. trinn")
    if (isTrinnCategory) {
      // B) Felles for absolutt alle trinn
      if (altInnhold.includes("alle trinn") || altInnhold.includes("1.-7. trinn") || altInnhold.includes("1-7. trinn") || mappedGroup === "fellesaktiviteter") {
        return true;
      }

      const trinnNummer = parseInt(cat.split('.')[0].trim(), 10);

      if (!isNaN(trinnNummer)) {
        // C) Sjekk om teksten inneholder et SPESIFIKT trinn eller klasse (f.eks. "3. trinn", "3a", "7a-b", "3.trinn")
        const spesifiktTrinnRegex = new RegExp(`\\b${trinnNummer}(\\.|a|b|c|d|\\s*-\\s*|\\s*\\.\\s*trinn|\\s*trinn)`, 'i');
        const harSpesifiktTrinnITekst = spesifiktTrinnRegex.test(altInnhold);

        // Sjekk om teksten matcher et tallområde (f.eks "1.-3. trinn" eller "1-3. trinn")
        let matcherOmrade = false;
        const rangeMatch = altInnhold.match(/(\d+)\s*[\.\-]\s*(\d+)\.?\s*trinn/i);
        if (rangeMatch) {
          const startTrinn = parseInt(rangeMatch[1], 10);
          const sluttTrinn = parseInt(rangeMatch[2], 10);
          if (trinnNummer >= startTrinn && trinnNummer <= sluttTrinn) {
            matcherOmrade = true;
          }
        }

        if (harSpesifiktTrinnITekst || matcherOmrade) {
          return true; // Matcher nøyaktig det trinnet eller et definert intervall
        }

        // D) FALLBACK: Bruk Heståsen / Brattbakken KUN dersom INGEN andre spesifikke trinn er nevnt i teksten
        const harAndreTrinnTekst = /\b[1-7](\.|a|b|c|d|\s*trinn)/i.test(altInnhold);

        if (!harAndreTrinnTekst) {
          if (altInnhold.includes("heståsen") && trinnNummer >= 1 && trinnNummer <= 3) return true;
          if (altInnhold.includes("brattbakken") && trinnNummer >= 4 && trinnNummer <= 7) return true;
        }
      }
    }

    // 4. Samlekategorier
    if (cat === "Alle på Heståsen" && (altInnhold.includes("heståsen") || (Array.isArray(trinnArray) && trinnArray.some(t => ["1. trinn", "2. trinn", "3. trinn"].includes(t))))) {
      return true;
    }
    if (cat === "Alle på Brattbakken" && (altInnhold.includes("brattbakken") || (Array.isArray(trinnArray) && trinnArray.some(t => ["4. trinn", "5. trinn", "6. trinn", "7. trinn"].includes(t))))) {
      return true;
    }
  }

  return false;
}


// --- KALENDER OPPDATERING ---
function updateCalendarEvents() {
  const isAdmin = typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin();

  let filteredBursdagEvents = [];
  if (typeof getBirthdayEvents === 'function' && typeof calendar !== 'undefined' && calendar) {
    const currentYear = calendar.getDate().getFullYear();
    const rawBursdager = getBirthdayEvents(currentYear);
    filteredBursdagEvents = rawBursdager.filter(event => isEventInSelectedCategories(event));
  }

  // --- HENT HENDELSER TRYGT ---
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
    if (!Array.isArray(events)) return [];
    return events
      .filter(evt => typeof deletedStaticEventIds !== 'undefined' ? !deletedStaticEventIds.has(evt.id) : true)
      .filter(event => isEventInSelectedCategories(event))
      .map(evt => {
        const grp = evt.extendedProps?.group || evt.group || '';
        const colorKey = typeof categoryColors !== 'undefined' 
          ? Object.keys(categoryColors).find(k => k.toLowerCase() === grp.toLowerCase()) 
          : null;
        const c = (categoryColors && categoryColors[colorKey]) || evt.backgroundColor || evt.color || '#3788d8';
        
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

  // 🔑 NØKKELFORBEDRING: Konverter brukerskapte hendelser til gyldig FullCalendar-format!
  const userEventsSource = typeof rawEvents !== 'undefined' ? rawEvents : [];
  const processedUserEvents = userEventsSource
    .filter(event => isEventInSelectedCategories(event))
    .map(evt => {
      // Hent datoer
      const sDate = evt.startDate || (evt.start ? evt.start.split('T')[0] : '');
      const eDate = evt.endDate || sDate;
      const sTime = evt.startTime || '';
      const eTime = evt.endTime || '';

      // Tving start/end ISO-streng slik at FullCalendar skjønner NØYAKTIG hvilken dag det er
      let fullStart = sDate;
      let fullEnd = eDate;

      if (sDate && sTime) {
        fullStart = `${sDate}T${sTime}:00`;
      }
      if (eDate && eTime) {
        fullEnd = `${eDate}T${eTime}:00`;
      } else if (eDate && sTime) {
        // Hvis sluttid mangler, sett sluttid til 30 min etter start
        fullEnd = fullStart;
      }

      const grp = evt.group || evt.extendedProps?.group || '';
      const colorKey = typeof categoryColors !== 'undefined' 
        ? Object.keys(categoryColors).find(k => k.toLowerCase() === grp.toLowerCase()) 
        : null;
      const c = (categoryColors && categoryColors[colorKey]) || evt.backgroundColor || evt.color || '#e74c3c';

      return {
        ...evt,
        id: evt.id,
        title: evt.title,
        start: fullStart,  // 👈 FullCalendar MÅ ha denne egenskapen (heter 'start', IKKE 'startDate')
        end: fullEnd,      // 👈 FullCalendar MÅ ha denne egenskapen (heter 'end', IKKE 'endDate')
        allDay: !sTime,    // Hvis klokkeslett mangler, marker som allDay
        backgroundColor: c,
        borderColor: c,
        extendedProps: {
          ...evt.extendedProps,
          group: grp,
          trinn: evt.trinn || [],
          description: evt.description || '',
          recurringSeriesId: evt.recurringSeriesId || null
        }
      };
    });

  const allEvents = [
    ...schoolEvents, 
    ...processStaticEvents(rawFelles), 
    ...processStaticEvents(rawDks), 
    ...processStaticEvents(rawSvomme), 
    ...processStaticEvents(filteredBursdagEvents), 
    ...processStaticEvents(rawKartlegginger), 
    ...processStaticEvents(rawMoter),
    ...processStaticEvents(rawUia),
    ...processedUserEvents // 👈 Bruker de ferdig vaskede hendelsene
  ];

  if (typeof calendar !== 'undefined' && calendar) {
    calendar.removeAllEvents();
    calendar.addEventSource(allEvents);
  }
}


// --- MODAL & HENDELSES-LYTTERE ---
document.getElementById('modalCloseX')?.addEventListener('click', closeModal);
document.getElementById('formCancelBtn')?.addEventListener('click', closeModal);
document.getElementById('viewCancelBtn')?.addEventListener('click', closeModal);

// Sjekker om slette/rediger-knapper skal vises når en modal åpnes
function updateModalAdminButtons() {
  const isAdmin = typeof isCurrentUserAdmin === 'function' && isCurrentUserAdmin();
  const editBtn = document.getElementById('viewEditBtn');
  const deleteBtn = document.getElementById('viewDeleteBtn');

  if (activeEvent && activeEvent.isSchoolRoute) {
    if (editBtn) editBtn.style.display = 'none';
    if (deleteBtn) deleteBtn.style.display = 'none';
    return;
  }

  if (editBtn) editBtn.style.display = isAdmin ? 'inline-block' : 'none';
  if (deleteBtn) deleteBtn.style.display = isAdmin ? 'inline-block' : 'none';
}

document.getElementById('viewEditBtn')?.addEventListener('click', () => {
  if (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin()) {
    alert("Du må være administrator for å redigere denne hendelsen.");
    return;
  }

  if (activeEvent && !activeEvent.isSchoolRoute) {
    document.getElementById('eventId').value = activeEvent.id || '';
    document.getElementById('title').value = activeEvent.title || activeEvent.rawTitle || '';
    document.getElementById('group').value = activeEvent.extendedProps?.group || activeEvent.group || '1. trinn';
    
    // Sikrer at redigering ALDRI utløser repeteringsmodus ved uhell
    const recInput = document.getElementById('isRecurringMode');
    if (recInput) recInput.value = "false";
    
    // Håndter dato/tid trygt
    const startIso = activeEvent.startDate || (activeEvent.start ? new Date(activeEvent.start).toISOString().split('T')[0] : '');
    const endIso = activeEvent.endDate || (activeEvent.end ? new Date(activeEvent.end).toISOString().split('T')[0] : startIso);

    document.getElementById('startDate').value = startIso;
    document.getElementById('startTime').value = activeEvent.startTime || '';
    document.getElementById('endDate').value = endIso;
    document.getElementById('endTime').value = activeEvent.endTime || '';

    document.getElementById('description').value = activeEvent.extendedProps?.description || activeEvent.description || '';

    // 🔑 KRYSS AV RIKTIGE TRINN TIGHT MATCH
    const trinnValues = activeEvent.extendedProps?.trinn 
                     || activeEvent.extendedProps?.trinnArray 
                     || activeEvent.trinn 
                     || [];

    document.querySelectorAll('input[name="trinnOption"]').forEach(cb => {
      cb.checked = Array.isArray(trinnValues) && trinnValues.some(v => String(v).trim().toLowerCase() === cb.value.trim().toLowerCase());
    });

    showFormMode("Rediger avtale", false);
  }
});

document.getElementById('viewDeleteBtn')?.addEventListener('click', async () => {
  if (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin()) {
    alert("Du må være administrator for å slette hendelser.");
    return;
  }

  if (!activeEvent || activeEvent.isSchoolRoute) return;

// Håndtering dersom det er en statisk .js-hendelse
  if (activeEvent.extendedProps?.isStatic || activeEvent.isStatic) {
    if (confirm(`Vil du slette den faste hendelsen "${activeEvent.title}" for alle?`)) {
      const targetId = activeEvent.id;
      closeModal();
      try {
        await setDoc(doc(db, "deleted_static_events", targetId), {
          deletedBy: auth.currentUser?.email || 'admin', // <-- Endret her!
          deletedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Feil ved sletting av statisk hendelse:", err);
        alert("Kunne ikke slette hendelsen.");
      }
    }
    return;
  }

  // Sletting av repetitive serier eller enkle brukerskapte hendelser
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
  if (!activeEvent || (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin())) return;
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
  if (!activeEvent || !activeEvent.recurringSeriesId || (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin())) return;
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
  if (!activeEvent || !activeEvent.recurringSeriesId || (typeof isCurrentUserAdmin === 'function' && !isCurrentUserAdmin())) return;
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





document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!isCurrentUserAdmin()) {
    alert("Du har ikke tilgang til å lagre endringer.");
    return;
  }

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

  // Henter alle valgte trinn fra sjekkboksene
  const selectedTrinn = Array.from(document.querySelectorAll('input[name="trinnOption"]:checked'))
    .map(cb => cb.value);

  closeModal();

  try {
    if (eventId) {
      // Redigering av enhetlig hendelse
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
      // 🔑 KORRIGERT LOGIKK FOR REGELMESSIGE HENDELSER
      const eventsToCreate = [];
      const baseStart = new Date(startDateStr + "T00:00:00");
      const baseEnd = new Date((endDateStr || startDateStr) + "T00:00:00");

      // Beregn varigheten i dager (0 for samme dag)
      const daySpan = Math.round((baseEnd - baseStart) / (1000 * 60 * 60 * 24));
      
      const iterations = (repeatPattern === 'monthly') ? 10 : (repeatPattern === 'biweekly' ? 20 : 40);
      const seriesId = 'series_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

      for (let i = 0; i < iterations; i++) {
        let nextStart = new Date(baseStart.getTime());

        if (repeatPattern === 'weekly') {
          nextStart.setDate(baseStart.getDate() + (i * 7));
        } else if (repeatPattern === 'biweekly') {
          nextStart.setDate(baseStart.getDate() + (i * 14));
        } else if (repeatPattern === 'monthly') {
          nextStart.setMonth(baseStart.getMonth() + i);
        }

        // Regn ut endDate nøyaktig ut fra den NYE startdatoen
        let nextEnd = new Date(nextStart.getTime());
        nextEnd.setDate(nextStart.getDate() + daySpan);

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




function renderFilters() {
  const filterContainer = document.getElementById('filterList');
  if (!filterContainer) return;
  filterContainer.innerHTML = '';

  if (typeof categoryColors === 'undefined') return;

  Object.keys(categoryColors).forEach(cat => {
    const item = document.createElement('div');
    item.className = 'filter-item-vert';
    
    // Checkbox for filtrering
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = typeof selectedCategories !== 'undefined' && selectedCategories.includes(cat);
    checkbox.value = cat;
    
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      if (typeof selectedCategories === 'undefined') return;

      if (e.target.checked) {
        if (!selectedCategories.includes(cat)) selectedCategories.push(cat);
      } else {
        selectedCategories = selectedCategories.filter(c => c !== cat);
      }
      
      updateCalendarEvents();
      checkSingleCategorySelection();
    });

    // Fargeprikk
    const colorDot = document.createElement('span');
    colorDot.className = 'color-dot';
    const catColor = categoryColors[cat] || '#3788d8';
    colorDot.style.backgroundColor = catColor;

    // Kategori-navn
    const labelText = document.createElement('span');
    labelText.className = 'filter-label';
    labelText.textContent = cat;

    // Klikkområde som åpner modalen
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

  if (typeof selectedCategories !== 'undefined' && selectedCategories.length === 1) {
    const activeCat = selectedCategories[0];
    printBtn.textContent = `🖨️ Skriv ut liste for "${activeCat}"`;
    printBtn.style.display = 'block';
  } else {
    printBtn.style.display = 'none';
  }
}

// Utskrift for enkeltkategori
document.getElementById('btnPrintCategory')?.addEventListener('click', () => {
  if (typeof selectedCategories === 'undefined' || selectedCategories.length !== 1) return;

  const selectedCategory = selectedCategories[0];
  const originalView = calendar.view.type;
  const originalDate = calendar.getDate();

  const currentMonth = originalDate.getMonth();
  const startYear = currentMonth >= 7 ? originalDate.getFullYear() : originalDate.getFullYear() - 1;
  const schoolYearStart = `${startYear}-08-01`;

  calendar.changeView('schoolYearList');
  calendar.gotoDate(schoolYearStart);

  const shouldIncludeEvent = (evt) => {
    const trinnArray = evt.extendedProps?.trinn || evt.trinn || [];
    if (Array.isArray(trinnArray) && trinnArray.includes(selectedCategory)) {
      return true;
    }
    return isEventInSelectedCategories(evt);
  };


  const getFelles = typeof getFellesaktiviteterSomEvents === 'function' ? getFellesaktiviteterSomEvents() : (typeof fellesEventsFromJs !== 'undefined' ? fellesEventsFromJs : []);
  const getDks = typeof getDksAktiviteterSomEvents === 'function' ? getDksAktiviteterSomEvents() : (typeof dksEventsFromJs !== 'undefined' ? dksEventsFromJs : []);
  const getSvomme = typeof getSvommeAktiviteterSomEvents === 'function' ? getSvommeAktiviteterSomEvents() : (typeof svommeEventsFromJs !== 'undefined' ? svommeEventsFromJs : []);
  const getMoter = typeof getMoteAktiviteterSomEvents === 'function' ? getMoteAktiviteterSomEvents() : (typeof moterEventsFromJs !== 'undefined' ? moterEventsFromJs : []);
  const getUia = typeof getUiAAktiviteterSomEvents === 'function' ? getUiAAktiviteterSomEvents() : (typeof uiaEventsFromJs !== 'undefined' ? uiaEventsFromJs : []);
  const getKartlegging = typeof getKartleggingerSomEvents === 'function' ? getKartleggingerSomEvents() : (typeof kartleggingEventsFromJs !== 'undefined' ? kartleggingEventsFromJs : []);

  const userEventsSource = typeof rawEvents !== 'undefined' ? rawEvents : [];

  const filteredUserEvents = userEventsSource.filter(shouldIncludeEvent);
  const filteredFellesEvents = getFelles.filter(shouldIncludeEvent);
  const filteredDksEvents = getDks.filter(shouldIncludeEvent);
  const filteredSvommeEvents = getSvomme.filter(shouldIncludeEvent);
  const filteredMoteEvents = getMoter.filter(shouldIncludeEvent);
  const filteredUiaEvents = getUia.filter(shouldIncludeEvent);
  const filteredKartleggingEvents = getKartlegging.filter(shouldIncludeEvent);
  
  let filteredBursdager = [];
  if (typeof getBirthdayEvents === 'function' && calendar) {
    filteredBursdager = getBirthdayEvents(startYear).filter(shouldIncludeEvent);
  }

  const allRawEvents = [
    ...filteredFellesEvents, 
    ...filteredDksEvents, 
    ...filteredSvommeEvents, 
    ...filteredMoteEvents, 
    ...filteredUiaEvents,
    ...filteredKartleggingEvents,
    ...filteredBursdager,
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
      color: item.originalEvt.color || item.originalEvt.backgroundColor || '#3788d8'
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