# Dyson Game Hub

**Play. Challenge. Share. Compete.** — plain HTML/CSS/JS with Supabase as the backend.

## Everything is in ONE folder (no sub-folders)

| Files | What they are |
|---|---|
| `index.html`, `play.html`, `create-game.html`, `leaderboard.html`, `profile.html`, `results.html` | the pages |
| `style.css`, `games.css`, `responsive.css` | the design (palette sampled from your pictures) |
| `config.js` | **put your Supabase URL + anon key here** |
| `supabase.js`, `app.js`, `auth.js`, `sharing.js`, `sound.js`, `leaderboard.js` | shared logic |
| `who-knows-me.js`, `would-you-rather.js`, `truth-or-dare.js`, `general-knowledge.js` | the four games |
| `images.js` | maps every quiz answer (e.g. "Burna Boy") to its picture file |
| `pic-*.webp` | all 99 pictures, optimised |
| `logo.png`, `favicon*.png`, `icon-*.png`, `manifest.json` | branding / PWA |
| `SUPABASE_SETUP.md` | database SQL (unchanged) |

Upload the whole folder to GitHub Pages / any static host. Share links are built
automatically as `…/play.html?game=CODE&type=who-knows-me`.

## Pictures
Every option in the 25-question bank has a picture, shown as big tiles while playing.
To swap one, replace the matching `pic-….webp` (keep the name) or edit `images.js`.
`pic-facebook`, `pic-horror` and `pic-manchester-united` are generated stand-ins
(the originals were blank black images) — replace them with real photos any time.
Not used yet: `pic-congress-badge.webp` and `pic-urban-badge.webp` (school badges) — ready for an About section.
