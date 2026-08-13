// ansatte.js

const ansatteData = [
  { etternavn: "Abelsen", fornavn: "Anne", fodselsdato: "12.05.1974", epost: "anne.abelsen@kristiansand.kommune.no" },
  { etternavn: "Abrahamsen", fornavn: "Truls", fodselsdato: "29.11.1997", epost: "truls.abrahamsen@kristiansand.kommune.no" },
  { etternavn: "Ali", fornavn: "Yaser Shahada", fodselsdato: "25.08.1978", epost: "yaser.shahada.ali@kristiansand.kommune.no" },
  { etternavn: "Bechmann", fornavn: "Kari Grostad", fodselsdato: "13.08.1986", epost: "kari.grostad.beckmann@kristiansand.kommune.no" },
  { etternavn: "Berg", fornavn: "Hans-Petter", fodselsdato: "23.09.1964", epost: "hans-petter.berg3@kristiansand.kommune.no" },
  { etternavn: "Bergum", fornavn: "Siril", fodselsdato: "20.09.1993", epost: "siril.bergum@kristiansand.kommune.no" },
  { etternavn: "Birkeland", fornavn: "Geir Andre", fodselsdato: "24.10.1971", epost: "geir.andre.birkeland@kristiansand.kommune.no" },
  { etternavn: "Bisseth-Isefjær", fornavn: "Camilla", fodselsdato: "31.01.1992", epost: "camilla.bisseth-isefjar@kristiansand.kommune.no" },
  { etternavn: "Boya", fornavn: "Taghred Eliya", fodselsdato: "13.12.1978", epost: "taghred.eliya.boya@kristiansand.kommune.no" },
  { etternavn: "Braadland", fornavn: "Janne", fodselsdato: "15.11.1972", epost: "janne.braadland@kristiansand.kommune.no" },
  { etternavn: "Dahle", fornavn: "Ingrid", fodselsdato: "26.09.1992", epost: "ingrid.dahle@kristiansand.kommune.no" },
  { etternavn: "Dalene", fornavn: "Egil", fodselsdato: "20.11.1970", epost: "egil.dalene@kristiansand.kommune.no" },
  { etternavn: "Daling", fornavn: "Elise Mariann Helbostad", fodselsdato: "14.06.1996", epost: "elise.mariann.helbostad.daling@kristiansand.kommune.no" },
  { etternavn: "Dyrdahl", fornavn: "Thomas", fodselsdato: "10.04.1975", epost: "thomas.dyrdahl@kristiansand.kommune.no" },
  { etternavn: "Egeland", fornavn: "Tommy Champa", fodselsdato: "10.09.2003", epost: "tommy.champa.egeland@kristiansand.kommune.no" },
  { etternavn: "Frikstad", fornavn: "Cecilie Wallin", fodselsdato: "04.05.1971", epost: "cecilie.wallin.frikstad@kristiansand.kommune.no" },
  { etternavn: "Gundersen", fornavn: "Jeanette", fodselsdato: "02.11.1972", epost: "jeanette.gundersen@kristiansand.kommune.no" },
  { etternavn: "Gundersen", fornavn: "Mette", fodselsdato: "25.12.1980", epost: "mette.gundersen@kristiansand.kommune.no" },
  { etternavn: "Gunther", fornavn: "Monica", fodselsdato: "31.07.1975", epost: "monica.gunther@kristiansand.kommune.no" },
  { etternavn: "Hafnor", fornavn: "Rebeca Martin", fodselsdato: "07.05.1995", epost: "rebeca.martin.hafnor@kristiansand.kommune.no" },
  { etternavn: "Haidari", fornavn: "Hamide", fodselsdato: "10.01.1989", epost: "hamide.haidari@kristiansand.kommune.no" },
  { etternavn: "Hallberg", fornavn: "Eddy Elisabeth Steinfeld", fodselsdato: "27.07.1960", epost: "eddy.elisabeth.steinfeld.hallberg@kristiansand.kommune.no" },
  { etternavn: "Heggland", fornavn: "Rune", fodselsdato: "21.03.1988", epost: "rune.heggland@kristiansand.kommune.no" },
  { etternavn: "Hilmarsson", fornavn: "William", fodselsdato: "28.02.2004", epost: "william.hilmarsson@kristiansand.kommune.no" },
  { etternavn: "Hovden", fornavn: "Solfrid Berg", fodselsdato: "28.01.1976", epost: "solfrid.berg.hovden@kristiansand.kommune.no" },
  { etternavn: "Haaland", fornavn: "Guro", fodselsdato: "11.02.1993", epost: "guro.haaland@kristiansand.kommune.no" },
  { etternavn: "Johannessen", fornavn: "Heidi", fodselsdato: "10.06.1982", epost: "heidi.johannessen@kristiansand.kommune.no" },
  { etternavn: "Keskin", fornavn: "Ayhan", fodselsdato: "10.05.1967", epost: "ayhan.keskin@kristiansand.kommune.no" },
  { etternavn: "Kjevik", fornavn: "Tom Otto Bjorvand", fodselsdato: "25.11.1970", epost: "tom.otto.bjorvand.kjevik@kristiansand.kommune.no" },
  { etternavn: "Knutson", fornavn: "Lars Rosseland", fodselsdato: "23.04.1984", epost: "lars.rosseland.knutson@kristiansand.kommune.no" },
  { etternavn: "Kopperud", fornavn: "Andre", fodselsdato: "22.01.1981", epost: "andre.kopperud@kristiansand.kommune.no" },
  { etternavn: "Kregnes", fornavn: "Åse Reidun Svaland", fodselsdato: "05.11.1967", epost: "ase.reidun.svaland.kregnes@kristiansand.kommune.no" },
  { etternavn: "Kristiansen", fornavn: "Markus Sundgot", fodselsdato: "18.12.1993", epost: "markus.sundgot.kristiansen@kristiansand.kommune.no" },
  { etternavn: "Landa", fornavn: "Ingrid Hanne Sandvær", fodselsdato: "13.12.1971", epost: "ingrid.hanne.sandvar.landa@kristiansand.kommune.no" },
  { etternavn: "Lossius", fornavn: "Anders", fodselsdato: "17.05.1995", epost: "anders.lossius@kristiansand.kommune.no" },
  { etternavn: "Løvaas", fornavn: "Hanne", fodselsdato: "08.01.1999", epost: "hanne.lovaas@kristiansand.kommune.no" },
  { etternavn: "Minchin", fornavn: "Patrick", fodselsdato: "03.02.1993", epost: "patrick.minchin@kristiansand.kommune.no" },
  { etternavn: "Moland", fornavn: "Andreas", fodselsdato: "19.04.1987", epost: "andreas.moland@kristiansand.kommune.no" },
  { etternavn: "Myklebust", fornavn: "Martin", fodselsdato: "03.02.1993", epost: "martin.myklebust@kristiansand.kommune.no" },
  { etternavn: "Nesse", fornavn: "Espen N", fodselsdato: "17.04.1994", epost: "espen.n.nesse@kristiansand.kommune.no" },
  { etternavn: "Nilsen", fornavn: "Susanne Kjellemo", fodselsdato: "11.08.2000", epost: "susanne.kjellemo.nilsen@kristiansand.kommune.no" },
  { etternavn: "Nordbø", fornavn: "Tonje Eie", fodselsdato: "25.09.1989", epost: "tonje.eie.nordbo@kristiansand.kommune.no" },
  { etternavn: "Omholt", fornavn: "Thomas Brænde", fodselsdato: "05.05.1985", epost: "thomas.braende.omholt@kristiansand.kommune.no" },
  { etternavn: "Pedersen", fornavn: "Gro Anita", fodselsdato: "11.06.1970", epost: "gro.anita.pedersen@kristiansand.kommune.no" },
  { etternavn: "Premak", fornavn: "June", fodselsdato: "23.11.1991", epost: "june.premak@kristiansand.kommune.no" },
  { etternavn: "Rasukhanova", fornavn: "Malika S", fodselsdato: "09.08.1968", epost: "malika.s.rasukhanova@kristiansand.kommune.no" },
  { etternavn: "Rossevatn", fornavn: "Daniel", fodselsdato: "11.10.1998", epost: "daniel.rossevatn@kristiansand.kommune.no" },
  { etternavn: "Ryghseter", fornavn: "Ole-Johan", fodselsdato: "09.09.1976", epost: "ole-johan.ryghseter@kristiansand.kommune.no" },
  { etternavn: "Røyseland", fornavn: "Arild", fodselsdato: "18.03.1972", epost: "arild.royseland@kristiansand.kommune.no" },
  { etternavn: "Schellhorn", fornavn: "Marte", fodselsdato: "26.04.1998", epost: "marte.schellhorn@kristiansand.kommune.no" },
  { etternavn: "Skarprud", fornavn: "Tor", fodselsdato: "25.08.1977", epost: "tor.skarprud@kristiansand.kommune.no" },
  { etternavn: "Skavikmo", fornavn: "Elin", fodselsdato: "19.12.1967", epost: "elin.skavikmo@kristiansand.kommune.no" },
  { etternavn: "Skram", fornavn: "Irene", fodselsdato: "29.08.1964", epost: "irene.skram@kristiansand.kommune.no" },
  { etternavn: "Smeland", fornavn: "Oliv", fodselsdato: "01.10.1996", epost: "oliv.smeland@kristiansand.kommune.no" },
  { etternavn: "Solli-Kleivset", fornavn: "Håvard", fodselsdato: "28.03.1985", epost: "havard.kleivset@kristiansand.kommune.no" },
  { etternavn: "Som", fornavn: "Molida", fodselsdato: "09.11.2005", epost: "molida.som@kristiansand.kommune.no" },
  { etternavn: "Sveberg", fornavn: "Mari Nordby", fodselsdato: "04.07.1994", epost: "mari.nordby.sveberg@kristiansand.kommune.no" },
  { etternavn: "Sørli", fornavn: "Christine", fodselsdato: "10.06.1994", epost: "christine.sorli2@kristiansand.kommune.no" },
  { etternavn: "Trondsen", fornavn: "Monja Byklum", fodselsdato: "05.01.1971", epost: "monja.byklum.trondsen@kristiansand.kommune.no" },
  { etternavn: "Tysland", fornavn: "Filip Madsen", fodselsdato: "01.07.1992", epost: "filip.madsen.tysland@kristiansand.kommune.no" },
  { etternavn: "Tønnessen", fornavn: "Karianne", fodselsdato: "25.04.1972", epost: "karianne.tonnessen@kristiansand.kommune.no" },
  { etternavn: "Vabo", fornavn: "Liv Marit", fodselsdato: "15.01.1973", epost: "liv.marit.vabo@kristiansand.kommune.no" },
  { etternavn: "Vigemyr-Karlsen", fornavn: "Silje Merete", fodselsdato: "29.09.1982", epost: "silje.merete.vigemyr.karlsen@kristiansand.kommune.no" },
  { etternavn: "Aadnevik", fornavn: "Malin", fodselsdato: "22.07.1997", epost: "malin.aadnevik@kristiansand.kommune.no" }
];

export function getBirthdayEvents(year = new Date().getFullYear()) {
  return ansatteData.map(ansatt => {
    const [dag, maaned, fodselsAar] = ansatt.fodselsdato.split('.');
    const alder = year - parseInt(fodselsAar, 10);
    const dateStr = `${year}-${maaned.padStart(2, '0')}-${dag.padStart(2, '0')}`;

    return {
      id: `bday-${ansatt.epost}-${year}`,
      title: `🎂 ${ansatt.fornavn} ${ansatt.etternavn} (${alder} år)`,
      start: dateStr,
      allDay: true,
      display: 'block',
      backgroundColor: '#f59e0b',
      borderColor: '#d97706',
      extendedProps: {
        rawTitle: `Bursdag: ${ansatt.fornavn} ${ansatt.etternavn}`,
        group: 'Bursdag',
        description: `${ansatt.fornavn} fyller ${alder} år i dag! (${ansatt.fodselsdato})`,
        email: ansatt.epost
      }
    };
  });
}