/**
 * DKS (Den Kulturelle Skolesekken) – Hånes skole 2026-2027
 */

// Lenker til DKS-produksjonene
const DKS_LENKER = {
  "Mosaikk 26-27": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=23873",
  "Kunst Nå! 26-27": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=23885",
  "ARIADNES TRÅD": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=24729",
  "I Havets Favn 26-27": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=23676",
  "SANS 26-27": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=24072",
  "To i båden": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=25188",
  "ELLE MAIJA 26-27": "https://www.denkulturelleskolesekken.no/utforsk-produksjoner-i-dks/?produksjon=22943"
};

const DKS_REGISTER = [
  {
    id: "dks-1",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-08",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "1A (24 per)",
    trinn: "1. trinn"
  },
  {
    id: "dks-2",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-08",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "1b (24 per)",
    trinn: "1. trinn"
  },
  {
    id: "dks-3",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-09",
    startTid: "10:15",
    sluttTid: "11:45",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "2a (17 per)",
    trinn: "2. trinn"
  },
  {
    id: "dks-4",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-10",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "2b (17 per)",
    trinn: "2. trinn"
  },
  {
    id: "dks-5",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-10",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "2C (23 per)",
    trinn: "2. trinn"
  },
  {
    id: "dks-6",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-11",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "3a (22 per)",
    trinn: "3. trinn"
  },
  {
    id: "dks-7",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-11",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "3b (20 per)",
    trinn: "3. trinn"
  },
  {
    id: "dks-8",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-14",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "3C (18 per)",
    trinn: "3. trinn"
  },
  {
    id: "dks-9",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-14",
    startTid: "12:30",
    sluttTid: "14:00",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "4A (22 per)",
    trinn: "4. trinn"
  },
  {
    id: "dks-10",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-15",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "4b (23 per)",
    trinn: "4. trinn"
  },
  {
    id: "dks-11",
    tittel: "Mosaikk 26-27",
    dato: "2026-09-15",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole",
    arrangor: "Agder fylkeskommune",
    deltakere: "4C (19 per)",
    trinn: "4. trinn"
  },
  {
    id: "dks-12",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-21",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "5A (22 per)",
    trinn: "5. trinn"
  },
  {
    id: "dks-13",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-21",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "5b (21 per)",
    trinn: "5. trinn"
  },
  {
    id: "dks-14",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-22",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "5C (19 per)",
    trinn: "5. trinn"
  },
  {
    id: "dks-15",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-22",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "6A (22 per)",
    trinn: "6. trinn"
  },
  {
    id: "dks-16",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-23",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "6b (20 per)",
    trinn: "6. trinn"
  },
  {
    id: "dks-17",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-23",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "6C (23 per)",
    trinn: "6. trinn"
  },
  {
    id: "dks-18",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-24",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "6D (16 per)",
    trinn: "6. trinn"
  },
  {
    id: "dks-19",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-24",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "7A (22 per)",
    trinn: "7. trinn"
  },
  {
    id: "dks-20",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-25",
    startTid: "09:15",
    sluttTid: "10:45",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "7B (16 per)",
    trinn: "7. trinn"
  },
  {
    id: "dks-21",
    tittel: "Kunst Nå! 26-27",
    dato: "2026-09-25",
    startTid: "11:45",
    sluttTid: "13:15",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "7C (21 per)",
    trinn: "7. trinn"
  },
  {
    id: "dks-22",
    tittel: "ARIADNES TRÅD",
    dato: "2026-12-03",
    startTid: "09:00",
    sluttTid: "11:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Kristiansand kommune",
    deltakere: "6b (20 per), 6A (22 per)",
    trinn: "6. trinn"
  },
  {
    id: "dks-23",
    tittel: "ARIADNES TRÅD",
    dato: "2026-12-03",
    startTid: "12:00",
    sluttTid: "14:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Kristiansand kommune",
    deltakere: "6C (23 per), 6D (16 per)",
    trinn: "6. trinn"
  },
  {
    id: "dks-24",
    tittel: "I Havets Favn 26-27",
    dato: "2027-01-18",
    startTid: "10:15",
    sluttTid: "11:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "5.-6. trinn (103 deltakere)",
    trinn: ["5. trinn", "6. trinn"]
  },
  {
    id: "dks-25",
    tittel: "I Havets Favn 26-27",
    dato: "2027-01-18",
    startTid: "11:45",
    sluttTid: "12:30",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "6.-7. trinn (96 deltakere)",
    trinn: ["6. trinn", "7. trinn"]
  },
  {
    id: "dks-26",
    tittel: "SANS 26-27",
    dato: "2027-05-13",
    startTid: "09:15",
    sluttTid: "10:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "1.-3. trinn (152 deltakere)",
    trinn: ["1. trinn", "2. trinn", "3. trinn"]
  },
  {
    id: "dks-27",
    tittel: "SANS 26-27",
    dato: "2027-05-13",
    startTid: "10:15",
    sluttTid: "11:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "3.-5. trinn (143 deltakere)",
    trinn: ["3. trinn", "4. trinn", "5. trinn"]
  },
  {
    id: "dks-28",
    tittel: "SANS 26-27",
    dato: "2027-05-14",
    startTid: "09:15",
    sluttTid: "10:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "5.-7. trinn (156 deltakere)",
    trinn: ["5. trinn", "6. trinn", "7. trinn"]
  },
  {
    id: "dks-29",
    tittel: "To i båden",
    dato: "2027-05-18",
    startTid: "09:15",
    sluttTid: "09:55",
    sted: "Hånes skole – Gymsal",
    arrangor: "Kristiansand kommune",
    deltakere: "1A (24 per), 1b (24 per)",
    trinn: "1. trinn"
  },
  {
    id: "dks-30",
    tittel: "To i båden",
    dato: "2027-05-18",
    startTid: "11:45",
    sluttTid: "12:25",
    sted: "Hånes skole – Gymsal",
    arrangor: "Kristiansand kommune",
    deltakere: "2a (17 per), 2b (17 per), 2C (23 per)",
    trinn: "2. trinn"
  },
  {
    id: "dks-31",
    tittel: "To i båden",
    dato: "2027-05-19",
    startTid: "09:15",
    sluttTid: "09:55",
    sted: "Hånes skole – Gymsal",
    arrangor: "Kristiansand kommune",
    deltakere: "3a (22 per), 3b (20 per), 3C (18 per)",
    trinn: "3. trinn"
  },
  {
    id: "dks-32",
    tittel: "To i båden",
    dato: "2027-05-19",
    startTid: "11:45",
    sluttTid: "12:25",
    sted: "Hånes skole – Gymsal",
    arrangor: "Kristiansand kommune",
    deltakere: "4A (22 per), 4b (23 per), 4C (19 per)",
    trinn: "4. trinn"
  },
  {
    id: "dks-33",
    tittel: "ELLE MAIJA 26-27",
    dato: "2027-05-28",
    startTid: "10:15",
    sluttTid: "11:00",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "1.-2. trinn (130 deltakere)",
    trinn: ["1. trinn", "2. trinn"]
  },
  {
    id: "dks-34",
    tittel: "ELLE MAIJA 26-27",
    dato: "2027-05-28",
    startTid: "11:45",
    sluttTid: "12:30",
    sted: "Hånes skole – Gymsal",
    arrangor: "Agder fylkeskommune",
    deltakere: "3.-4. trinn (122 deltakere)",
    trinn: ["3. trinn", "4. trinn"]
  }
];

export function getDKSAktiviteter() {
  return DKS_REGISTER.map(a => ({
    ...a,
    url: DKS_LENKER[a.tittel] || null
  }));
}

export function getDKSAktiviteterSomEvents() {
  const liste = getDKSAktiviteter();

  return liste.map(a => {
    // Sørger for at trinnListe alltid blir et array
    const trinnListe = Array.isArray(a.trinn) ? a.trinn : [a.trinn];
    const dksUrl = DKS_LENKER[a.tittel] || null;

    return {
      id: a.id,
      title: `🎭 ${a.tittel} (${a.deltakere})`,
      start: `${a.dato}T${a.startTid}:00`,
      end: `${a.dato}T${a.sluttTid}:00`,
      allDay: false,
      backgroundColor: '#1abc9c',
      borderColor: '#16a085',
      extendedProps: {
        group: 'DKS',
        rawTitle: a.tittel,
        sted: a.sted,
        arrangor: a.arrangor,
        deltakere: a.deltakere,
        trinn: trinnListe, // Eksplisitt trinn-array
        url: dksUrl,
        description: `Sted: ${a.sted} | Arrangør: ${a.arrangor} | Deltakere: ${a.deltakere}`
      }
    };
  });
}