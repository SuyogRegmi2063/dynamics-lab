/* DynamicsLab shared helpers: formatting, canvas charts, eigen solver, shear-building modal analysis */
(function () {
  'use strict';

  var css = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  function fmt(x, d) {
    d = d || 4;
    if (x === undefined || x === null || !isFinite(x)) return '—';
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 1e6 || a < 1e-3) return x.toExponential(Math.max(d - 1, 1));
    return String(+x.toPrecision(d));
  }

  function niceTicks(min, max, n) {
    if (max === min) max = min + 1;
    var span = max - min;
    var step0 = span / n;
    var mag = Math.pow(10, Math.floor(Math.log10(step0)));
    var norm = step0 / mag;
    var step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    var start = Math.ceil(min / step - 1e-9) * step;
    var t = [];
    for (var v = start; v <= max + step * 1e-9; v += step) t.push(+v.toPrecision(12));
    return t;
  }

  function setupCanvas(canvas, h) {
    var dpr = window.devicePixelRatio || 1;
    canvas.style.height = h + 'px';
    var w = canvas.clientWidth || 600;
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }

  /* o: {series:[{x,y,color,label,dash,width}], xlabel, ylabel, height, xmin,xmax,ymin,ymax, yzero, markers:[{x,y,color}], vlines:[{x,color,dash}]} */
  function drawChart(canvas, o) {
    var h = o.height || +canvas.dataset.h || 260;
    var S = setupCanvas(canvas, h), ctx = S.ctx, w = S.w;
    var pad = { l: 58, r: 16, t: 16, b: 46 };
    var series = o.series;
    var xmin = o.xmin, xmax = o.xmax, ymin = o.ymin, ymax = o.ymax;

    if (xmin == null || xmax == null || ymin == null || ymax == null) {
      var ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
      series.forEach(function (s) {
        for (var i = 0; i < s.x.length; i++) {
          var X = s.x[i], Y = s.y[i];
          if (!isFinite(X) || !isFinite(Y)) continue;
          if (X < ax) ax = X; if (X > bx) bx = X;
          if (Y < ay) ay = Y; if (Y > by) by = Y;
        }
      });
      if (!isFinite(ax)) { ax = 0; bx = 1; ay = 0; by = 1; }
      if (xmin == null) xmin = ax;
      if (xmax == null) xmax = bx;
      if (ymin == null || ymax == null) {
        if (o.yzero) { ay = Math.min(ay, 0); by = Math.max(by, 0); }
        var py = (by - ay) * 0.08 || 1;
        if (ymin == null) ymin = ay - py;
        if (ymax == null) ymax = by + py;
      }
    }
    if (xmax === xmin) xmax = xmin + 1;
    if (ymax === ymin) ymax = ymin + 1;

    var pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    var X = function (x) { return pad.l + (x - xmin) / (xmax - xmin) * pw; };
    var Y = function (y) { return pad.t + ph - (y - ymin) / (ymax - ymin) * ph; };
    var grid = css('--plot-grid'), muted = css('--muted'), ink = css('--ink');

    ctx.font = '12px system-ui, sans-serif';
    ctx.lineWidth = 1;
    var xt = niceTicks(xmin, xmax, Math.max(3, Math.floor(pw / 90)));
    var yt = niceTicks(ymin, ymax, Math.max(3, Math.floor(ph / 50)));

    ctx.strokeStyle = grid; ctx.fillStyle = muted;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    xt.forEach(function (v) {
      var px = X(v);
      ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, pad.t + ph); ctx.stroke();
      ctx.fillText(fmt(v, 3), px, pad.t + ph + 6);
    });
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    yt.forEach(function (v) {
      var py = Y(v);
      ctx.beginPath(); ctx.moveTo(pad.l, py); ctx.lineTo(pad.l + pw, py); ctx.stroke();
      ctx.fillText(fmt(v, 3), pad.l - 8, py);
    });

    // zero lines
    ctx.strokeStyle = muted; ctx.globalAlpha = .6;
    if (ymin < 0 && ymax > 0) { ctx.beginPath(); ctx.moveTo(pad.l, Y(0)); ctx.lineTo(pad.l + pw, Y(0)); ctx.stroke(); }
    if (xmin < 0 && xmax > 0) { ctx.beginPath(); ctx.moveTo(X(0), pad.t); ctx.lineTo(X(0), pad.t + ph); ctx.stroke(); }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, ph); ctx.clip();
    (o.vlines || []).forEach(function (v) {
      ctx.strokeStyle = v.color || muted; ctx.setLineDash(v.dash || [5, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X(v.x), pad.t); ctx.lineTo(X(v.x), pad.t + ph); ctx.stroke();
    });
    series.forEach(function (s, idx) {
      ctx.strokeStyle = s.color || css('--c' + ((idx % 5) + 1));
      ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      var started = false;
      for (var i = 0; i < s.x.length; i++) {
        if (!isFinite(s.x[i]) || !isFinite(s.y[i])) { started = false; continue; }
        if (!started) { ctx.moveTo(X(s.x[i]), Y(s.y[i])); started = true; }
        else ctx.lineTo(X(s.x[i]), Y(s.y[i]));
      }
      ctx.stroke();
    });
    ctx.restore();
    ctx.setLineDash([]);

    (o.markers || []).forEach(function (m) {
      var mx = Math.min(Math.max(X(m.x), pad.l), pad.l + pw);
      var my = Math.min(Math.max(Y(m.y), pad.t), pad.t + ph);
      ctx.fillStyle = m.color || css('--accent');
      ctx.strokeStyle = css('--surface'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });

    // legend
    var lx = pad.l + 10, ly = pad.t + 8;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    series.forEach(function (s, idx) {
      if (!s.label) return;
      var col = s.color || css('--c' + ((idx % 5) + 1));
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash(s.dash || []);
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 18, ly); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = ink;
      ctx.fillText(s.label, lx + 24, ly);
      lx += 24 + ctx.measureText(s.label).width + 16;
      if (lx > pad.l + pw - 60) { lx = pad.l + 10; ly += 16; }
    });

    // axis labels
    ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (o.xlabel) ctx.fillText(o.xlabel, pad.l + pw / 2, h - 8);
    if (o.ylabel) {
      ctx.save(); ctx.translate(14, pad.t + ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText(o.ylabel, 0, 0); ctx.restore();
    }
    return { X: X, Y: Y };
  }

  /* Jacobi eigenvalue algorithm for a real symmetric matrix. Returns ascending eigenvalues and eigenvectors (columns of V). */
  function jacobiEigen(A0) {
    var n = A0.length, i, j, k, p, q;
    var A = A0.map(function (r) { return r.slice(); });
    var V = [];
    for (i = 0; i < n; i++) { V.push([]); for (j = 0; j < n; j++) V[i].push(i === j ? 1 : 0); }
    for (var sweep = 0; sweep < 100; sweep++) {
      var off = 0, diag = 0;
      for (i = 0; i < n; i++) { diag += A[i][i] * A[i][i]; for (j = i + 1; j < n; j++) off += A[i][j] * A[i][j]; }
      if (off <= 1e-24 * Math.max(diag, 1e-300)) break;
      for (p = 0; p < n - 1; p++) {
        for (q = p + 1; q < n; q++) {
          if (Math.abs(A[p][q]) < 1e-300) continue;
          var theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
          var t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
          var c = 1 / Math.sqrt(t * t + 1), s = t * c;
          for (k = 0; k < n; k++) { var akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
          for (k = 0; k < n; k++) { var apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
          for (k = 0; k < n; k++) { var vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
        }
      }
    }
    var idx = [];
    for (i = 0; i < n; i++) idx.push(i);
    idx.sort(function (a, b) { return A[a][a] - A[b][b]; });
    return {
      values: idx.map(function (i) { return A[i][i]; }),
      vectors: idx.map(function (c) { var v = []; for (var r = 0; r < n; r++) v.push(V[r][c]); return v; })
    };
  }

  /* Shear building, storey 0 = first floor. m[i] mass of storey i, k[i] stiffness of the storey between level i-1 and i.
     Any consistent units; with tonnes and kN/m the frequencies come out in rad/s. */
  function shearModes(m, k) {
    var n = m.length, i, j;
    var K = [];
    for (i = 0; i < n; i++) { K.push([]); for (j = 0; j < n; j++) K[i].push(0); }
    for (i = 0; i < n; i++) {
      K[i][i] += k[i];
      if (i + 1 < n) { K[i][i] += k[i + 1]; K[i][i + 1] -= k[i + 1]; K[i + 1][i] -= k[i + 1]; }
    }
    var A = [];
    for (i = 0; i < n; i++) { A.push([]); for (j = 0; j < n; j++) A[i].push(K[i][j] / Math.sqrt(m[i] * m[j])); }
    var eig = jacobiEigen(A);
    var total = m.reduce(function (a, b) { return a + b; }, 0);
    var out = { omega: [], modes: [], gamma: [], massRatio: [], modalMass: [] };
    eig.values.forEach(function (lam, r) {
      var v = eig.vectors[r];
      var phi = v.map(function (x, ii) { return x / Math.sqrt(m[ii]); });
      var ref = phi[n - 1];
      if (Math.abs(ref) < 1e-9 * Math.max.apply(null, phi.map(Math.abs))) ref = phi.reduce(function (a, b) { return Math.abs(b) > Math.abs(a) ? b : a; }, 0);
      phi = phi.map(function (x) { return x / ref; });
      var Mn = 0, L = 0;
      for (var ii = 0; ii < n; ii++) { Mn += m[ii] * phi[ii] * phi[ii]; L += m[ii] * phi[ii]; }
      out.omega.push(Math.sqrt(Math.max(lam, 0)));
      out.modes.push(phi);
      out.modalMass.push(Mn);
      out.gamma.push(L / Mn);
      out.massRatio.push(L * L / Mn / total);
    });
    return out;
  }

  function bindRanges(root) {
    (root || document).querySelectorAll('input[type="range"]').forEach(function (inp) {
      var out = document.getElementById(inp.id + '-out');
      if (!out) return;
      var upd = function () { out.textContent = inp.value; };
      inp.addEventListener('input', upd);
      upd();
    });
  }

  function renderMath(el) {
    var run = function () {
      if (!window.renderMathInElement) return false;
      window.renderMathInElement(el || document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
      return true;
    };
    if (!run()) window.addEventListener('load', run, { once: true });
  }

  var resizeTimer;
  var resizeHandlers = [];
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resizeHandlers.forEach(function (f) { f(); }); }, 120);
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onScheme = function () { setTimeout(function () { resizeHandlers.forEach(function (f) { f(); }); }, 30); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderMath(document.body);
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  });

  window.DL = {
    css: css, fmt: fmt, niceTicks: niceTicks, setupCanvas: setupCanvas, drawChart: drawChart,
    jacobiEigen: jacobiEigen, shearModes: shearModes, bindRanges: bindRanges, renderMath: renderMath,
    onResize: function (f) { resizeHandlers.push(f); }
  };
})();
// Add the Notes link to the menu on every page
(function () {
  function addNotesLink() {
    var nav = document.querySelector('.site-header .links');
    if (!nav || nav.querySelector('a[href="notes.html"]')) return;
    var a = document.createElement('a');
    a.href = 'notes.html';
    a.textContent = 'Notes';
    if (/notes\.html$/.test(location.pathname)) a.setAttribute('aria-current', 'page');
    nav.appendChild(a);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addNotesLink);
  } else {
    addNotesLink();
  }
})();
// Tab icon (favicon) on every page
(function () {
  if (document.querySelector('link[rel="icon"]')) return;
  var l1 = document.createElement('link');
  l1.rel = 'icon'; l1.href = 'favicon.ico?v=2'; l1.setAttribute('sizes', 'any');
  var l2 = document.createElement('link');
  l2.rel = 'icon'; l2.type = 'image/png'; l2.href = 'favicon.png?v=2';
  var l3 = document.createElement('link');
  l3.rel = 'apple-touch-icon'; l3.href = 'apple-touch-icon.png?v=2';
  document.head.appendChild(l1);
  document.head.appendChild(l2);
  document.head.appendChild(l3);
})();
// Use the logo image in the header on every page
(function () {
  var brand = document.querySelector('.site-header .brand');
  if (!brand) return;
  var img = document.createElement('img');
  img.src = 'logo-mark-light.png';
  img.alt = '';
  img.style.cssText = 'height:40px;width:auto;display:block';
  var old = brand.querySelector('svg, img');
  if (old) old.replaceWith(img); else brand.prepend(img);
  brand.style.display = 'inline-flex';
  brand.style.alignItems = 'center';
  brand.style.gap = '10px';
})();