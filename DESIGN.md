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

**Revised 2 Sep — the trailer cut.** Chris: *"the journey feels a little too
long. make it more compact and simplified, seamless. i almost want it to feel
like a hype game trailer or announcement."*

The page had been alternating scene / band / scene / band, so the trailer kept
stopping to explain itself. It is now two acts:

> **ACT I · THE CITY** hero → day one → **the climb** → theater → the shop → send it → **end card**
> **ACT II · UNDER THE HOOD** the datasheet → the swap → the price (trial + refund + who folded in) → the flaws

Six scenes with nothing between them, then a card that gives the page a visible
finish, then the facts for anyone the trailer sold. Scene scroll went from
2400vh to 1700vh; two whole bands were folded away.

**The acts are now stated, not implied.** The rail groups every stop under ACT I
or ACT II, the end card is marked END OF ACT I and points at Act II by name, and
Act II opens on its own stamp instead of simply beginning.

**THE ARCADE was cut** — Chris's call, it stays a thing you find rather than a
thing you're sold.

### UNDER THE HOOD

Act II is a **datasheet, not a brochure.** Chris: *"i want the under the hood
section to be really in depth and technological for anyone, really breaking down
the features of the app."*

Twelve tools, and each answers the same three questions in the same order:
**WHAT IT IS / HOW YOU'D USE IT / UNDER THE HOOD.** The third line is the one
that has to be true, so every one of them was read out of the app rather than
written from memory — the seven pipeline stages from `lib/pipeline.ts`, the
S-grade threshold of 92 from `lib/hookForge.ts`, the five scoring categories
from `lib/verdictPrompt.ts` and `lib/scoringV7.ts`, the sound providers from
`main/soundScout.ts`, the READ → DO → QUIZ shape from `lib/academy.ts`.

Act I got shorter so Act II could get longer. That is the right trade: the
trailer is what sells, the datasheet is what someone reads once they are already
leaning in, and nobody scrolls it who has not decided to.

**Fourteen now, and every one has a real screen.** Chris captured the eight
missing tools on 2 Sep; Health (whose shot had been sitting unused) and The
Arcade (recovered from git after the scene was cut) joined them.

**Collapsed by default**, built on `<details>`/`<summary>` rather than a scripted
accordion — it opens with JavaScript off, the keyboard and screen readers get
correct behaviour for free, and the browser owns the open state. Shut, the whole
section is fourteen readable rows; opened, each is the full sheet. The first
ships open so the shape is obvious without a click, and one OPEN ALL button
saves anyone fourteen clicks. Any toggle re-runs `measure()`, or the rail starts
pointing at the wrong chapter.

Open, the page is 29.7 screens. Shut, 23.3.

### The plates, and where the sharpness actually went

The scroll plates looked soft and the instinct was that they needed more
resolution. **They did not.** Measured on the bedroom whiteboard, from the same
source second, three ways:

| | bitrate | result |
|---|---|---|
| what shipped — crop 1550 upscaled to 1600, crf 31 | 0.47 MB/s | *"of the empire"* unreadable |
| same framing, crf 23 + unsharp | 1.23 MB/s | reads cleanly |
| native 1700 crop, crf 23 + unsharp | 1.52 MB/s | no better than the row above |

So it was **bitrate, not pixels** — which is lucky, because it means every scene
keeps the framing it was approved with. `tools/encode-plates.sh` re-encodes from
source at one crf for all six plates (crf is a quality target, so one value gives
uniform *quality* across a still penthouse and a moving drive; one bitrate would
do the opposite).

**crf 31 is where the curve bends.** On the hero's COMICSNEXT tower, 26 is
sharper by an amount nobody will see and costs 82 MB for 34 seconds; at 35 the
tower windows smear together and the sign goes mushy.

The in-points for hero, empty and penthouse were never written down, so they were
recovered by SSIM-matching each shipped plate's first frame back against its
source and taking the peak.

**Then the 2× pixel grid, over everything.** Six of the seven plates were
already pixelated by the app's own render pass; the shop's UI panel was the one
that wasn't, and that was the actual inconsistency. A hard 2× grid across all
seven settles it — the 3D scenes barely change because their pixels are already
there, and the shop stops being the odd one out. Chris's call, made knowing it
costs some catalogue legibility.

Sharpen *before* the downsample so edges survive it; `area` going down (averages,
no aliasing) and `neighbor` coming back up (hard block edges, which is the
point); rgb24 through the middle because the halved height is odd on four of the
seven plates and yuv420p will not carry an odd dimension.

It pays for itself too: a hard grid has a quarter of the unique detail to
encode, so the files come back much smaller at the same crf. That is what
stopped the drive plate stalling — at 21 MB it was the last thing to download
and froze on its last buffered frame, which reads as a still image rather than
a video.

**TRAP, and it cost a whole encode run.** The grid helper began
`[ "$PIXEL" = "1" ] && return`. When the test fails, that AND-list fails, and
under `set -e` a failing list kills the command-substitution subshell *before*
`printf` runs — so `grid()` returned an empty string, every plate encoded with
no grid at all, and the sizes came back byte-identical to the run before. Silent,
and it looked exactly like the filter having no effect. An `if` block cannot fail
that way.

**THE CEILING IS NOT IN THIS REPO.** Medal is set to `"resolution":"FULL_HD"`, so
it downscales the 2560×1392 app window to 1974×1080 before any of this runs —
a third of the picture thrown away at capture, and the reason the site still
upscales 1.5× on a 1440p monitor. Set Medal to 1440p, re-record, re-run the
script.

**The theater has no source left.** Only its already-compressed 1600px plate
survives, and re-encoding that cannot put back what was thrown away. It is the
one plate that needs re-recording rather than re-encoding.

### THE CLIMB

The centrepiece, and the one scene that holds two videos. The bedroom plays
across the first half of the scroll and the penthouse across the second, so one
gesture carries you from day one to the top floor. Underneath, the nine tiers
light in order, the one you are standing on lifts, and its building line comes
with it — Iron's empty lot through Icon's city wonder.

Colours and building lines come from the app's own `TIERS` table
(`src/renderer/src/lib/rank.ts`), so the site and the product cannot drift on
what Gold looks like. All nine lines ship in the HTML; only classes move, and
only when the tier changes. **Only the visible plate is ever seeked** — two
seeks in one frame is ~18 ms against a 16.7 ms budget, and the outgoing plate
frozen on its last frame is what a dissolve wants anyway.

The conversion order survives intact — what → who → proof → the swap → the
price → the flaws → the trial → the refund — because nothing above the price
asks for money and everything below it removes a reason not to buy. The trial
and the refund now sit *inside* the price box rather than trailing it, which
puts every reason-not-to-worry in the same frame as the number.

A chapter rail runs down the right edge during Act I. "Too long" is mostly not
knowing where you are; seven labelled stops turn an unknown scroll into a known
one.

## Open

- [ ] Phone number for the contact page — still `[NUMBER]`, blocks publishing
- [ ] Which district maps to which section
- [ ] Whether the boot sequence plays on every visit or only the first
- [ ] Loading: the city is heavy, and a loading screen is an opportunity, not a cost
