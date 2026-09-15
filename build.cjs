// Bouwt index.html voor de voorbeeldsite van Expert Renovaties uit copy/nl.json.
// Vormtaal: de AriTherm-demo (volle breedte, witte en grijze banden, merkkleur uit hun logo).
// node build.cjs
const fs = require('fs'), path = require('path');
const R = __dirname;
const index = JSON.parse(fs.readFileSync(path.join(R, 'img', 'index.json'), 'utf8'));
const maat = {};
for (const f of index) maat[f.naam] = f;

// NL staat op de hoofdmap, FR en EN in een eigen submap.
const VERSIE = require('crypto').createHash('md5')
  .update(fs.readFileSync(path.join(R, 'styles.css')))
  .update(fs.readFileSync(path.join(R, 'site.js')))
  .digest('hex').slice(0, 8);

// Deze demo is eentalig: Herent en Leuven zijn Nederlandstalig gebied, en een taalkeuze
// zonder echte vertaling is erger dan geen taalkeuze.
const TALEN = [
  { code: 'nl', label: 'NL', map: '', basis: '' },
  { code: 'fr', label: 'FR', map: 'fr', basis: '../' },
  { code: 'en', label: 'EN', map: 'en', basis: '../' },
];

for (const taal of TALEN) {
const t = JSON.parse(fs.readFileSync(path.join(R, 'copy', taal.code + '.json'), 'utf8'));
const basis = taal.basis;
const uitMap = taal.map ? path.join(R, taal.map) : R;
fs.mkdirSync(uitMap, { recursive: true });

// naar dezelfde pagina in een andere taal
const naarTaal = (doel, bestand) => {
  const b2 = bestand || 'index.html';
  if (taal.map === '' && doel.map === '') return b2;
  if (taal.map === '') return doel.map + '/' + b2;
  if (doel.map === '') return '../' + b2;
  return '../' + doel.map + '/' + b2;
};
const taalkeuze = (bestand) => TALEN.length < 2 ? '' : '<p class="er-talen">' + TALEN.map(d =>
  d.code === taal.code
    ? '<span class="er-taal is-aan" aria-current="true">' + d.label + '</span>'
    : '<a class="er-taal" href="' + naarTaal(d, bestand) + '" hreflang="' + d.code + '">' + d.label + '</a>'
).join('') + '</p>';
const BESTAND = 'index.html';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rauw = s => String(s == null ? '' : s);

function pic(naam, alt, klas, maten, laden) {
  const w = (maat[naam] || {}).w || 1440;
  const opties = [500, 900, 1600].filter(b => b <= w);
  if (!opties.length) opties.push(w);
  const srcset = opties.map(b => `${basis}img/${naam}-${b}.jpg ${b}w`).join(', ');
  const src = `${basis}img/${naam}-${opties[opties.length - 1]}.jpg`;
  return `<img class="${klas || ''}" src="${src}" srcset="${srcset}" sizes="${maten || '100vw'}" alt="${esc(alt)}" loading="${laden || 'lazy'}" decoding="async">`;
}

const ster = n => Array.from({ length: 5 }, (_, i) => `<span class="er-ster${i < n ? '' : ' er-ster--leeg'}" aria-hidden="true">${i < n ? '★' : '☆'}</span>`).join('');

const GOOGLE = `<svg class="er-g" viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-3.9H24v7.1h12c-.2 1.9-1.5 4.7-4.4 6.6l6.7 5.2C42.2 35.5 45 30.3 45 24z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-1.9 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9l-7.1 5.5C8 41.4 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.5 28.6c-.5-1.4-.7-2.9-.7-4.6s.3-3.2.7-4.6l-7.1-5.5C2.9 16.9 2 20.3 2 24s.9 7.1 2.4 10.1l7.1-5.5z"/><path fill="#EA4335" d="M24 10.2c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 4 29.9 2 24 2 15.4 2 8 6.6 4.4 13.9l7.1 5.5c1.8-5.2 6.7-9.2 12.5-9.2z"/></svg>`;

const pijl = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>';

// Eén icoon per stap van de werkwijze: plaatsbezoek, offerte, uitvoering, oplevering.
const ICOON = {
  huis: '<path d="M3.2 10.6 12 3.4l8.8 7.2V20a1 1 0 0 1-1 1H4.2a1 1 0 0 1-1-1z"/><path d="M9.4 21v-6.2h5.2V21"/>',
  offerte: '<path d="M6 2.9h7.4L18.4 8v13.1H6z"/><path d="M13.4 2.9V8h5"/><path d="M9 12.2h6.4M9 15.4h6.4M9 18.6h3.6"/>',
  hamer: '<path d="M13.7 3.6 19.9 9.8l-2.6 2.6-6.2-6.2z"/><path d="M11.3 10.4 4 17.7a1.6 1.6 0 0 0 2.3 2.3l7.3-7.3"/>',
  sleutel: '<circle cx="7.6" cy="16.4" r="3.4"/><path d="M10 14 20 4"/><path d="M16.3 7.7l2.3 2.3M13.8 10.2l1.9 1.9"/>',
};
const icoonSvg = n => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICOON[n]}</svg>`;
const STAPICOON = ['huis', 'offerte', 'hamer', 'sleutel'];

/* ---------- topbalk ---------- */
const kopbalk = `
<div class="er-top">
  <div class="er-breed er-top__in">
    <p class="er-top__stuk"><a href="mailto:${esc(t.top.mail)}">${esc(t.top.mail)}</a></p>
    <p class="er-top__stuk er-top__bel"><a href="tel:${esc(t.bel.tel)}"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>${esc(t.bel.nummer)}</a></p>
    <p class="er-top__stuk">${esc(t.top.adres)}</p>
    <p class="er-top__soc">
      ${t.footer.instagram_url ? `<a href="${esc(t.footer.instagram_url)}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none"/></svg></a>` : ''}
      <a href="${esc(t.footer.facebook_url)}" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg></a>
    </p>
  </div>
</div>`;

const logo = `<a class="er-logo" href="#top" aria-label="${esc(t.meta.naam)}"><img src="${basis}img/logo-kop.png" alt="Logo van ${esc(t.meta.naam)}" width="674" height="180"></a>`;

/* ---------- kop ---------- */
const kop = `
<header class="er-kop" id="kop">
  <div class="er-breed er-kop__in">
    ${logo}
    <nav class="er-nav" aria-label="Hoofdmenu">
      <ul>${t.nav.map(n => `<li><a href="${esc(n.naar)}">${esc(n.label)}</a></li>`).join('')}</ul>
    </nav>
    ${taalkeuze(BESTAND).replace('er-talen', 'er-talen er-talen--kop')}
    <a class="er-knop er-knop--vol er-kop__bel" href="tel:${esc(t.bel.tel)}">${esc(t.bel.kort)} ${esc(t.bel.nummer)}</a>
    <button class="er-menuknop" type="button" aria-expanded="false" aria-controls="er-mobielmenu" aria-label="Menu openen"><span class="er-menuknop__lijnen" aria-hidden="true"><span></span><span></span><span></span></span></button>
  </div>
  <div class="er-mobielmenu" id="er-mobielmenu" hidden>
    <ul>${t.nav.map(n => `<li><a href="${esc(n.naar)}">${esc(n.label)}</a></li>`).join('')}</ul>
    ${taalkeuze(BESTAND).replace('er-talen', 'er-talen er-talen--menu')}
    <a class="er-knop er-knop--vol er-mobielmenu__knop" href="#contact">${esc(t.hero.knop1)}</a>
  </div>
</header>`;

/* ---------- hero: volle schermhoogte, doorlopend door afgewerkte projecten ---------- */
const hero = `
<section class="er-hero" id="top" data-aantal="${t.hero.slides.length}">
  <div class="er-hero__foto">
    ${t.hero.slides.map((s, i) => `<figure class="er-dia${i === 0 ? ' is-aan' : ''}" data-i="${i}">${pic(s.img, s.alt, '', '100vw', i === 0 ? 'eager' : 'lazy')}</figure>`).join('')}
  </div>
  <div class="er-breed er-hero__in">
    <h1>${esc(t.hero.kop).replace(/(\S+)\s(\S+)\n/g, '$1&nbsp;$2<br> ').replace(/\n/g, '<br> ')}</h1>
    ${t.hero.sub ? `<p class="er-hero__sub">${esc(t.hero.sub)}</p>` : ''}
    <div class="er-hero__knoppen">
      <a class="er-knop er-knop--vol" href="#contact">${esc(t.hero.knop1)}</a>
    </div>
    <div class="er-bewijs">
      <a class="er-bewijs__google" href="${esc(t.reviews.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t.reviews.bekijk)}">${GOOGLE}<b>${esc(t.reviews.score)}</b><span class="er-bewijs__sterren">${ster(5)}</span><span>${esc(t.reviews.bron)}-reviews</span></a>
    </div>
  </div>
  <div class="er-hero__bediening">
    <button class="er-rond er-rond--glas" type="button" data-dia="vorige" aria-label="${esc(t.hero.vorige)}">‹</button>
    <button class="er-rond er-rond--glas" type="button" data-dia="volgende" aria-label="${esc(t.hero.volgende)}">›</button>
  </div>
  <div class="er-hero__streep" aria-hidden="true">${t.hero.slides.map((s, i) => `<span class="er-hero__tik${i === 0 ? ' is-aan' : ''}"></span>`).join('')}</div>
</section>`;

/* ---------- diensten: brede rijen die om en om spiegelen ---------- */
const diensten = `
<section class="er-band er-diensten" id="diensten">
  <div class="er-breed">
    <div class="er-kopblok er-kopblok--mid er-op">
      <h2>${esc(t.diensten.kop)}</h2>
      ${t.diensten.tekst ? `<p>${esc(t.diensten.tekst)}</p>` : ''}
    </div>
    <div class="er-rijen">
      ${t.diensten.groepen.map((d, i) => `<article class="er-rij${i % 2 ? ' er-rij--om' : ''} er-op" id="d-${esc(d.id)}">
        <div class="er-rij__beeld">${pic(d.img, d.alt, '', '(max-width:900px) 92vw, 600px')}</div>
        <div class="er-rij__tekst">
          <span class="er-rij__nr">0${i + 1}</span>
          <h3>${esc(d.titel)}</h3>
          <p>${esc(d.tekst)}</p>
          <ul class="er-rij__lijst">${d.onderdelen.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
          <a class="er-rij__link" href="#contact">${esc(t.diensten.knop)}<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg></a>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;

/* ---------- materialenband ---------- */
const merkRij = t.merken.items.map(m => `<span class="er-merk"><img src="${basis}img/merken/${esc(m.bestand)}.png" alt="${esc(m.naam)}" loading="lazy" decoding="async"></span>`).join('');
const merken = t.merken.items.length === 0 ? '' : `
<section class="er-merken" aria-label="${esc(t.merken.kop)}">
  <div class="er-breed er-merken__kop er-op"><span class="er-merken__lijn" aria-hidden="true"></span><p>${esc(t.merken.kop)}</p><span class="er-merken__lijn" aria-hidden="true"></span></div>
  <div class="er-loop er-loop--merken">
    <div class="er-loop__spoor er-loop__spoor--traag">${merkRij}${merkRij}${merkRij}${merkRij}</div>
  </div>
</section>`;

/* ---------- werkwijze: bolletjes op een gebogen pad ---------- */
// De bolletjes staan niet op één lijn: boven, onder, onder, boven. De pijl ertussen
// wordt per gat berekend uit het hoogteverschil, zodat hij precies aansluit.
const HOOGTE = [0, 58, 34, 0];
function boog(i) {
  const d = (HOOGTE[i + 1] || 0) - (HOOGTE[i] || 0);
  const y1 = (60 - d / 2).toFixed(1), y2 = (60 + d / 2).toFixed(1);
  const mid = (((HOOGTE[i + 1] || 0) - (HOOGTE[i] || 0)) / 2 + 31).toFixed(1);
  return `<span class="er-boog" style="--mid:${mid}px" aria-hidden="true"><svg viewBox="0 0 300 120" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"><path d="M6 ${y1} C110 ${y1}, 190 ${y2}, 286 ${y2}" stroke-dasharray="5 7"/><path d="M277 ${(Number(y2) - 6).toFixed(1)} L288 ${y2} L277 ${(Number(y2) + 6).toFixed(1)}"/></svg></span>`;
}

const werkwijze = `
<section class="er-band er-werkwijze" id="werkwijze">
  <div class="er-breed">
    <div class="er-kopblok er-kopblok--mid er-op">
      <h2>${esc(t.werkwijze.kop_sterk)}</h2>
      <p>${esc(t.werkwijze.kop_licht)}</p>
    </div>
    <ol class="er-stappen">
      ${t.werkwijze.stappen.map((s, i) => `<li class="er-stap er-op" style="--op:${HOOGTE[i] || 0}px">
        <span class="er-stap__bol">${icoonSvg(STAPICOON[i] || 'huis')}</span>
        <span class="er-stap__nr">${esc(s.nr)}</span>
        <h3>${esc(s.titel)}</h3>
        <p>${esc(s.tekst)}</p>
        ${i < t.werkwijze.stappen.length - 1 ? boog(i) : ''}
      </li>`).join('')}
    </ol>
  </div>
</section>`;

/* ---------- voor en na ---------- */
const voorna = `
<section class="er-band er-band--grijs er-voorna" id="voorna">
  <div class="er-breed">
    <div class="er-kopblok er-kopblok--mid er-op">
      <h2>${esc(t.voorna.kop_sterk)}</h2>
      <p>${esc(t.voorna.kop_licht)}</p>
    </div>
    <div class="er-schuif er-op" data-aantal="${t.voorna.paren.length}">
      <button class="er-schuif__sluit" type="button" aria-label="Sluiten">&times;</button>
      ${t.voorna.paren.map((p, i) => {
  const m = maat[p.na] || { w: 4, h: 3 };
  return `<figure class="er-schuif__paar${i === 0 ? ' is-aan' : ''}" data-i="${i}">
        <div class="er-schuif__vak" style="--verhouding:${(m.h / m.w * 100).toFixed(2)}%">
          <div class="er-schuif__na">${pic(p.na, p.na_alt, '', '(max-width:1000px) 92vw, 960px', 'eager')}<span class="er-schuif__merk er-schuif__merk--na">${esc(t.voorna.na)}</span></div>
          <div class="er-schuif__voor">${pic(p.voor, p.voor_alt, '', '(max-width:1000px) 92vw, 960px', 'eager')}<span class="er-schuif__merk er-schuif__merk--voor">${esc(t.voorna.voor)}</span></div>
          <button class="er-schuif__vergroot" type="button" aria-label="Toon groter"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7.5 2.5h-5v5M12.5 17.5h5v-5M17.5 7.5v-5h-5M2.5 12.5v5h5"/></svg>Groter</button>
          <input class="er-schuif__bereik" type="range" min="0" max="100" value="50" step="0.1" aria-label="${esc(t.voorna.kop_licht)}">
          <span class="er-schuif__lijn" style="left:50%"><span class="er-schuif__greep" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6"/></svg></span></span>
        </div>
        <figcaption>${esc(p.titel)}</figcaption>
      </figure>`;
}).join('')}
      <div class="er-schuif__bediening">
        <button class="er-rond" type="button" data-schuif="vorige" aria-label="${esc(t.voorna.vorige)}">‹</button>
        <div class="er-schuif__stippen">${t.voorna.paren.map((p, i) => `<button class="er-stip${i === 0 ? ' is-aan' : ''}" type="button" data-naar="${i}" aria-label="${esc(p.titel)}"></button>`).join('')}</div>
        <button class="er-rond er-rond--vol" type="button" data-schuif="volgende" aria-label="${esc(t.voorna.volgende)}">›</button>
      </div>
    </div>
  </div>
</section>`;

/* ---------- waarom ---------- */
const waarom = `
<section class="er-band er-band--grijs er-waarom" id="waarom">
  <div class="er-breed er-waarom__in">
    <div class="er-waarom__tekst er-op">
      <h2>${esc(t.waarom.kop_sterk)}</h2>
      ${t.waarom.intro ? `<p>${esc(t.waarom.intro)}</p>` : ''}
      <a class="er-knop er-knop--vol" href="#contact">${esc(t.diensten.knop)}</a>
    </div>
    <ul class="er-redenen">
      ${t.waarom.items.map(w => `<li class="er-reden er-op">
        <span class="er-reden__nr">${esc(w.nr)}</span>
        <div><h3>${esc(w.titel)}</h3><p>${esc(w.tekst)}</p></div>
      </li>`).join('')}
    </ul>
    <figure class="er-duo er-op">${pic(t.waarom.fotos[0].img, t.waarom.fotos[0].alt, 'er-duo__a', '(max-width:1000px) 92vw, 330px')}${pic(t.waarom.fotos[1].img, t.waarom.fotos[1].alt, 'er-duo__b', '(max-width:1000px) 92vw, 330px')}</figure>
  </div>
</section>`;

/* ---------- cta met formulier ---------- */
const f = t.cta.formulier;
const cta = `
<section class="er-cta" id="contact">
  <div class="er-cta__foto">${pic(t.cta.foto, t.cta.foto_alt, '', '100vw')}</div>
  <div class="er-breed er-cta__in">
    <div class="er-cta__tekst er-op">
      <h2>${esc(t.cta.kop_sterk)}</h2>
      <p>${esc(t.cta.tekst)}</p>
      <a class="er-knop er-knop--wit" href="tel:${esc(t.bel.tel)}">${esc(t.cta.knop)}</a>
    </div>
    <form class="er-form er-op" novalidate>
      <h3>${esc(f.kop)}</h3>
      <div class="er-form__rij">
        <label>${esc(f.naam)}<input type="text" name="naam" placeholder="${esc(f.naam_p)}" required></label>
        <label>${esc(f.mail)}<input type="email" name="mail" placeholder="${esc(f.mail_p)}" required></label>
      </div>
      <div class="er-form__rij">
        <label>${esc(f.tel)}<input type="tel" name="tel" placeholder="${esc(f.tel_p)}"></label>
        <label>${esc(f.soort)}<select name="soort">${f.soort_opties.map((o, i) => `<option${i === 0 ? ' value=""' : ''}>${esc(o)}</option>`).join('')}</select></label>
      </div>
      <label class="er-form__vol">${esc(f.bericht)}<textarea name="bericht" rows="4" placeholder="${esc(f.bericht_p)}"></textarea></label>
      <button class="er-knop er-knop--vol er-form__knop" type="submit">${esc(f.knop)}</button>
      <p class="er-form__bedankt" hidden>${esc(f.bedankt)}</p>
    </form>
  </div>
</section>`;

/* ---------- realisaties: doorlopende band, klikbaar naar de realisatiepagina ---------- */
const tegel = p => `<a class="er-tegel" href="realisaties.html#${esc(p.slug)}">
  <span class="er-tegel__beeld">${pic(p.fotos[0].img, p.fotos[0].alt, '', '300px', 'eager')}</span>
  <span class="er-tegel__naam">${esc(p.titel)}</span>
</a>`;
const tegels = t.realisaties.items.map(tegel).join('');

const realisaties = `
<section class="er-band er-real" id="realisaties">
  <div class="er-breed er-real__kop er-op">
    <div>
      <h2>${esc(t.realisaties.kop_sterk)}</h2>
      <p>${esc(t.realisaties.kop_licht)}</p>
    </div>
    <div class="er-real__bediening">
      <button class="er-rond" type="button" data-band="vorige" aria-label="${esc(t.voorna.vorige)}">‹</button>
      <button class="er-rond" type="button" data-band="volgende" aria-label="${esc(t.voorna.volgende)}">›</button>
      <a class="er-knop er-knop--vol" href="realisaties.html">${esc(t.realisaties.knop)}</a>
    </div>
  </div>
  <div class="er-loop" role="region" aria-label="${esc(t.realisaties.kop_sterk)}">
    <div class="er-loop__spoor">${tegels}${tegels}</div>
  </div>
</section>`;

/* ---------- reviews ---------- */
const reviews = `
<section class="er-band er-band--grijs er-reviews" id="reviews">
  <div class="er-breed er-reviews__in">
    <div class="er-reviews__links er-op">
      <h2>${esc(t.reviews.kop_sterk)}</h2>
      <a class="er-score" href="${esc(t.reviews.url)}" target="_blank" rel="noopener noreferrer">${GOOGLE}<div><b>${esc(t.reviews.score)}</b><span>${esc(t.reviews.bekijk)}</span></div></a>
    </div>
    <div class="er-reviews__beeld er-op">${pic(t.reviews.foto, t.reviews.foto_alt, '', '(max-width:1000px) 92vw, 280px')}</div>
    <div class="er-reviews__spoorvak er-op">
      <div class="er-revvak"><ul class="er-revspoor" data-aantal="${t.reviews.items.length}">
        ${t.reviews.items.map(r => `<li class="er-rev">
          <span class="er-rev__aanhaling" aria-hidden="true">&ldquo;</span>
          <p class="er-rev__tekst">${esc(r.tekst)}</p>
          <p class="er-rev__naam">${esc(r.naam)}</p>
          <p class="er-rev__bron">${esc(t.reviews.bron)}-review</p>
        </li>`).join('')}
      </ul></div>
      <div class="er-reviews__bediening">
        <button class="er-rond" type="button" data-rev="vorige" aria-label="${esc(t.reviews.vorige)}">‹</button>
        <button class="er-rond er-rond--vol" type="button" data-rev="volgende" aria-label="${esc(t.reviews.volgende)}">›</button>
      </div>
    </div>
  </div>
</section>`;

/* ---------- voet ---------- */
const voet = `
<footer class="er-voet">
  <div class="er-breed er-voet__in">
    <div class="er-voet__merk">
      <img class="er-voet__logo" src="${basis}img/logo-licht.png" alt="Logo van ${esc(t.meta.naam)}" width="674" height="180">
      <p>${esc(t.footer.zin)}</p>
      <p class="er-voet__soc">
        ${t.footer.instagram ? `<a href="${esc(t.footer.instagram_url)}" target="_blank" rel="noopener noreferrer">${esc(t.footer.instagram)}</a>` : ''}
        <a class="er-voet__sociaal" href="${esc(t.footer.facebook_url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t.footer.facebook)}"><svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg></a>
      </p>
    </div>
    <div class="er-voet__kolom">
      <h4>${esc(t.footer.kop_diensten)}</h4>
      <ul>${t.diensten.groepen.map(d => `<li><a href="#d-${esc(d.id)}">${esc(d.titel)}</a></li>`).join('')}</ul>
    </div>
    <div class="er-voet__kolom">
      <h4>${esc(t.footer.kop_bedrijf)}</h4>
      <ul>${t.footer.bedrijf.map(b => `<li><a href="${esc(b.naar)}">${esc(b.label)}</a></li>`).join('')}</ul>
    </div>
    <div class="er-voet__kolom">
      <h4>${esc(t.footer.kop_contact)}</h4>
      <ul class="er-voet__contact">
        <li>${rauw(t.contact.adres)}</li>
        <li><a href="tel:${esc(t.contact.tel1_url)}">${esc(t.contact.tel1)}</a></li>
        <li>${t.contact.tel2 ? `<a href="tel:${esc(t.contact.tel2_url)}">${esc(t.contact.tel2)}</a>` : ''}</li>
        <li><a href="mailto:${esc(t.contact.mail)}">${esc(t.contact.mail)}</a></li>
        <li class="er-voet__btw">${esc(t.contact.btw_label)} ${esc(t.contact.btw)}</li>
      </ul>
    </div>
  </div>
  <div class="er-breed er-voet__onder"><p>${esc(t.footer.rechten)}</p></div>
</footer>`;

const html = `<!doctype html>
<html lang="${taal.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(t.meta.titel)}</title>
<meta name="description" content="${esc(t.meta.omschrijving)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lato:wght@400;700&display=swap" rel="stylesheet">
<link rel="icon" href="${basis}img/merkteken.png" type="image/png">
<link rel="apple-touch-icon" href="${basis}img/merkteken-180.png">
<link rel="stylesheet" href="${basis}styles.css?v=${VERSIE}">
</head>
<body>
${kopbalk}
${kop}
<main>
${hero}
${waarom}
${diensten}
${reviews}
${merken}
${werkwijze}
${voorna}
${realisaties}
${cta}
</main>
${voet}
<a class="er-belzweef" href="tel:${esc(t.bel.tel)}" aria-label="${esc(t.bel.label)} ${esc(t.bel.nummer)}">
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>
  <span>${esc(t.bel.label)}</span>
</a>
<script src="${basis}site.js?v=${VERSIE}"></script>
</body>
</html>`;

fs.writeFileSync(path.join(uitMap, 'index.html'), html);
console.log('[' + taal.code + '] index.html ' + html.length + ' tekens');


/* ================= realisaties.html ================= */
const navPagina = t.nav.map(n => n.naar === '#realisaties'
  ? `<li><a href="realisaties.html" aria-current="page">${esc(n.label)}</a></li>`
  : `<li><a href="index.html${esc(n.naar)}">${esc(n.label)}</a></li>`).join('');
const kopPagina = kop
  .replace(/href="#top"/g, 'href="index.html"')
  .replace(/<ul>[\s\S]*?<\/ul>\n    <\/nav>/, `<ul>${navPagina}</ul>\n    </nav>`)
  .replace(/<div class="er-mobielmenu" id="er-mobielmenu" hidden>\n    <ul>[\s\S]*?<\/ul>/, `<div class="er-mobielmenu" id="er-mobielmenu" hidden>\n    <ul>${navPagina}</ul>`)
  .replace(/href="#contact"/g, 'href="index.html#contact"');
const voetPagina = voet.replace(/href="#/g, 'href="index.html#').replace(/href="index\.html#top"/g, 'href="index.html"');

const kopbalkPagina = kopbalk.split(taalkeuze('index.html')).join(taalkeuze('realisaties.html'));
const projecten = t.realisaties.items.map(p => `
<article class="er-rp er-rp--${p.fotos.length}" id="${esc(p.slug)}">
  <h2 class="er-op">${esc(p.titel)}</h2>
  <ul class="er-rp__raster">
    ${p.fotos.map((f, i) => `<li class="er-op${i === 0 ? ' er-rp__groot' : ''}">${pic(f.img, f.alt, '', i === 0 ? '(max-width:1000px) 92vw, 720px' : '(max-width:1000px) 44vw, 340px')}</li>`).join('')}
  </ul>
</article>`).join('');

const paginaHtml = `<!doctype html>
<html lang="${taal.code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(t.realisaties.kop_sterk)} | ${esc(t.meta.naam)}</title>
<meta name="description" content="${esc(t.realisaties.kop_licht)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lato:wght@400;700&display=swap" rel="stylesheet">
<link rel="icon" href="${basis}img/merkteken.png" type="image/png">
<link rel="apple-touch-icon" href="${basis}img/merkteken-180.png">
<link rel="stylesheet" href="${basis}styles.css?v=${VERSIE}">
</head>
<body>
${kopbalkPagina}
${kopPagina}
<main>
<section class="er-paginakop">
  <div class="er-breed">
    <p class="er-kruimel"><a href="index.html">${esc(t.meta.naam)}</a> · ${esc(t.realisaties.kop_sterk)}</p>
    <h1>${esc(t.realisaties.kop_sterk)}</h1>
    <p class="er-paginakop__sub">${esc(t.realisaties.kop_licht)}</p>
  </div>
</section>
<section class="er-band er-rps">
  <div class="er-breed">${projecten}</div>
</section>
<section class="er-slot">
  <div class="er-breed er-slot__in">
    <h2>${esc(t.cta.kop_sterk)}</h2>
    <a class="er-knop er-knop--vol" href="index.html#contact">${esc(t.hero.knop1)}</a>
  </div>
</section>
</main>
${voetPagina}
<a class="er-belzweef" href="tel:${esc(t.bel.tel)}" aria-label="${esc(t.bel.label)} ${esc(t.bel.nummer)}">
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>
  <span>${esc(t.bel.label)}</span>
</a>
<script src="${basis}site.js?v=${VERSIE}"></script>
</body>
</html>`;
fs.writeFileSync(path.join(uitMap, 'realisaties.html'), paginaHtml);
console.log('[' + taal.code + '] realisaties.html ' + paginaHtml.length + ' tekens, ' + t.realisaties.items.length + ' projecten');
}
console.log('drie talen klaar: nl op de hoofdmap, fr en en in een submap');
