/**
 * Skolerute og fridager / røddager for skoleår.
 * Format på datoer: YYYY-MM-DD
 * Type-kategorier: 
 *  - "planlegging_sfo"    : Planleggingsdag kun for SFO
 *  - "planlegging_skole"  : Planleggingsdag kun for skole
 *  - "planlegging_begge"  : Planleggingsdag for både skole og SFO
 *  - "ferie"              : Skole- / SFO-ferie
 *  - "roddag"             : Norsk offentlig høytidsdag / rød dag
 *  - "hendelse"           : Skolestart, skoleslutt, SFO-åpning etc.
 */

export const schoolYearsData = {
  "2026-2027": [
    // --- JULI 2026 ---
    { startDate: "2026-07-27", endDate: "2026-07-27", title: "Planleggingsdag for SFO", type: "planlegging_sfo", schoolOpen: false, sfoOpen: false },
    { startDate: "2026-07-28", endDate: "2026-07-28", title: "SFO åpner", type: "hendelse", schoolOpen: false, sfoOpen: true },

    // --- AUGUST 2026 ---
    { startDate: "2026-08-10", endDate: "2026-08-11", title: "Planleggingsdager for skole og SFO", type: "planlegging_begge", schoolOpen: false, sfoOpen: false },
    { startDate: "2026-08-12", endDate: "2026-08-12", title: "Planleggingsdag for skole", type: "planlegging_skole", schoolOpen: false, sfoOpen: true },
    { startDate: "2026-08-13", endDate: "2026-08-13", title: "Første skoledag", type: "hendelse", schoolOpen: true, sfoOpen: true },

    // --- SEPTEMBER / OKTOBER 2026 ---
    { startDate: "2026-09-28", endDate: "2026-10-02", title: "Høstferie (uke 40)", type: "ferie", schoolOpen: false, sfoOpen: true },

    // --- NOVEMBER 2026 ---
    { startDate: "2026-11-06", endDate: "2026-11-06", title: "Planleggingsdag for skole og SFO", type: "planlegging_begge", schoolOpen: false, sfoOpen: false },

    // --- DESEMBER 2026 / JANUAR 2027 ---
    { startDate: "2026-12-21", endDate: "2027-01-03", title: "Juleferie", type: "ferie", schoolOpen: false, sfoOpen: false },
    // Norske røddager i julen:
    { startDate: "2026-12-25", endDate: "2026-12-25", title: "1. juledag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2026-12-26", endDate: "2026-12-26", title: "2. juledag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-01-01", endDate: "2027-01-01", title: "1. nyttårsdag", type: "roddag", schoolOpen: false, sfoOpen: false },

    { startDate: "2027-01-04", endDate: "2027-01-04", title: "Planleggingsdag for skole", type: "planlegging_skole", schoolOpen: false, sfoOpen: true },

    // --- FEBRUAR 2027 ---
    { startDate: "2027-02-22", endDate: "2027-02-26", title: "Vinterferie (uke 8)", type: "ferie", schoolOpen: false, sfoOpen: true },

    // --- MARS 2027 (PÅSKE) ---
    { startDate: "2027-03-22", endDate: "2027-03-30", title: "Påskeferie", type: "ferie", schoolOpen: false, sfoOpen: false },
    // Norske røddager i påsken 2027:
    { startDate: "2027-03-25", endDate: "2027-03-25", title: "Skjærtorsdag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-03-26", endDate: "2027-03-26", title: "Langfredag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-03-28", endDate: "2027-03-28", title: "1. påskedag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-03-29", endDate: "2027-03-29", title: "2. påskedag", type: "roddag", schoolOpen: false, sfoOpen: false },

    // --- MAI 2027 ---
    { startDate: "2027-05-01", endDate: "2027-05-01", title: "Offentlig høytidsdag (1. mai)", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-05-06", endDate: "2027-05-06", title: "Kristi Himmelfartsdag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-05-07", endDate: "2027-05-07", title: "Inneklemt dag (fri)", type: "ferie", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-05-16", endDate: "2027-05-16", title: "1. pinsedag", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-05-17", endDate: "2027-05-17", title: "Grunnlovsdag (17. mai)", type: "roddag", schoolOpen: false, sfoOpen: false },
    { startDate: "2027-05-17", endDate: "2027-05-17", title: "2. pinsedag", type: "roddag", schoolOpen: false, sfoOpen: false }, // Faller på 17. mai i 2027

    // --- JUNI / JULI 2027 ---
    { startDate: "2027-06-18", endDate: "2027-06-18", title: "Siste skoledag før sommerferien", type: "hendelse", schoolOpen: true, sfoOpen: true },
    { startDate: "2027-07-02", endDate: "2027-07-02", title: "Siste dag med SFO før sommerferie", type: "hendelse", schoolOpen: false, sfoOpen: true }
  ]
};