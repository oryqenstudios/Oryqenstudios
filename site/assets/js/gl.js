/* ORYQEN STUDIOS — WebGL particle form (no library).
   <canvas class="gl" data-gl="orb">   home hero: a breathing particle sphere that follows the cursor
                                       and dissolves into a wave field as the visitor scrolls.
   <canvas class="gl" data-gl="field"> inner page headers: the wave field only. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VERT = [
    'attribute vec3 aPos;',
    'attribute vec3 aRnd;',
    'uniform float uTime, uMorph, uAspect, uDpr, uSize, uScale, uReveal;',
    'uniform vec2 uRot, uMouse, uOffset;',
    'varying float vAlpha;',
    'varying float vMix;',
    'mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }',
    'float wave(vec3 p, float t){',
    '  return sin(p.x * 2.3 + t * 0.9) * sin(p.y * 2.9 - t * 0.7) * sin(p.z * 2.1 + t * 1.1)',
    '       + 0.5 * sin(p.x * 5.1 - t * 1.3 + p.y * 4.3) * cos(p.z * 4.7 + t * 0.8);',
    '}',
    'void main(){',
    '  float t = uTime;',
    '  vec3 n = aPos;',
    '  float d = wave(n, t * 0.35);',
    '  vec3 orb = n * (1.0 + 0.17 * d + (aRnd.x - 0.5) * 0.05);',
    '  orb = mix(n * (2.4 + aRnd.z * 2.6), orb, uReveal);',
    '  float k = 1.0 - uMorph;',
    '  orb.xz = rot(uRot.x + t * 0.07) * orb.xz;',
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
    '  gl_Position = vec4(ndc, 0.0, 1.0);',
    '  if (w < 0.35) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);',
    '  gl_PointSize = uSize * uDpr * (0.55 + aRnd.z) / w * (1.0 + push * 1.6);',
    '  float aOrb = (0.18 + 0.82 * smoothstep(-1.2, 1.2, p.z)) * uReveal;',
    '  float aField = smoothstep(9.0, 2.0, w) * smoothstep(0.35, 1.4, w) * 0.75;',
    '  vAlpha = mix(aOrb, aField, uMorph) + push * 0.5;',
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
    var N = mode === 'orb' ? (small ? 16000 : 44000) : (small ? 7000 : 16000);
    var pos = new Float32Array(N * 3), rnd = new Float32Array(N * 3);
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
      pos[i * 3] = Math.cos(th) * r; pos[i * 3 + 1] = y; pos[i * 3 + 2] = Math.sin(th) * r;
      rnd[i * 3] = Math.random(); rnd[i * 3 + 1] = Math.random(); rnd[i * 3 + 2] = Math.random();
    }
    function attr(name, data) {
      var b = gl.createBuffer(), loc = gl.getAttribLocation(prog, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    }
    attr('aPos', pos); attr('aRnd', rnd);

    var U = {};
    ['uTime', 'uMorph', 'uAspect', 'uDpr', 'uSize', 'uScale', 'uReveal', 'uRot', 'uMouse', 'uOffset', 'uColA', 'uColB', 'uGain']
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
      gl.uniform1f(U.uScale, wide ? 1.0 : Math.min(1, aspect * 1.25));
      gl.uniform2f(U.uOffset, wide ? 0.4 : 0.0, wide ? 0.06 : 0.34);
      gl.uniform1f(U.uGain, mode === 'orb' ? (wide ? 0.62 : 0.5) : 0.42);
    }

    var mouse = { x: 0.4, y: 0.1, tx: 0.4, ty: 0.1, active: false };
    var rot = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      if (e.clientY < r.top - 100 || e.clientY > r.bottom + 100) { mouse.active = false; return; }
      mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
      mouse.active = true;
    }, { passive: true });

    var reveal = mode === 'orb' ? 0 : 1, revealOn = mode !== 'orb' || reduce, morph = mode === 'orb' ? 0 : 1;
    document.addEventListener('oryqen:ready', function () { revealOn = true; });
    setTimeout(function () { revealOn = true; }, 3500);
    if (reduce) reveal = 1;

    var visible = true, raf = 0, start = performance.now(), last = start;
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      var t = (now - start) / 1000;
      mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 5);
      mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 5);
      rot.x += (mouse.x * 0.55 - rot.x) * Math.min(1, dt * 2.2);
      rot.y += (-mouse.y * 0.35 - rot.y) * Math.min(1, dt * 2.2);
      if (revealOn && reveal < 1) reveal = Math.min(1, reveal + dt * 0.55);
      if (mode === 'orb') {
        var r = host.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, -r.top / (r.height * 0.85)));
        morph += (p * p * (3 - 2 * p) - morph) * Math.min(1, dt * 6);
      }
      var e = 1 - Math.pow(1 - reveal, 3);
      gl.uniform1f(U.uTime, t);
      gl.uniform1f(U.uMorph, morph);
      gl.uniform1f(U.uReveal, e);
      gl.uniform2f(U.uRot, rot.x, rot.y);
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
