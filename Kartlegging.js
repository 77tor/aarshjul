/**
 * Kartlegginger – Hånes skole 2026-2027
 */

// Hjelpefunksjon for å finne mandag i en gitt uke for skolestart-året
function getMondayOfISOWeek(week, year) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

// Formaterer dato til YYYY-MM-DD
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Genererer start (mandag) og slutt (fredag) ut fra ukeintervall
function getDatoRangeForUker(startUke, sluttUke) {
  // Ukene 34-52 er i 2026, uke 1-25 er i 2027
  const startAar = startUke >= 30 ? 2026 : 2027;
  const sluttAar = sluttUke >= 30 ? 2026 : 2027;

  const mandag = getMondayOfISOWeek(startUke, startAar);
  const fredag = getMondayOfISOWeek(sluttUke, sluttAar);
  fredag.setDate(fredag.getDate() + 4); // Fredag samme uke

  return {
    startDato: formatDateISO(mandag),
    sluttDato: formatDateISO(fredag)
  };
}

const KARTLEGGINGER_REGISTER = [
  // Bokstavtesten (1. trinn)
  {
    id: "kart-1a",
    tittel: "Bokstavtesten (nr. 1)",
    trinnText: "1. trinn",
    trinnListe: ["1. trinn"],
    startUke: 34,
    sluttUke: 38,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/bokstavtesten",
    regUrl: "https://engage-no.conexus.net/",
    regTekst: "Registrering i Conexus Engage"
  },
  {
    id: "kart-1b",
    tittel: "Bokstavtesten (nr. 2)",
    trinnText: "1. trinn",
    trinnListe: ["1. trinn"],
    startUke: 1,
    sluttUke: 4,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/bokstavtesten",
    regUrl: "https://engage-no.conexus.net/",
    regTekst: "Registrering i Conexus Engage"
  },
  {
    id: "kart-1c",
    tittel: "Bokstavtesten (nr. 3)",
    trinnText: "1. trinn",
    trinnListe: ["1. trinn"],
    startUke: 21,
    sluttUke: 25,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/bokstavtesten",
    regUrl: "https://engage-no.conexus.net/",
    regTekst: "Registrering i Conexus Engage"
  },

  // Ordkjedetesten (4. trinn)
  {
    id: "kart-2",
    tittel: "Ordkjedetesten",
    trinnText: "4. trinn",
    trinnListe: ["4. trinn"],
    startUke: 17,
    sluttUke: 20,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/ordkjedetesten",
    regUrl: "https://engage-no.conexus.net/",
    regTekst: "Registrering i Conexus Engage"
  },

  // Nasjonale prøver (5. trinn)
  {
    id: "kart-3",
    tittel: "Nasjonale prøver",
    trinnText: "5. trinn",
    trinnListe: ["5. trinn"],
    startUke: 36,
    sluttUke: 39,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/nasjonale-proever",
    regUrl: null,
    regTekst: "Registreres automatisk gjennom pålogg"
  },

  // Klassetrivsel (1.-7. trinn)
  {
    id: "kart-4a",
    tittel: "Klassetrivsel (Høst)",
    trinnText: "1.-7. trinn",
    trinnListe: ["1. trinn", "2. trinn", "3. trinn", "4. trinn", "5. trinn", "6. trinn", "7. trinn"],
    startUke: 37,
    sluttUke: 39,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/klassetrivsel-no",
    regUrl: null,
    regTekst: "Registreres automatisk gjennom pålogg"
  },
  {
    id: "kart-4b",
    tittel: "Klassetrivsel (Vår)",
    trinnText: "1.-7. trinn",
    trinnListe: ["1. trinn", "2. trinn", "3. trinn", "4. trinn", "5. trinn", "6. trinn", "7. trinn"],
    startUke: 9,
    sluttUke: 11,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/obligatoriske-kartlegginger/klassetrivsel-no",
    regUrl: null,
    regTekst: "Registreres automatisk gjennom pålogg"
  },

  // Lokale kartlegginger (1.-7. trinn)
  {
    id: "kart-5a",
    tittel: "Lokale kartlegginger (Høst)",
    trinnText: "1.-7. trinn",
    trinnListe: ["1. trinn", "2. trinn", "3. trinn", "4. trinn", "5. trinn", "6. trinn", "7. trinn"],
    startUke: 37,
    sluttUke: 39,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/supplement/lokale-kartlegginger",
    regUrl: "https://77tor.github.io/Reg-lokale-kart/",
    regTekst: "Registrering på nett"
  },
  {
    id: "kart-5b",
    tittel: "Lokale kartlegginger (Vår)",
    trinnText: "1.-7. trinn",
    trinnListe: ["1. trinn", "2. trinn", "3. trinn", "4. trinn", "5. trinn", "6. trinn", "7. trinn"],
    startUke: 9,
    sluttUke: 11,
    infoUrl: "https://sites.google.com/ikrs.no/kartlegging/home/supplement/lokale-kartlegginger",
    regUrl: "https://77tor.github.io/Reg-lokale-kart/",
    regTekst: "Registrering på nett"
  }
];

export function getKartlegginger() {
  return KARTLEGGINGER_REGISTER;
}

export function getKartleggingerSomEvents() {
  const liste = getKartlegginger();

  return liste.map(a => {
    const dates = getDatoRangeForUker(a.startUke, a.sluttUke);

    // FullCalendar ekskluderer sluttdatoen for allDay-events, så vi legger til 1 dag på end
    const endD = new Date(dates.sluttDato);
    endD.setDate(endD.getDate() + 1);
    const endStr = formatDateISO(endD);

    // Bygg opp beskrivelsen
    let desc = `Gjennomføring: Uke ${a.startUke}-${a.sluttUke} | Målgruppe: ${a.trinnText}`;
    if (a.regTekst) {
      desc += ` | ${a.regTekst}`;
    }

    return {
      id: a.id,
      title: `📊 ${a.tittel} (${a.trinnText})`,
      start: dates.startDato,
      end: endStr,
      allDay: true,
      backgroundColor: '#f59e0b', // Stilig oransje/amber farge for kartlegginger
      borderColor: '#d97706',
      extendedProps: {
        group: 'Kartlegging',
        rawTitle: a.tittel,
        deltakere: a.trinnText,
        trinn: a.trinnListe,
        url: a.infoUrl,
        regUrl: a.regUrl,
        regTekst: a.regTekst,
        description: desc
      }
    };
  });
}