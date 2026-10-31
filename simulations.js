/* Simulations: (1) SDOF frame, (2) resonance curves, (3) shear-building mode shapes */
(function () {
  'use strict';
  var DL = window.DL;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = DL.fmt, css = DL.css;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  DL.bindRanges();

  /* ================= Simulation 1: SDOF frame ================= */
  var s1 = { mode: 'free', playing: !reduce, t: 0, data: null };

  function params1() {
    return {
      m: +$('m').value * 1000, k: +$('k').value * 1000, xi: +$('xi').value / 100,
      u0: +$('u0').value / 1000, p0: +$('p0').value * 1000, r: +$('r').value
    };
  }

  function dafOf(r, xi) { return 1 / Math.sqrt((1 - r * r) * (1 - r * r) + (2 * xi * r) * (2 * xi * r)); }
  function thetaOf(r, xi) { return Math.atan2(2 * xi * r, 1 - r * r) * 180 / Math.PI; }

  function simulate1() {
    var P = params1(), forced = s1.mode === 'forced';
    var wn = Math.sqrt(P.k / P.m), T = 2 * Math.PI / wn, wf = P.r * wn, c = 2 * P.xi * P.m * wn;
    var tEnd = Math.max(10 * T, 1.5), dt = T / 400, n = Math.ceil(tEnd / dt);
    var t = new Array(n + 1), u = new Array(n + 1), F = new Array(n + 1);
    var x = forced ? 0 : P.u0, v = 0, maxAbs = 0;
    var acc = function (tt, xx, vv) { return ((forced ? P.p0 * Math.sin(wf * tt) : 0) - c * vv - P.k * xx) / P.m; };
    for (var i = 0; i <= n; i++) {
      var tt = i * dt;
      t[i] = tt; u[i] = x; F[i] = forced ? P.p0 * Math.sin(wf * tt) : 0;
      if (Math.abs(x) > maxAbs) maxAbs = Math.abs(x);
      if (i === n) break;
      var k1x = v, k1v = acc(tt, x, v);
      var k2x = v + 0.5 * dt * k1v, k2v = acc(tt + dt / 2, x + 0.5 * dt * k1x, v + 0.5 * dt * k1v);
      var k3x = v + 0.5 * dt * k2v, k3v = acc(tt + dt / 2, x + 0.5 * dt * k2x, v + 0.5 * dt * k2v);
      var k4x = v + dt * k3v, k4v = acc(tt + dt, x + dt * k3x, v + dt * k3v);
      x += dt / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
      v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    var step = Math.max(1, Math.floor(n / 1500)), tp = [], up = [];
    for (var j = 0; j <= n; j += step) { tp.push(t[j]); up.push(u[j] * 1000); }
    var D = dafOf(P.r, P.xi), amp = D * P.p0 / P.k;
    s1.data = { t: t, u: u, F: F, dt: dt, n: n, tEnd: tEnd, wn: wn, T: T, P: P, forced: forced, maxAbs: maxAbs, tp: tp, up: up, D: D, amp: amp };
    if (s1.t > tEnd) s1.t = 0;

    $('roWn').textContent = fmt(wn, 4) + ' rad/s';
    $('roFn').textContent = fmt(wn / (2 * Math.PI), 4) + ' Hz';
    $('roT').textContent = fmt(T, 4) + ' s';
    $('roWd').textContent = fmt(wn * Math.sqrt(1 - P.xi * P.xi), 4) + ' rad/s';
    $('roDafBox').hidden = !forced;
    $('roAmpBox').hidden = !forced;
    if (forced) {
      $('roDaf').textContent = isFinite(D) ? fmt(D, 4) : '∞';
      $('roAmp').textContent = isFinite(amp) ? fmt(amp * 1000, 4) + ' mm' : '∞';
    }
  }

  function drawFrame1() {
    var d = s1.data; if (!d) return;
    var S = DL.setupCanvas($('frameCanvas'), 200), ctx = S.ctx, w = S.w, h = S.h;
    var ink = css('--ink'), accent = css('--accent'), teal = css('--teal'), muted = css('--muted'), soft = css('--soft');
    var i = Math.min(d.n, Math.floor(s1.t / d.dt));
    var scale = d.maxAbs > 0 ? (w * 0.26) / d.maxAbs : 0;
    var dx = d.u[i] * scale;
    var ground = h - 26, deckY = ground - 110, cx = w / 2, half = Math.min(80, w * 0.17);

    ctx.fillStyle = soft; ctx.fillRect(0, ground, w, h - ground);
    ctx.strokeStyle = muted; ctx.lineWidth = 1.5;
    for (var g = -2; g < w / 14 + 2; g++) { ctx.beginPath(); ctx.moveTo(g * 14, h); ctx.lineTo(g * 14 + 14, ground); ctx.stroke(); }

    ctx.globalAlpha = .2; ctx.fillStyle = ink;
    ctx.fillRect(cx - half - 16, deckY - 14, 2 * half + 32, 14);
    ctx.globalAlpha = 1;

    ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = ink;
    [-half, half].forEach(function (off) {
      ctx.beginPath(); ctx.moveTo(cx + off, ground); ctx.lineTo(cx + off + dx, deckY); ctx.stroke();
    });
    ctx.fillStyle = accent;
    ctx.fillRect(cx - half - 16 + dx, deckY - 14, 2 * half + 32, 14);

    if (d.forced && d.P.p0 > 0) {
      var L = 80 * d.F[i] / d.P.p0, y = deckY - 36, xm = cx + dx;
      if (Math.abs(L) > 3) {
        var x1 = xm - L / 2, x2 = xm + L / 2, sgn = L > 0 ? 1 : -1;
        ctx.strokeStyle = teal; ctx.fillStyle = teal; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - sgn * 9, y - 6); ctx.lineTo(x2 - sgn * 9, y + 6); ctx.closePath(); ctx.fill();
      }
    }
    ctx.fillStyle = muted; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('t = ' + fmt(s1.t, 3) + ' s   u = ' + fmt(d.u[i] * 1000, 3) + ' mm', 12, 20);
  }

  function drawHist1() {
    var d = s1.data; if (!d) return;
    var i = Math.min(d.n, Math.floor(s1.t / d.dt));
    var series = [{ x: d.tp, y: d.up, color: css('--c1'), width: 2 }];
    if (d.forced && isFinite(d.amp) && d.amp * 1000 <= 1.3 * d.maxAbs * 1000 && d.amp > 0) {
      series.push({ x: [0, d.tEnd], y: [d.amp * 1000, d.amp * 1000], color: css('--c2'), dash: [6, 4], width: 1.5, label: 'steady-state amplitude' });
      series.push({ x: [0, d.tEnd], y: [-d.amp * 1000, -d.amp * 1000], color: css('--c2'), dash: [6, 4], width: 1.5 });
    }
    DL.drawChart($('histCanvas'), {
      series: series, xlabel: 'Time (s)', ylabel: 'Displacement (mm)', yzero: true, xmin: 0, xmax: d.tEnd,
      markers: [{ x: d.t[i], y: d.u[i] * 1000 }], vlines: [{ x: d.t[i], color: css('--muted'), dash: [3, 4] }]
    });
  }

  function setMode1(mode) {
    s1.mode = mode;
    $('modeFree').setAttribute('aria-pressed', String(mode === 'free'));
    $('modeForced').setAttribute('aria-pressed', String(mode === 'forced'));
    $('freeFields').hidden = mode !== 'free';
    $('forcedFields').hidden = mode !== 'forced';
    s1.t = 0;
    simulate1(); render1();
  }
  function render1() { drawFrame1(); drawHist1(); }
  function syncPlayLabels() {
    $('playBtn').textContent = s1.playing ? 'Pause' : 'Play';
    $('play3').textContent = s3.playing ? 'Pause' : 'Play';
  }

  $('modeFree').addEventListener('click', function () { setMode1('free'); });
  $('modeForced').addEventListener('click', function () { setMode1('forced'); });
  ['m', 'k', 'xi', 'u0', 'p0', 'r'].forEach(function (id) {
    $(id).addEventListener('input', function () { s1.t = 0; simulate1(); render1(); });
  });
  $('playBtn').addEventListener('click', function () { s1.playing = !s1.playing; syncPlayLabels(); });
  $('restartBtn').addEventListener('click', function () { s1.t = 0; render1(); });

  /* ================= Simulation 2: resonance curves ================= */
  var refXi = [0.05, 0.1, 0.2, 0.5, 1.0];

  function render2() {
    var xi = +$('xi2').value / 100, r0 = +$('r2').value;
    var rs = [], i;
    for (i = 0; i <= 300; i++) rs.push(i / 100);
    var peakR = xi < Math.SQRT1_2 ? Math.sqrt(1 - 2 * xi * xi) : 0;
    var peakD = xi < Math.SQRT1_2 ? 1 / (2 * xi * Math.sqrt(1 - xi * xi)) : 1;
    $('ro2D').textContent = fmt(dafOf(r0, xi), 4);
    $('ro2th').textContent = fmt(thetaOf(r0, xi), 4) + '°';
    $('ro2pk').textContent = fmt(peakD, 4);
    $('ro2rp').textContent = fmt(peakR, 3);

    var colors = ['--c2', '--c3', '--c4', '--c5', '--muted'];
    var dS = [], pS = [];
    refXi.forEach(function (x, idx) {
      dS.push({ x: rs, y: rs.map(function (r) { return dafOf(r, x); }), color: css(colors[idx]), width: 1.5, label: 'ξ = ' + Math.round(x * 100) + '%' });
      pS.push({ x: rs, y: rs.map(function (r) { return thetaOf(r, x); }), color: css(colors[idx]), width: 1.5 });
    });
    dS.push({ x: rs, y: rs.map(function (r) { return dafOf(r, xi); }), color: css('--accent'), width: 3.5, label: 'selected ξ = ' + (+$('xi2').value) + '%' });
    pS.push({ x: rs, y: rs.map(function (r) { return thetaOf(r, xi); }), color: css('--accent'), width: 3.5 });

    DL.drawChart($('dafCanvas'), {
      series: dS, xlabel: 'Frequency ratio r = ω̄/ωₙ', ylabel: 'Amplification D', xmin: 0, xmax: 3, ymin: 0, ymax: Math.min(10, Math.max(3, peakD * 1.1)),
      markers: [{ x: r0, y: dafOf(r0, xi) }], vlines: [{ x: 1, color: css('--muted') }]
    });
    DL.drawChart($('phaseCanvas'), {
      series: pS, xlabel: 'Frequency ratio r = ω̄/ωₙ', ylabel: 'Phase lag θ (°)', xmin: 0, xmax: 3, ymin: 0, ymax: 180,
      markers: [{ x: r0, y: thetaOf(r0, xi) }], vlines: [{ x: 1, color: css('--muted') }]
    });
  }
  ['xi2', 'r2'].forEach(function (id) { $(id).addEventListener('input', render2); });

  /* ================= Simulation 3: mode shapes ================= */
  var s3 = { playing: !reduce, phase: 0, res: null, N: 3, mode: 0 };

  function compute3(rebuildSelect) {
    var N = +$('nSt').value;
    var ones = []; for (var i = 0; i < N; i++) ones.push(1);
    s3.res = DL.shearModes(ones, ones.slice());
    s3.N = N;
    if (rebuildSelect) {
      var sel = $('modeSel'), keep = Math.min(s3.mode, N - 1);
      sel.innerHTML = '';
      for (var j = 0; j < N; j++) { var o = document.createElement('option'); o.value = j; o.textContent = 'Mode ' + (j + 1); sel.appendChild(o); }
      sel.value = keep; s3.mode = keep;
    }
    var r = s3.res, md = s3.mode;
    $('ro3w').textContent = fmt(r.omega[md], 4);
    $('ro3r').textContent = fmt(r.omega[md] / r.omega[0], 4);
    $('ro3g').textContent = fmt(r.gamma[md], 4);
    $('ro3m').textContent = fmt(r.massRatio[md] * 100, 3) + '%';
  }

  function render3() {
    var r = s3.res; if (!r) return;
    var N = s3.N, md = s3.mode, phi = r.modes[md];
    var S = DL.setupCanvas($('modeCanvas'), 360), ctx = S.ctx, w = S.w, h = S.h;
    var ink = css('--ink'), accent = css('--accent'), teal = css('--teal'), muted = css('--muted'), soft = css('--soft');
    var ground = h - 30, sh = Math.min(48, (h - 70) / N), cx = w / 2, half = Math.min(70, w * 0.14);
    var maxAbs = Math.max.apply(null, phi.map(Math.abs));
    var A = (+$('amp3').value / 100) * Math.min(w * 0.3, 150) / maxAbs;
    var s = Math.sin(s3.phase);
    var xs = [cx].concat(phi.map(function (p) { return cx + A * p * s; }));

    ctx.fillStyle = soft; ctx.fillRect(0, ground, w, h - ground);
    ctx.strokeStyle = muted; ctx.lineWidth = 1.5;
    for (var g = -2; g < w / 14 + 2; g++) { ctx.beginPath(); ctx.moveTo(g * 14, h); ctx.lineTo(g * 14 + 14, ground); ctx.stroke(); }

    ctx.globalAlpha = .18; ctx.fillStyle = ink;
    for (var q = 1; q <= N; q++) ctx.fillRect(cx - half - 12, ground - q * sh - 10, 2 * half + 24, 10);
    ctx.globalAlpha = 1;

    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = ink;
    [-half, half].forEach(function (off) {
      ctx.beginPath(); ctx.moveTo(xs[0] + off, ground);
      for (var k = 1; k <= N; k++) ctx.lineTo(xs[k] + off, ground - k * sh);
      ctx.stroke();
    });
    for (var k2 = 1; k2 <= N; k2++) {
      ctx.fillStyle = phi[k2 - 1] >= 0 ? accent : teal;
      ctx.fillRect(xs[k2] - half - 12, ground - k2 * sh - 10, 2 * half + 24, 10);
    }
    ctx.fillStyle = muted; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Mode ' + (md + 1) + ' of ' + N + '  (orange = moves with the roof, teal = opposite)', 12, 20);

    var shapeX = [0].concat(phi), shapeY = [];
    for (var y = 0; y <= N; y++) shapeY.push(y);
    var mins = Math.min.apply(null, shapeX), maxs = Math.max.apply(null, shapeX);
    var markers = []; for (var z = 1; z <= N; z++) markers.push({ x: phi[z - 1], y: z, color: css('--accent') });
    DL.drawChart($('shapeCanvas'), {
      series: [{ x: shapeX, y: shapeY, color: css('--c2'), width: 2.5 }],
      xlabel: 'Modal displacement (roof = 1)', ylabel: 'Storey level',
      xmin: Math.min(-0.2, mins - 0.2), xmax: Math.max(1.2, maxs + 0.2), ymin: 0, ymax: N + 0.3,
      markers: markers, vlines: [{ x: 0, color: css('--muted'), dash: [3, 4] }]
    });
  }

  $('nSt').addEventListener('change', function () { compute3(true); render3(); });
  $('modeSel').addEventListener('change', function () { s3.mode = +$('modeSel').value; compute3(false); render3(); });
  $('amp3').addEventListener('input', render3);
  $('play3').addEventListener('click', function () { s3.playing = !s3.playing; syncPlayLabels(); });

  /* ================= animation loop ================= */
  var last = performance.now();
  function tick(now) {
    var dtReal = Math.min((now - last) / 1000, 0.1); last = now;
    if (s1.playing && s1.data) {
      s1.t += dtReal * (+$('speed').value);
      if (s1.t > s1.data.tEnd) s1.t = 0;
      render1();
    }
    if (s3.playing && s3.res) {
      var ratio = s3.res.omega[s3.mode] / s3.res.omega[0];
      s3.phase += 2 * Math.PI * Math.min(0.3 * ratio, 3) * dtReal;
      render3();
    }
    requestAnimationFrame(tick);
  }

  function renderAll() { render1(); render2(); render3(); }
  DL.onResize(renderAll);

  setMode1('free');
  render2();
  compute3(true);
  render3();
  syncPlayLabels();
  requestAnimationFrame(tick);
})();
