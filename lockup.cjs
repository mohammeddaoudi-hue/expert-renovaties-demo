// Bouwt een horizontale logo-lockup uit hun eigen vierkante logo: merkteken links, woordmerk rechts.
// node lockup.cjs
const sharp = require('C:/Users/Mohammed/pixelperfect-photo-painter/node_modules/sharp');
const path = require('path');
const R = __dirname;

async function deel(bron, top, hoogte) {
  const { data, info } = await sharp(bron).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, K = info.channels;
  let x0 = W, x1 = 0;
  for (let y = top; y < top + hoogte; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * K + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    }
  }
  return { left: x0, top, width: x1 - x0 + 1, height: hoogte };
}

(async () => {
  for (const [bron, uit] of [['logo-black-transparancy.png', 'logo-kop.png'], ['logo-white-transparancy.png', 'logo-licht.png']]) {
    const B = path.join(R, 'bron', bron);
    const teken = await deel(B, 431, 543);          // het E/R-gebouwtje
    const woord = await deel(B, 1129, 440);         // EXPERT + RENOVATIES
    const H = 180;                                   // hoogte van de lockup
    const tekenBuf = await sharp(B).extract(teken).resize({ height: H }).png().toBuffer();
    const woordBuf = await sharp(B).extract(woord).resize({ height: Math.round(H * 0.78) }).png().toBuffer();
    const tm = await sharp(tekenBuf).metadata(), wm = await sharp(woordBuf).metadata();
    const gat = Math.round(H * 0.22);
    await sharp({ create: { width: tm.width + gat + wm.width, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([
        { input: tekenBuf, left: 0, top: 0 },
        { input: woordBuf, left: tm.width + gat, top: Math.round((H - wm.height) / 2) },
      ])
      .png().toFile(path.join(R, 'img', uit));
    const m = await sharp(path.join(R, 'img', uit)).metadata();
    console.log(uit + ': ' + m.width + 'x' + m.height + '  (teken ' + tm.width + ', woord ' + wm.width + ')');
  }
})();
