// ---------------------------------------------------------------------------
// server.js
// This is the tiny "server" program. A server's only job is to hand your
// website's files to a visitor's web browser when they come to your address.
// Railway runs this file automatically to put your site online.
// ---------------------------------------------------------------------------

// Bring in "Express", a small helper that makes running a web server easy.
const express = require("express");

// Create our web server application.
const app = express();

// The "port" is like a door number the server listens at.
// Railway tells us which door to use through something called process.env.PORT.
// When you run it on your own computer, Railway isn't involved, so we fall
// back to door number 3000.
const PORT = process.env.PORT || 3000;

// Serve everything inside the "public" folder (your HTML, CSS, images, etc.).
// This means a visitor automatically sees public/index.html as the home page.
app.use(express.static("public"));

// Start listening for visitors.
app.listen(PORT, () => {
  console.log(`Unity Life Group site is running. Open http://localhost:${PORT}`);
});
