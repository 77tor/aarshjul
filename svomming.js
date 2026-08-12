/**
 * Skolesvømming – Hånes skole 2026-2027
 */

const SVOMMING_REGISTER = [
  // August 2026
  { id: "svomm-1", tittel: "Skolesvømming", dato: "2026-08-26", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 7a-b" },
  { id: "svomm-2", tittel: "Skolesvømming", dato: "2026-08-27", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 7b-c" },
  { id: "svomm-3", tittel: "Skolesvømming", dato: "2026-08-28", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 7c-a" },

  // November 2026
  { id: "svomm-4", tittel: "Skolesvømming", dato: "2026-11-18", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b" },
  { id: "svomm-5", tittel: "Skolesvømming", dato: "2026-11-19", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3b-c" },
  { id: "svomm-6", tittel: "Skolesvømming", dato: "2026-11-20", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c-a" },
  { id: "svomm-7", tittel: "Skolesvømming", dato: "2026-11-25", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b" },
  { id: "svomm-8", tittel: "Skolesvømming", dato: "2026-11-26", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3b-c" },
  { id: "svomm-9", tittel: "Skolesvømming", dato: "2026-11-27", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c-a" },

  // Desember 2026
  { id: "svomm-10", tittel: "Skolesvømming", dato: "2026-12-02", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b" },
  { id: "svomm-11", tittel: "Skolesvømming", dato: "2026-12-03", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3b-c" },
  { id: "svomm-12", tittel: "Skolesvømming", dato: "2026-12-04", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c-a" },
  { id: "svomm-13", tittel: "Skolesvømming", dato: "2026-12-09", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b" },
  { id: "svomm-14", tittel: "Skolesvømming", dato: "2026-12-10", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c" },

  // Februar 2027
  { id: "svomm-15", tittel: "Skolesvømming", dato: "2027-02-10", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b" },
  { id: "svomm-16", tittel: "Skolesvømming", dato: "2027-02-11", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c" },
  { id: "svomm-17", tittel: "Skolesvømming", dato: "2027-02-12", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a" },
  { id: "svomm-18", tittel: "Skolesvømming", dato: "2027-02-17", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b" },
  { id: "svomm-19", tittel: "Skolesvømming", dato: "2027-02-18", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c" },
  { id: "svomm-20", tittel: "Skolesvømming", dato: "2027-02-19", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a" },

  // Mars 2027
  { id: "svomm-21", tittel: "Skolesvømming", dato: "2027-03-03", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b" },
  { id: "svomm-22", tittel: "Skolesvømming", dato: "2027-03-04", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c" },
  { id: "svomm-23", tittel: "Skolesvømming", dato: "2027-03-05", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a" },
  { id: "svomm-24", tittel: "Skolesvømming", dato: "2027-03-10", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b" },
  { id: "svomm-25", tittel: "Skolesvømming", dato: "2027-03-11", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c" },
  { id: "svomm-26", tittel: "Skolesvømming", dato: "2027-03-12", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a" },
  { id: "svomm-27", tittel: "Skolesvømming", dato: "2027-03-17", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b" },
  { id: "svomm-28", tittel: "Skolesvømming", dato: "2027-03-18", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c" },
  { id: "svomm-29", tittel: "Skolesvømming", dato: "2027-03-19", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a" },
  { id: "svomm-30", tittel: "Skolesvømming", dato: "2027-03-31", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b" },

  // April 2027
  { id: "svomm-31", tittel: "Skolesvømming", dato: "2027-04-01", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c" },

  // Juni 2027
  { id: "svomm-32", tittel: "Skolesvømming", dato: "2027-06-07", startTid: "10:10", sluttTid: "11:40", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 2a-b" },
  { id: "svomm-33", tittel: "Skolesvømming", dato: "2027-06-08", startTid: "10:10", sluttTid: "11:40", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 2c" }
];

export function getSvommeAktiviteter() {
  return SVOMMING_REGISTER;
}

export function getSvommeAktiviteterSomEvents() {
  return SVOMMING_REGISTER.map(a => {
    // Ekstraherer trinn-tall fra deltakere-feltet (f.eks. "7" fra "Brattbakken 7a-b")
    const match = a.deltakere ? a.deltakere.match(/\b([1-7])(?=[a-c]|\.|\s*trinn|\b)/gi) : [];
    const trinnListe = match ? [...new Set(match.map(t => `${t}. trinn`))] : [];

    return {
      id: a.id,
      title: `🏊 Skolesvømming (${a.deltakere})`,
      start: `${a.dato}T${a.startTid}:00`,
      end: `${a.dato}T${a.sluttTid}:00`,
      allDay: false,
      backgroundColor: '#00cec9',
      borderColor: '#0984e3',
      extendedProps: {
        group: 'Svømming',
        rawTitle: a.tittel,
        sted: a.sted,
        arrangor: a.arrangor,
        deltakere: a.deltakere,
        trinn: trinnListe, // Inneholder f.eks. ["7. trinn"], ["3. trinn"], ["4. trinn"] eller ["2. trinn"]
        description: `Sted: ${a.sted} | Deltakere: ${a.deltakere}`
      }
    };
  });
}