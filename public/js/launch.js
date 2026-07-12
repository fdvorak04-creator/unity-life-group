// ---------------------------------------------------------------------------
// launch.js
// One job: turn the Launch page from an endless scroll into a menu.
//
// The page ships with six section cards and all six sections, and the sections
// start hidden. Picking a card shows exactly one of them; "All Sections" puts
// the grid back. Nothing here navigates — the content is already downloaded, so
// the swap is instant and there is no reload.
//
// The open section's id lives in the URL hash. That buys three things for free:
// /new-agents/launch#get-paid can be sent to an agent and opens straight into
// the section, the browser Back button walks back to the grid, and a refresh
// keeps you where you were.
// ---------------------------------------------------------------------------

(function () {
  const menu = document.getElementById("launch-menu");
  const panelWrap = document.getElementById("launch-panels");
  const backBtn = document.getElementById("launch-back");
  if (!menu || !panelWrap || !backBtn) return;   // not the launch page.

  const cards = Array.from(menu.querySelectorAll(".sec-card"));
  const panels = Array.from(panelWrap.querySelectorAll(".launch-panel"));

  // Only ids that actually exist can be opened. A typo in a card's data-panel
  // then costs us one dead card instead of a blank page.
  const byId = new Map(panels.map((p) => [p.id, p]));

  // Replays the entrance animation. Toggling `hidden` alone won't re-run a CSS
  // animation that has already played once, so the class comes off, the browser
  // is forced to notice (offsetWidth), and it goes back on.
  function animateIn(el) {
    el.classList.remove("is-in");
    void el.offsetWidth;
    el.classList.add("is-in");
  }

  // Render whatever the hash says. This is the ONLY place that decides what's on
  // screen — every control just sets the hash and lets this run.
  function render() {
    const id = window.location.hash.slice(1);
    const panel = byId.get(id);

    panels.forEach((p) => (p.hidden = p !== panel));

    if (panel) {
      menu.hidden = true;
      panelWrap.hidden = false;
      animateIn(panel);
    } else {
      panelWrap.hidden = true;
      menu.hidden = false;
      animateIn(menu);
    }
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.panel;
      if (!byId.has(id)) return;

      window.location.hash = id;

      // The browser scrolls the hash target into view on its own, but the panel
      // sits below the title and intro — which we want kept in frame. So the top
      // of the page is where we put them, every time.
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  backBtn.addEventListener("click", () => {
    // Going through history rather than clearing the hash directly, so Back and
    // this button can't disagree about where "back" is. If the agent arrived on
    // a deep link there is no grid behind them, so we make one.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.hash = "";
      render();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Escape closes the open section — the same as hitting "All Sections". Not
  // while the lightbox is up, though: there, Escape belongs to the lightbox
  // (/js/lightbox.js), and closing the section out from under it would dump the
  // agent back on the grid. The element is looked up at press time rather than
  // held in a variable, because the lightbox is another file's business now.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const lb = document.getElementById("lightbox");
    if (lb && !lb.hidden) return;
    if (!panelWrap.hidden) backBtn.click();
  });

  window.addEventListener("hashchange", render);
  render();   // set the right view before the agent has touched anything.

  // (The click-to-expand lightbox that used to live down here is now
  // /js/lightbox.js, so the Agent Portal can use it too. This page loads it.)
})();
