# DynamicsLab: structural dynamics for students

A static website (no build step). Open `index.html` in a browser, or serve the folder:

    python3 -m http.server 8000     # then visit http://localhost:8000

Deploy by uploading the folder to GitHub Pages, Netlify or any static host.
Equations use KaTeX and fonts come from Google Fonts, both loaded from a CDN, so an internet connection is needed for those.

## Pages
- `index.html` home and learning tracks
- `lessons.html` 9 lessons (beginner, intermediate, advanced), each a `<details class="lesson">` block
- `simulations.html` SDOF frame, resonance curves, shear-building mode shapes
- `tools.html` SDOF properties, harmonic response, modal analysis, Newmark solver
- `quiz.html` practice questions, `formulas.html` formula sheet

## Editing
- Add a lesson: copy a `<details class="lesson">` block in `lessons.html` and set `data-level`.
- Add a quiz question: add an object to the `QUESTIONS` array in `quiz.js` (math in `\( \)`).
- Colours and fonts: CSS variables at the top of `style.css` (dark mode included).
- Units in the tools: tonnes, kN, m, s, so sqrt(k/m) is in rad/s.
