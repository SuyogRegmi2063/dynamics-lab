/* scan-notes.js — run with:  node scan-notes.js
 *
 * Looks inside the "notes" folder, treats every sub-folder as one section
 * (e.g. "Chapter 1", "Past Year Questions") and writes notes-data.js,
 * which the Notes page reads.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "notes";
const OUT = "notes-data.js";

const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
const isPdf = (n) => /\.pdf$/i.test(n);

if (!fs.existsSync(ROOT)) {
  fs.mkdirSync(ROOT);
  console.log('Created an empty "notes" folder. Add sub-folders with PDFs, then run this again.');
}

const sections = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort(naturalSort)
  .map((folder) => {
    const files = fs.readdirSync(path.join(ROOT, folder))
      .filter(isPdf)
      .sort(naturalSort)
      .map((f) => ({ name: f.replace(/\.pdf$/i, ""), path: ROOT + "/" + folder + "/" + f }));
    return { title: folder, files };
  });

// PDFs placed directly inside "notes" (no sub-folder) go into "Other"
const loose = fs.readdirSync(ROOT).filter((n) => isPdf(n) && fs.statSync(path.join(ROOT, n)).isFile()).sort(naturalSort);
if (loose.length) {
  sections.push({ title: "Other", files: loose.map((f) => ({ name: f.replace(/\.pdf$/i, ""), path: ROOT + "/" + f })) });
}

fs.writeFileSync(OUT, "window.NOTES_DATA = " + JSON.stringify(sections, null, 2) + ";\n");

const total = sections.reduce((n, s) => n + s.files.length, 0);
console.log("Done: " + total + " PDF(s) in " + sections.length + " section(s) written to " + OUT);
