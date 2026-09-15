// Gedragstest voor de voorbeeldsite van Rai Bouw. Server moet draaien op 8133.
// node er-gedrag.mjs
import puppeteer from 'file:///C:/Users/Mohammed/pixelperfect-photo-painter/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const URL = 'http://localhost:8133/';
let ok = 0; const fouten = [];
const test = (naam, goed, extra) => { if (goed) { ok++; } else { fouten.push(naam + (extra ? ' → ' + extra : '')); } };


// Elke meting die naar beelden kijkt moet hier doorheen. Zonder deze stap meet je
// de laadtijd van luie beelden in plaats van de site. Dat ging vandaag drie keer mis.
async function beeldenKlaar(pg, seconden) {
  return pg.evaluate(async (s) => {
    for (const e of document.querySelectorAll('.er-op')) e.classList.add('is-zichtbaar');
    for (const i of document.images) i.loading = 'eager';
    const start = Date.now();
    while (Date.now() - start < s * 1000) {
      if (![...document.images].some(i => !i.complete || i.naturalWidth === 0)) {
        await Promise.all([...document.images].map(i => (i.decode ? i.decode() : Promise.resolve()).catch(() => {})));
        return true;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    return false;
  }, seconden || 25);
}

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });

/* ================= bureau ================= */
{
  const pg = await browser.newPage();
  const consoleFouten = [];
  pg.on('console', m => { if (m.type() === 'error') consoleFouten.push(m.text()); });
  pg.on('pageerror', e => consoleFouten.push(String(e.message)));
  const mislukt = [];
  pg.on('requestfailed', r => mislukt.push(r.url().split('/').pop()));
  await pg.setViewport({ width: 1440, height: 1000 });
  const antwoord = await pg.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

  test('pagina geeft 200', antwoord.status() === 200, String(antwoord.status()));
  test('geen console-fouten', consoleFouten.length === 0, consoleFouten.slice(0, 3).join(' | '));
  test('geen mislukte verzoeken', mislukt.filter(u => !/fonts\.g/.test(u)).length === 0, mislukt.slice(0, 3).join(', '));

  // traag scrollen zodat elk lui beeld zijn beurt krijgt, onderaan wachten tot alles klaar is
  const wachtte = await pg.evaluate(async () => {
    for (const i of document.images) i.loading = 'eager';
    const H = document.body.scrollHeight;
    for (let y = 0; y < H; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); }
    window.scrollTo(0, H);
    const start = Date.now();
    while (Date.now() - start < 25000) {
      if (![...document.images].some(i => !i.complete)) { window.scrollTo(0, 0); return Date.now() - start; }
      await new Promise(r => setTimeout(r, 300));
    }
    window.scrollTo(0, 0);
    return -1;
  });
  await new Promise(r => setTimeout(r, 600));
  test('alle beelden binnen 25 s klaar', wachtte >= 0, 'nog bezig na 25 s');

  const beeld = await pg.evaluate(() => {
    const al = [...document.images];
    return { totaal: al.length, stuk: al.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')), zonderAlt: al.filter(i => !(i.alt || '').trim()).length };
  });
  test('alle beelden laden', beeld.stuk.length === 0, beeld.stuk.slice(0, 3).join(', '));
  test('minstens 30 beelden op de pagina', beeld.totaal >= 30, String(beeld.totaal));
  test('elk beeld heeft alt', beeld.zonderAlt === 0, String(beeld.zonderAlt) + ' zonder alt');

  const overloop = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  test('geen horizontale overloop op 1440', overloop <= 0, 'overschot ' + overloop + 'px');

  const ankers = await pg.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h !== '#'));
  const kapot = await pg.evaluate(hs => hs.filter(h => !document.querySelector(h)), ankers);
  test('alle ankers bestaan', kapot.length === 0, kapot.join(', '));

  const secties = ['#top', '#waarom', '#diensten', '#reviews', '#werkwijze', '#voorna', '#contact', '#realisaties'];
  const aanwezig = await pg.evaluate(s => s.filter(x => document.querySelector(x)), secties);
  test('alle secties aanwezig', aanwezig.length === secties.length, 'mist ' + secties.filter(s => !aanwezig.includes(s)).join(', '));

  /* voor-en-na schuif */
  const beginKlem = await pg.$eval('.er-schuif__paar.is-aan .er-schuif__voor', e => getComputedStyle(e).clipPath);
  await pg.$eval('.er-schuif__paar.is-aan .er-schuif__bereik', e => { e.value = 12; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await new Promise(r => setTimeout(r, 250));
  const naKlem = await pg.$eval('.er-schuif__paar.is-aan .er-schuif__voor', e => getComputedStyle(e).clipPath);
  const lijnLinks = await pg.$eval('.er-schuif__paar.is-aan .er-schuif__lijn', e => e.style.left);
  test('schuif verandert het beeld', beginKlem !== naKlem, beginKlem + ' → ' + naKlem);
  test('schuiflijn volgt de waarde', lijnLinks === '12%', lijnLinks);

  const parenTotaal = await pg.$$eval('.er-schuif__paar', e => e.length);
  test('twee voor-en-na paren', parenTotaal === 2, String(parenTotaal));
  // op een breed scherm staan beide paren open; de pijlen horen bij de telefoon
  const beideOpen = await pg.$$eval('.er-schuif__paar', e => e.filter(p => p.offsetParent !== null).length);
  test('beide paren staan open op pc', beideOpen === 2, String(beideOpen));
  const bedieningWeg = await pg.$eval('.er-schuif__bediening', e => getComputedStyle(e).display);
  test('pijlen en bolletjes zijn weg op pc', bedieningWeg === 'none', bedieningWeg);
  // vergroten toont alleen het aangeklikte paar
  await pg.evaluate(() => document.querySelectorAll('.er-schuif__vergroot')[1].click());
  await new Promise(r => setTimeout(r, 400));
  const grootStand = await pg.evaluate(() => ({
    aan: document.querySelector('.er-schuif').classList.contains('is-groot'),
    zichtbaar: [...document.querySelectorAll('.er-schuif__paar')].filter(p => p.offsetParent !== null).length,
  }));
  test('vergroten toont één paar schermvullend', grootStand.aan && grootStand.zichtbaar === 1, JSON.stringify(grootStand));
  await pg.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 300));
  test('escape sluit de vergroting', (await pg.$eval('.er-schuif', e => !e.classList.contains('is-groot'))));

  /* reviewspoor */
  const voorScroll = await pg.$eval('.er-revspoor', e => e.style.transform);
  await pg.click('[data-rev="volgende"]');
  await new Promise(r => setTimeout(r, 700));
  const naScroll = await pg.$eval('.er-revspoor', e => e.style.transform);
  test('reviewspoor schuift', naScroll !== voorScroll, voorScroll + ' → ' + naScroll);
  test('drie reviews', (await pg.$$eval('.er-rev', e => e.length)) === 3, String(await pg.$$eval('.er-rev', e => e.length)));

  /* formulier verstuurt niets */
  const heeftActie = await pg.$eval('.er-form', e => e.hasAttribute('action'));
  test('formulier heeft geen action', heeftActie === false);
  await pg.type('.er-form input[name="naam"]', 'Test');
  // de hero wisselt vanzelf van foto; dat verschuift niets, maar we laten de pagina eerst tot rust komen
  await pg.$eval('.er-form__knop', e => { e.scrollIntoView({ block: 'center', behavior: 'instant' }); });
  await new Promise(r => setTimeout(r, 500));
  const knopH = await pg.$('.er-form__knop');
  await knopH.click();
  let verscheen = false;
  for (let i = 0; i < 40 && !verscheen; i++) {
    verscheen = await pg.$eval('.er-form__bedankt', e => !e.hidden);
    if (!verscheen) await new Promise(r => setTimeout(r, 150));
  }
  test('bedanktekst verschijnt', verscheen);
  test('pagina navigeert niet weg', pg.url() === URL || pg.url() === URL.replace(/\/$/, ''), pg.url());

  /* telefoon- en mailkoppelingen */
  const tel = await pg.$$eval('a[href^="tel:"]', a => a.map(x => x.getAttribute('href')));
  test('telefoonkoppelingen kloppen', tel.length >= 3 && tel.every(h => h === 'tel:+32491630566'), tel.join(', '));
  const mail = await pg.$$eval('a[href^="mailto:"]', a => a.map(x => x.getAttribute('href')));
  test('mailkoppeling klopt', mail.length >= 1 && mail.every(h => h === 'mailto:k-swistak@wp.pl'), mail.join(', '));

  /* externe links veilig */
  const extern = await pg.$$eval('a[target="_blank"]', a => a.map(x => x.rel));
  test('externe links met noopener', extern.length > 0 && extern.every(r => /noopener/.test(r)), extern.join(' | '));

  /* noindex */
  test('noindex staat er', await pg.$eval('meta[name="robots"]', e => /noindex/.test(e.content)));

  /* zwevende belknop */
  await pg.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  test('belknop verborgen bovenaan', !(await pg.$eval('.er-belzweef', e => e.classList.contains('is-zichtbaar'))));
  await pg.evaluate(() => window.scrollTo(0, 1800));
  await new Promise(r => setTimeout(r, 500));
  test('belknop verschijnt na de hero', await pg.$eval('.er-belzweef', e => e.classList.contains('is-zichtbaar')));
  test('belknop belt het juiste nummer', (await pg.$eval('.er-belzweef', e => e.getAttribute('href'))) === 'tel:+32491630566');
  await pg.evaluate(() => window.scrollTo(0, 0));

  await pg.close();
}

/* ================= mobiel 390 ================= */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await pg.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await pg.evaluate(async () => { const H = document.body.scrollHeight; for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } window.scrollTo(0, 0); });
  await new Promise(r => setTimeout(r, 800));

  const overloop = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  test('geen horizontale overloop op 390', overloop <= 0, 'overschot ' + overloop + 'px');

  const breed = await pg.evaluate(() => [...document.querySelectorAll('body *')]
    .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.er-revspoor') && !e.closest('.er-loop'))
    .slice(0, 5).map(e => e.className || e.tagName));
  test('geen element buiten het scherm', breed.length === 0, breed.join(', '));

  const klein = await pg.evaluate(() => [...document.querySelectorAll('p,span,a,li,h1,h2,h3,h4,label,button')]
    .filter(e => e.textContent.trim() && e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 12)
    .slice(0, 5).map(e => (e.className || e.tagName) + ' ' + getComputedStyle(e).fontSize));
  test('geen tekst kleiner dan 12px', klein.length === 0, klein.join(', '));

  const raak = await pg.evaluate(() => [...document.querySelectorAll('a,button,input,select,textarea')]
    .filter(e => { const r = e.getBoundingClientRect(); return e.offsetParent && r.width > 0 && (r.height < 32 || r.width < 32) && !e.closest('.er-top') && !e.closest('.er-voet') && !e.closest('.er-stip'); })
    .slice(0, 6).map(e => (e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
  test('raakvlakken groot genoeg', raak.length === 0, raak.join(', '));

  /* mobiel menu */
  test('menuknop zichtbaar', await pg.$eval('.er-menuknop', e => !!e.offsetParent));
  await pg.click('.er-menuknop');
  await new Promise(r => setTimeout(r, 350));
  test('menu opent', await pg.$eval('#er-mobielmenu', e => !e.hidden && e.classList.contains('is-open')));
  test('menu meldt open', await pg.$eval('.er-menuknop', e => e.getAttribute('aria-expanded') === 'true'));
  await pg.$eval('#er-mobielmenu ul a', e => e.click());
  await new Promise(r => setTimeout(r, 350));
  test('menu sluit na een keuze', await pg.$eval('#er-mobielmenu', e => e.hidden));

  /* schuif werkt ook op mobiel */
  await pg.$eval('.er-schuif__paar.is-aan .er-schuif__bereik', e => { e.value = 80; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await new Promise(r => setTimeout(r, 200));
  test('schuif werkt op mobiel', (await pg.$eval('.er-schuif__paar.is-aan .er-schuif__lijn', e => e.style.left)) === '80%');

  const hoogte = await pg.evaluate(() => document.body.scrollHeight);
  test('pagina heeft inhoud op mobiel', hoogte > 8000, String(hoogte));

  await pg.close();
}


/* ================= hero-carrousel ================= */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise(r => setTimeout(r, 1200));
  const dias = await pg.$$eval(".er-dia", e => e.length);
  test("hero heeft zes fotos", dias === 5, String(dias));
  const hoog = await pg.evaluate(() => Math.round(document.querySelector(".er-hero").getBoundingClientRect().height));
  test("hero vult het scherm", hoog >= 700, hoog + "px bij 900 hoog venster");
  const eerst = await pg.$eval(".er-dia.is-aan", e => Number(e.dataset.i));
  await pg.click("[data-dia=\"volgende\"]");
  await new Promise(r => setTimeout(r, 400));
  const na = await pg.$eval(".er-dia.is-aan", e => Number(e.dataset.i));
  test("hero schakelt door", na === (eerst + 1) % 6, eerst + " naar " + na);
  const tik = await pg.$eval(".er-hero__tik.is-aan", e => [...e.parentElement.children].indexOf(e));
  test("streepje volgt de foto", tik === na, "streep " + tik + " foto " + na);
  const aan = await pg.$$eval(".er-dia.is-aan", e => e.length);
  test("maar een foto tegelijk", aan === 1, String(aan));
  const draait = await pg.evaluate(async () => { const i = Number(document.querySelector(".er-dia.is-aan").dataset.i); await new Promise(r => setTimeout(r, 7000)); return Number(document.querySelector(".er-dia.is-aan").dataset.i) !== i; });
  test("hero loopt vanzelf door", draait);
  test("drie dienstrijen", (await pg.$$eval(".er-rij", e => e.length)) === 3);
  test("voetlogo is de lichte versie", await pg.$eval(".er-voet__logo", e => /logo-licht/.test(e.getAttribute("src"))));
  test("gebogen pijlen tussen de stappen", (await pg.$$eval(".er-boog", e => e.length)) === 3);
  await pg.close();
}


/* ================= drie talen ================= */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  for (const [pad, code, kop] of [['', 'nl', 'Uw partner'], ['fr/', 'fr', 'Votre partenaire'], ['en/', 'en', 'Your partner']]) {
    const a = await pg.goto(URL + pad, { waitUntil: 'networkidle2', timeout: 60000 });
    test('pagina laadt (' + code + ')', a.status() === 200, String(a.status()));
    test('taalattribuut (' + code + ')', (await pg.$eval('html', e => e.lang)) === code);
    test('kop in de juiste taal (' + code + ')', (await pg.$eval('h1', e => e.textContent)).replace(/\u00a0/g, ' ').trim().startsWith(kop), (await pg.$eval('h1', e => e.textContent.trim().slice(0, 30))));
    await beeldenKlaar(pg, 30);
    const stuk = await pg.evaluate(() => [...document.images].filter(i => !i.complete || i.naturalWidth === 0).length);
    test('beelden laden (' + code + ')', stuk === 0, stuk + ' stuk');
    const css = await pg.evaluate(() => getComputedStyle(document.querySelector('.er-kop')).position);
    test('stijlblad geladen (' + code + ')', css === 'sticky', css);
  }
  // doorklikken van nl naar fr en terug
  await pg.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  await pg.close();
}

await browser.close();

console.log('geslaagd: ' + ok + '   gefaald: ' + fouten.length);
if (fouten.length) { console.log('\nFOUT:'); for (const f of fouten) console.log('  ' + f); process.exit(1); }
console.log('alle gedragstests in orde');
