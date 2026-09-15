// Snijdt het merkteken (de E/R-vorm) en het woordmerk los uit hun eigen logobestand.
// node merk.cjs
const sharp = require('C:/Users/Mohammed/pixelperfect-photo-painter/node_modules/sharp');
const path = require('path');
const BRON = path.join(__dirname, 'bron', 'logo-black-transparancy.png');
const UIT = path.join(__dirname, 'img');

(async () => {
  const { data, info } = await sharp(BRON).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, K = info.channels;
  const rijVol = [];
  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * K + 3] > 40) n++;
    rijVol.push(n);
  }
  // banden van gevulde rijen
  const banden = []; let start = null;
  for (let y = 0; y < H; y++) {
    if (rijVol[y] > 0 && start === null) start = y;
    if ((rijVol[y] === 0 || y === H - 1) && start !== null) { banden.push([start, y]); start = null; }
  }
  console.log('banden (y-van, y-tot, hoogte):');
  banden.forEach(b => console.log('  ' + b[0] + ' - ' + b[1] + '  h=' + (b[1] - b[0])));
  const kolVol = (y0, y1) => {
    const k = [];
    for (let x = 0; x < W; x++) { let n = 0; for (let y = y0; y < y1; y++) if (data[(y * W + x) * K + 3] > 40) n++; k.push(n); }
    const eerste = k.findIndex(v => v > 0), laatste = k.length - 1 - [...k].reverse().findIndex(v => v > 0);
    return [eerste, laatste];
  };
  const teken = banden[0];
  const [tx0, tx1] = kolVol(teken[0], teken[1]);
  console.log('merkteken: x ' + tx0 + '-' + tx1 + ', y ' + teken[0] + '-' + teken[1]);
  await sharp(BRON).extract({ left: tx0, top: teken[0], width: tx1 - tx0 + 1, height: teken[1] - teken[0] })
    .resize({ height: 160 }).png().toFile(path.join(UIT, 'merkteken-zwart.png'));
  await sharp(BRON).extract({ left: tx0, top: teken[0], width: tx1 - tx0 + 1, height: teken[1] - teken[0] })
    .resize({ height: 160 }).negate({ alpha: false }).png().toFile(path.join(UIT, 'merkteken-wit.png'));
  // volledige logo's voor de ronde badge
  await sharp(path.join(__dirname, 'bron', 'logo-white-transparancy.png')).resize(360).png().toFile(path.join(UIT, 'logo-wit.png'));
  await sharp(BRON).resize(360).png().toFile(path.join(UIT, 'logo-zwart.png'));
  console.log('merkteken + logo geschreven naar img/');
})();
