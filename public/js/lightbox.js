// ---------------------------------------------------------------------------
// lightbox.js  —  the click-to-expand image viewer.
//
// Used by the Launch page (the comp guide and the producer bonus) and by the
// Agent Portal (the same two charts). It used to live inside launch.js, behind
// that file's "am I the launch page?" guard — which meant the Agent Portal could
// not open a chart at all. It is its own file now, so any page that drops in the
// lightbox markup gets the behaviour for free.
//
// A page opts in by including the .lightbox element (see either page's HTML) and
// giving each thumbnail a `data-zoom` with the full-size image's URL. No markup,
// no listeners: this file simply does nothing.
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxClose = document.getElementById("lightbox-close");
  if (!lightbox || !lightboxImg || !lightboxClose) return;   // page doesn't use it

  // The element that was focused when the lightbox opened, so focus can be put
  // back where the agent left it once it closes.
  let lastFocused = null;

  function openLightbox(src, alt) {
    lastFocused = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";   // the page must not scroll behind it
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll(".comp-zoom").forEach((zoom) => {
    zoom.addEventListener("click", () => {
      const img = zoom.querySelector("img");
      openLightbox(zoom.dataset.zoom, img && img.alt);
    });
  });

  lightboxClose.addEventListener("click", closeLightbox);

  // A click on the backdrop closes; a click on the image itself does not, so
  // nobody dismisses the chart by trying to look at it.
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightboxImg) return;
    closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
})();
