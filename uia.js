// uia.js - UiA Praksis og Studentperioder

// Oversikt over øvingslærere og deres klasser
export const ovingslarere = {
  "Gro": "4b",
  "Geir": "2a",
  "Tonje": "3b",
  "Camilla": "7a",
  "Espen": "5c",
  "Oliv": "5b"
};

// Hjelpefunksjon for å legge til klasse bak lærernavn
function berikLarere(larerTekst) {
  let resultat = larerTekst;
  Object.entries(ovingslarere).forEach(([navn, klasse]) => {
    // Erstatter f.eks. "Gro" med "Gro (4b)" dersom navnet finnes i teksten
    const regex = new RegExp(`\\b${navn}\\b`, 'g');
    resultat = resultat.replace(regex, `${navn} (${klasse})`);
  });
  return resultat;
}

export const uiaData = [
  // Uke 39: NORSEC
  {
    title: "UiA Praksis: NORSEC",
    startDate: "2026-09-21",
    endDate: "2026-09-25",
    description: "Student: NORSEC\nØvingslærer: Gro",
    group: "UiA"
  },
  // Uke 41-43: 1 GLU 1-7
  {
    title: "UiA Praksis: 1 GLU 1-7 (engelsk, naturfag og KRLE)",
    startDate: "2026-10-05",
    endDate: "2026-10-23",
    description: "Student: 1 GLU 1-7 (engelsk; naturfag og KRLE)\nØvingslærere: Camilla, Espen og Oliv",
    group: "UiA"
  },
  // Uke 45: NORSEC (Man-Tor)
  {
    title: "UiA Praksis: NORSEC",
    startDate: "2026-11-02",
    endDate: "2026-11-05",
    description: "Student: NORSEC\nØvingslærer: Gro",
    group: "UiA"
  },
  // Uke 7: 1 GLU 1-7 & 1-10
  {
    title: "UiA Praksis: 1 GLU 1-7 Norsk/Matte & 1 GLU 5-10 Engelsk",
    startDate: "2027-02-15",
    endDate: "2027-02-19",
    description: "Studenter: 1 GLU 1-7 Norsk og matematikk, 1 GLU 5-10 Engelsk\nØvingslærere: Geir (1-7), Tonje (1-7), Camilla (5-10)",
    group: "UiA"
  },
  // Uke 9: 1 GLU 1-7 & 1-10
  {
    title: "UiA Praksis: 1 GLU 1-7 Norsk/Matte & 1 GLU 5-10 Engelsk",
    startDate: "2027-03-01",
    endDate: "2027-03-05",
    description: "Studenter: 1 GLU 1-7 Norsk og matematikk, 1 GLU 5-10 Engelsk\nØvingslærere: Geir (1-7), Tonje (1-7), Camilla (5-10)",
    group: "UiA"
  },
  // Uke 10-11: Hovedpraksis (1 GLU)
  {
    title: "UiA Praksis: 1 GLU 1-7 Norsk/Matte & 1 GLU 5-10 Engelsk",
    startDate: "2027-03-08",
    endDate: "2027-03-19",
    description: "Studenter: 1 GLU 1-7 Norsk og matematikk, 1 GLU 5-10 Engelsk\nØvingslærere: Geir (1-7), Tonje (1-7), Camilla (5-10)",
    group: "UiA"
  },
  // Uke 10: CES Enkeltdager
  {
    title: "UiA Praksis: CES",
    startDate: "2027-03-09",
    endDate: "2027-03-09",
    description: "Student: CES\nØvingslærer: Gro",
    group: "UiA"
  },
  {
    title: "UiA Praksis: CES",
    startDate: "2027-03-11",
    endDate: "2027-03-11",
    description: "Student: CES\nØvingslærer: Gro",
    group: "UiA"
  },
  // Uke 11: CES Enkeltdager
  {
    title: "UiA Praksis: CES",
    startDate: "2027-03-16",
    endDate: "2027-03-16",
    description: "Student: CES\nØvingslærer: Gro",
    group: "UiA"
  },
  {
    title: "UiA Praksis: CES",
    startDate: "2027-03-18",
    endDate: "2027-03-18",
    description: "Student: CES\nØvingslærer: Gro",
    group: "UiA"
  },
  // Uke 13: 1 GLU 5-10 Engelsk (Onsd-Fred)
  {
    title: "UiA Praksis: 1 GLU 5-10 Engelsk",
    startDate: "2027-03-31",
    endDate: "2027-04-02",
    description: "Student: 1 GLU 5-10 Engelsk\nØvingslærer: Camilla",
    group: "UiA"
  }
];

// Funksjon som konverterer dataene til FullCalendar-eventer
export function getUiAAktiviteterSomEvents() {
  return uiaData.map((item, index) => {
    let endAdjusted = item.endDate;
    if (item.endDate) {
      const d = new Date(item.endDate + "T00:00:00");
      d.setDate(d.getDate() + 1);
      endAdjusted = d.toISOString().split('T')[0];
    }

    // Automatisk flett inn klassene i lærernavnene
    const beriketBeskrivelse = berikLarere(item.description);

    return {
      id: `uia_event_${index}_${item.startDate}`,
      title: item.title,
      start: item.startDate,
      end: endAdjusted,
      allDay: true,
      extendedProps: {
        group: "UiA",
        rawTitle: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        description: beriketBeskrivelse,
        isStatic: true
      }
    };
  });
}