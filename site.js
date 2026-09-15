/* Expert Renovaties — voorbeeldsite. Menu, voor-en-na-schuif, reviewspoor, formulier. */
(function () {
  'use strict';

  /* ---- blokken laten verschijnen bij het scrollen ---- */
  var blokken = Array.prototype.slice.call(document.querySelectorAll('.er-op'));
  var rustig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!blokken.length) { /* niets te doen */ }
  else if (rustig || !('IntersectionObserver' in window)) {
    blokken.forEach(function (e) { e.classList.add('is-zichtbaar'); });
  } else {
    // alles wat al in beeld staat meteen tonen, de rest volgt bij het scrollen
    var kijker = new IntersectionObserver(function (rijen) {
      rijen.forEach(function (r) {
        if (!r.isIntersecting) return;
        var el = r.target;
        var buren = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).filter(function (k) { return k.classList.contains('er-op'); }) : [];
        var plek = buren.indexOf(el);
        el.style.transitionDelay = (plek > 0 ? Math.min(plek, 5) * 70 : 0) + 'ms';
        el.classList.add('is-zichtbaar');
        kijker.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    blokken.forEach(function (e) {
      if (e.getBoundingClientRect().top < window.innerHeight * 0.92) e.classList.add('is-zichtbaar');
      else kijker.observe(e);
    });
  }


  /* ---- hero: doorlopend door de afgewerkte projecten ---- */
  var hero = document.querySelector('.er-hero');
  if (hero) {
    var dias = Array.prototype.slice.call(hero.querySelectorAll('.er-dia'));
    var tikken = Array.prototype.slice.call(hero.querySelectorAll('.er-hero__tik'));
    var nu = 0, klok = null;
    var toonDia = function (i) {
      nu = (i + dias.length) % dias.length;
      dias.forEach(function (d, n) { d.classList.toggle('is-aan', n === nu); if (n === nu) { var im = d.querySelector('img'); if (im) im.loading = 'eager'; } });
      tikken.forEach(function (d, n) { d.classList.toggle('is-aan', n === nu); });
      var volg = dias[(nu + 1) % dias.length];
      if (volg) { var im2 = volg.querySelector('img'); if (im2) im2.loading = 'eager'; }
    };
    var start = function () { if (!rustig && dias.length > 1) { stop(); klok = setInterval(function () { toonDia(nu + 1); }, 6000); } };
    var stop = function () { if (klok) { clearInterval(klok); klok = null; } };
    hero.addEventListener('click', function (e) {
      var k = e.target.closest('button');
      if (!k || !k.dataset.dia) return;
      toonDia(k.dataset.dia === 'vorige' ? nu - 1 : nu + 1);
      start();
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    start();
  }


  /* ---- werkwijze: de bolletjes volgen de scroll ---- */
  var stappen = Array.prototype.slice.call(document.querySelectorAll('.er-stap'));
  var werkwijze = document.querySelector('.er-werkwijze');
  if (stappen.length && werkwijze) {
    if (rustig) {
      stappen.forEach(function (e) { e.classList.add('is-aan'); });
    } else {
      var wacht = false;
      var meet = function () {
        var r = werkwijze.getBoundingClientRect();
        var vh = window.innerHeight || 800;
        var begin = vh * 0.82;          // eerste bolletje kleurt zodra de sectie hier komt
        var eind = vh * 0.34;           // laatste bolletje kleurt hier
        var loop = (begin - r.top) / (begin - eind + r.height * 0.55);
        var p = Math.max(0, Math.min(1, loop));
        var n = Math.ceil(p * stappen.length);
        stappen.forEach(function (e, i) { e.classList.toggle('is-aan', i < n); });
      };
      var tik = function () {
        if (wacht) return;
        wacht = true;
        requestAnimationFrame(function () { wacht = false; meet(); });
      };
      window.addEventListener('scroll', tik, { passive: true });
      window.addEventListener('resize', tik);
      meet();
    }
  }


  /* ---- zwevende belknop: verschijnt voorbij de hero ---- */
  var belKnop = document.querySelector('.er-belzweef');
  if (belKnop) {
    var grens = function () {
      var hero = document.querySelector('.er-hero') || document.querySelector('.er-paginakop');
      return hero ? hero.offsetTop + hero.offsetHeight * 0.7 : 500;
    };
    var belBezig = false;
    var kijk = function () {
      if (belBezig) return;
      belBezig = true;
      requestAnimationFrame(function () {
        belBezig = false;
        belKnop.classList.toggle('is-zichtbaar', window.scrollY > grens());
      });
    };
    window.addEventListener('scroll', kijk, { passive: true });
    window.addEventListener('resize', kijk);
    kijk();
  }

  /* ---- mobiel menu ---- */
  var knop = document.querySelector('.er-menuknop');
  var menu = document.getElementById('er-mobielmenu');
  if (knop && menu) {
    knop.addEventListener('click', function () {
      var open = !menu.classList.contains('is-open');
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.toggle('is-open', open); if (!open) menu.hidden = true; });
      knop.setAttribute('aria-expanded', open ? 'true' : 'false');
      knop.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('is-open');
        menu.hidden = true;
        knop.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var breed = function () { return window.matchMedia('(min-width: 861px)').matches; };

  /* ---- voor en na: slepen met de vinger of de muis ---- */
  var schuif = document.querySelector('.er-schuif');
  if (schuif) {
    var paren = Array.prototype.slice.call(schuif.querySelectorAll('.er-schuif__paar'));
    var stippen = Array.prototype.slice.call(schuif.querySelectorAll('.er-stip'));
    var huidig = 0;

    paren.forEach(function (paar) {
      var bereik = paar.querySelector('.er-schuif__bereik');
      var voor = paar.querySelector('.er-schuif__voor');
      var lijn = paar.querySelector('.er-schuif__lijn');
      var vak = paar.querySelector('.er-schuif__vak');
      if (!bereik || !voor || !lijn || !vak) return;

      var zet = function (waarde) {
        var w = Math.max(0, Math.min(100, waarde));
        bereik.value = w;
        voor.style.clipPath = 'inset(0 ' + (100 - w) + '% 0 0)';
        lijn.style.left = w + '%';
      };
      var uitPunt = function (e) {
        var r = vak.getBoundingClientRect();
        if (!r.width) return Number(bereik.value);
        return ((e.clientX - r.left) / r.width) * 100;
      };

      var bezig = false;
      vak.addEventListener('pointerdown', function (e) {
        bezig = true;
        try { vak.setPointerCapture(e.pointerId); } catch (x) { /* oude browser */ }
        zet(uitPunt(e));
        e.preventDefault();
      });
      vak.addEventListener('pointermove', function (e) { if (bezig) { zet(uitPunt(e)); e.preventDefault(); } });
      var losSchuif = function (e) {
        if (!bezig) return;
        bezig = false;
        try { vak.releasePointerCapture(e.pointerId); } catch (x) { /* al los */ }
      };
      vak.addEventListener('pointerup', losSchuif);
      vak.addEventListener('pointercancel', losSchuif);
      vak.addEventListener('lostpointercapture', function () { bezig = false; });

      bereik.addEventListener('input', function () { zet(Number(bereik.value)); });
      bereik.addEventListener('change', function () { zet(Number(bereik.value)); });
      zet(50);
    });

    var toonPaar = function (i) {
      huidig = (i + paren.length) % paren.length;
      paren.forEach(function (p, n) {
        p.hidden = breed() ? false : n !== huidig;
        p.classList.toggle('is-aan', n === huidig);
      });
      stippen.forEach(function (d, n) { d.classList.toggle('is-aan', n === huidig); });
    };

    schuif.addEventListener('click', function (e) {
      var k = e.target.closest('button');
      if (!k) return;
      if (k.dataset.schuif === 'vorige') toonPaar(huidig - 1);
      else if (k.dataset.schuif === 'volgende') toonPaar(huidig + 1);
      else if (k.dataset.naar !== undefined) toonPaar(Number(k.dataset.naar));
    });
  }

  /* ---- doorlopende banden: verschuiven met transform, blijven altijd lopen ---- */
  Array.prototype.forEach.call(document.querySelectorAll('.er-loop'), function (loop) {
    var spoor = loop.querySelector('.er-loop__spoor');
    if (!spoor) return;
    var merken = loop.classList.contains('er-loop--merken');
    var perSeconde = merken ? 26 : 40;
    var x = 0, vorige = 0, pauze = false, sleept = false, startX = 0, startPos = 0, inBeeld = true;

    var helft = function () { return spoor.scrollWidth / 2; };
    var teken = function () {
      var h = helft();
      if (h > 0) { while (x >= h) x -= h; while (x < 0) x += h; }
      spoor.style.transform = 'translate3d(' + (-x) + 'px,0,0)';
    };
    var stap = function (tijd) {
      if (!vorige) vorige = tijd;
      var dt = Math.min(tijd - vorige, 120) / 1000;
      vorige = tijd;
      if (!pauze && !sleept && inBeeld && !rustig) { x += perSeconde * dt; teken(); }
      requestAnimationFrame(stap);
    };

    // alleen een muis pauzeert bij aanwijzen; op een telefoon komt er geen pointerleave
    loop.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') pauze = true; });
    loop.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') pauze = false; });

    loop.addEventListener('pointerdown', function (e) {
      sleept = true; startX = e.clientX; startPos = x;
      loop.classList.add('is-sleept');
      try { loop.setPointerCapture(e.pointerId); } catch (err) { /* oude browser */ }
    });
    loop.addEventListener('pointermove', function (e) {
      if (!sleept) return;
      x = startPos - (e.clientX - startX);
      teken();
      e.preventDefault();
    });
    var los = function (e) {
      if (!sleept) return;
      sleept = false;
      loop.classList.remove('is-sleept');
      if (e && e.pointerType !== 'mouse') pauze = false;
      try { loop.releasePointerCapture(e.pointerId); } catch (err) { /* al los */ }
    };
    loop.addEventListener('pointerup', los);
    loop.addEventListener('pointercancel', los);
    window.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { sleept = false; pauze = false; } });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { vorige = 0; pauze = false; } });

    // buiten beeld stilleggen: scheelt werk op een telefoon
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (r) { inBeeld = r[0].isIntersecting; if (inBeeld) vorige = 0; }, { rootMargin: '150px' }).observe(loop);
    }

    // een klik op een tegel mag niet afgaan na een sleepbeweging
    loop.addEventListener('click', function (e) { if (Math.abs(x - startPos) > 6) e.preventDefault(); }, true);

    requestAnimationFrame(stap);
    loop.__band = {
      schuif: function (heen, afstand) {
        pauze = true;
        var doel = x + heen * afstand, begin = x, t0 = 0;
        var animeer = function (tijd) {
          if (!t0) t0 = tijd;
          var p = Math.min((tijd - t0) / 420, 1);
          var e2 = 1 - Math.pow(1 - p, 3);
          x = begin + (doel - begin) * e2;
          teken();
          if (p < 1) requestAnimationFrame(animeer);
          else { vorige = 0; pauze = false; }
        };
        requestAnimationFrame(animeer);
      },
      stand: function () { return { x: Math.round(x), pauze: pauze, sleept: sleept, inBeeld: inBeeld }; },
    };
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-band]'), function (k) {
    k.addEventListener('click', function () {
      var loop = document.querySelector('.er-real .er-loop');
      if (!loop || !loop.__band) return;
      var tegel = loop.querySelector('.er-tegel');
      var afstand = tegel ? tegel.getBoundingClientRect().width + 18 : 300;
      loop.__band.schuif(k.dataset.band === 'vorige' ? -1 : 1, afstand);
    });
  });

  /* ---- reviews: carrousel op index, loopt oneindig rond ---- */
  var revSpoor = document.querySelector('.er-revspoor');
  if (revSpoor) {
    var revs = revSpoor.querySelectorAll('.er-rev');
    var aantal = revs.length;
    var index = 0;
    var toonRev = function (i) {
      index = ((i % aantal) + aantal) % aantal;
      revSpoor.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      Array.prototype.forEach.call(revs, function (e, n) {
        e.setAttribute('aria-hidden', n === index ? 'false' : 'true');
      });
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-rev]'), function (k) {
      k.addEventListener('click', function () { toonRev(index + (k.dataset.rev === 'vorige' ? -1 : 1)); });
    });
    // met de vinger vegen
    var vX = 0, vBezig = false;
    revSpoor.addEventListener('pointerdown', function (e) { vX = e.clientX; vBezig = true; });
    revSpoor.addEventListener('pointerup', function (e) {
      if (!vBezig) return;
      vBezig = false;
      var d = e.clientX - vX;
      if (Math.abs(d) > 45) toonRev(index + (d < 0 ? 1 : -1));
    });
    revSpoor.addEventListener('pointercancel', function () { vBezig = false; });
    toonRev(0);
  }

  /* ---- formulier: dit is een voorbeeldsite en verstuurt niets ---- */
  var form = document.querySelector('.er-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bedankt = form.querySelector('.er-form__bedankt');
      if (bedankt) bedankt.hidden = false;
    });
  }

  /* ---- voor en na: schermvullend bekijken ---- */
  (function () {
    var schuif = document.querySelector('.er-schuif');
    if (!schuif) return;
    var sluit = schuif.querySelector('.er-schuif__sluit');
    var open = function (aan) {
      schuif.classList.toggle('is-groot', aan);
      if (!aan) Array.prototype.forEach.call(schuif.querySelectorAll('.er-schuif__paar'), function (p) { p.classList.remove('is-groot-paar'); });
      document.body.style.overflow = aan ? 'hidden' : '';
    };
    Array.prototype.forEach.call(schuif.querySelectorAll('.er-schuif__vergroot'), function (knop) {
      knop.addEventListener('click', function (e) {
        e.stopPropagation();
        var paar = knop.closest('.er-schuif__paar');
        Array.prototype.forEach.call(schuif.querySelectorAll('.er-schuif__paar'), function (p) { p.classList.toggle('is-groot-paar', p === paar); });
        open(true);
      });
    });
    if (sluit) sluit.addEventListener('click', function () { open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); });
    schuif.addEventListener('click', function (e) { if (schuif.classList.contains('is-groot') && e.target === schuif) open(false); });
  })();
})();
