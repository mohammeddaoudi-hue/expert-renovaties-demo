// Maakt schermafdrukken van de voorbeeldsite.  node schot.mjs [breedte] [naam]
import puppeteer from 'file:///C:/Users/Mohammed/pixelperfect-photo-painter/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
const BR = Number(process.argv[2] || 1440);
const NAAM = process.argv[3] || ('schot-' + BR);
const UIT = 'C:/Users/Mohammed/NORVO-DEMOS/expertrenovaties/schermen/';
fs.mkdirSync(UIT, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const pg = await b.newPage();
await pg.setViewport({ width: BR, height: BR > 700 ? 1000 : 844, deviceScaleFactor: 1 });
await pg.goto('http://localhost:8133/', { waitUntil: 'networkidle2', timeout: 60000 });
await pg.evaluate(() => document.querySelectorAll('.er-op').forEach(e => e.classList.add('is-zichtbaar')));
await pg.evaluate(async () => { const H = document.body.scrollHeight; for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 170)); } window.scrollTo(0, 0); });
await new Promise(r => setTimeout(r, 1400));
await pg.screenshot({ path: UIT + NAAM + '.png', fullPage: true });
const m = await pg.evaluate(() => ({ hoogte: document.body.scrollHeight, breedte: document.documentElement.scrollWidth }));
console.log(NAAM + '.png  ' + m.breedte + 'x' + m.hoogte);
await b.close();
