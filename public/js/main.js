// ---------------------------------------------------------------------------
// main.js  —  loaded by EVERY page.
//
// Its one job today is the "Ember Drift" background: the drifting gold and
// steel flecks that sit behind the whole site, and the faint shield watermark
// behind the homepage hero.
//
// It lives here, in the file every page already loads, so the background is a
// single shared component rather than six copies that drift apart. To change
// the effect anywhere, change it here and it changes everywhere.
//
// TWO INTENSITIES, one layer:
//   data-bg="full"     -> the homepage. More embers, brighter, plus the shield.
//   data-bg="ambient"  -> everywhere else (and the default). Fewer embers,
//                         dimmer, no shield — it must never compete with the
//                         content sitting on top of it.
// Set the mode with a data-bg attribute on <body>. No attribute = ambient, so
// any new page is quiet by default and has to ask to be loud.
//
// The rest of the layer — the gradient, the gold pool of light, and the dark
// veil that guarantees text stays readable — is pure CSS (see .ulg-bg in
// styles.css), so it paints on the very first frame. Only the embers are built
// here, which is why there is never a flash of un-styled background.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  // The two dials, per mode. COUNT is how many embers; OPACITY scales how
  // visible each one is; SPEED multiplies the drift time (higher = slower and
  // calmer). Ambient is deliberately about half as busy and a third as bright.
  const MODES = {
    full:    { count: 34, opacity: 1.0,  speed: 1.0 },
    ambient: { count: 16, opacity: 0.42, speed: 1.5 },
  };

  function build() {
    const body = document.body;
    if (!body) return;

    const mode = MODES[body.dataset.bg] || MODES.ambient;
    const isFull = body.dataset.bg === "full";

    // The layer itself. aria-hidden because it is decoration and a screen
    // reader has nothing to gain from it. It's inserted FIRST in the body so it
    // sits behind everything without needing a negative z-index (which would
    // put it behind the body's own background and make it invisible).
    const bg = document.createElement("div");
    bg.className = "ulg-bg";
    bg.setAttribute("aria-hidden", "true");

    // The pool of gold light. On the homepage it sits high, behind the lockup;
    // on every other page it's dialled right down by CSS.
    const glow = document.createElement("div");
    glow.className = "ulg-bg-glow";
    bg.appendChild(glow);

    // The shield watermark — homepage only. This is the real ULG mark (the same
    // three-shield artwork as the logo), not a generic shield, so the watermark
    // behind the hero is the brand's own silhouette. It's held at a few percent
    // opacity by CSS: it should be felt, not read.
    if (isFull) {
      bg.insertAdjacentHTML(
        "beforeend",
        '<svg class="ulg-bg-shield" viewBox="2 2 58 40" fill="none" focusable="false">' +
          '<path d="M13 7 L24 10.5 L24 22 C24 30.5 19.5 35.5 13 39 C6.5 35.5 2 30.5 2 22 L2 10.5 Z"/>' +
          '<path d="M49 7 L60 10.5 L60 22 C60 30.5 55.5 35.5 49 39 C42.5 35.5 38 30.5 38 22 L38 10.5 Z"/>' +
          '<path d="M31 2 L44 6 L44 21 C44 31.5 38.5 38 31 42 C23.5 38 18 31.5 18 21 L18 6 Z"/>' +
        "</svg>"
      );
    }

    // The dark veil: a gradient wash over the embers, heaviest where the content
    // is. It is what lets us keep the effect lively behind the page while still
    // guaranteeing that body text never has to compete with a bright fleck.
    const veil = document.createElement("div");
    veil.className = "ulg-bg-veil";
    bg.appendChild(veil);

    body.insertBefore(bg, body.firstChild);

    // Somebody who has asked their computer to stop animating things gets the
    // gradient, the glow and the shield — but no embers at all. Not "embers that
    // hold still": no embers. Nothing is built, so there is nothing to paint.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // A SEEDED random, so the ember field is laid out identically on every load
    // and every page. An unseeded one would reshuffle on each navigation, and the
    // background would visibly "jump" as you moved through the site — which is
    // exactly what a background must never do.
    let seed = 42;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };

    // One fragment, one insert. Appending 34 elements one at a time would make
    // the browser reconsider the layout 34 times.
    const frag = document.createDocumentFragment();

    for (let i = 0; i < mode.count; i++) {
      const isGold = rand() > 0.55;          // a little over half are steel, not gold
      const size = (1.5 + rand() * 2.5).toFixed(1);
      const p = document.createElement("div");

      p.className = "ulg-p";
      p.style.left = Math.round(rand() * 98) + "%";
      p.style.width = size + "px";
      p.style.height = size + "px";

      // Gold flecks and steel-blue flecks — the same two metals as the logo.
      p.style.background = isGold
        ? "rgba(226, 190, 121, 0.9)"   /* --gold-bright */
        : "rgba(110, 145, 200, 0.75)"; /* steel         */

      // Each ember's own peak opacity, scaled by the mode. --po is read by the
      // keyframes, so an ember fades in to ITS brightness and no further.
      const peak = Math.min(1, (0.15 + rand() * 0.4) * mode.opacity);
      p.style.setProperty("--po", peak.toFixed(2));

      // Between ~22s and ~42s to cross the screen, stretched by the mode's speed.
      p.style.animationDuration = Math.round((22 + rand() * 20) * mode.speed) + "s";

      // A NEGATIVE delay starts each ember partway through its own rise, so the
      // field is already in full flight on the first frame instead of every
      // ember launching from the bottom edge together.
      p.style.animationDelay = (-rand() * 40).toFixed(1) + "s";

      frag.appendChild(p);
    }

    bg.appendChild(frag);
  }

  // main.js is loaded at the end of <body>, so the body already exists — but
  // guard anyway, in case this script is ever moved into <head>.
  if (document.body) {
    build();
  } else {
    document.addEventListener("DOMContentLoaded", build);
  }
})();
