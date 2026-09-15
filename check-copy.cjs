// Keurt de copy en de feiten van de voorbeeldsite van Expert Renovaties.
// node check-copy.cjs            → keurt copy/nl.json + index.html
// node check-copy.cjs --lokaas   → positieve controle: moet FALEN
const fs = require('fs'), path = require('path');
const R = __dirname;
const LOKAAS = process.argv.includes('--lokaas');

let t = JSON.parse(fs.readFileSync(path.join(R, 'copy', 'nl.json'), 'utf8'));
const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const beelden = JSON.parse(fs.readFileSync(path.join(R, 'img', 'index.json'), 'utf8')).map(x => x.naam);
const css = fs.readFileSync(path.join(R, 'styles.css'), 'utf8');

// De positieve controle bouwt vijf fouten in, één per soort. Elke soort MOET gevonden worden.
const LOKAAS_VERWACHT = ['verboden/van-tot-constructie', 'verboden/em-dash', 'claim', 'cijfer', 'foto bestaat', 'realisatie eerst af', 'label is kort', 'label zonder bijstelling', 'label zonder getal'];
if (LOKAAS) {
  t = JSON.parse(JSON.stringify(t));
  t.hero.kop = 'Van de eerste steen tot de laatste plint — al 250 tevreden klanten';
  t.realisaties.items[0].fotos.unshift({ img: 'onbestaande-foto-voor', alt: 'lokaas' });
  t.realisaties.items[1].titel = 'Badkamer in een woning met 3 douches';
}

const fouten = [];
const fout = (waar, wat) => fouten.push(waar + ': ' + wat);
let checks = 0;
const check = (waar, goed, wat) => { checks++; if (!goed) fout(waar, wat); };

/* ---- alle tekst verzamelen ---- */
const teksten = [];
(function loop(o, pad) {
  if (typeof o === 'string') { if (!/^_/.test(pad.split('.')[0])) teksten.push({ pad, s: o }); return; }
  if (Array.isArray(o)) return o.forEach((v, i) => loop(v, pad + '[' + i + ']'));
  if (o && typeof o === 'object') return Object.entries(o).forEach(([k, v]) => loop(v, pad ? pad + '.' + k : k));
})(t, '');
const zichtbaar = teksten.filter(x => !/_alt$|\.alt$|^meta\.|_url$|\.tel$|_p$|naar$|^_/.test(x.pad));

/* ---- 1. verboden constructies ---- */
const VERBODEN = [
  { naam: 'van-tot-constructie', re: /\bvan\s+(de|het|een)\s+[a-zé]+(\s+[a-zé]+){0,3}\s+tot\s+(de|het|een)\b/i },
  { naam: 'em-dash', re: /—/ },
  { naam: 'negatie-framing (niet ... maar)', re: /\bniet\b[^.]{0,40}\bmaar\b/i },
  { naam: 'geen-framing', re: /\bgeen\b/i },
  { naam: '"of bel"', re: /\bof bel\b/i },
  { naam: 'in plaats van', re: /\bin plaats van\b/i },
  { naam: 'waar anderen', re: /\bwaar anderen\b|\bbij de meeste\b/i },
  { naam: 'partner-taal', re: /\b(partner|hand in hand|samen bouwen)\b/i },
  { naam: 'lege superlatief', re: /\b(professioneel|betrouwbaar|vakkundig|kwalitatief|optimaal|effectief|slim)\b/i, uit: ['reviews.items'] },
  { naam: 'werf', re: /\bwerf\b|\bwerven\b/i },
];
for (const v of VERBODEN) {
  for (const x of zichtbaar) {
    if (v.uit && v.uit.some(u => x.pad.startsWith(u))) continue;
    check('verboden/' + v.naam, !v.re.test(x.s), x.pad + ' → "' + x.s.slice(0, 70) + '"');
  }
}

/* ---- 2. eyebrow-labels: geen enkele all-caps mini-kop ---- */
for (const x of zichtbaar) {
  const woorden = x.s.trim().split(/\s+/);
  const allCaps = x.s.length > 3 && x.s.length < 40 && x.s === x.s.toUpperCase() && /[A-Z]{3}/.test(x.s) && woorden.length <= 4;
  check('eyebrow', !allCaps || /^(EXPERT|RENOVATIES|BE)$/.test(x.s.trim()), x.pad + ' → "' + x.s + '"');
}

/* ---- 3. cijfers in de wervende copy: alleen wat traceerbaar is ----
   Contactgegevens, fotonamen en letterlijke reviews staan hier bewust buiten:
   die worden apart gecontroleerd in blok 11 en zijn geen claim. */
const COPYPADEN = /^(hero\.(kop|sub)|feiten\[\d+\]\.getal|over\.(kop_sterk|kop_licht|tekst)|diensten\.(kop|tekst)|diensten\.groepen\[\d+\]\.(titel|tekst)|werkwijze\.(kop_sterk|kop_licht)|werkwijze\.stappen\[\d+\]\.(titel|tekst)|voorna\.(kop_sterk|kop_licht)|voorna\.paren\[\d+\]\.titel|waarom\.(kop_sterk|intro)|waarom\.items\[\d+\]\.(titel|tekst)|cta\.(kop_sterk|tekst)|realisaties\.(kop_sterk|kop_licht)|realisaties\.items\[\d+\]\.(titel|tekst)|reviews\.(kop_sterk|kop_licht)|footer\.zin|meta\.omschrijving)$/;
// 5,0 en 8 = Google-profiel, 01-04 = stapnummers, 1018.081.910 = KBO
const TOEGESTAAN = ['5,0', '8', '01', '02', '03', '04', '1018.081.910'];
let copyVelden = 0;
for (const x of zichtbaar) {
  if (!COPYPADEN.test(x.pad)) continue;
  copyVelden++;
  for (const g of (x.s.match(/\d[\d.,]*/g) || [])) {
    check('cijfer', TOEGESTAAN.includes(g), x.pad + ' → onbekend getal "' + g + '" in "' + x.s.slice(0, 60) + '"');
  }
}
check('copypaden dekken de tekst', copyVelden >= 30, 'slechts ' + copyVelden + ' copyvelden gescand, de regex mist secties');

/* ---- 4. resultaatclaims en garanties ---- */
const CLAIMS = /\b(gegarandeerd|garantie|altijd|nooit|100%|beste van|nummer 1|marktleider|tevreden klanten|jaar ervaring)\b/i;
for (const x of zichtbaar) check('claim', !CLAIMS.test(x.s), x.pad + ' → "' + x.s.slice(0, 70) + '"');

/* ---- 5. elke foto bestaat ---- */
const genoemd = new Set();
const foto = n => { genoemd.add(n); check('foto bestaat', beelden.includes(n), 'onbekende foto "' + n + '"'); };
t.hero.slides.forEach(s => foto(s.img));
foto(t.cta.foto); foto(t.reviews.foto);
t.waarom.fotos.forEach(f => foto(f.img));
t.diensten.groepen.forEach(d => foto(d.img));
t.voorna.paren.forEach(p => { foto(p.voor); foto(p.na); });
t.realisaties.items.forEach(p => p.fotos.forEach(f => foto(f.img)));

/* ---- 6. elke foto heeft een alt ---- */
const altLeeg = [];
(function alts(o, pad) {
  if (o && typeof o === 'object') {
    if (typeof o.img === 'string' && !(o.alt || '').trim()) altLeeg.push(pad);
    Object.entries(o).forEach(([k, v]) => alts(v, pad + '.' + k));
  }
})(t, '');
check('alt-tekst', altLeeg.length === 0, altLeeg.join(', '));
check('alt in html', !/<img[^>]*alt=""/.test(html), 'lege alt in index.html');

/* ---- 7. realisaties beginnen met het afgewerkte beeld ---- */
for (const p of t.realisaties.items) {
  check('realisatie eerst af', !/-voor$/.test(p.fotos[0].img), p.titel + ' begint met "' + p.fotos[0].img + '"');
  check('realisatie max 5', p.fotos.length <= 5, p.titel + ' heeft ' + p.fotos.length + ' foto\'s');
}

/* ---- 8. voor-en-na paren: voor is voor, na is na ---- */
for (const p of t.voorna.paren) {
  const stam = n => n.split('-')[0];
  check('paar is twee verschillende fotos', p.voor !== p.na, p.titel);
  check('paar zelfde project', stam(p.voor) === stam(p.na), p.titel + ': ' + p.voor + ' hoort niet bij ' + p.na);
}

/* ---- 8b. hun eigen logo staat in de kop en in de voet ---- */
check('logo-bestand kop', fs.existsSync(path.join(R, 'img', 'logo-kop.png')), 'img/logo-kop.png ontbreekt');
check('logo-bestand voet', fs.existsSync(path.join(R, 'img', 'logo-licht.png')), 'img/logo-licht.png ontbreekt');
check('logo in de kop', /class="er-logo"[\s\S]{0,140}img\/logo-kop\.png/.test(html), 'de kopbalk toont hun logo niet');
check('logo in de voet', /er-voet__logo[\s\S]{0,140}img\/logo-licht\.png/.test(html), 'de voettekst toont hun logo niet');
check('geen wit plaatje in de voet', !/rb-voet__plaat/.test(html), 'het logo staat nog op een wit plaatje');
check('geen nagetekend merk', !/rb-merk__teken/.test(html), 'er staat nog een zelfgemaakt merkteken in de pagina');
check('geen verzonnen favicon', !/merk.svg/.test(html), 'merk.svg staat er nog, dat is een zelfgemaakt teken');
check('favicon uit hun logo', fs.existsSync(path.join(R, 'img', 'merkteken.png')), 'img/merkteken.png ontbreekt');

/* ---- 8c. materialenband, doorlopende realisatieband en de realisatiepagina ---- */
const pagina = fs.existsSync(path.join(R, 'realisaties.html')) ? fs.readFileSync(path.join(R, 'realisaties.html'), 'utf8') : '';
check('realisatiepagina bestaat', pagina.length > 2000, 'realisaties.html ontbreekt of is leeg');
check('band linkt naar de pagina', /class="er-tegel" href="realisaties.html#/.test(html), 'de tegels linken niet naar realisaties.html');
check('band verdubbeld voor de lus', (html.match(/class="er-tegel"/g) || []).length === t.realisaties.items.length * 2, 'de band is niet verdubbeld, dan hapert de lus');
for (const m of t.merken.items) check('materiaallogo bestaat', fs.existsSync(path.join(R, 'img', 'merken', m.bestand + '.png')), m.bestand + '.png ontbreekt');
for (const p of t.realisaties.items) check('project op de pagina', pagina.indexOf('id="' + p.slug + '"') > 0, p.titel + ' staat niet op realisaties.html');
check('pagina noindex', /name="robots" content="noindex/.test(pagina), 'realisaties.html mist noindex');

/* ---- 8d. labels zijn categoriewoorden, geen minibeschrijvingen ---- */
const LABELSLOP = /\b(in een|bij een|van een|met een|onder het|aan een|in het|op een)\b/i;
const woordenTel = s => s.trim().split(/\s+/).length;
for (const p of t.realisaties.items) {
  check('label is kort', woordenTel(p.titel) <= 2, p.titel + ' heeft ' + woordenTel(p.titel) + ' woorden');
  check('label zonder bijstelling', !LABELSLOP.test(p.titel), p.titel);
  check('label zonder getal', !/[0-9]/.test(p.titel), p.titel);
}
for (const p of t.voorna.paren) {
  check('paarlabel is kort', woordenTel(p.titel) <= 2, p.titel);
  check('paarlabel zonder bijstelling', !LABELSLOP.test(p.titel), p.titel);
}

/* ---- 8e. hero: volle hoogte en enkel afgewerkt werk ---- */
check('hero heeft meerdere dias', t.hero.slides.length >= 4, 'slechts ' + t.hero.slides.length + ' fotos in de hero');
for (const s of t.hero.slides) check('hero toont afgewerkt werk', /^(uitbouw-(tuinzijde|hoek|avond|schuifraam|zijkant)|bad-af|bad-zicht|douche-(overzicht|breed|nissen|radiator)|keuken-(overzicht|werkblad)|zolder(kamer)?-(kamer|dakvenster|gang|overloop|balustrade|airco|vloer)|achterbouw-terras)$/.test(s.img), s.img + ' is geen afgewerkt project');
check('hero is volle schermhoogte', /\.er-hero \{[^}]*min-height: calc\(100svh/.test(css), 'de hero vult het scherm niet');
check('hero heeft bediening', /data-dia="vorige"/.test(html) && /data-dia="volgende"/.test(html), 'de hero mist knoppen');

/* ---- 9. demo-regels in de html ---- */
check('noindex', /name="robots" content="noindex/.test(html), 'noindex ontbreekt');
check('formulier verstuurt niets', !/<form[^>]*action=/.test(html), 'formulier heeft een action');
check('geen externe tracking', !/googletagmanager|analytics|facebook\.net/.test(html), 'tracking gevonden');

/* ---- 10. herhaling: geen twee secties met dezelfde openingswoorden ---- */
const openingen = {};
for (const x of zichtbaar.filter(v => /tekst$|sub$|intro$/.test(v.pad) && v.s.trim())) {
  const eerste = x.s.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
  (openingen[eerste] = openingen[eerste] || []).push(x.pad);
}
for (const [o, waar] of Object.entries(openingen)) check('herhaalde opening', waar.length === 1, '"' + o + '" in ' + waar.join(' en '));

/* ---- 11. contactgegevens kloppen met de bron ---- */
check('btw', t.contact.btw === 'BE 1018.081.910', 'btw-nummer wijkt af');
check('telefoon', t.contact.tel1 === '+32 491 63 05 66', 'telefoonnummer wijkt af');
check('mail', t.contact.mail === 'k-swistak@wp.pl', 'e-mail wijkt af');
check('adres', t.contact.adres.includes('Kerkstraat 36') && t.contact.adres.includes('3020 Herent'), 'adres wijkt af');


/* ---- 12. drie talen: zelfde structuur, eigen taal, werkende paden ---- */
const paden = o => { const uit = []; (function loop(x, p) { if (x && typeof x === 'object') { for (const k of Object.keys(x)) loop(x[k], p ? p + '.' + k : k); } else uit.push(p); })(o, ''); return uit.sort(); };
const pnl = paden(t).filter(p => p !== 'lang');
for (const [code, map] of [['fr', 'fr'], ['en', 'en']]) {
  const jp = path.join(R, 'copy', code + '.json');
  if (!fs.existsSync(jp)) continue;
  const v = JSON.parse(fs.readFileSync(jp, 'utf8'));
  const pv = paden(v).filter(p => p !== 'lang');
  check('zelfde velden (' + code + ')', pv.length === pnl.length && pv.every((x, i) => x === pnl[i]), 'structuur wijkt af van nl.json');
  // geen Nederlandse resten buiten de letterlijke reviews
  const rest = [];
  (function loop(x, p) { if (typeof x === 'string') { if (/^(reviews\.items|_)/.test(p)) return; if (/\b(uw|wij|onze|offerte aanvragen|realisaties bekijken)\b/i.test(x)) rest.push(p); return; } if (x && typeof x === 'object') for (const k of Object.keys(x)) loop(x[k], p ? p + '.' + k : k); })(v, '');
  check('geen Nederlandse resten (' + code + ')', rest.length === 0, rest.slice(0, 4).join(', '));
  for (const bestand of ['index.html', 'realisaties.html']) {
    const hp = path.join(R, map, bestand);
    check('pagina bestaat (' + code + '/' + bestand + ')', fs.existsSync(hp), hp + ' ontbreekt');
    if (!fs.existsSync(hp)) continue;
    const h = fs.readFileSync(hp, 'utf8');
    check('taalattribuut (' + code + ')', h.indexOf('<html lang="' + code + '"') >= 0, 'html lang klopt niet');
    check('paden met voorvoegsel (' + code + ')', h.indexOf('href="../styles.css"') >= 0 && h.indexOf('"../img/') >= 0, 'bestandspaden missen ../');
    check('noindex (' + code + ')', /name="robots" content="noindex/.test(h), 'noindex ontbreekt');
  }
}
check('hoofdpagina zonder voorvoegsel', html.indexOf('href="styles.css?v=') >= 0, 'de hoofdpagina mag geen ../ gebruiken');
/* ---- uitslag ---- */
const gebruikt = beelden.filter(b => genoemd.has(b)).length;
console.log('controles: ' + checks + '   foto\'s in gebruik: ' + gebruikt + ' van ' + beelden.length);
if (LOKAAS) {
  const gemist = LOKAAS_VERWACHT.filter(soort => !fouten.some(f => f.startsWith(soort + ':')));
  console.log('lokaas-fouten gevonden: ' + fouten.length);
  for (const f of fouten.slice(0, 12)) console.log('  ' + f);
  if (gemist.length) { console.log('\nLOKAAS FAALT, deze soorten werden gemist: ' + gemist.join(', ') + '. De controle is ongeldig.'); process.exit(1); }
  console.log('\nLOKAAS WERKT: alle ' + LOKAAS_VERWACHT.length + ' ingebouwde foutsoorten zijn gevonden.');
  process.exit(0);
}
if (fouten.length) {
  console.log('\nFOUT (' + fouten.length + '):');
  for (const f of fouten.slice(0, 40)) console.log('  ' + f);
  process.exit(1);
}
console.log('alles in orde');
