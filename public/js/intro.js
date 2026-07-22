// ---------------------------------------------------------------------------
// intro.js  —  the logo intro, homepage only.
//
// Almost all of the intro is CSS (see "3b. THE LOGO INTRO" in styles.css). The
// decision to play it at all is made by an inline script in the head of
// index.html, which puts `intro-armed` on <html> on a visitor's first arrival in
// a browser session.
//
// So this file has exactly two jobs, and they are the same job:
//   - end the intro when it's finished, and
//   - end the intro early if the visitor touches anything.
//
// "End the intro" means: take `intro-armed` off <html>, and put `intro-done` on.
// That's the whole mechanism. Every piece's animation was written to finish at
// the element's natural resting state — opacity 1, no transform, exactly where
// the homepage's logo already sits — so removing the class mid-flight doesn't
// "skip to an ending", it just stops pretending and shows the page. There is no
// separate skipped-state to keep in sync with the played-one, which is why the
// two can't drift apart.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  const html = document.documentElement;

  // Not armed = not the first arrival this session (or no sessionStorage at all,
  // or this isn't the homepage). Nothing to do, and nothing to listen for.
  if (!html.classList.contains("intro-armed")) return;

  // Just past the last thing still moving. The lockup settles by ~1.0s and the
  // roar rings ripple out through ~1.1s; the hero's reveals (rule, tagline,
  // worlds, note) land last, at 1.12 + 0.5 = ~1.62s. Swapping the class any
  // earlier would cut those reveals off mid-fade and snap them to full opacity —
  // so this number and the delays in styles.css ("3b. THE LOGO INTRO") have to be
  // kept in step with each other.
  const RUNTIME_MS = 1700;

  // Any of these means "I'm here, get on with it".
  const SKIP_ON = ["pointerdown", "keydown", "wheel", "touchstart"];

  let done = false;

  function finish() {
    if (done) return;   // the timer and a click can both land; only the first counts
    done = true;

    clearTimeout(timer);
    SKIP_ON.forEach((evt) => window.removeEventListener(evt, finish));

    html.classList.remove("intro-armed");
    html.classList.add("intro-done");
  }

  const timer = setTimeout(finish, RUNTIME_MS);

  // `passive` because none of these handlers ever calls preventDefault — it tells
  // the browser it can keep scrolling without waiting to find out.
  SKIP_ON.forEach((evt) => window.addEventListener(evt, finish, { passive: true }));
})();
