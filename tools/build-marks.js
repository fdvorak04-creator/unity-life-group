// ---------------------------------------------------------------------------
// tools/build-marks.js  —  turns the real logo masters into what the site uses.
//
//   node tools/build-marks.js
//
// WHY THIS EXISTS. The files in public/logos-final are the real artwork, but they
// are PRINT exports: each one is a US-Letter page (612x792) with an opaque paper
// background baked in and the logo floating in the middle of a lot of nothing.
// Dropped into a web page as-is you get a big opaque rectangle. So this tool:
//
//   1. strips the two baked-in backgrounds (the page sheet, and the design's own
//      dark panel),
//   2. crops the canvas to the artwork's true ink bounds (computed from the path
//      geometry, not eyeballed),
//   3. tags the pieces the homepage intro animates,
//   4. writes the results into public/logos-final/web/, and injects the inline
//      markup into index.html and new-agents.html between their ULG: markers.
//
// THE MASTERS ARE NEVER MODIFIED, AND NOTHING HERE IS DRAWN BY HAND. Every path
// is the artwork's own. If a mark needs to change, change the master and re-run
// this — do not hand-edit the generated markup, or the logo slowly stops being
// the logo.
//
// NAMING TRAP: the colour in a master's filename is the BACKGROUND it is made
// for, not the ink. ulg-lockup-navy.svg is the LIGHT artwork (for navy grounds);
// ulg-lockup-light.svg is the DARK artwork (for white grounds). This site is
// midnight throughout, so everything here is built from the *-navy masters.
// ---------------------------------------------------------------------------
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LOGOS = path.join(ROOT, "public/logos-final");
const OUT = path.join(LOGOS, "web");
fs.mkdirSync(OUT, { recursive: true });

// The artwork's three inks, as the export writes them.
const WHITE = "rgb(99.21875%, 99.21875%, 98.81897%)";
const GOLD = "rgb(78.42865%, 60.778809%, 23.529053%)";
const STEEL = "rgb(56.079102%, 62.748718%, 74.119568%)";

// ---- geometry -------------------------------------------------------------
// Paths are M/L/C/Z only (no arcs, no H/V), so numbers strictly alternate x,y.
// Bezier control points are included in the hull, which can only ever overstate
// a box by a hair — it will never clip the art.
const nums = (d) => (d.match(/-?\d*\.?\d+/g) || []).map(Number);
const pairs = (d) => {
  const n = nums(d), p = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  return p;
};
const hull = (pts) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), X: Math.max(...xs), Y: Math.max(...ys) };
};
const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

// ---- read a master --------------------------------------------------------
function load(file) {
  const svg = fs.readFileSync(path.join(LOGOS, file), "utf8");
  const cut = svg.indexOf("</defs>") + "</defs>".length;
  const defs = svg.slice(0, cut);

  // The print export bakes in two backgrounds: the page sheet (a full-bleed
  // rect OR path, depending on the file) and the design's dark panel (the only
  // thing that uses clip-0).
  const body = svg
    .slice(cut)
    .replace(/<\/svg>\s*$/, "")
    .replace(/<rect\s+x="-61\.2"[^>]*\/>\s*/g, "")
    .replace(/<path[^>]*fill="rgb\(100%, 100%, 100%\)"[^>]*\/>\s*/g, "")
    .replace(/<g\s+clip-path="url\(#clip-0\)">[\s\S]*?<\/g>\s*/g, "");

  const glyphs = {};
  for (const m of defs.matchAll(/<g id="(glyph-[\d-]+)">([\s\S]*?)<\/g>/g)) {
    const pts = [];
    for (const p of m[2].matchAll(/\sd="([^"]+)"/g)) pts.push(...pairs(p[1]));
    glyphs[m[1]] = pts;
  }
  const clips = {};
  for (const m of defs.matchAll(/<clipPath id="(clip-\d+)">\s*<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)"/g))
    clips[m[1]] = { x: +m[2], y: +m[3], w: +m[4], h: +m[5] };
  const sources = {};
  for (const m of defs.matchAll(/<g id="(source-\d+)" clip-path="url\(#(clip-\d+)\)">/g)) sources[m[1]] = clips[m[2]];

  return { defs, body, glyphs, sources };
}

// Every point a chunk of body markup puts on the canvas.
function points(chunk, glyphs, sources) {
  const pts = [];
  for (const m of chunk.matchAll(/<path[^>]*\sd="([^"]+)"/g)) pts.push(...pairs(m[1]));
  for (const m of chunk.matchAll(/<use xlink:href="#(glyph-[\d-]+)" x="([\d.-]+)" y="([\d.-]+)"/g))
    pts.push(...shift(glyphs[m[1]] || [], +m[2], +m[3]));
  for (const m of chunk.matchAll(/<use xlink:href="#(source-\d+)" transform="matrix\(1, 0, 0, 1, ([\d.-]+), ([\d.-]+)\)"/g)) {
    const r = sources[m[1]];
    if (r) pts.push([r.x + +m[2], r.y + +m[3]], [r.x + r.w + +m[2], r.y + r.h + +m[3]]);
  }
  return pts;
}

const viewBox = (b, pad) => `${b.x - pad} ${b.y - pad} ${b.X - b.x + pad * 2} ${b.Y - b.y + pad * 2}`;

function writeSvg(name, defs, inner, vb) {
  const head = defs.replace(
    /<svg([^>]*?)width="612" height="792" viewBox="0 0 612 792">/,
    `<svg$1viewBox="${vb}">`
  );
  fs.writeFileSync(path.join(OUT, name), `${head}\n<g id="art">${inner}</g>\n</svg>\n`);
  console.log(`  ${name}  viewBox="${vb}"`);
}

// ---------------------------------------------------------------------------
console.log("building marks from the real masters…");

const lock = load("ulg-lockup-navy.svg");

// --- the four shield shapes, lifted out of the lockup ----------------------
const mainD = lock.body.match(new RegExp(`<path fill-rule="nonzero" fill="${WHITE.replace(/[()%.]/g, "\\$&")}" fill-opacity="1" d="([^"]+)"`))[1];
const goldD = lock.body.match(new RegExp(`<path fill-rule="nonzero" fill="${GOLD.replace(/[()%.]/g, "\\$&")}" fill-opacity="1" d="([^"]+)"`))[1];

// The outer shields are defined at the origin in <defs> and placed by a
// translate in the body.
const srcD = {};
for (const m of lock.defs.matchAll(/<g id="(source-\d+)" clip-path[\s\S]*?<path[^>]*fill="rgb\(56\.079102%[^"]*"[^>]*d="([^"]+)"/g)) srcD[m[1]] = m[2];
const at = {};
for (const m of lock.body.matchAll(/<use xlink:href="#(source-\d+)" transform="matrix\(1, 0, 0, 1, ([\d.-]+), ([\d.-]+)\)"/g))
  at[m[1]] = { dx: +m[2], dy: +m[3] };

const oL = { d: srcD["source-5"], ...at["source-5"] };
const oR = { d: srcD["source-8"], ...at["source-8"] };
const tag = (s) => `transform="translate(${s.dx} ${s.dy})"`;

const bM = hull(pairs(mainD));
const bL = hull(shift(pairs(oL.d), oL.dx, oL.dy));
const bR = hull(shift(pairs(oR.d), oR.dx, oR.dy));
const top = Math.min(bM.y, bL.y, bR.y);
const bot = Math.max(bM.Y, bL.Y, bR.Y);

// The three stage icons share ONE viewBox height, so the centre shield renders
// at an identical size on every card (they are height-sized in CSS) while the
// side shields simply add width as the mark completes itself.
const P = 1.5;
const box = (x, X) => `${x - P} ${top - P} ${X - x + P * 2} ${bot - top + P * 2}`;

const ICONS = [
  // stage 1 — the centre shield alone, still only an outline
  `<svg class="stage-icon" viewBox="${box(bM.x, bM.X)}" fill="none" aria-hidden="true" focusable="false">
            <path d="${mainD}" fill="none" stroke="#FDFDFC" stroke-width="1.8" stroke-linejoin="round" opacity="0.55"/>
          </svg>`,
  // stage 2 — the centre shield is solid now, and one side shield has arrived
  `<svg class="stage-icon" viewBox="${box(bM.x, bR.X)}" fill="none" aria-hidden="true" focusable="false">
            <path d="${oR.d}" ${tag(oR)} fill="${STEEL}" opacity="0.5"/>
            <path d="${mainD}" fill="${WHITE}" opacity="0.92"/>
          </svg>`,
  // stage 3 — the finished mark, gold and all
  `<svg class="stage-icon" viewBox="${box(bL.x, bR.X)}" fill="none" aria-hidden="true" focusable="false">
            <path d="${oL.d}" ${tag(oL)} fill="${STEEL}"/>
            <path d="${oR.d}" ${tag(oR)} fill="${STEEL}"/>
            <path d="${mainD}" fill="${WHITE}"/>
            <path d="${goldD}" fill="${GOLD}"/>
          </svg>`,
];

// --- files in public/logos-final/web/ --------------------------------------
const fullBox = hull(points(lock.body, lock.glyphs, lock.sources));
const HERO_VB = viewBox(fullBox, 2);

writeSvg("lockup-on-dark.svg", lock.defs, lock.body, HERO_VB);

const shieldsOnly = lock.body.match(/<g mask="url\(#mask-0\)">[\s\S]*?<path[^>]*fill="rgb\(78\.42865%[^>]*\/>/)[0];
const leanDefs = lock.defs.replace(/<g id="glyph-[\d-]+">[\s\S]*?<\/g>\s*/g, ""); // no lettering here
writeSvg("shield-on-dark.svg", leanDefs, shieldsOnly, box(bL.x, bR.X));

// The watermark behind the hero: the mark as a hairline outline. Stroke is baked
// in so main.js can drop it in as a plain <img> and CSS only has to place it.
fs.writeFileSync(
  path.join(OUT, "shield-outline.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box(bL.x, bR.X)}" fill="none" stroke="#5D80B8" stroke-width="0.5" stroke-linejoin="round">
<path d="${oL.d}" ${tag(oL)}/>
<path d="${oR.d}" ${tag(oR)}/>
<path d="${mainD}"/>
</svg>
`
);
console.log(`  shield-outline.svg`);

const mono = load("ulg-monogram-navy.svg");
writeSvg("monogram-on-dark.svg", mono.defs, mono.body, viewBox(hull(points(mono.body, mono.glyphs, mono.sources)), 2));

// --- the inline hero lockup ------------------------------------------------
// Tag the pieces the intro animates. Order in the export is load-bearing and
// known: the two masked <use> are the outer shields, then the white main shield,
// then the gold heart, then the wordmark, then GROUP.
let i = 0;
const heroInner = lock.body
  .replace(/<g mask="url\(#mask-([01])\)">/g, (m, n) => `<g class="lk-shield lk-shield-${n === "0" ? "l" : "r"}" mask="url(#mask-${n})">`)
  .replace(/<path (fill-rule="nonzero" fill="rgb\(99\.21875%[^>]*)\/>/, '<path class="lk-shield lk-shield-m" $1/>')
  .replace(/<path (fill-rule="nonzero" fill="rgb\(78\.42865%[^>]*)\/>/, '<path class="lk-shield lk-shield-g" $1/>')
  // each letter gets its index, so the intro's stagger is computed, not listed
  .replace(/<g (fill="rgb\(99\.21875%[^"]*" fill-opacity="1")>\s*(<use xlink:href="#glyph-0-)/g,
    (m, f, u) => `<g class="lk-ch" style="--i:${i++}" ${f}>${u}`)
  // GROUP, and the two gold rules that flank it, arrive together
  .replace(/<g (fill="rgb\(78\.42865%[^"]*" fill-opacity="1")>\s*(<use xlink:href="#glyph-1-)/g, '<g class="lk-gp" $1>$2')
  .replace(/<path (fill-rule="nonzero" fill="rgb\(78\.42865%(?![^>]*lk-shield)[^>]*)\/>/g, '<path class="lk-gp" $1/>');

const heroSvg = `<svg class="lockup-svg" viewBox="${HERO_VB}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false">
${lock.defs.slice(lock.defs.indexOf("<defs>"))}
${heroInner}
</svg>`;

// Where the shield's heart sits inside the lockup box, as a percentage — the
// pulse fires from there. Measured, not guessed.
const cx = (((bM.x + bM.X) / 2 - (fullBox.x - 2)) / (fullBox.X - fullBox.x + 4)) * 100;
const cy = (((top + bot) / 2 - (fullBox.y - 2)) / (fullBox.Y - fullBox.y + 4)) * 100;

// --- inject ----------------------------------------------------------------
function inject(file, marker, markup) {
  const p = path.join(ROOT, "public", file);
  const src = fs.readFileSync(p, "utf8");
  const re = new RegExp(`(<!-- ULG:${marker}:START -->)[\\s\\S]*?(<!-- ULG:${marker}:END -->)`);
  if (!re.test(src)) throw new Error(`no ULG:${marker} markers in ${file}`);
  fs.writeFileSync(p, src.replace(re, `$1\n${markup}\n      $2`));
  console.log(`  injected ${marker} -> ${file}`);
}

inject("index.html", "LOCKUP", heroSvg);
inject("index.html", "MOTIF", ICONS.join("\n          "));
inject("new-agents.html", "STAGE1", ICONS[0]);
inject("new-agents.html", "STAGE2", ICONS[1]);
inject("new-agents.html", "STAGE3", ICONS[2]);

console.log(`\nlockup: ${i} letters | aspect ${( (fullBox.X-fullBox.x+4) / (fullBox.Y-fullBox.y+4) ).toFixed(4)} | pulse ${cx.toFixed(2)}% / ${cy.toFixed(2)}%`);
console.log("done.");
