/*
 * Itera Collectives Photobooth - motion.js
 * Self mounting per section motion graphics (hand drawn red pen look).
 * Owns: .motion, .motion__art, .motion-* (see css/motion.css), html.motion-ready.
 * Each graphic is built with createElementNS, aria-hidden, and only animated by CSS
 * (transform, opacity, stroke-dashoffset) while its section is on screen.
 * No console output, no external hosts, no dynamic innerHTML.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- tiny seeded random so strokes wobble the same on every load ---------- */
  var seed = 7;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function jit(n) { return (rand() - 0.5) * n; }
  function f(n) { return Math.round(n * 10) / 10; }

  /* ---------- svg element helpers ---------- */
  /* CSP blocks style attributes, so declarations go through the CSSOM */
  function applyStyle(node, text) {
    String(text).split(';').forEach(function (decl) {
      var i = decl.indexOf(':');
      if (i < 1) return;
      node.style.setProperty(decl.slice(0, i).trim(), decl.slice(i + 1).trim());
    });
  }
  function el(tag, attrs, kids) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'style') { applyStyle(node, attrs[k]); return; }
      node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) { node.appendChild(kid); });
    return node;
  }
  function delay(sec) { return '--d:' + sec + 's'; }
  /* pen path: cls = space separated modifiers, style optional */
  function pen(d, cls, style) {
    var a = { d: d, 'class': 'motion-pen ' + (cls || '') };
    if (style) a.style = style;
    return el('path', a);
  }
  function grp(cls, kids, attrs) {
    var a = attrs || {};
    a['class'] = cls;
    return el('g', a, kids);
  }
  function wrap(x, y, kid) { return el('g', { transform: 'translate(' + x + ' ' + y + ')' }, [kid]); }

  /* ---------- wobbly geometry (returns path data) ---------- */
  function poly(pts, close, j) {
    var amt = j == null ? 1 : j;
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    var n = pts.length;
    var edges = close ? n : n - 1;
    for (var i = 0; i < edges; i++) {
      var a = pts[i];
      var b = pts[(i + 1) % n];
      d += 'Q' + f((a[0] + b[0]) / 2 + jit(amt * 2)) + ' ' + f((a[1] + b[1]) / 2 + jit(amt * 2)) +
        ' ' + f(b[0]) + ' ' + f(b[1]);
    }
    return d + (close ? 'Z' : '');
  }
  function line(x1, y1, x2, y2, j) { return poly([[x1, y1], [x2, y2]], false, j == null ? 0.8 : j); }
  function rect(x, y, w, h, j) { return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, j == null ? 0.7 : j); }
  function circle(cx, cy, r) {
    var d = '';
    var step = Math.PI / 4;
    for (var i = 0; i < 8; i++) {
      var a = i * step;
      var rr = r * (1 + jit(0.06));
      var cr = r * 1.082 * (1 + jit(0.05));
      var px = cx + Math.cos(a + step) * rr;
      var py = cy + Math.sin(a + step) * rr;
      if (i === 0) d += 'M' + f(cx + Math.cos(a) * rr) + ' ' + f(cy + Math.sin(a) * rr);
      d += 'Q' + f(cx + Math.cos(a + step / 2) * cr) + ' ' + f(cy + Math.sin(a + step / 2) * cr) + ' ' + f(px) + ' ' + f(py);
    }
    return d + 'Z';
  }
  function star4(cx, cy, r) {
    return 'M' + cx + ' ' + (cy - r) + 'Q' + cx + ' ' + cy + ' ' + (cx + r) + ' ' + cy +
      'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + r) + 'Q' + cx + ' ' + cy + ' ' + (cx - r) + ' ' + cy +
      'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - r) + 'Z';
  }
  function rays(cx, cy, r1, r2, count) {
    var d = '';
    for (var i = 0; i < count; i++) {
      var a = (i / count) * Math.PI * 2;
      d += line(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, 0.5);
    }
    return d;
  }
  function svgRoot(w, h, kids) {
    return el('svg', {
      'class': 'motion__svg', viewBox: '0 0 ' + w + ' ' + h, 'aria-hidden': 'true', focusable: 'false'
    }, kids);
  }

  /* hand drawn digits 3 2 1 in a 8 x 12 box */
  var DIGITS = {
    3: 'M1 2Q4 -1 6.5 2Q7.5 5 3.5 5.6Q8 6.6 6.8 10Q4 13.5 0.5 10.5',
    2: 'M1 3Q2 -0.5 5.5 0.5Q8 3 5 6L0.8 11.4L7.4 11.2',
    1: 'M1 3.4L4.2 0.6L4.4 11.6'
  };

  /* ================= 1. HERO: printer slot, printing strip, curtain ripple ================= */
  function buildHero() {
    var kids = [];
    kids.push(el('defs', {}, [el('clipPath', { id: 'motion-hero-clip' }, [el('rect', { x: 0, y: 24, width: 120, height: 108 })])]));
    [8, 18, 28, 92, 102, 112].forEach(function (x, i) {
      var cls = 'motion-ripple' + (i % 3 === 1 ? ' motion-x' : '');
      kids.push(pen('M' + x + ' 28Q' + (x + 5) + ' 48 ' + x + ' 68T' + x + ' 108T' + x + ' 126', cls, delay(f(i * 0.35))));
    });
    var frames = [];
    for (var i = 0; i < 4; i++) {
      var y = 22 + i * 26;
      var cls = i > 1 ? 'motion-x' : '';
      frames.push(grp(cls, [
        pen(rect(46, y, 28, 22, 0.5), 'motion-f-soft'),
        pen(star4(60, y + 11, 5), 'motion-f-ink motion-thin'),
        pen(rect(46, y, 28, 22, 0.3), 'motion-flash motion-nostroke motion-f-gold', delay(f(i * 0.9)))
      ]));
    }
    var strip = grp('motion-strip', [pen(rect(42, 16, 36, 108, 0.8), 'motion-f-paper')].concat(frames));
    kids.push(grp('', [strip], { 'clip-path': 'url(#motion-hero-clip)' }));
    kids.push(pen(rect(24, 6, 72, 18, 0.8), 'motion-f-soft'));
    kids.push(pen(line(32, 15, 88, 15, 0.5), 'motion-thick'));
    kids.push(pen(circle(90, 10, 2), 'motion-f-gold motion-blink'));
    return svgRoot(120, 130, kids);
  }

  /* ================= 2. ABOUT: sketched camera, iris, flash burst ================= */
  function buildAbout() {
    var blades = '';
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      blades += line(60 + Math.cos(a) * 6, 46 + Math.sin(a) * 6, 60 + Math.cos(a + 1) * 15, 46 + Math.sin(a + 1) * 15, 0.4);
    }
    return svgRoot(120, 80, [
      pen(poly([[40, 24], [47, 14], [73, 14], [80, 24]], true, 0.6), 'motion-f-soft'),
      pen(rect(12, 24, 96, 48, 0.9), 'motion-f-paper'),
      pen(rect(16, 28, 88, 10, 0.5), 'motion-f-soft motion-thin'),
      pen(circle(60, 48, 19), 'motion-f-soft'),
      pen(circle(60, 48, 14), 'motion-f-paper'),
      grp('motion-iris', [pen(blades, 'motion-thin')], { style: 'transform-origin:60px 48px;transform-box:view-box' }),
      grp('motion-aperture', [pen(circle(60, 48, 7), 'motion-f-ink')], { style: 'transform-origin:60px 48px;transform-box:view-box' }),
      pen(rect(20, 18, 10, 6, 0.4), 'motion-f-ink'),
      pen(circle(94, 34, 3), 'motion-f-gold motion-thin'),
      grp('motion-burst', [pen(star4(104, 14, 9), 'motion-f-gold motion-thin'), pen(rays(104, 14, 11, 16, 8), 'motion-gold')],
        { style: 'transform-origin:104px 14px;transform-box:view-box' })
    ]);
  }

  /* ================= 3. PACKAGES: clock with sweeping hands and a +1 tick ================= */
  function buildPackages() {
    var ticks = '';
    for (var i = 0; i < 12; i++) {
      var a = (i / 12) * Math.PI * 2;
      var r1 = i % 3 === 0 ? 22 : 25;
      ticks += line(50 + Math.cos(a) * r1, 42 + Math.sin(a) * r1, 50 + Math.cos(a) * 29, 42 + Math.sin(a) * 29, 0.3);
    }
    var origin = 'transform-origin:50px 42px;transform-box:view-box';
    return svgRoot(120, 84, [
      pen(circle(50, 42, 33), 'motion-f-paper'),
      pen(circle(50, 42, 36), 'motion-thin motion-faint'),
      pen(ticks, 'motion-thin'),
      grp('motion-hand motion-hand--hour', [pen(line(50, 42, 50, 24, 0.4), 'motion-thick')], { style: origin }),
      grp('motion-hand motion-hand--min', [pen(line(50, 42, 50, 15, 0.4), '')], { style: origin }),
      pen(circle(50, 42, 2.4), 'motion-f-ink'),
      grp('motion-plus', [
        pen(circle(94, 20, 13), 'motion-f-gold'),
        pen('M88 20L100 20M94 14L94 26', 'motion-ink-on-gold'),
        pen('M104 8L107 4M108 14L112 12', 'motion-thin motion-gold')
      ], { style: 'transform-origin:94px 20px;transform-box:view-box' })
    ]);
  }

  /* ================= 4. INCLUDED: mini booth, light bars, OLED countdown, strip to tray ================= */
  function buildIncluded() {
    var digits = [3, 2, 1].map(function (n, i) {
      return wrap(52, 23, grp('motion-digit motion-digit--' + n, [pen(DIGITS[n], 'motion-cream motion-thick')], { style: delay(0) }));
    });
    return svgRoot(120, 84, [
      pen(rect(24, 6, 6, 48, 0.4), 'motion-f-gold motion-bar', delay(0)),
      pen(rect(90, 6, 6, 48, 0.4), 'motion-f-gold motion-bar', delay(0.6)),
      pen(rect(32, 6, 56, 58, 0.9), 'motion-f-soft'),
      pen('M32 12Q36 38 32 62M38 8Q42 36 38 62M82 8Q78 36 82 62M88 12Q84 38 88 62', 'motion-thin motion-faint'),
      pen(rect(42, 14, 36, 28, 0.5), 'motion-f-ink'),
      grp('', digits),
      pen(rect(42, 14, 36, 28, 0.3), 'motion-flash-oled motion-nostroke motion-f-gold'),
      pen(line(54, 46, 66, 46, 0.4), 'motion-thick'),
      grp('motion-drop', [pen(rect(56, 46, 8, 18, 0.4), 'motion-f-paper motion-thin'), pen(rect(57.5, 48, 5, 4, 0.2), 'motion-f-gold motion-nostroke')]),
      pen(rect(46, 64, 28, 8, 0.5), 'motion-f-soft'),
      pen(line(36, 78, 84, 78, 0.8), 'motion-thin')
    ]);
  }

  /* ================= 5. LAYOUTS: strips filling frame by frame with a flash each ================= */
  function buildLayouts() {
    var kids = [];
    var strips = [{ x: 14, n: 2, h: 26 }, { x: 48, n: 3, h: 18 }, { x: 82, n: 4, h: 13 }];
    var count = 0;
    strips.forEach(function (s, si) {
      kids.push(pen(rect(s.x, 4, 26, 74, 0.7), 'motion-f-paper'));
      for (var i = 0; i < s.n; i++) {
        var gap = 3;
        var fh = (66 - gap * (s.n - 1)) / s.n;
        var y = 8 + i * (fh + gap);
        var d = f(count * 0.55);
        var cls = si === 2 && i > 1 ? 'motion-x' : '';
        kids.push(grp(cls, [
          pen(rect(s.x + 3, y, 20, fh, 0.4), 'motion-f-ink motion-fill motion-thin', delay(d)),
          pen(star4(s.x + 13, y + fh / 2, Math.min(5, fh / 3)), 'motion-f-paper motion-nostroke motion-fill', delay(d)),
          pen(star4(s.x + 21, y + 4, 4), 'motion-f-gold motion-thin motion-spark', delay(d))
        ]));
        count += 1;
      }
    });
    return svgRoot(120, 82, kids);
  }

  /* ================= 6. GALLERY: slow film strip marquee, twinkling sparkles ================= */
  function buildGallery() {
    var holes = '';
    var frames = [];
    for (var i = 0; i < 12; i++) {
      var x = i * 20;
      frames.push(pen(rect(x + 3, 14, 14, 20, 0.4), 'motion-f-soft motion-thin'));
      if (i % 2 === 0) frames.push(pen(star4(x + 10, 24, 3.5), 'motion-f-gold motion-nostroke'));
      holes += rect(x + 4, 7, 4, 3, 0.2) + rect(x + 12, 7, 4, 3, 0.2) + rect(x + 4, 38, 4, 3, 0.2) + rect(x + 12, 38, 4, 3, 0.2);
    }
    var band = grp('motion-marquee', [pen(rect(-4, 4, 248, 40, 0.6), 'motion-f-ink motion-nostroke'), pen(holes, 'motion-f-paper motion-nostroke')].concat(frames));
    var sparks = [[16, 56, 5, 0], [58, 54, 4, 0.7], [104, 58, 5, 1.4], [142, 55, 4, 2.1]].map(function (s) {
      return pen(star4(s[0], s[1], s[2]), 'motion-f-gold motion-twinkle motion-thin', delay(s[3]) + ';transform-origin:' + s[0] + 'px ' + s[1] + 'px;transform-box:view-box');
    });
    return svgRoot(160, 64, [band].concat(sparks));
  }

  /* ================= 7. WHERE: dropping map pin, ripples, swinging now open sign ================= */
  function buildWhere() {
    var sign = el('text', { x: 105, y: 38, 'text-anchor': 'middle', 'class': 'motion-sign-text' });
    sign.textContent = 'now open';
    return svgRoot(130, 84, [
      pen('M6 74Q28 68 48 74T92 74T124 72', 'motion-thin motion-faint'),
      pen('M16 30L38 24L60 32L82 22', 'motion-thin motion-faint motion-dash'),
      pen('M60 58m-6 0a6 2.4 0 1 0 12 0a6 2.4 0 1 0 -12 0', 'motion-ripple-ring motion-thin', delay(0) + ';transform-origin:60px 58px;transform-box:view-box'),
      pen('M60 58m-6 0a6 2.4 0 1 0 12 0a6 2.4 0 1 0 -12 0', 'motion-ripple-ring motion-thin motion-x', delay(0.9) + ';transform-origin:60px 58px;transform-box:view-box'),
      pen('M60 58m-6 0a6 2.4 0 1 0 12 0a6 2.4 0 1 0 -12 0', 'motion-ripple-ring motion-thin', delay(1.8) + ';transform-origin:60px 58px;transform-box:view-box'),
      grp('motion-pin', [
        pen('M60 58C44 40 46 14 60 14C74 14 76 40 60 58Z', 'motion-f-ink'),
        pen(circle(60, 30, 6), 'motion-f-paper motion-thin')
      ]),
      pen('M96 4L96 18M114 4L114 18', 'motion-thin'),
      grp('motion-sign', [pen('M92 18L96 18M114 18L118 18', 'motion-thin'), pen(rect(86, 18, 38, 26, 0.5), 'motion-f-gold'), sign, pen(star4(92, 50, 3), 'motion-f-gold motion-thin motion-x')],
        { style: 'transform-origin:105px 4px;transform-box:view-box' })
    ]);
  }

  /* ================= 8. EVENTS: confetti, balloon, ring, camera flash sparkles ================= */
  function buildEvents() {
    var bits = [
      [30, 10, 'rect', 'motion-f-gold'], [58, 22, 'tri', 'motion-f-ink'], [86, 8, 'rect', 'motion-f-soft'],
      [112, 26, 'tri', 'motion-f-gold'], [138, 10, 'rect', 'motion-f-ink'], [48, 52, 'tri', 'motion-f-soft'],
      [100, 54, 'rect', 'motion-f-gold'], [128, 52, 'tri', 'motion-f-soft']
    ].map(function (b, i) {
      var d = b[2] === 'rect' ? rect(b[0], b[1], 7, 4, 0.3) : poly([[b[0], b[1] + 6], [b[0] + 4, b[1]], [b[0] + 8, b[1] + 6]], true, 0.3);
      return pen(d, 'motion-confetti motion-thin ' + b[3] + (i > 3 ? ' motion-x' : ''), delay(f(i * 0.45)) + ';transform-origin:' + (b[0] + 4) + 'px ' + (b[1] + 3) + 'px;transform-box:view-box');
    });
    return svgRoot(160, 76, bits.concat([
      grp('motion-float', [
        pen('M16 6C4 6 3 30 16 34C29 30 28 6 16 6Z', 'motion-f-ink'),
        pen('M13 35L19 35L16 38Z', 'motion-f-ink motion-thin'),
        pen('M16 38Q10 50 17 58T14 74', 'motion-thin')
      ]),
      grp('motion-float motion-float--b', [
        pen(circle(70, 50, 11), 'motion-thick'), pen(circle(84, 50, 11), 'motion-thick'),
        pen('M74 36L77 30L80 36L77 40Z', 'motion-f-gold')
      ]),
      pen(star4(124, 36, 9), 'motion-f-gold motion-twinkle motion-thin', delay(0.4) + ';transform-origin:124px 36px;transform-box:view-box'),
      pen(star4(146, 58, 6), 'motion-f-paper motion-twinkle motion-thin', delay(1.1) + ';transform-origin:146px 58px;transform-box:view-box'),
      pen(rays(124, 36, 12, 16, 8), 'motion-gold motion-twinkle', delay(0.4) + ';transform-origin:124px 36px;transform-box:view-box')
    ]));
  }

  /* ================= 9. PROCESS: marching dashed trail, pen check marks ================= */
  function buildProcess() {
    var kids = [pen('M30 40C44 38 50 24 62 22M80 22C94 24 100 38 112 40', 'motion-thin motion-trail')];
    [[18, 42], [70, 22], [124, 42]].forEach(function (c, i) {
      kids.push(pen(circle(c[0], c[1], 11), 'motion-f-paper'));
      kids.push(pen('M' + (c[0] - 5) + ' ' + c[1] + 'L' + (c[0] - 1) + ' ' + (c[1] + 5) + 'L' + (c[0] + 6) + ' ' + (c[1] - 5), 'motion-check motion-gold motion-thick', delay(f(i * 1.6))));
    });
    kids.push(pen(star4(44, 8, 4), 'motion-f-gold motion-thin motion-x'));
    return svgRoot(142, 62, kids);
  }

  /* ================= 10. FAQ: wiggling scribble question mark, curtain that parts ================= */
  function buildFaq() {
    return svgRoot(120, 80, [
      grp('motion-wiggle', [
        pen('M20 24C18 6 52 4 52 24C52 38 34 40 34 54', 'motion-thick'),
        pen(circle(34, 68, 3), 'motion-f-ink')
      ], { style: 'transform-origin:34px 70px;transform-box:view-box' }),
      pen(rect(68, 10, 46, 58, 0.7), 'motion-f-paper'),
      pen(star4(91, 38, 9), 'motion-f-gold motion-thin'),
      grp('motion-curtain motion-curtain--l', [pen(rect(68, 10, 25, 58, 0.5), 'motion-f-ink motion-thin'), pen('M76 12Q80 38 76 66M84 12Q88 38 84 66', 'motion-cream motion-thin motion-faint')],
        { style: 'transform-origin:68px 10px;transform-box:view-box' }),
      grp('motion-curtain motion-curtain--r', [pen(rect(89, 10, 25, 58, 0.5), 'motion-f-ink motion-thin'), pen('M97 12Q101 38 97 66M105 12Q109 38 105 66', 'motion-cream motion-thin motion-faint')],
        { style: 'transform-origin:114px 10px;transform-box:view-box' }),
      pen(line(64, 72, 118, 72, 0.6), 'motion-thin')
    ]);
  }

  /* ================= 11. INQUIRY: looping paper plane doodle ================= */
  var PLANE_TRAIL = 'M8 62C28 72 42 44 30 40C20 36 22 58 46 54C72 50 82 26 112 14';
  function buildInquiry() {
    return svgRoot(120, 80, [
      pen(PLANE_TRAIL, 'motion-trail motion-thin motion-trail--draw'),
      grp('motion-plane', [
        pen('M-8 -2L9 -8L-2 8L-3 2Z', 'motion-f-paper'),
        pen('M-3 2L9 -8', 'motion-thin'),
        pen('M-8 -2L-3 2', 'motion-thin motion-gold')
      ]),
      pen(star4(104, 36, 4), 'motion-f-gold motion-thin motion-twinkle', delay(0.6) + ';transform-origin:104px 36px;transform-box:view-box'),
      pen(star4(14, 20, 3.5), 'motion-f-gold motion-thin motion-twinkle motion-x', delay(1.2) + ';transform-origin:14px 20px;transform-box:view-box')
    ]);
  }

  /* ================= 12. FOOTER: waving ink flourish, tiny strip printing the contact line ================= */
  function buildFooter() {
    return svgRoot(170, 70, [
      grp('motion-wave', [
        pen('M6 44C26 8 56 6 60 30C64 54 28 56 36 34C44 12 92 16 118 38C132 48 142 40 150 30', 'motion-thick motion-flourish'),
        pen('M148 28Q154 24 156 18', 'motion-thin motion-gold')
      ], { style: 'transform-origin:6px 44px;transform-box:view-box' }),
      grp('motion-ministrip', [
        pen(rect(130, 48, 34, 20, 0.5), 'motion-f-paper motion-thin'),
        pen(line(134, 54, 160, 54, 0.3) + line(134, 59, 152, 59, 0.3) + line(134, 64, 157, 64, 0.3), 'motion-thin motion-gold')
      ], { style: 'transform-origin:130px 48px;transform-box:view-box' })
    ]);
  }

  /* ---------- mounting ---------- */
  /* ar = height / width of the viewBox, mw = target width on desktop */
  var PLAN = [
    { sel: '#hero', build: buildHero, pos: 'hero', mw: '9rem', ar: 130 / 120 },
    { sel: '#about', build: buildAbout, pos: 'tr', mw: '9rem', ar: 80 / 120 },
    { sel: '#packages', build: buildPackages, pos: 'bl', mw: '8rem', ar: 84 / 120 },
    { sel: '#included', build: buildIncluded, pos: 'br', mw: '8.5rem', ar: 84 / 120 },
    { sel: '#layouts', build: buildLayouts, pos: 'tl', mw: '8rem', ar: 82 / 120 },
    { sel: '#gallery', build: buildGallery, pos: 'tr', mw: '11rem', ar: 64 / 160 },
    { sel: '#events', build: buildEvents, pos: 'br', mw: '11rem', ar: 76 / 160 },
    { sel: '#where', build: buildWhere, pos: 'tr', mw: '9rem', ar: 84 / 130 },
    { sel: '#process', build: buildProcess, pos: 'br', mw: '10rem', ar: 62 / 142 },
    { sel: '#faq', build: buildFaq, pos: 'tr', mw: '8rem', ar: 80 / 120 },
    { sel: '#inquiry', build: buildInquiry, pos: 'tl', mw: '8rem', ar: 80 / 120 },
    { sel: '.site-footer', build: buildFooter, pos: 'tr', mw: '11rem', ar: 70 / 170 }
  ];

  function mountOne(plan) {
    var host = document.querySelector(plan.sel);
    if (!host || host.querySelector(':scope > .motion')) return null;
    var wrapper = document.createElement('div');
    wrapper.className = 'motion';
    wrapper.setAttribute('aria-hidden', 'true');
    var art = document.createElement('div');
    art.className = 'motion__art';
    art.setAttribute('data-pos', plan.pos);
    art.style.setProperty('--mw', plan.mw);
    art.style.setProperty('--ar', String(f(plan.ar * 100) / 100));
    art.appendChild(plan.build());
    wrapper.appendChild(art);
    host.classList.add('has-motion');
    host.insertBefore(wrapper, host.firstChild);
    return { host: host, box: wrapper, art: art };
  }

  function bindFaqCurtain(box) {
    var list = document.querySelector('[data-faq]');
    if (!list) return;
    function sync() { box.classList.toggle('is-open', !!list.querySelector('details[open]')); }
    list.addEventListener('toggle', sync, true);
    sync();
  }

  function addShutterRing() {
    var btn = document.getElementById('form-submit');
    if (!btn || btn.querySelector('.motion-shutter')) return null;
    var ring = document.createElement('span');
    ring.className = 'motion-shutter';
    ring.setAttribute('aria-hidden', 'true');
    ring.appendChild(document.createElement('i'));
    btn.classList.add('motion-host');
    btn.appendChild(ring);
    return ring;
  }

  function init() {
    var mounted = PLAN.map(mountOne).filter(Boolean);
    if (!mounted.length) return;
    var faq = mounted.filter(function (m) { return m.host.id === 'faq'; })[0];
    if (faq) bindFaqCurtain(faq.box);
    var ring = addShutterRing();
    document.documentElement.classList.add('motion-ready');
    if (!('IntersectionObserver' in window)) {
      mounted.forEach(function (m) { m.box.classList.add('is-live'); });
      if (ring) ring.classList.add('is-live');
      return;
    }
    /* Watch the art itself (a small corner box), not the tall section host, so loops stop once it scrolls away. */
    var lookup = new Map(mounted.map(function (m) { return [m.art, m]; }));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (ring && entry.target === ring) { ring.classList.toggle('is-live', entry.isIntersecting); return; }
        var m = lookup.get(entry.target);
        if (m) m.box.classList.toggle('is-live', entry.isIntersecting);
      });
    }, { rootMargin: '60px 0px 60px 0px', threshold: 0 });
    mounted.forEach(function (m) { io.observe(m.art); });
    if (ring) io.observe(ring);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
