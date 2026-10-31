/* Home page hero: a 3-storey frame swaying in its first mode with slowly decaying amplitude */
(function () {
  'use strict';
  var canvas = document.getElementById('heroCanvas');
  if (!canvas || !window.DL) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phi = [0.445, 0.802, 1]; // first mode of a uniform 3-storey shear building
  var t0 = performance.now();

  function draw(t) {
    var S = DL.setupCanvas(canvas, 320), ctx = S.ctx, w = S.w, h = S.h;
    var ink = DL.css('--ink'), accent = DL.css('--accent'), teal = DL.css('--teal'), muted = DL.css('--muted'), soft = DL.css('--soft');
    var ground = h - 34, storey = 78, cx = w / 2, half = Math.min(80, w * 0.2);
    var cycle = 9; // seconds before the "shaking" restarts
    var tt = t % cycle;
    var env = Math.exp(-0.35 * tt);
    var s = Math.sin(2 * Math.PI * 0.8 * tt) * env * Math.min(w * 0.12, 42);

    ctx.fillStyle = soft; ctx.fillRect(0, ground, w, h - ground);
    ctx.strokeStyle = muted; ctx.lineWidth = 1.5;
    for (var i = -2; i < w / 14 + 2; i++) { ctx.beginPath(); ctx.moveTo(i * 14, h); ctx.lineTo(i * 14 + 14, ground); ctx.stroke(); }

    // ghost
    ctx.globalAlpha = .18; ctx.fillStyle = ink;
    for (var g = 1; g <= 3; g++) ctx.fillRect(cx - half - 12, ground - g * storey - 12, 2 * half + 24, 12);
    ctx.globalAlpha = 1;

    var xs = [cx].concat(phi.map(function (p) { return cx + p * s; }));
    ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = ink;
    [-half, half].forEach(function (off) {
      ctx.beginPath(); ctx.moveTo(xs[0] + off, ground);
      for (var k = 1; k <= 3; k++) ctx.lineTo(xs[k] + off, ground - k * storey);
      ctx.stroke();
    });
    for (var k2 = 1; k2 <= 3; k2++) {
      ctx.fillStyle = k2 === 3 ? accent : teal;
      var x = xs[k2], y = ground - k2 * storey;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - half - 12, y - 12, 2 * half + 24, 14, 5); else ctx.rect(x - half - 12, y - 12, 2 * half + 24, 14);
      ctx.fill();
    }
  }

  function loop(now) {
    draw((now - t0) / 1000);
    requestAnimationFrame(loop);
  }
  if (reduce) { draw(0.3); DL.onResize(function () { draw(0.3); }); }
  else requestAnimationFrame(loop);
})();
