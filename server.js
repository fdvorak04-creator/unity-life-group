// ---------------------------------------------------------------------------
// server.js
// This is the tiny "server" program. A server's only job is to hand your
// website's files to a visitor's web browser when they come to your address.
// Railway runs this file automatically to put your site online.
// ---------------------------------------------------------------------------

// Bring in "Express", a small helper that makes running a web server easy.
const express = require("express");
const path = require("path");

// Create our web server application.
const app = express();

// The "port" is like a door number the server listens at.
// Railway tells us which door to use through something called process.env.PORT.
// When you run it on your own computer, Railway isn't involved, so we fall
// back to door number 3000.
const PORT = process.env.PORT || 3000;

// Where all the visitor-facing files live.
const PUBLIC_DIR = path.join(__dirname, "public");

// Serve everything inside the "public" folder (your HTML, CSS, images, etc.).
// This means a visitor automatically sees public/index.html as the home page.
app.use(express.static(PUBLIC_DIR));

// ---------------------------------------------------------------------------
// CLEAN ADDRESSES
// Without these two lines, the section pages would only answer to the clumsy
// addresses /new-agents.html and /agents.html. These make the tidy versions
// work instead — ulgagency.com/new-agents and ulgagency.com/agents.
// ---------------------------------------------------------------------------
app.get("/new-agents", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "new-agents.html"));
});

app.get("/agents", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "agents.html"));
});

app.get("/vision", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "vision.html"));
});

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
});
