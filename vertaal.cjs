// Haalt de vertaalbare tekst uit copy/nl.json en zet vertalingen terug in copy/fr.json en copy/en.json.
//   node vertaal.cjs uit            → schrijft _vertaal/strings.json (genummerde lijst)
//   node vertaal.cjs in fr bestand  → bouwt copy/fr.json uit een lijst {n, tekst}
const fs = require('fs'), path = require('path');
const R = __dirname;

// velden die nooit vertaald worden: verwijzingen, gegevens, cijfers
const NIET = new Set(['img', 'slug', 'bestand', 'url', 'naar', 'tel', 'tel1_url', 'tel2_url', 'mail',
  'facebook_url', 'instagram_url', 'foto', 'getal', 'nr', 'sterren', 'code', 'id', 'adres', 'btw',
  'tel1', 'tel2', 'nummer', 'naam', 'wanneer', 'breed', 'label_taal']);
// hele takken die niet mee hoeven
const OVERSLAAN = /^_werkblad|^_aannames/;

function loop(o, pad, fn) {
  for (const [k, v] of Object.entries(o)) {
    const q = pad ? pad + '.' + k : k;
    if (OVERSLAAN.test(q)) continue;
    if (typeof v === 'string') { if (!NIET.has(k) && v.trim()) fn(q, v, o, k); }
    else if (Array.isArray(v)) v.forEach((x, i) => {
      if (typeof x === 'string') { if (!NIET.has(k) && x.trim()) fn(q + '[' + i + ']', x, v, i); }
      else if (x && typeof x === 'object') loop(x, q + '[' + i + ']', fn);
    });
    else if (v && typeof v === 'object') loop(v, q, fn);
  }
}

const nl = JSON.parse(fs.readFileSync(path.join(R, 'copy', 'nl.json'), 'utf8'));
const modus = process.argv[2];

if (modus === 'uit') {
  const lijst = [];
  loop(nl, '', (pad, tekst) => lijst.push({ n: lijst.length + 1, pad, tekst }));
  fs.mkdirSync(path.join(R, '_vertaal'), { recursive: true });
  fs.writeFileSync(path.join(R, '_vertaal', 'strings.json'), JSON.stringify(lijst, null, 1));
  const tekens = lijst.reduce((s, x) => s + x.tekst.length, 0);
  console.log(lijst.length + ' strings, ' + tekens + ' tekens');
  // in vier blokken, zodat vier vertalers parallel kunnen werken
  const per = Math.ceil(lijst.length / 4);
  for (let b = 0; b < 4; b++) {
    const deel = lijst.slice(b * per, (b + 1) * per);
    fs.writeFileSync(path.join(R, '_vertaal', 'blok-' + (b + 1) + '.txt'),
      deel.map(x => x.n + ' | ' + x.pad + ' | ' + x.tekst).join('\n'));
    console.log('blok ' + (b + 1) + ': ' + deel.length + ' strings (' + deel[0].n + ' tot ' + deel[deel.length - 1].n + ')');
  }
} else if (modus === 'in') {
  const taal = process.argv[3];
  const bron = process.argv[4];
  const lijst = JSON.parse(fs.readFileSync(path.join(R, '_vertaal', 'strings.json'), 'utf8'));
  const vertaald = JSON.parse(fs.readFileSync(bron, 'utf8'));
  const kaart = new Map(vertaald.map(v => [Number(v.n), v.tekst]));
  const ontbreekt = lijst.filter(x => !kaart.has(x.n)).map(x => x.n);
  const kopie = JSON.parse(JSON.stringify(nl));
  let gezet = 0;
  let i = 0;
  loop(kopie, '', (pad, tekst, ouder, sleutel) => {
    i++;
    const nieuw = kaart.get(i);
    if (nieuw) { ouder[sleutel] = nieuw; gezet++; }
  });
  kopie.meta = kopie.meta || {};
  fs.writeFileSync(path.join(R, 'copy', taal + '.json'), JSON.stringify(kopie, null, 2) + '\n');
  console.log(taal + ': ' + gezet + ' van ' + lijst.length + ' strings gezet' +
    (ontbreekt.length ? ', ONTBREEKT: ' + ontbreekt.join(',') : ''));
} else {
  console.log('gebruik: node vertaal.cjs uit   of   node vertaal.cjs in fr <bestand.json>');
}
