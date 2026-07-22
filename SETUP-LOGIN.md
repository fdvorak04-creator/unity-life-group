# Turning on restricted access (agent login)

This is the one-time setup that switches on login for **Get Licensed** and the
**Agent Portal**. Home and Apply Now stay public.

The code is already done. What's left is creating a free **WorkOS** account
(the service that runs the login screen and emails the magic links), copying a
few values into **Railway**, and flipping the switch. Nothing here touches the
code, and no secret ever goes into git.

**Rough time: 15–20 minutes.** If any screen doesn't look like the steps below,
stop and ask me — WorkOS occasionally moves things around, and I'd rather guide
you live than have you guess.

---

## Part A — Set up WorkOS (do this once)

1. **Create the account.** Go to <https://workos.com>, sign up, and confirm your
   email. The plan we're using (AuthKit) is free.

2. **Create your organization = your agent roster.**
   In the dashboard, open **Organizations** → **Create Organization**.
   Name it **Unity Life Group**. Open it and copy its ID — it starts with
   `org_`. That's your `WORKOS_ORG_ID`. *(Only members of this organization can
   get into the locked pages — this is the real gate.)*

3. **Grab your keys.** Open **API Keys** (sometimes under "Developers").
   - Copy the **Secret Key** (starts with `sk_`) → that's `WORKOS_API_KEY`.
   - Copy the **Client ID** (starts with `client_`) → that's `WORKOS_CLIENT_ID`.
   Treat the secret key like a password — anyone with it can act as your app.

4. **Tell WorkOS where to send agents back (redirect URIs).**
   Open **Redirects** (or **AuthKit → Redirects**) and add **both**:
   - `https://ulgagency.com/callback`  ← your live site
   - `http://localhost:3000/callback`  ← so we can test on your computer
   Save.

5. **Make magic link the sign-in method.**
   Open **Authentication** (or **AuthKit → Sign-in methods**). Turn **on**
   **Magic Auth** (email link). You can turn **off** Password and any social
   logins so email is the only way in.

6. **Lock it to invited people only (belt-and-suspenders).**
   If you see a setting like "Allow anyone to sign up" or "Self-service
   sign-up", turn it **off**. *(Even if this is left on, our code still rejects
   anyone who isn't in the Unity Life Group organization — but off is tidier.)*

7. **Add your agents.** Open the **Unity Life Group** organization →
   **Members** → **Invite** (or **Add user**) and enter each agent's email.
   That's what puts them "on the roster." You'll do this each time a new agent
   comes on — it's the 30-second action I mentioned.

---

## Part B — Make a cookie password

This is just a long random string that scrambles the login pass. Any 32+
random characters work. Easiest: open a new browser tab, go to
<https://1password.com/password-generator> (or any password generator), set the
length to 40+, and copy the result. Save it as `WORKOS_COOKIE_PASSWORD`.

---

## Part C — Put the values into Railway

1. Open your project on <https://railway.app> → the ULG service → **Variables**.
2. Add these six variables (paste the values you gathered above):

   | Variable | Value |
   |---|---|
   | `WORKOS_API_KEY` | your `sk_...` secret key |
   | `WORKOS_CLIENT_ID` | your `client_...` id |
   | `WORKOS_COOKIE_PASSWORD` | your 40-character random string |
   | `WORKOS_REDIRECT_URI` | `https://ulgagency.com/callback` |
   | `WORKOS_ORG_ID` | your `org_...` id |
   | `AUTH_ENABLED` | `false` *(for now — we flip it last)* |

3. Railway saves and redeploys automatically.

---

## Part D — Test, then flip the switch

1. With `AUTH_ENABLED=false`, visit the site. Everything should work exactly as
   before (nothing locked). This confirms the new code didn't break anything.
2. Change `AUTH_ENABLED` to `true` and let Railway redeploy.
3. Open `https://ulgagency.com/agents` in a private/incognito window. You should
   be bounced to the WorkOS login screen.
4. Enter an email you added to the roster in step A7. Check that inbox, click the
   magic link — it should drop you right onto the Agent Portal.
5. Try an email you did **not** add. You should be turned away with
   "Not on the ULG roster yet." That proves the gate works.

If step 3 or 4 misbehaves, the Railway **Logs** tab will show an `[auth]` line
explaining what's missing. Send me a screenshot and I'll sort it.

---

## Day-to-day, once it's live

- **Add an agent:** WorkOS → Unity Life Group organization → invite their email.
- **Remove an agent:** WorkOS → find the user → remove from the organization (to
  fully cut off access immediately, delete or suspend the user). Their pass stops
  working within a few minutes.
- **An agent is stuck:** have them click **Log out** (or clear cookies) and log
  in again. Magic links expire, so a fresh one always fixes it.

You never need to touch the code or redeploy to manage agents — it's all in the
WorkOS dashboard.
