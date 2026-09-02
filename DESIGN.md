# The website — design brief

Decided 2 September 2026, the day before the move. Written down because a
dozen decisions made in one conversation do not survive a house move otherwise.

---

## The thesis

**The website is the city.**

The inspiration list — `igloo.inc`, `staratlas.com`, `kprverse.com`,
`2019.makemepulse.com`, `messenger.abeto.co` — is a list of WebGL worlds built
to *look* like somewhere. SITS already **is** somewhere: a night city, a
daytime city you drive through, a penthouse, a market, a cinema lobby, an
arcade, with the real tools living inside them.

So the page does not imitate those sites. It shows the thing they are
approximating. Scrolling moves through the city, and each district is a section
of the argument — what this is, who it's for, the price, the honest part — as
places you arrive at rather than blocks stacked on a background.

**No competitor can copy this**, because the asset is the product.

## The one rule that outranks the thesis

From the research: a visitor decides in **two seconds**. Clarity comes before
creativity, always. Immersion has to *carry* the message, never replace it.

If a scroll effect makes the headline harder to read, the scroll effect loses.

## Decisions (Chris, 2 Sep)

| | |
|---|---|
| **Aesthetic** | Full immersion. Boots like the app, CRT flicker, pixel type throughout. |
| **Colour** | Green — phosphor, matching the app. The gold-block "S" is the logo. |
| **The one CTA** | Download. One destination, repeated, never a second option. |
| **Model** | 14-day trial, everything unlocked. No free tier. Premium/VIP for higher AI limits comes later. |
| **Hero line** | "The game for running a YouTube channel." |
| **Positioning** | The game framing leads; "replaces ~$52/mo of tools" carries the practical value. |
| **Hero clip** | The night-city reveal. |
| **Sendy** | Appears once, as a character. Not a guide down the page. |
| **Founder** | Not visible yet. No photo, no byline. Revisit when actively marketing. |
| **Mobile** | Desktop is the full experience. Mobile gets a clean, simple fallback — not a cut-down port of the immersive version. |
| **Sound** | Muted by default, with an unmute toggle. |
| **Launch** | Held until the site is right. Paddle waits too (Chris's call, 2 Sep). |

## How it gets built

**Scroll-scrubbed video, not live WebGL.** The footage already exists, it runs
on any machine, and it is how most of the award-winning sites on that list
actually work underneath. A real Three.js port would take weeks and would fight
us on every laptop that isn't a gaming rig.

Twelve clips, 1920×1080, ~2.5 minutes total, in `C:\Medal\Edits`:

| # | What it shows | Length |
|---|---|---|
| 01 | Boot — the pixel "S" assembling on a starfield | 9.1s |
| 02 | **Night city reveal — THE HERO** | 17.1s |
| 03 | Night city, channel picker | 7.6s |
| 04 | Daytime city, channel names on the buildings | 25.4s |
| 05 | Focus timer | 14.9s |
| 06 | Production pipeline | 8.5s |
| 07 | The Penthouse — office interior | 18.2s |
| 08 | The Market — shop interior | 8.6s |
| 09 | Civic Works / district upgrades | 4.2s |
| 10 | Street-level drive through the city | 11.7s |
| 11 | The Lobby — cinema interior | 14.8s |
| 12 | Arcade | 9.3s |

## What the page has to do without

**No testimonials, no customers, no logos.** The research is blunt that social
proof beats design and it is not close — the only question a visitor has is
*"has this worked for someone like me?"* and there is currently no answer.

Three substitutes carry that weight instead:

1. **The trial.** They do not have to believe the page; they can run the thing.
2. **The honest section.** Telling people the bad parts unprompted is a trust
   signal that needs nobody else's permission.
3. **A refund with no conditions.** The risk sits with the seller.

**The first real testimonial will be Brendon's.** Everything else on this page
is a claim; that would be evidence.

## Order of the page

Unchanged from `LANDING-COPY.md`, because order is the thing that converts:

> what → who → proof → the swap → the price → the flaws → the trial → the refund

Nothing above the price asks for money. Everything below it removes a reason
not to buy.

## Open

- [ ] Phone number for the contact page — still `[NUMBER]`, blocks publishing
- [ ] Which district maps to which section
- [ ] Whether the boot sequence plays on every visit or only the first
- [ ] Loading: the city is heavy, and a loading screen is an opportunity, not a cost
