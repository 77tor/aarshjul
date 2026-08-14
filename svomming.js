/**
 * Skolesvømming – Hånes skole 2026-2027
 */

const SVOMMING_REGISTER = [
  // August 2026
  { id: "svomm-1", tittel: "Skolesvømming", dato: "2026-08-26", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 7a-b", trinn: "7. trinn" },
  { id: "svomm-2", tittel: "Skolesvømming", dato: "2026-08-27", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 7b-c", trinn: "7. trinn" },
  { id: "svomm-3", tittel: "Skolesvømming", dato: "2026-08-28", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 7c-a", trinn: "7. trinn" },

  // November 2026
  { id: "svomm-4", tittel: "Skolesvømming", dato: "2026-11-18", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b", trinn: "3. trinn" },
  { id: "svomm-5", tittel: "Skolesvømming", dato: "2026-11-19", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3b-c", trinn: "3. trinn" },
  { id: "svomm-6", tittel: "Skolesvømming", dato: "2026-11-20", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c-a", trinn: "3. trinn" },
  { id: "svomm-7", tittel: "Skolesvømming", dato: "2026-11-25", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b", trinn: "3. trinn" },
  { id: "svomm-8", tittel: "Skolesvømming", dato: "2026-11-26", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3b-c", trinn: "3. trinn" },
  { id: "svomm-9", tittel: "Skolesvømming", dato: "2026-11-27", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c-a", trinn: "3. trinn" },

  // Desember 2026
  { id: "svomm-10", tittel: "Skolesvømming", dato: "2026-12-02", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b", trinn: "3. trinn" },
  { id: "svomm-11", tittel: "Skolesvømming", dato: "2026-12-03", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3b-c", trinn: "3. trinn" },
  { id: "svomm-12", tittel: "Skolesvømming", dato: "2026-12-04", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c-a", trinn: "3. trinn" },
  { id: "svomm-13", tittel: "Skolesvømming", dato: "2026-12-09", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3a-b", trinn: "3. trinn" },
  { id: "svomm-14", tittel: "Skolesvømming", dato: "2026-12-10", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 3c", trinn: "3. trinn" },

  // Februar 2027
  { id: "svomm-15", tittel: "Skolesvømming", dato: "2027-02-10", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b", trinn: "4. trinn" },
  { id: "svomm-16", tittel: "Skolesvømming", dato: "2027-02-11", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c", trinn: "4. trinn" },
  { id: "svomm-17", tittel: "Skolesvømming", dato: "2027-02-12", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a", trinn: "4. trinn" },
  { id: "svomm-18", tittel: "Skolesvømming", dato: "2027-02-17", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b", trinn: "4. trinn" },
  { id: "svomm-19", tittel: "Skolesvømming", dato: "2027-02-18", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c", trinn: "4. trinn" },
  { id: "svomm-20", tittel: "Skolesvømming", dato: "2027-02-19", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a", trinn: "4. trinn" },

  // Mars 2027
  { id: "svomm-21", tittel: "Skolesvømming", dato: "2027-03-03", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b", trinn: "4. trinn" },
  { id: "svomm-22", tittel: "Skolesvømming", dato: "2027-03-04", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c", trinn: "4. trinn" },
  { id: "svomm-23", tittel: "Skolesvømming", dato: "2027-03-05", startTid: "08:30", sluttTid: "10:00", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a", trinn: "4. trinn" },
  { id: "svomm-24", tittel: "Skolesvømming", dato: "2027-03-10", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b", trinn: "4. trinn" },
  { id: "svomm-25", tittel: "Skolesvømming", dato: "2027-03-11", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c", trinn: "4. trinn" },
  { id: "svomm-26", tittel: "Skolesvømming", dato: "2027-03-12", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a", trinn: "4. trinn" },
  { id: "svomm-27", tittel: "Skolesvømming", dato: "2027-03-17", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b", trinn: "4. trinn" },
  { id: "svomm-28", tittel: "Skolesvømming", dato: "2027-03-18", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4b-c", trinn: "4. trinn" },
  { id: "svomm-29", tittel: "Skolesvømming", dato: "2027-03-19", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c-a", trinn: "4. trinn" },
  { id: "svomm-30", tittel: "Skolesvømming", dato: "2027-03-31", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4a-b", trinn: "4. trinn" },

  // April 2027
  { id: "svomm-31", tittel: "Skolesvømming", dato: "2027-04-01", startTid: "12:00", sluttTid: "13:30", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Brattbakken 4c", trinn: "4. trinn" },

  // Juni 2027
  { id: "svomm-32", tittel: "Skolesvømming", dato: "2027-06-07", startTid: "10:10", sluttTid: "11:40", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 2a-b", trinn: "2. trinn" },
  { id: "svomm-33", tittel: "Skolesvømming", dato: "2027-06-08", startTid: "10:10", sluttTid: "11:40", sted: "Aquarama", arrangor: "Hånes skole", deltakere: "Heståsen 2c", trinn: "2. trinn" }
];

export function getSvommeAktiviteter() {
  return SVOMMING_REGISTER;
}

export function getSvommeAktiviteterSomEvents() {
  return SVOMMING_REGISTER.map(a => {
    // Konverterer trinn til et array uansett om det er skrevet som streng eller array i objektet
    const trinnListe = Array.isArray(a.trinn) ? a.trinn : [a.trinn];

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
        trinn: trinnListe, // Eksplisitt array, f.eks. ["7. trinn"]
        description: `Sted: ${a.sted} | Deltakere: ${a.deltakere}`
      }
    };
  });
}