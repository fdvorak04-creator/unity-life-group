# Unity Life Group — Agent Hub (ulgagency.com)
Internal hub for ULG's insurance agents. Owner: Fraser. Users: agents
on desktop 95% of the time.

# Brand — never deviate
The authority is the vault: `C:\Projects\ulg-brain\10-Business\brand.md`.
Read it before touching anything visual. In short:
- Palette: forest ground (#061C15 page, #0A3628 cards, #164C39 lines),
  gold as a metallic GRADIENT (#F2DFA8 → #D8B36A → #B98A2F → #E8CC8A),
  ivory #EDE8DC body text, slate #8FA79B muted. Tokens live in the
  `:root` block of public/css/styles.css.
- Gold is ALWAYS a gradient (flat gold is a brand violation) and used
  SCARCELY: the mark, headlines, and one CTA per screen. Everything else
  is ivory on green. Body text is always ivory, never gold.
- Fonts: Cinzel (display/headings, matches the wordmark), Albert Sans
  (labels + body). Not Playfair — that was the retired system.
- Feel: heraldic — prestige, permanence, earned status. Deep near-black
  greens; gold stays genuinely metallic and scarce. Never startup-template,
  and never let green+gold+crown drift into "country club".

# Logo — how it works (read before touching the mark)
- The master is `public/unity-life-group-logo.svg`: the gold lion emblem
  (crown + lion + laurels) over the Cinzel wordmark. The EMBLEM IS ONE
  MERGED PATH — it moves as a single unit, never in parts.
- `public/brand/emblem.svg` is the emblem alone (favicon, header mark,
  watermark). `public/brand/laurel-1..3.svg` are the laurel-progression
  icons — the wreath filling stage by stage, used on the homepage motif
  and the /new-agents stage cards (they replaced the old three-shield
  progression).
- The homepage hero inlines the emblem lockup so the intro can animate its
  pieces (.lk-emblem / .lk-unity / .lk-lg / .lk-rules). THE SVG-TRANSFORM
  TRAP: never put a CSS transform on an SVG element that already carries a
  transform attribute — wrap it in an outer <g> and animate the wrapper
  (brand.md spells this out).
- The old `public/logos-final` three-shield system and its
  `tools/build-marks.js` generator are RETIRED. Don't use them.

# Rules
- Desktop and laptop-first; narrow widths must still scroll and function.
- Site structure: Home → Start Here (/new-agents: licensing,
  contracting, launch) + Agent Portal (/agents)
- Deployment: GitHub → Railway auto-deploy. "Push the update" =
  commit and push.
- Verify changes before declaring done; never break existing links.
