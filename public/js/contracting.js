// ---------------------------------------------------------------------------
// contracting.js
// Powers the one interactive piece on /new-agents/contracting: the "Copy"
// button on the template the agent has to send their upline.
//
// The template itself lives in the HTML, not in here. The button just points at
// it by id (data-copy-target), so the wording can be changed on the page without
// anyone having to remember to change a matching copy of it in this file.
// ---------------------------------------------------------------------------

(function () {
  var button = document.querySelector("[data-copy-target]");
  if (!button) return;

  var source = document.getElementById(button.getAttribute("data-copy-target"));
  if (!source) return;

  var label = button.querySelector(".copy-btn-text");
  var resetTimer = null;

  // Copying is invisible — nothing on screen changes, and the agent has no way
  // of knowing whether the clipboard took it. So the button says so itself, and
  // goes back to normal after a couple of seconds.
  function flash(message) {
    if (label) label.textContent = message;
    button.classList.add("is-copied");

    clearTimeout(resetTimer);   // rapid clicks shouldn't leave it stuck saying "Copied"
    resetTimer = setTimeout(function () {
      if (label) label.textContent = "Copy";
      button.classList.remove("is-copied");
    }, 2000);
  }

  // The old way of copying. The modern clipboard API below only exists on secure
  // pages (https, or localhost) — this is the fallback for anything else, so the
  // button still works if the site is ever opened over plain http or as a file.
  function copyTheOldWay(text) {
    var scratch = document.createElement("textarea");
    scratch.value = text;
    scratch.setAttribute("readonly", "");
    scratch.style.position = "fixed";   // "fixed" + off-screen: never scrolls the page
    scratch.style.top = "-9999px";
    document.body.appendChild(scratch);
    scratch.select();

    var copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (err) {
      copied = false;
    }

    document.body.removeChild(scratch);
    return copied;
  }

  button.addEventListener("click", function () {
    var text = source.textContent.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          flash("Copied");
        },
        function () {
          // Permission denied, or the browser refused. Try the old way before
          // telling the agent it didn't work.
          flash(copyTheOldWay(text) ? "Copied" : "Press Ctrl+C");
        }
      );
      return;
    }

    flash(copyTheOldWay(text) ? "Copied" : "Press Ctrl+C");
  });
})();
