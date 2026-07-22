// ---------------------------------------------------------------------------
// intro.js  —  the roar intro, homepage only.
//
// The decision to play at all is made by the inline script in the head of
// index.html, which puts `intro-armed` on <html> on a visitor's first arrival in
// a browser session (or whenever the URL carries ?intro). This file drives the
// roar video once it's armed, and — the part that matters — hands off to the
// homepage as ONE transition rather than a cut.
//
// The states on <html>:
//   intro-armed    -> the roar overlay is shown; the hero is hidden beneath it.
//   intro-lifting  -> the outro: the roar recedes + dissolves while the hero
//                     fades up into place (the two blend into one move).
//   intro-done     -> the page is revealed and every entrance is frozen at rest.
//
// "End the intro" happens on any of: the roar finishing, the visitor touching
// anything, the video failing / autoplay being blocked, or a hard safety timeout
// — so the overlay can never trap someone behind it.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  const html = document.documentElement;

  // Not armed = not the first arrival this session (or not the homepage).
  if (!html.classList.contains("intro-armed")) return;

  const overlay = document.getElementById("roar-intro");
  const video = document.getElementById("roar-intro-video");

  // Someone who asked their computer to reduce motion doesn't want a cinematic —
  // hand them the settled homepage immediately, no video, no fade.
  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const OUTRO_MS = 850;   // must match the .roar-intro / .intro-lifting transitions
  const MAX_MS = 6000;    // hard ceiling: the overlay is always gone by here

  const SKIP_ON = ["pointerdown", "keydown", "wheel", "touchstart"];

  let done = false;

  function removeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  // instant = true skips the outro (reduced motion, or the video never showed, so
  // there's nothing to gracefully recede). Called with an explicit boolean —
  // never straight from an event listener, or the Event would arrive as `instant`.
  function finish(instant) {
    if (done) return; // 'ended', a click and the safety timer can all land; first wins
    done = true;

    clearTimeout(safety);
    SKIP_ON.forEach((evt) => window.removeEventListener(evt, onSkip));
    if (video) {
      try { video.pause(); } catch (e) { /* nothing to do */ }
    }

    if (instant) {
      html.classList.remove("intro-armed");
      html.classList.add("intro-done");
      removeOverlay();
      return;
    }

    // The outro: recede + dissolve the roar, fade the hero up, then settle.
    html.classList.remove("intro-armed");
    html.classList.add("intro-lifting");
    if (overlay) overlay.classList.add("is-lifting");

    setTimeout(function () {
      html.classList.remove("intro-lifting");
      html.classList.add("intro-done");
      removeOverlay();
    }, OUTRO_MS);
  }

  function onSkip() { finish(false); }   // a touch mid-roar still gets the graceful outro

  const safety = setTimeout(function () { finish(false); }, MAX_MS);
  SKIP_ON.forEach((evt) => window.addEventListener(evt, onSkip, { passive: true }));

  if (reduceMotion || !video) {
    finish(true);
    return;
  }

  // End with the outro when the roar finishes; snap to the page on any failure.
  video.addEventListener("ended", function () { finish(false); }, { once: true });
  video.addEventListener("error", function () { finish(true); }, { once: true });

  // Autoplay needs the muted attribute (set in the HTML). If the browser still
  // refuses, don't sit on a frozen first frame — just show the page.
  const played = video.play();
  if (played && typeof played.catch === "function") {
    played.catch(function () { finish(true); });
  }
})();
