// ---------------------------------------------------------------------------
// auth.js
// This is the "bouncer" for the site. Its job is to make sure only approved
// ULG agents can open the locked sections (Get Licensed + the Agent Portal),
// while leaving the public pages (Home, Apply Now) open to everyone.
//
// How an agent gets in:
//   1. They open a locked page. The bouncer sees no valid pass and sends them
//      to WorkOS's login screen.
//   2. They type their email; WorkOS emails them a one-time "magic link".
//   3. They click it, WorkOS sends them back here, and we check they're on the
//      ULG roster. If they are, we hand their browser an encrypted pass (a
//      cookie) and let them into the page they wanted.
//
// The actual login screen and the magic-link email are handled by WorkOS, so
// there are no passwords for us to store and nothing to email ourselves.
// ---------------------------------------------------------------------------

const { WorkOS } = require("@workos-inc/node");

// ---------------------------------------------------------------------------
// SETTINGS — all supplied by Railway environment variables, never the code.
// (See SETUP-LOGIN.md for what each one is and where to get it.)
// ---------------------------------------------------------------------------
const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";

const API_KEY = process.env.WORKOS_API_KEY;             // secret, starts with sk_
const CLIENT_ID = process.env.WORKOS_CLIENT_ID;          // starts with client_
const COOKIE_PASSWORD = process.env.WORKOS_COOKIE_PASSWORD; // 32+ random characters
const REDIRECT_URI = process.env.WORKOS_REDIRECT_URI;    // e.g. https://ulgagency.com/callback
const ORG_ID = process.env.WORKOS_ORG_ID;                // the "Unity Life Group" org, starts with org_

// The name of the browser cookie that carries the agent's encrypted pass.
const COOKIE_NAME = "wos-session";

// The pass lives on locked pages only over HTTPS in production; on a plain
// http://localhost dev machine that flag must be off or the cookie won't stick.
const COOKIE_OPTIONS = {
  httpOnly: true,                       // JavaScript on the page can't read it
  secure: (REDIRECT_URI || "").startsWith("https://"),
  sameSite: "lax",                      // survives the login redirect, blocks cross-site abuse
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30,     // stay logged in ~30 days
};

// ---------------------------------------------------------------------------
// Is login fully configured? If AUTH_ENABLED is on, every one of these must be
// present, or we'd be pretending to protect pages that are actually wide open.
// ---------------------------------------------------------------------------
function configStatus() {
  const required = { API_KEY, CLIENT_ID, COOKIE_PASSWORD, REDIRECT_URI, ORG_ID };
  const missing = Object.keys(required).filter((k) => !required[k]);
  return {
    enabled: AUTH_ENABLED,
    ready: AUTH_ENABLED && missing.length === 0,
    missing,
  };
}

// Only build the WorkOS client when we actually have keys — otherwise it throws.
const workos =
  API_KEY && CLIENT_ID
    ? new WorkOS(API_KEY, { clientId: CLIENT_ID })
    : null;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Remember which page the agent was trying to reach, so we can drop them back
// there after login. We only ever allow internal paths (must start with a
// single "/") — this blocks an attacker from bouncing someone to another site.
function safeReturnTo(value) {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/agents";
}

function encodeState(returnTo) {
  return Buffer.from(safeReturnTo(returnTo)).toString("base64url");
}

function decodeState(state) {
  try {
    return safeReturnTo(Buffer.from(String(state), "base64url").toString("utf8"));
  } catch {
    return "/agents";
  }
}

// A tiny branded page for the two "you can't proceed" cases. Kept inline so it
// has no external dependencies and works even mid-setup.
function messagePage(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Unity Life Group</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;
    background:#061C15;color:#EDE8DC;
    font-family:'Albert Sans',system-ui,-apple-system,Segoe UI,sans-serif;padding:2rem}
  .card{max-width:32rem;background:#0A3628;border:1px solid #164C39;
    border-radius:14px;padding:2.5rem;text-align:center}
  h1{font-family:'Cinzel',Georgia,serif;font-weight:600;margin:0 0 .75rem;font-size:1.5rem}
  p{line-height:1.6;color:#EDE8DC;margin:.5rem 0}
  a{color:#EDE8DC;text-decoration:underline;text-underline-offset:3px}
  .muted{color:#8FA79B;font-size:.9rem;margin-top:1.5rem}
</style></head><body><div class="card">
<h1>${title}</h1>${body}
</div></body></html>`;
}

// ---------------------------------------------------------------------------
// THE BOUNCER — runs before any locked page is served.
// ---------------------------------------------------------------------------
async function requireAuth(req, res, next) {
  // Login turned off entirely (e.g. before setup, or on a dev machine):
  // behave exactly like the old site and let everyone through.
  if (!AUTH_ENABLED) return next();

  // Login is switched on but not fully configured. We must NOT fall open here —
  // that would leak the locked pages. Hold the door instead.
  if (!configStatus().ready) {
    return res
      .status(503)
      .send(messagePage("Login is being set up",
        "<p>The secure sections are being configured right now. Please check back shortly.</p>"));
  }

  const session = workos.userManagement.loadSealedSession({
    sessionData: req.cookies[COOKIE_NAME],
    cookiePassword: COOKIE_PASSWORD,
  });

  let result = await session.authenticate();

  // Valid pass — let them in.
  if (result.authenticated) return next();

  // No pass at all → send them to log in.
  if (result.reason === "no_session_cookie_provided") {
    return res.redirect("/login?returnTo=" + encodeURIComponent(req.originalUrl));
  }

  // Pass expired (normal after a while). Try to quietly renew it.
  try {
    const refreshed = await session.refresh();
    if (refreshed.authenticated) {
      res.cookie(COOKIE_NAME, refreshed.sealedSession, COOKIE_OPTIONS);
      return next();
    }
  } catch (err) {
    console.error("[auth] session refresh failed:", err.message);
  }

  // Couldn't renew (e.g. the agent was removed in WorkOS). Clear the stale
  // pass and make them log in again.
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  return res.redirect("/login?returnTo=" + encodeURIComponent(req.originalUrl));
}

// ---------------------------------------------------------------------------
// THE LOGIN ROUTES — /login, /callback, /logout
// ---------------------------------------------------------------------------
function mountAuthRoutes(app) {
  // Start login: hand off to the WorkOS-hosted magic-link screen.
  app.get("/login", (req, res) => {
    if (!AUTH_ENABLED) return res.redirect("/");
    if (!configStatus().ready) {
      return res.status(503).send(messagePage("Login is being set up",
        "<p>The secure sections are being configured right now. Please check back shortly.</p>"));
    }
    const authorizationUrl = workos.userManagement.getAuthorizationUrl({
      clientId: CLIENT_ID,
      provider: "authkit",
      redirectUri: REDIRECT_URI,
      state: encodeState(req.query.returnTo),
    });
    res.redirect(authorizationUrl);
  });

  // WorkOS sends the agent back here after they click their magic link.
  app.get("/callback", async (req, res) => {
    if (!AUTH_ENABLED || !configStatus().ready) return res.redirect("/");
    const { code, state } = req.query;
    if (!code) return res.redirect("/login");

    try {
      const auth = await workos.userManagement.authenticateWithCode({
        code,
        clientId: CLIENT_ID,
        session: { sealSession: true, cookiePassword: COOKIE_PASSWORD },
      });

      // ROSTER CHECK — the real gate. Proving you own an email is not enough;
      // you must be a member of the Unity Life Group organization in WorkOS.
      // Fraser adds agents there; anyone else is turned away.
      const memberships = await workos.userManagement.listOrganizationMemberships({
        userId: auth.user.id,
        organizationId: ORG_ID,
      });

      if (!memberships.data.length) {
        return res.status(403).send(messagePage("Not on the ULG roster yet",
          `<p>The email <strong>${auth.user.email}</strong> isn't approved for the secure area.</p>
           <p>If you're a Unity Life Group agent, ask Fraser to add you, then try again.</p>`));
      }

      res.cookie(COOKIE_NAME, auth.sealedSession, COOKIE_OPTIONS);
      return res.redirect(decodeState(state));
    } catch (err) {
      console.error("[auth] callback error:", err.message);
      return res.status(500).send(messagePage("Login didn't go through",
        `<p>Something interrupted the login. Please <a href="/login">try again</a>.</p>`));
    }
  });

  // Log out: end the WorkOS session and clear the local pass.
  app.get("/logout", async (req, res) => {
    if (!AUTH_ENABLED || !configStatus().ready) return res.redirect("/");
    try {
      const session = workos.userManagement.loadSealedSession({
        sessionData: req.cookies[COOKIE_NAME],
        cookiePassword: COOKIE_PASSWORD,
      });
      const logoutUrl = await session.getLogoutUrl();
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      return res.redirect(logoutUrl);
    } catch (err) {
      // No valid session to end — just clear locally and go home.
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      return res.redirect("/");
    }
  });
}

module.exports = { AUTH_ENABLED, configStatus, requireAuth, mountAuthRoutes };
