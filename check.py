#!/usr/bin/env python3
"""Assert the site still has the parts that make it the site.

WHY THIS EXISTS. The cursor glow and the matrix trail shipped MISSING for a
day. A cleanup deleted a dead `.feat` rule by slicing "from .feat up to THE
LADDER", but an earlier edit had moved the ladder further down the file, so the
slice swallowed everything in between -- which was the entire cursor block. The
check written at the time confirmed the DEAD selectors were gone and never
confirmed the LIVE ones survived, which is the wrong half to verify.

So this file only ever asks one question: is the thing still there? It is
deliberately dumb. It does not parse CSS or render anything; it looks for the
handful of selectors and elements that, if they vanished, would mean something
visible had quietly stopped working.

    python check.py
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# selector / file / what a person loses if it goes missing
CSS = [
    ("#glow{",              "the cursor glow"),
    ("#glow.on",            "the glow ever becoming visible"),
    (".rain{",              "the matrix trail"),
    ("@keyframes rainfall", "the trail falling and fading"),
    (".rip .ch",            "headlines reacting to the pointer"),
    ("@keyframes chRip",    "the per-character wave"),
    ("@keyframes lineFlash", "the headline glow pulse"),
    (".scene.dual .plate",  "the climb's two plates crossfading"),
    (".badge.lit",          "rank badges lighting as you climb"),
    (".tierline.on",        "the building line for the tier you are on"),
    ("#rail.on",            "the chapter rail"),
    (".spec summary",       "the datasheet rows opening"),
    (".tall-4",             "scene heights (a missing one collapses the scene)"),
    (".tall-3",             "scene heights"),
    (".tall-25",            "scene heights"),
    (".tall-2",             "scene heights"),
    (".legal{",             "the legal pages having any layout at all"),
    (".skip{",              "the keyboard skip link"),
    (":focus-visible",      "keyboard users seeing where they are"),
]

HTML = [
    ('id="glow"',           "the glow element"),
    ('id="rail"',           "the chapter rail element"),
    ('data-scene',          "every scrubbed scene"),
    ('class="scene tall-4 dual"', "the climb being a two-plate scene"),
    ('data-src="media/bedroom.mp4"',   "the bedroom plate"),
    ('data-src="media/penthouse.mp4"', "the penthouse plate"),
    ('href="download.html"', "the download button pointing at our own page"),
    ('id="get"',            "the download button"),
]

JS = [
    ("primePlate",          "waking the hidden plate before it is shown"),
    ("clampToBuffered",     "holding on the last real frame instead of stalling"),
    ("paintLadder",         "the rank badges lighting"),
    ("nextToPrefetch",      "prefetching what is AHEAD of the reader"),
    ("isPhone",             "the live mobile breakpoint"),
]

def scan(path, checks, label):
    text = (HERE / path).read_text(encoding="utf-8")
    missing = [(n, why) for n, why in checks if n not in text]
    for n, why in checks:
        if n not in text:
            continue
    return missing


def main():
    fails = []
    total = 0
    for path, checks, label in (("style.css", CSS, "CSS"),
                                ("index.html", HTML, "HTML"),
                                ("app.js", JS, "JS")):
        total += len(checks)
        for name, why in scan(path, checks, label):
            fails.append(f"{path}: {name}  ->  lost {why}")

    # Braces, because an unbalanced stylesheet silently drops everything after
    # the break and looks exactly like "the design got worse".
    css = (HERE / "style.css").read_text(encoding="utf-8")
    total += 1
    if css.count("{") != css.count("}"):
        fails.append(f"style.css: {css.count('{')} open braces vs {css.count('}')} close")

    # Every scene must ship its first layer visible, or a JS failure means a
    # page with no words on it.
    html = (HERE / "index.html").read_text(encoding="utf-8")
    total += 1
    scenes = re.findall(r'<section class="scene[^>]*data-scene.*?</section>', html, re.S)
    for sc in scenes:
        chapter = re.search(r'data-chapter="([^"]+)"', sc)
        if '<div class="layer' in sc and 'class="layer on"' not in sc and 'layer right on' not in sc:
            fails.append(f"index.html: scene {chapter.group(1) if chapter else '?'} has no layer marked .on")

    print(f"\n  SITE CHECK - {total} things that must still be there\n")
    if fails:
        for f in fails:
            print(f"  MISSING  {f}")
        sys.exit(f"\n  {len(fails)} missing. Something visible has stopped working.\n")
    print(f"  All present across {len(scenes)} scenes.\n")


if __name__ == "__main__":
    main()
