/* Lessons page: level filter and deep links (#beginner, #l4) */
(function () {
  'use strict';
  var buttons = document.querySelectorAll('#levelFilter button');
  var lessons = document.querySelectorAll('details.lesson');

  function setFilter(level) {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === level)); });
    lessons.forEach(function (l) { l.hidden = !(level === 'all' || l.dataset.level === level); });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setFilter(b.dataset.filter); });
  });

  function fromHash() {
    var h = location.hash.replace('#', '');
    if (['beginner', 'intermediate', 'advanced'].indexOf(h) >= 0) {
      setFilter(h);
    } else if (/^l\d+$/.test(h)) {
      setFilter('all');
      var el = document.getElementById(h);
      if (el) { el.open = true; setTimeout(function () { el.scrollIntoView(); }, 50); }
    }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // keep the open lesson's math visible when opened for the first time
  lessons.forEach(function (l) {
    l.addEventListener('toggle', function () { if (l.open && window.DL) window.DL.renderMath(l); });
  });
})();
