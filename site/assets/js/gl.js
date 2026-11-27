/* ORYQEN STUDIOS — WebGL particle hero (no library).
   <canvas class="gl" data-gl="orb">   home hero: tens of thousands of particles that assemble, in turn, into
                                       an idea (sphere), a desktop website, a mobile screen and the Oryqen ring.
                                       Follows the cursor, can be dragged and pulsed, and dissolves into a wave
                                       field on scroll. Buttons with [data-shape="0..3"] jump between forms.
   <canvas class="gl" data-gl="field"> inner page headers: the wave field only. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = [
    'attribute vec3 aFrom;',
    'attribute vec3 aTo;',
    'attribute vec3 aRnd;',
    'uniform float uTime, uMorph, uAspect, uDpr, uSize, uScale, uReveal, uMix, uWobFrom, uWobTo, uSpin;',
    'uniform vec2 uRot, uMouse, uOffset;',
    'uniform vec3 uPulse;',
    'varying float vAlpha;',
    'varying float vMix;',
    'mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }',
    'float wave(vec3 p, float t){',
    '  return sin(p.x * 2.3 + t * 0.9) * sin(p.y * 2.9 - t * 0.7) * sin(p.z * 2.1 + t * 1.1)',
    '       + 0.5 * sin(p.x * 5.1 - t * 1.3 + p.y * 4.3) * cos(p.z * 4.7 + t * 0.8);',
    '}',
    'void main(){',
    '  float t = uTime;',
    // each particle leaves and arrives at its own moment, so forms dissolve and re-assemble
    '  float m = clamp(uMix * 1.7 - aRnd.x * 0.7, 0.0, 1.0);',
    '  m = m * m * (3.0 - 2.0 * m);',
    '  float arc = sin(m * 3.14159);',
    '  vec3 base = mix(aFrom, aTo, m);',
    '  base.xy = rot(arc * (0.35 + aRnd.y) * 1.1) * base.xy;',
    '  base += (aRnd - 0.5) * arc * 1.1;',
    '  float d = wave(base, t * 0.35);',
    '  vec3 orb = base * (1.0 + mix(uWobFrom, uWobTo, m) * d);',
    '  orb.z += (aRnd.x - 0.5) * 0.05;',
    '  orb = mix(normalize(base + 0.0001) * (2.4 + aRnd.z * 2.6), orb, uReveal);',
    '  float k = 1.0 - uMorph;',
    '  orb.xz = rot(uRot.x + uSpin) * orb.xz;',
    '  orb.yz = rot(uRot.y) * orb.yz;',
    '  orb *= uScale;',
    '  vec2 g = (aRnd.xy - 0.5) * vec2(11.0, 8.0);',
    '  float h = sin(g.x * 0.9 + t * 0.5) * 0.26 + sin(g.y * 1.3 - t * 0.4 + g.x * 0.4) * 0.2;',
    '  vec3 field = vec3(g.x, h - 1.25, g.y - 1.6);',
    '  vec3 p = mix(orb, field, uMorph);',
    '  float w = 3.6 - p.z;',
    '  float f = 1.9;',
    '  vec2 ndc = vec2(p.x * f / uAspect, p.y * f) / max(w, 0.001) + uOffset * k;',
    '  vec2 dm = (ndc - uMouse) * vec2(uAspect, 1.0);',
    '  float dist = length(dm);',
    '  float push = smoothstep(0.42, 0.0, dist);',
    '  ndc += (dm / max(dist, 0.0001)) * push * 0.075 / vec2(uAspect, 1.0);',
    '  vec2 dp = (ndc - uPulse.xy) * vec2(uAspect, 1.0);',
    '  float dl = length(dp);',
    '  float ring = smoothstep(0.17, 0.0, abs(dl - uPulse.z * 1.8)) * (1.0 - uPulse.z);',
    '  ndc += (dp / max(dl, 0.0001)) * ring * 0.12 / vec2(uAspect, 1.0);',
    '  push = max(push, ring);',
    '  gl_Position = vec4(ndc, 0.0, 1.0);',
    '  if (w < 0.35) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);',
    '  gl_PointSize = uSize * uDpr * (0.55 + aRnd.z) / w * (1.0 + push * 1.6 + arc * 0.5);',
    '  float aOrb = (0.2 + 0.8 * smoothstep(-1.2, 1.2, p.z)) * uReveal;',
    '  float aField = smoothstep(9.0, 2.0, w) * smoothstep(0.35, 1.4, w) * 0.75;',
    '  vAlpha = mix(aOrb, aField, uMorph) + push * 0.5 + arc * 0.2 * k;',
    '  vMix = clamp(0.5 + d * 0.6 + (aRnd.y - 0.5) * 0.5, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform vec3 uColA, uColB;',
    'uniform float uGain;',
    'varying float vAlpha;',
    'varying float vMix;',
    'void main(){',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.08, d) * vAlpha * uGain;',
    '  gl_FragColor = vec4(mix(uColA, uColB, vMix) * a, a);',
    '}'
  ].join('\n');

  /* ---------- particle forms ---------- */
  function sphere(N) {
    var a = new Float32Array(N * 3), golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      a[i * 3] = Math.cos(th) * r; a[i * 3 + 1] = y; a[i * 3 + 2] = Math.sin(th) * r;
    }
    return a;
  }
  function ring(N) {
    var a = new Float32Array(N * 3), R = 0.86, r = 0.27, tilt = 0.45, c = Math.cos(tilt), s = Math.sin(tilt);
    for (var i = 0; i < N; i++) {
      var u = Math.random() * Math.PI * 2, v = Math.random() * Math.PI * 2;
      var x = (R + r * Math.cos(v)) * Math.cos(u), y = (R + r * Math.cos(v)) * Math.sin(u), z = r * Math.sin(v);
      a[i * 3] = x; a[i * 3 + 1] = y * c - z * s; a[i * 3 + 2] = y * s + z * c;
    }
    return a;
  }
  // A drawing is a list of weighted primitives; points are shared out by weight.
  //   ['fill', x, y, w, h]  ['box', x, y, w, h] (outline)  ['line', x1, y1, x2, y2]  ['dot', cx, cy, r]
  function drawing(N, parts) {
    var a = new Float32Array(N * 3), total = 0, i = 0;
    parts.forEach(function (p) { total += p[0]; });
    parts.forEach(function (p, idx) {
      var n = idx === parts.length - 1 ? N - i : Math.round((p[0] / total) * N), kind = p[1];
      for (var j = 0; j < n && i < N; j++, i++) {
        var x = 0, y = 0, q = Math.random();
        if (kind === 'fill') { x = p[2] + Math.random() * p[4]; y = p[3] + Math.random() * p[5]; }
        else if (kind === 'line') { x = p[2] + (p[4] - p[2]) * q; y = p[3] + (p[5] - p[3]) * q; }
        else if (kind === 'dot') { var ang = Math.random() * 6.2832, rr = Math.sqrt(Math.random()) * p[4]; x = p[2] + Math.cos(ang) * rr; y = p[3] + Math.sin(ang) * rr; }
        else { // box outline, walked around its perimeter
          var w = p[4], h = p[5], per = q * 2 * (w + h);
          if (per < w) { x = p[2] + per; y = p[3]; }
          else if (per < w + h) { x = p[2] + w; y = p[3] + per - w; }
          else if (per < 2 * w + h) { x = p[2] + per - w - h; y = p[3] + h; }
          else { x = p[2]; y = p[3] + per - 2 * w - h; }
        }
        a[i * 3] = x + (Math.random() - 0.5) * 0.008;
        a[i * 3 + 1] = y + (Math.random() - 0.5) * 0.008;
        a[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
      }
    });
    return a;
  }
  function desktop(N) {
    return drawing(N, [
      [14, 'box', -1.15, -0.75, 2.3, 1.5],            // browser window
      [5, 'line', -1.15, 0.57, 1.15, 0.57],            // toolbar
      [1, 'dot', -1.06, 0.66, 0.024], [1, 'dot', -0.98, 0.66, 0.024], [1, 'dot', -0.9, 0.66, 0.024],
      [3, 'box', -0.5, 0.62, 1.0, 0.08],               // address bar
      [2, 'fill', -1.0, 0.41, 0.3, 0.04],              // logo
      [1, 'fill', 0.2, 0.415, 0.13, 0.028], [1, 'fill', 0.4, 0.415, 0.13, 0.028], [1, 'fill', 0.6, 0.415, 0.13, 0.028],
      [2, 'box', 0.82, 0.385, 0.2, 0.085],             // nav button
      [12, 'fill', -1.0, 0.1, 0.95, 0.12],             // headline
      [9, 'fill', -1.0, -0.08, 0.68, 0.12],
      [3, 'fill', -1.0, -0.22, 0.8, 0.03], [2, 'fill', -1.0, -0.29, 0.58, 0.03],
      [5, 'fill', -1.0, -0.5, 0.34, 0.1],              // primary button
      [3, 'box', -0.6, -0.5, 0.34, 0.1],               // secondary button
      [8, 'box', 0.15, -0.55, 0.85, 0.8],              // image
      [6, 'fill', 0.15, -0.55, 0.85, 0.8],
      [2, 'dot', 0.8, 0.07, 0.07],
      [2, 'line', 0.15, -0.42, 0.45, -0.12], [1, 'line', 0.45, -0.12, 0.6, -0.3], [2, 'line', 0.6, -0.3, 0.8, -0.1], [2, 'line', 0.8, -0.1, 1.0, -0.38]
    ]);
  }
  function mobile(N) {
    return drawing(N, [
      [14, 'box', -0.5, -0.98, 1.0, 1.96],             // handset
      [6, 'box', -0.44, -0.9, 0.88, 1.8],              // screen
      [2, 'fill', -0.14, 0.845, 0.28, 0.035],          // speaker
      [2, 'fill', -0.36, 0.69, 0.26, 0.04],            // logo
      [1, 'line', 0.24, 0.725, 0.36, 0.725], [1, 'line', 0.24, 0.695, 0.36, 0.695],
      [9, 'fill', -0.36, 0.42, 0.66, 0.11],            // headline
      [7, 'fill', -0.36, 0.27, 0.46, 0.11],
      [2, 'fill', -0.36, 0.16, 0.62, 0.028], [2, 'fill', -0.36, 0.1, 0.44, 0.028],
      [6, 'fill', -0.36, -0.09, 0.72, 0.11],           // button
      [7, 'box', -0.36, -0.64, 0.72, 0.45],            // image
      [6, 'fill', -0.36, -0.64, 0.72, 0.45],
      [2, 'fill', -0.36, -0.76, 0.5, 0.03],
      [1, 'fill', -0.12, -0.86, 0.24, 0.016]           // home bar
    ]);
  }
  // a little dust drifting around every form gives the scene depth
  function dust(arr, N, seed) {
    var start = Math.floor(N * 0.93);
    for (var i = start; i < N; i++) { arr[i * 3] = seed[i * 3]; arr[i * 3 + 1] = seed[i * 3 + 1]; arr[i * 3 + 2] = seed[i * 3 + 2]; }
    return arr;
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  function init(canvas) {
    var mode = canvas.getAttribute('data-gl') || 'orb';
    var gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) { canvas.style.display = 'none'; return; }
    var vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.style.display = 'none'; return; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.style.display = 'none'; return; }
    gl.useProgram(prog);

    var small = window.innerWidth < 800;
    var N = mode === 'orb' ? (small ? 18000 : 46000) : (small ? 7000 : 16000);
    var rnd = new Float32Array(N * 3), seed = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      rnd[i * 3] = Math.random(); rnd[i * 3 + 1] = Math.random(); rnd[i * 3 + 2] = Math.random();
      seed[i * 3] = (Math.random() - 0.5) * 5.2; seed[i * 3 + 1] = (Math.random() - 0.5) * 3.4; seed[i * 3 + 2] = -2.6 + Math.random() * 3.0;
    }
    // forms: [points, surface wobble, spins freely?]
    var forms = mode === 'orb'
      ? [[dust(sphere(N), N, seed), 0.17, true], [dust(desktop(N), N, seed), 0.012, false], [dust(mobile(N), N, seed), 0.012, false], [dust(ring(N), N, seed), 0.06, true]]
      : [[sphere(N), 0.17, true]];
    var buffers = forms.map(function (f) {
      var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, f[0], gl.STATIC_DRAW); return b;
    });
    var locFrom = gl.getAttribLocation(prog, 'aFrom'), locTo = gl.getAttribLocation(prog, 'aTo'), locRnd = gl.getAttribLocation(prog, 'aRnd');
    function point(loc, buf) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0); }
    var rndBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, rndBuf); gl.bufferData(gl.ARRAY_BUFFER, rnd, gl.STATIC_DRAW);
    point(locRnd, rndBuf); point(locFrom, buffers[0]); point(locTo, buffers[0]);

    var U = {};
    ['uTime', 'uMorph', 'uAspect', 'uDpr', 'uSize', 'uScale', 'uReveal', 'uRot', 'uMouse', 'uOffset', 'uColA', 'uColB', 'uGain', 'uPulse', 'uMix', 'uWobFrom', 'uWobTo', 'uSpin']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform3f(U.uColA, 0.42, 0.66, 0.9);   // deep ice blue
    gl.uniform3f(U.uColB, 0.93, 0.97, 1.0);   // near white
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    var host = canvas.parentElement;
    var dpr = 1, W = 1, H = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 800 ? 1.5 : 2);
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      var aspect = W / H, wide = aspect > 1.15;
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uSize, mode === 'orb' ? (wide ? 7.5 : 6.5) : 8.5);
      gl.uniform1f(U.uScale, wide ? 1.0 : Math.min(1, aspect * 1.2));
      gl.uniform2f(U.uOffset, wide ? 0.42 : 0.0, wide ? 0.06 : 0.44);
      gl.uniform1f(U.uGain, mode === 'orb' ? (wide ? 0.62 : 0.5) : 0.42);
    }

    /* ----- form sequence ----- */
    var HOLD = 3.4, MOVE = 2.1;
    var seq = { cur: 0, next: 0, mix: 0, moving: false, hold: 0, queued: -1 };
    var shapeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-shape]'));
    function mark() {
      var active = seq.moving ? seq.next : seq.cur;
      shapeBtns.forEach(function (b) {
        var on = +b.getAttribute('data-shape') === active;
        b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on));
        if (!on) b.style.setProperty('--p', 0);
      });
    }
    function begin(to) {
      if (to === seq.cur || forms.length < 2) return;
      seq.next = to; seq.mix = 0; seq.moving = true;
      point(locFrom, buffers[seq.cur]); point(locTo, buffers[to]);
      gl.uniform1f(U.uWobFrom, forms[seq.cur][1]); gl.uniform1f(U.uWobTo, forms[to][1]);
      mark();
    }
    function settle() {
      seq.cur = seq.next; seq.mix = 0; seq.moving = false; seq.hold = 0;
      point(locFrom, buffers[seq.cur]); point(locTo, buffers[seq.cur]);
      gl.uniform1f(U.uWobFrom, forms[seq.cur][1]); gl.uniform1f(U.uWobTo, forms[seq.cur][1]);
      mark();
    }
    gl.uniform1f(U.uWobFrom, forms[0][1]); gl.uniform1f(U.uWobTo, forms[0][1]);
    shapeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var to = +b.getAttribute('data-shape');
        if (reduce) { seq.next = to; settle(); kick(); return; }
        if (seq.moving) seq.queued = to; else begin(to);
        kick();
      });
    });
    mark();

    /* ----- pointer: follow, drag to turn (mouse only), click or tap to pulse ----- */
    var mouse = { x: 0.4, y: 0.1, tx: 0.4, ty: 0.1, active: false };
    var rot = { x: 0, y: 0 };
    var drag = { on: false, down: false, x: 0, y: 0, vx: 0, vy: 0, lx: 0, ly: 0, moved: 0 };
    var pulse = { x: 9, y: 9, age: 1 };
    var interactive = function (t) { return t.closest && t.closest('a, button, input, select, textarea, label, summary'); };
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      if (e.clientY < r.top - 100 || e.clientY > r.bottom + 100) mouse.active = false;
      else {
        mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
        mouse.active = true;
      }
      if (!drag.down) return;
      var dx = e.clientX - drag.lx, dy = e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.on) { drag.vx = dx * 0.006; drag.vy = dy * 0.005; drag.x += drag.vx; drag.y += drag.vy; }
    }, { passive: true });
    host.addEventListener('pointerdown', function (e) {
      if (interactive(e.target)) return;
      drag.moved = 0; drag.lx = e.clientX; drag.ly = e.clientY; drag.down = true;
      if (e.pointerType === 'mouse' && mode === 'orb') { drag.on = true; host.classList.add('is-grabbing'); }
    });
    window.addEventListener('pointerup', function (e) {
      if (!drag.down) return;
      drag.down = false; drag.on = false; host.classList.remove('is-grabbing');
      if (drag.moved < 8) {
        var r = canvas.getBoundingClientRect();
        pulse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pulse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        pulse.age = 0; kick();
      }
    });
    window.addEventListener('pointercancel', function () { drag.down = false; drag.on = false; host.classList.remove('is-grabbing'); });

    var reveal = mode === 'orb' ? 0 : 1, revealOn = mode !== 'orb' || reduce, morph = mode === 'orb' ? 0 : 1;
    document.addEventListener('oryqen:ready', function () { revealOn = true; });
    setTimeout(function () { revealOn = true; }, 3500);
    if (reduce) reveal = 1;

    var visible = true, raf = 0, start = performance.now(), last = start, spin = 0, free = 1;
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var t = (now - start) / 1000;
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 5);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 5);
      rot.x += (mouse.x * 0.5 - rot.x) * Math.min(1, dt * 2.2);
      rot.y += (-mouse.y * 0.32 - rot.y) * Math.min(1, dt * 2.2);
      if (revealOn && reveal < 1) reveal = Math.min(1, reveal + dt * 0.55);
      if (mode === 'orb') {
        var r = host.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, -r.top / (r.height * 0.85)));
        morph += (p * p * (3 - 2 * p) - morph) * Math.min(1, dt * 6);
      }

      // sequence: hold a form, then let it dissolve into the next
      if (forms.length > 1 && reveal >= 1 && !reduce) {
        if (seq.moving) {
          seq.mix = Math.min(1, seq.mix + dt / MOVE);
          if (seq.mix >= 1) { settle(); if (seq.queued > -1) { var q = seq.queued; seq.queued = -1; begin(q); } }
        } else if (morph < 0.4 && !drag.on) {
          seq.hold += dt;
          var btn = shapeBtns[seq.cur];
          if (btn) btn.style.setProperty('--p', Math.min(1, seq.hold / HOLD));
          if (seq.hold >= HOLD) begin((seq.cur + 1) % forms.length);
        }
      }
      // round forms spin freely; screens settle to face the viewer and sway
      var fromFree = forms[seq.cur][2] ? 1 : 0, toFree = forms[seq.moving ? seq.next : seq.cur][2] ? 1 : 0;
      var e2 = seq.mix * seq.mix * (3 - 2 * seq.mix);
      free = fromFree + (toFree - fromFree) * e2;
      spin += dt * 0.16;
      var wrapped = ((spin + Math.PI) % (Math.PI * 2)) - Math.PI;
      var facing = Math.sin(t * 0.55) * 0.2;
      if (!drag.on) {
        drag.x += drag.vx; drag.y += drag.vy; drag.vx *= 0.94; drag.vy *= 0.94; drag.y *= 0.985;
        if (free < 0.5) drag.x *= 0.96; // screens ease back to face the viewer
      }
      drag.y = Math.max(-1.2, Math.min(1.2, drag.y));
      if (pulse.age < 1) pulse.age = Math.min(1, pulse.age + dt * 0.85);

      var e = 1 - Math.pow(1 - reveal, 3);
      gl.uniform1f(U.uTime, t);
      gl.uniform1f(U.uMorph, morph);
      gl.uniform1f(U.uReveal, e);
      gl.uniform1f(U.uMix, seq.mix);
      gl.uniform1f(U.uSpin, wrapped * free + facing * (1 - free));
      gl.uniform3f(U.uPulse, pulse.x, pulse.y, pulse.age);
      gl.uniform2f(U.uRot, rot.x + drag.x, rot.y + drag.y);
      gl.uniform2f(U.uMouse, mouse.active ? mouse.x : 9, mouse.active ? mouse.y : 9);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, N);
      if (visible && !reduce && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    resize();
    window.addEventListener('resize', function () { resize(); kick(); });
    document.addEventListener('visibilitychange', kick);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(canvas);
    }
    kick();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll('canvas.gl'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
