// ---------------------------------------------------------------------------
// server.js
// This is the tiny "server" program. A server's only job is to hand your
// website's files to a visitor's web browser when they come to your address.
// Railway runs this file automatically to put your site online.
// ---------------------------------------------------------------------------

// Load local secret settings from a .env file when running on your own
// computer. On Railway these come from the dashboard instead, so this line
// simply does nothing there.
require("dotenv").config();

// Bring in "Express", a small helper that makes running a web server easy.
const express = require("express");
const path = require("path");

// "cookie-parser" lets the server read the encrypted login pass the browser
// sends back on each visit. The bouncer logic itself lives in auth.js.
const cookieParser = require("cookie-parser");
const { requireAuth, mountAuthRoutes, configStatus } = require("./auth");

// Create our web server application.
const app = express();

// The "port" is like a door number the server listens at.
// Railway tells us which door to use through something called process.env.PORT.
// When you run it on your own computer, Railway isn't involved, so we fall
// back to door number 3000.
const PORT = process.env.PORT || 3000;

// Where all the visitor-facing files live.
const PUBLIC_DIR = path.join(__dirname, "public");

// ---------------------------------------------------------------------------
// LOGIN (restricted access)
// Read the browser's login pass, add the /login, /callback and /logout routes,
// then put a checkpoint in front of the two locked sections. Everything below
// this block — the clean addresses AND the static file server — sits behind
// this checkpoint for protected paths, so a locked page can't leak through.
//
// Public and stays public: Home ("/"), Apply Now, and all shared images/CSS.
// Locked: Get Licensed ("/new-agents" and its stage pages) and the Agent
// Portal ("/agents").
// ---------------------------------------------------------------------------
app.use(cookieParser());
mountAuthRoutes(app);

const PROTECTED = [
  /^\/agents(?:\.html)?\/?$/i,        // /agents, /agents/, /agents.html
  /^\/new-agents(?:\.html)?\/?$/i,    // /new-agents, /new-agents/, /new-agents.html
  /^\/new-agents\/.+/i,               // /new-agents/licensing, /contracting, /launch, ...
];

app.use((req, res, next) => {
  if (PROTECTED.some((pattern) => pattern.test(req.path))) {
    return requireAuth(req, res, next);
  }
  next();
});

// ---------------------------------------------------------------------------
// CLEAN ADDRESSES
// Without these two lines, the section pages would only answer to the clumsy
// addresses /new-agents.html and /agents.html. These make the tidy versions
// work instead — ulgagency.com/new-agents and ulgagency.com/agents.
//
// (/vision was removed. Anyone who still has the old link bookmarked falls
// through to the catch-all at the bottom and lands on the homepage.)
// ---------------------------------------------------------------------------
app.get(["/new-agents", "/new-agents/"], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "new-agents.html"));
});

app.get(["/agents", "/agents/"], (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "agents.html"));
});

// Serve everything inside the "public" folder (your HTML, CSS, images, etc.).
// This means a visitor automatically sees public/index.html as the home page.
app.use(express.static(PUBLIC_DIR));

// The three "new agent" stage pages, e.g. /new-agents/licensing.
// Listing the allowed names explicitly means a made-up address like
// /new-agents/anything-else can't reach for a file it shouldn't.
const STAGES = ["licensing", "contracting", "launch"];

app.get("/new-agents/:stage", (req, res, next) => {
  if (!STAGES.includes(req.params.stage)) return next();   // falls through to the 404 below
  res.sendFile(path.join(PUBLIC_DIR, "new-agents", `${req.params.stage}.html`));
});

// If someone types an address that doesn't exist, send them home rather than
// showing them a bare browser error page.
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Start listening for visitors.
app.listen(PORT, () => {
  console.log(`Unity Life Group site is running. Open http://localhost:${PORT}`);

  // Announce the login state loudly, so a half-finished setup is never mistaken
  // for a protected site.
  const status = configStatus();
  if (!status.enabled) {
    console.log("[auth] AUTH_ENABLED is off — every page is PUBLIC (no login required).");
  } else if (!status.ready) {
    console.warn(
      "[auth] AUTH_ENABLED is ON but these settings are missing:",
      status.missing.join(", "),
      "— locked pages will show a 'being set up' notice until they are added."
    );
  } else {
    console.log("[auth] Login is ON. Get Licensed and the Agent Portal are protected.");
  }
});
