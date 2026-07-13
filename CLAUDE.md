# Unity Life Group — Agent Hub (ulgagency.com)
Internal hub for ULG's insurance agents. Owner: Fraser. Users: agents
on desktop 95% of the time.

# Brand — never deviate
- Palette: deep midnight navy base (#081428–#0A1830), gold #C6A15B
  used sparingly as the accent weapon, steel blue secondary, white
  #FDFDFC
- Fonts: Playfair Display 600-800 for headings, Albert Sans for body
- Logo assets: public/logos-final — ALWAYS use these files. Never
  rebuild or approximate the marks in code.
- Feel: private wealth firm — editorial, sharp, expensive. Never
  startup-template.

# Logos — how they actually work (read before touching a mark)
- THE FILENAME NAMES THE BACKGROUND, NOT THE INK. `ulg-lockup-navy.svg`
  is the LIGHT artwork, for navy backgrounds — that is the one this
  site uses. `ulg-lockup-light.svg` is the DARK artwork, for white
  backgrounds, and is currently unused. Getting this backwards puts a
  white box with navy text on the midnight page.
- The three files in public/logos-final are PRINT EXPORTS: a US-Letter
  page (612x792) with an opaque background baked in and the logo
  floating in the middle. They are masters. Do not use them directly.
- What the site actually loads is public/logos-final/web/ — cropped,
  transparent, web-ready marks GENERATED from those masters by
  `node tools/build-marks.js`:
    lockup-on-dark.svg    the full lockup
    monogram-on-dark.svg  shields + ULG (favicon)
    shield-on-dark.svg    the three-shield mark (nav)
    shield-outline.svg    hairline version (hero watermark)
  The tool also injects the inline markup into index.html (the hero
  lockup, which the intro animates) and new-agents.html (the three
  stage shields), between their `<!-- ULG:… -->` markers.
- To change a mark: change the master, re-run the tool. NEVER hand-edit
  the generated path data, and never retype a path from memory — that
  is how the logo quietly stops being the logo.

# Rules
- Desktop and laptop-first; narrow widths must still scroll and function.
- Site structure: Home → Start Here (/new-agents: licensing,
  contracting, launch) + Agent Portal (/agents)
- Deployment: GitHub → Railway auto-deploy. "Push the update" =
  commit and push.
- Verify changes before declaring done; never break existing links.
