/* Toolbox: SDOF properties, harmonic response, shear-building modal analysis, Newmark solver.
   Units: tonnes, kN, metres, seconds (so sqrt(k/m) is in rad/s). */
(function () {
  'use strict';
  var DL = window.DL;
  var $ = function (id) { return document.getElementById(id); };
  var fmt = DL.fmt, css = DL.css;
  var num = function (id) { return parseFloat($(id).value); };

  function readouts(el, items) {
    el.innerHTML = items.map(function (it) {
      return '<div class="readout"><small>' + it[0] + '</small><b>' + it[1] + '</b></div>';
    }).join('');
  }
  function bad(el, msg) { readouts(el, [['Check inputs', msg]]); }
  function listen(sectionId, fn) {
    document.querySelectorAll('#' + sectionId + ' input, #' + sectionId + ' select').forEach(function (e) {
      e.addEventListener('input', fn);
      e.addEventListener('change', fn);
    });
  }

  /* ---------- Tool 1: SDOF properties ---------- */
  function tool1() {
    var out = $('t1out');
    var m = num('t1m'), xi = num('t1xi') / 100, k;
    var cols = $('t1src').value === 'cols';
    $('t1kBox').hidden = cols;
    $('t1cols').hidden = !cols;
    if (cols) {
      var n = num('t1n'), E = num('t1E') * 1e9, I = num('t1I') * 1e-8, h = num('t1h'), f = +$('t1end').value;
      k = n * f * E * I / Math.pow(h, 3) / 1000; // kN/m
    } else {
      k = num('t1k');
    }
    if (!(m > 0 && k > 0 && xi >= 0 && xi < 1)) { bad(out, 'Mass and stiffness must be positive and ξ below 100%.'); return; }
    var wn = Math.sqrt(k / m), ccr = 2 * m * wn, wd = wn * Math.sqrt(1 - xi * xi);
    var delta = 2 * Math.PI * xi / Math.sqrt(1 - xi * xi);
    var items = [];
    if (cols) items.push(['Stiffness k', fmt(k, 5) + ' kN/m']);
    items.push(
      ['Natural freq. ωₙ', fmt(wn) + ' rad/s'],
      ['Frequency fₙ', fmt(wn / (2 * Math.PI)) + ' Hz'],
      ['Period Tₙ', fmt(2 * Math.PI / wn) + ' s'],
      ['Critical damping c_cr', fmt(ccr) + ' kN·s/m'],
      ['Damping c', fmt(xi * ccr) + ' kN·s/m'],
      ['Damped freq. ω_D', fmt(wd) + ' rad/s'],
      ['Log decrement δ', fmt(delta)],
      ['Peak ratio uᵢ/uᵢ₊₁', fmt(Math.exp(delta))],
      ['Cycles to halve', delta > 0 ? fmt(Math.LN2 / delta, 3) : '∞']
    );
    readouts(out, items);
  }
  listen('tool1', tool1);

  /* ---------- Tool 2: harmonic response ---------- */
  function tool2() {
    var out = $('t2out');
    var m = num('t2m'), k = num('t2k'), xi = num('t2xi') / 100, p0 = num('t2p0'), f = num('t2f');
    if (!(m > 0 && k > 0 && xi >= 0 && xi < 1 && p0 >= 0 && f >= 0)) { bad(out, 'Use positive values and ξ below 100%.'); return; }
    var wn = Math.sqrt(k / m), fn = wn / (2 * Math.PI);
    var D = function (r) { return 1 / Math.sqrt((1 - r * r) * (1 - r * r) + (2 * xi * r) * (2 * xi * r)); };
    var r = 2 * Math.PI * f / wn, d = D(r), ust = p0 / k;
    var theta = Math.atan2(2 * xi * r, 1 - r * r) * 180 / Math.PI;
    var TR = d * Math.sqrt(1 + (2 * xi * r) * (2 * xi * r));
    readouts(out, [
      ['Natural freq. fₙ', fmt(fn) + ' Hz'],
      ['Frequency ratio r', fmt(r)],
      ['Amplification D', isFinite(d) ? fmt(d) : '∞ (resonance, no damping)'],
      ['Static deflection p₀/k', fmt(ust * 1000) + ' mm'],
      ['Steady-state amplitude', isFinite(d) ? fmt(d * ust * 1000) + ' mm' : '∞'],
      ['Phase lag θ', fmt(theta) + '°'],
      ['Transmissibility TR', isFinite(TR) ? fmt(TR) : '∞'],
      ['Force to support', isFinite(TR) ? fmt(TR * p0) + ' kN' : '∞'],
      ['Isolating (r > √2)?', r > Math.SQRT2 ? 'Yes' : 'No']
    ]);
    var fmax = Math.max(3 * fn, f * 1.15), fs = [], as = [];
    for (var i = 0; i <= 300; i++) { var ff = fmax * i / 300; fs.push(ff); as.push(D(2 * Math.PI * ff / wn) * ust * 1000); }
    var yTop = ust * 1000 * Math.min(10, Math.max(3, isFinite(d) ? d * 1.15 : 10));
    DL.drawChart($('t2chart'), {
      series: [{ x: fs, y: as, color: css('--c1'), width: 2.5 }],
      xlabel: 'Forcing frequency (Hz)', ylabel: 'Amplitude (mm)', xmin: 0, xmax: fmax, ymin: 0, ymax: yTop || 1,
      markers: [{ x: f, y: isFinite(d) ? d * ust * 1000 : yTop }],
      vlines: [{ x: fn, color: css('--muted') }]
    });
  }
  listen('tool2', tool2);

  /* ---------- Tool 3: shear building modal analysis ---------- */
  var rows = [{ m: 200, k: 80000 }, { m: 200, k: 80000 }, { m: 200, k: 80000 }];

  function buildTable3() {
    var html = '<tr><th>Storey</th><th>Mass (t)</th><th>Stiffness k (kN/m)</th></tr>';
    rows.forEach(function (r, i) {
      html += '<tr><td>' + (i + 1) + '</td>' +
        '<td><input type="number" min="0" step="any" data-i="' + i + '" data-f="m" value="' + r.m + '" aria-label="Mass of storey ' + (i + 1) + '"></td>' +
        '<td><input type="number" min="0" step="any" data-i="' + i + '" data-f="k" value="' + r.k + '" aria-label="Stiffness of storey ' + (i + 1) + '"></td></tr>';
    });
    $('t3in').innerHTML = html;
    $('t3in').querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () { rows[+inp.dataset.i][inp.dataset.f] = parseFloat(inp.value); tool3(); });
    });
    $('t3rem').disabled = rows.length <= 1;
    $('t3add').disabled = rows.length >= 12;
  }

  function tool3() {
    var m = rows.map(function (r) { return r.m; }), k = rows.map(function (r) { return r.k; });
    var ok = m.every(function (x) { return x > 0; }) && k.every(function (x) { return x > 0; });
    if (!ok) { bad($('t3sum'), 'All masses and stiffnesses must be positive.'); $('t3out').innerHTML = ''; return; }
    var N = m.length, res = DL.shearModes(m, k);
    var total = m.reduce(function (a, b) { return a + b; }, 0);
    var cum = 0, need = null;
    var html = '<tr><th>Mode</th><th>ω (rad/s)</th><th>f (Hz)</th><th>T (s)</th><th>Γ</th><th>Eff. mass</th><th>Cumulative</th><th>Shape (storey 1 → N)</th></tr>';
    for (var j = 0; j < N; j++) {
      cum += res.massRatio[j];
      if (need === null && cum >= 0.9) need = j + 1;
      var w = res.omega[j];
      html += '<tr><td>' + (j + 1) + '</td><td>' + fmt(w) + '</td><td>' + fmt(w / (2 * Math.PI)) + '</td><td>' + fmt(2 * Math.PI / w) + '</td>' +
        '<td>' + fmt(res.gamma[j], 4) + '</td><td>' + fmt(res.massRatio[j] * 100, 3) + '%</td><td>' + fmt(cum * 100, 4) + '%</td>' +
        '<td>[' + res.modes[j].map(function (x) { return fmt(x, 3); }).join(', ') + ']</td></tr>';
    }
    $('t3out').innerHTML = html;
    readouts($('t3sum'), [
      ['Storeys (DOF)', N],
      ['Total mass', fmt(total) + ' t'],
      ['Fundamental period T₁', fmt(2 * Math.PI / res.omega[0]) + ' s'],
      ['Modes for 90% mass', need === null ? N : need]
    ]);
    var series = res.modes.map(function (phi, j) {
      var ys = [0]; for (var i = 1; i <= N; i++) ys.push(i);
      return { x: [0].concat(phi), y: ys, width: 2.2, label: 'Mode ' + (j + 1) };
    });
    var all = [].concat.apply([], res.modes);
    DL.drawChart($('t3chart'), {
      series: series, xlabel: 'Modal displacement (roof = 1)', ylabel: 'Storey level',
      xmin: Math.min(-0.2, Math.min.apply(null, all) - 0.2), xmax: Math.max(1.2, Math.max.apply(null, all) + 0.2),
      ymin: 0, ymax: N + 0.3, vlines: [{ x: 0, color: css('--muted'), dash: [3, 4] }]
    });
  }
  $('t3add').addEventListener('click', function () {
    var last = rows[rows.length - 1] || { m: 200, k: 80000 };
    rows.push({ m: last.m, k: last.k }); buildTable3(); tool3();
  });
  $('t3rem').addEventListener('click', function () { if (rows.length > 1) { rows.pop(); buildTable3(); tool3(); } });

  /* ---------- Tool 4: Newmark solver ---------- */
  function loadFn(type, p0, td) {
    return function (t) {
      switch (type) {
        case 'step': return p0;
        case 'rect': return t <= td ? p0 : 0;
        case 'sine': return t <= td ? p0 * Math.sin(Math.PI * t / td) : 0;
        default: return t < td ? p0 * (1 - t / td) : 0;
      }
    };
  }

  function tool4() {
    var out = $('t4out');
    var m = num('t4m'), k = num('t4k'), xi = num('t4xi') / 100, p0 = num('t4p0'), td = num('t4td'), Ttot = num('t4T'), dt = num('t4dt');
    var type = $('t4load').value;
    $('t4td').disabled = type === 'step';
    if (!(m > 0 && k > 0 && xi >= 0 && xi < 1 && p0 >= 0 && td > 0 && Ttot > 0 && dt > 0)) { bad(out, 'Use positive values and ξ below 100%.'); return; }
    var n = Math.ceil(Ttot / dt);
    if (n > 200000) { bad(out, 'Too many steps (' + n + '). Increase Δt or reduce total time.'); return; }
    var beta = $('t4method').value === 'avg' ? 0.25 : 1 / 6, gamma = 0.5;
    var wn = Math.sqrt(k / m), T = 2 * Math.PI / wn, c = 2 * xi * m * wn;
    var p = loadFn(type, p0, td);
    var a1 = m / (beta * dt * dt) + gamma * c / (beta * dt);
    var a2 = m / (beta * dt) + (gamma / beta - 1) * c;
    var a3 = (1 / (2 * beta) - 1) * m + dt * (gamma / (2 * beta) - 1) * c;
    var kh = k + a1;
    var u = 0, v = 0, a = (p(0) - c * v - k * u) / m;
    var ts = [0], us = [0], ps = [p(0)], umax = 0, tmax = 0, blew = false;
    for (var i = 0; i < n; i++) {
      var t1 = (i + 1) * dt, pn = p(t1);
      var un = (pn + a1 * u + a2 * v + a3 * a) / kh;
      var vn = gamma / (beta * dt) * (un - u) + (1 - gamma / beta) * v + dt * (1 - gamma / (2 * beta)) * a;
      var an = (un - u) / (beta * dt * dt) - v / (beta * dt) - (1 / (2 * beta) - 1) * a;
      u = un; v = vn; a = an;
      if (!isFinite(u) || Math.abs(u) > 1e9) { blew = true; break; }
      if (Math.abs(u) > Math.abs(umax) * (1 + 1e-9)) { umax = u; tmax = t1; }
      ts.push(t1); us.push(u * 1000); ps.push(pn);
    }
    var ust = p0 / k;
    var warn = '';
    if (blew || ($('t4method').value === 'lin' && dt / T > 0.551)) warn = 'Unstable: Δt/Tₙ exceeds 0.551 for linear acceleration';
    else if (dt / T > 0.1) warn = 'Δt/Tₙ > 0.1, so accuracy is poor';
    readouts(out, [
      ['Natural period Tₙ', fmt(T) + ' s'],
      ['Δt / Tₙ', fmt(dt / T, 3)],
      ['Static deflection p₀/k', fmt(ust * 1000) + ' mm'],
      ['Peak displacement', blew ? '—' : fmt(Math.abs(umax) * 1000) + ' mm'],
      ['Time of peak', blew ? '—' : fmt(tmax) + ' s'],
      ['Dynamic factor (peak/static)', blew || ust === 0 ? '—' : fmt(Math.abs(umax) / ust, 4)]
    ].concat(warn ? [['Warning', warn]] : []));

    var step = Math.max(1, Math.floor(ts.length / 2000)), tp = [], up = [], pp = [];
    for (var j = 0; j < ts.length; j += step) { tp.push(ts[j]); up.push(us[j]); pp.push(ps[j]); }
    DL.drawChart($('t4u'), { series: [{ x: tp, y: up, color: css('--c1'), width: 2 }], xlabel: 'Time (s)', ylabel: 'Displacement (mm)', yzero: true, xmin: 0, xmax: Ttot });
    DL.drawChart($('t4p'), { series: [{ x: tp, y: pp, color: css('--c2'), width: 2 }], xlabel: 'Time (s)', ylabel: 'Load (kN)', yzero: true, xmin: 0, xmax: Ttot });
  }
  listen('tool4', tool4);

  function all() { tool1(); tool2(); tool3(); tool4(); }
  DL.onResize(all);
  buildTable3();
  all();
})();
