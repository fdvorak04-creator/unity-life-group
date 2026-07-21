// ---------------------------------------------------------------------------
// main.js  —  loaded by EVERY page.
//
// It builds the shared background layer that sits behind the whole site: a
// static forest gradient with a faint pool of gold light and a dark veil that
// keeps text readable. That's it — no moving parts.
//
// (The old "Ember Drift" effect — drifting gold/steel flecks and a shield
// watermark — was retired with the forest/gold rebrand. The background is now
// deliberately still: the mark and the type are what move, in the intro; the
// ground they stand on holds steady.)
//
// The gradient, glow and veil are pure CSS (see .ulg-bg in styles.css), so they
// paint on the very first frame. This file only has to insert the layer element
// for those rules to hang on.
//
// TWO INTENSITIES, one layer, set by a data-bg attribute on <body>:
//   data-bg="full"     -> the homepage. A stronger, higher gold glow.
//   data-bg="ambient"  -> everywhere else (and the default). Dimmer, so it never
//                         competes with the content sitting on top of it.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  function build() {
    const body = document.body;
    if (!body) return;

    // The layer itself. aria-hidden because it is pure decoration. Inserted FIRST
    // in the body so it sits behind everything without needing a negative z-index.
    const bg = document.createElement("div");
    bg.className = "ulg-bg";
    bg.setAttribute("aria-hidden", "true");

    // The pool of gold light — on the homepage it sits high, behind the lockup;
    // on every other page CSS dials it right down. This is what stops the flat
    // forest reading as a dead rectangle: the page looks lit rather than printed.
    const glow = document.createElement("div");
    glow.className = "ulg-bg-glow";
    bg.appendChild(glow);

    // The dark veil: a forest wash over the glow, heaviest where the content is,
    // so body text never has to compete with the light behind it.
    const veil = document.createElement("div");
    veil.className = "ulg-bg-veil";
    bg.appendChild(veil);

    body.insertBefore(bg, body.firstChild);
  }

  // Loaded at the end of <body>, so the body already exists — but guard anyway.
  if (document.body) {
    build();
  } else {
    document.addEventListener("DOMContentLoaded", build);
  }
})();
