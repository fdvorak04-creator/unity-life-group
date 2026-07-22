// ---------------------------------------------------------------------------
// intro.js  —  the roar intro, homepage only.
//
// The decision to play at all is made by the inline script in the head of
// index.html, which puts `intro-armed` on <html> on a visitor's first arrival in
// a browser session (or whenever the URL carries ?intro). This file drives the
// roar video once it's armed.
//
// The mechanism is the same swap the old fall-into-place intro used:
//   - `intro-armed`  -> the roar overlay is shown; the homepage settles under it.
//   - `intro-done`   -> the page is revealed and every entrance is frozen at rest.
// We add `.is-lifting` to the overlay so it fades out (CSS transition), then drop
// it from the DOM so it can never sit on top of the page and eat a click.
//
// "End the intro" happens on any of: the roar finishing, the visitor touching
// anything, the video failing to load / autoplay being blocked, or a hard safety
// timeout — so the overlay can never trap someone behind it.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  const html = document.documentElement;

  // Not armed = not the first arrival this session (or not the homepage). Nothing
  // to play and nothing to listen for.
  if (!html.classList.contains("intro-armed")) return;

  const overlay = document.getElementById("roar-intro");
  const video = document.getElementById("roar-intro-video");

  // Someone who has asked their computer to reduce motion doesn't want a
  // cinematic — hand them the settled homepage immediately, no video.
  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Hard ceiling: whatever else happens, the overlay is gone by this point, so a
  // stalled or missing video never leaves the page unreachable behind it.
  const MAX_MS = 6000;

  const SKIP_ON = ["pointerdown", "keydown", "wheel", "touchstart"];

  let done = false;

  function finish() {
    if (done) return; // 'ended', a click and the safety timer can all land; first wins
    done = true;

    clearTimeout(safety);
    SKIP_ON.forEach((evt) => window.removeEventListener(evt, finish));

    if (video) {
      try { video.pause(); } catch (e) { /* nothing to do */ }
    }

    // Reveal the settled homepage, freeze every entrance at its resting state.
    html.classList.remove("intro-armed");
    html.classList.add("intro-done");

    // Fade the overlay out, then remove it so it never blocks the page.
    if (overlay) {
      overlay.classList.add("is-lifting");
      const drop = () => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); };
      overlay.addEventListener("transitionend", drop, { once: true });
      setTimeout(drop, 900); // fallback if transitionend never fires
    }
  }

  const safety = setTimeout(finish, MAX_MS);

  // `passive` because none of these handlers calls preventDefault.
  SKIP_ON.forEach((evt) => window.addEventListener(evt, finish, { passive: true }));

  if (reduceMotion || !video) {
    finish();
    return;
  }

  // End when the roar finishes; bail to the page on any load/playback failure.
  video.addEventListener("ended", finish, { once: true });
  video.addEventListener("error", finish, { once: true });

  // Autoplay needs the muted attribute (set in the HTML). If the browser still
  // refuses, don't sit on a frozen first frame — just show the page.
  const played = video.play();
  if (played && typeof played.catch === "function") {
    played.catch(function () { finish(); });
  }
})();
