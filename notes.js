/* notes.js — shows the PDFs listed in notes-data.js on notes.html.
 * notes-data.js is created by:  node scan-notes.js
 */
(function () {
  "use strict";

  var grid = document.getElementById("uploadGrid");
  var msg = document.getElementById("upMsg");
  var searchEl = document.getElementById("notesSearch");
  var data = Array.isArray(window.NOTES_DATA) ? window.NOTES_DATA : [];
  var query = "";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render() {
    var html = "";
    data.forEach(function (sec) {
      var shown = sec.files.filter(function (f) {
        return !query || (f.name + " " + sec.title).toLowerCase().indexOf(query) !== -1;
      });
      if (query && !shown.length) return;

      html += '<section class="card up-card">' +
        '<div class="up-head"><h3>' + esc(sec.title) + '</h3><span class="muted up-count">' +
        sec.files.length + (sec.files.length === 1 ? " file" : " files") + "</span></div>" +
        '<ul class="file-list">' +
        (shown.length ? shown.map(function (f) {
          var href = encodeURI(f.path);
          return '<li class="file-item"><span class="file-name">' + esc(f.name) + "</span>" +
            '<span class="file-btns">' +
            '<a class="btn btn-ghost" href="' + href + '" target="_blank" rel="noopener">Open</a>' +
            '<a class="btn btn-ghost" href="' + href + '" download>Download</a>' +
            "</span></li>";
        }).join("") : '<li class="muted">No PDFs in this folder yet.</li>') +
        "</ul></section>";
    });

    if (!html) {
      grid.innerHTML = "";
      msg.textContent = data.length
        ? "No matching files."
        : 'No notes found yet. Put your PDFs in the "notes" folder (one sub-folder per chapter), then run: node scan-notes.js';
    } else {
      msg.textContent = "";
      grid.innerHTML = html;
    }
  }

  searchEl.addEventListener("input", function () {
    query = searchEl.value.trim().toLowerCase();
    render();
  });
  render();
})();
