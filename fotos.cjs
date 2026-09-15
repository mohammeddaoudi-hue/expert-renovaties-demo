// Zet de bronfoto's om naar webformaten met een leesbare naam.
// node fotos.cjs
const fs = require('fs'), path = require('path');
const sharp = require('C:/Users/Mohammed/pixelperfect-photo-painter/node_modules/sharp');
const R = __dirname;
const BRON = path.join(R, 'bron'), UIT = path.join(R, 'img');
fs.mkdirSync(UIT, { recursive: true });

// Bron: eigen mediabibliotheek van expert-renovaties.be (2020-2021) en hun Google-profiel (g-*).
const NAMEN = {
  // zolderverdieping, 20 oktober 2020
  '20201020_103242-rotated.jpg': 'zolder-gang',
  '20201020_103258-rotated.jpg': 'zolder-deur',
  '20201020_103258_landscape.jpg': 'zolder-deur-breed',
  '20201020_103305-rotated.jpg': 'zolder-kamer',
  '20201020_103316-rotated.jpg': 'zolder-overloop',
  '20201020_103321-rotated.jpg': 'zolder-balustrade',
  '20201020_103338-rotated.jpg': 'zolder-dakvenster',
  '20201020_103351-rotated.jpg': 'zolder-berging',
  // badkamer met inloopdouche, 29 mei 2021
  '20210529_144429-rotated.jpg': 'douche-overzicht',
  '20210529_144457-rotated.jpg': 'douche-nissen',
  '20210529_144538-rotated.jpg': 'douche-radiator',
  // uitbouw met houten gevelbekleding, juni 2021
  '20210609_080608-rotated.jpg': 'uitbouw-voorkant',
  '20210609_080614-rotated.jpg': 'uitbouw-folie',
  '20210609_080645-rotated.jpg': 'uitbouw-zijkant',
  '20210609_155610-rotated.jpg': 'uitbouw-avond',
  '20210611_095252-rotated.jpg': 'uitbouw-stelling',
  '20210612_112135-rotated.jpg': 'uitbouw-raam',
  '20210612_155958-rotated.jpg': 'uitbouw-tuinzijde',
  '20210612_160013-rotated.jpg': 'uitbouw-oprit',
  '20210612_160032-rotated.jpg': 'uitbouw-schuifraam',
  '20210612_160056-rotated.jpg': 'uitbouw-hoek',
  // keuken, 19 juni 2021
  '20210619_092839-rotated.jpg': 'keuken-werkblad',
  '20210619_130324-rotated.jpg': 'keuken-overzicht',
  // badkamer met bad aan het raam, juli 2021
  '20210727_124442-rotated.jpg': 'bad-ruw',
  '20210730_154952-rotated.jpg': 'bad-af',
  '20210730_154959-rotated.jpg': 'bad-zicht',
  // Google-profiel
  'g-1.jpg': 'douche-breed',
  'g-2.jpg': 'achterbouw-terras',
  'g-3.jpg': 'zolderkamer-airco',
  'g-4.jpg': 'ruwbouw-stelling',
  'g-5.jpg': 'zolderkamer-vloer',
};

const MATEN = [1600, 900, 500];

(async () => {
  const gemaakt = [];
  for (const [bestand, naam] of Object.entries(NAMEN)) {
    const bron = path.join(BRON, bestand);
    if (!fs.existsSync(bron)) { console.log('ONTBREEKT ' + bestand); continue; }
    const m = await sharp(bron).metadata();
    const maten = MATEN.filter(b => b <= m.width);
    if (!maten.length) maten.push(m.width);
    for (const br of maten) {
      await sharp(bron).rotate().resize(br).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(UIT, naam + '-' + br + '.jpg'));
    }
    gemaakt.push({ naam, bron: bestand, w: m.width, h: m.height, maten });
    console.log(naam.padEnd(22) + m.width + 'x' + m.height);
  }
  fs.writeFileSync(path.join(UIT, 'index.json'), JSON.stringify(gemaakt, null, 1));
  console.log('\n' + gemaakt.length + " foto's verwerkt");
})();
