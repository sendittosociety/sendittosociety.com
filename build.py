#!/usr/bin/env python3
"""Build the legal pages from the markdown sources in sits-app/site/.

One source of truth: edit the .md, run `python build.py`, the .html regenerates.
Handles only the subset of markdown those documents actually use.
"""
import html
import re
import sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "sits-app" / "site"
OUT = Path(__file__).resolve().parent

PAGES = [
    ("terms.md",          "terms.html",   "Terms & Conditions"),
    ("privacy-policy.md", "privacy.html", "Privacy Policy"),
    ("refund-policy.md",  "refund.html",  "Refund Policy"),
    ("contact.md",        "contact.html", "Contact"),
]

SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} — Send It To Society</title>
<meta name="robots" content="index,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Share+Tech+Mono&display=swap">
<link rel="stylesheet" href="style.css">
</head>
<body>

<header class="top">
  <div class="wrap">
    <a class="brand" href="/"><span class="dot"></span> Send It To Society</a>
    <nav class="topnav">
      <a href="terms.html">Terms</a>
      <a href="privacy.html">Privacy</a>
      <a href="refund.html">Refunds</a>
      <a href="contact.html">Contact</a>
    </nav>
  </div>
</header>

<main class="wrap legal">
{body}
</main>

<footer>
  <div class="wrap">
    <div class="links">
      <a href="/">Home</a>
      <a href="terms.html">Terms</a>
      <a href="privacy.html">Privacy</a>
      <a href="refund.html">Refunds</a>
      <a href="contact.html">Contact</a>
    </div>
    <p style="margin:0">Send It To Society — made by Christopher Leon Gales, one person, in Colorado.<br>
    Payments handled by Paddle.com Market Ltd, merchant of record.</p>
  </div>
</footer>

</body>
</html>
"""


def inline(text):
    """Escape, then apply inline markdown. Order matters: bold before italic."""
    t = html.escape(text, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', t)
    # Linkify the support address so the contact page is actually usable.
    t = t.replace("sendittosociety@gmail.com",
                  '<a href="mailto:sendittosociety@gmail.com">sendittosociety@gmail.com</a>')
    return t


def convert(md):
    # Drop HTML comments — they hold internal notes that must not ship.
    md = re.sub(r"<!--.*?-->", "", md, flags=re.S)
    lines = md.split("\n")
    out, buf, li = [], [], []

    def flush_p():
        if buf:
            out.append("<p>" + inline(" ".join(buf).strip()) + "</p>")
            buf.clear()

    def flush_li():
        if li:
            out.append("<ul>" + "".join(f"<li>{inline(x)}</li>" for x in li) + "</ul>")
            li.clear()

    first_h1_done = False
    updated_done = False

    for raw in lines:
        line = raw.rstrip()
        s = line.strip()

        if not s:
            flush_p(); flush_li(); continue

        if s.startswith("## "):
            flush_p(); flush_li()
            out.append(f"<h2>{inline(s[3:])}</h2>")
        elif s.startswith("# "):
            flush_p(); flush_li()
            out.append(f"<h1>{inline(s[2:])}</h1>")
            first_h1_done = True
        elif s == "---":
            flush_p(); flush_li()
            out.append("<hr>")
        elif s.startswith("- "):
            flush_p()
            li.append(s[2:])
        elif li and (raw.startswith("  ") or raw.startswith("	")):
            # An indented line under a list item is that item continuing onto a
            # second line, not a new paragraph. Without this the tail of every
            # wrapped bullet escapes the list and renders as loose body text.
            li[-1] += " " + s
        else:
            # The "last updated" line directly under the H1 gets its own style.
            if first_h1_done and not updated_done and s.startswith("**Send It To Society**"):
                flush_p(); flush_li()
                out.append(f'<p class="updated">{inline(s)}</p>')
                updated_done = True
                continue
            flush_li()
            buf.append(s)

    flush_p(); flush_li()
    return "\n".join(out)


def main():
    if not SRC.is_dir():
        sys.exit(f"ERROR: markdown source folder not found: {SRC}")
    warnings = []
    for src_name, out_name, title in PAGES:
        src = SRC / src_name
        if not src.is_file():
            warnings.append(f"MISSING SOURCE: {src_name}")
            continue
        md = src.read_text(encoding="utf-8-sig")
        body = convert(md)
        (OUT / out_name).write_text(
            SHELL.format(title=html.escape(title), body=body),
            encoding="utf-8", newline="\n")
        print(f"  {src_name:22s} -> {out_name}")
        for placeholder in ("[NUMBER]", "[NAME]", "[STATE]", "TODO", "TKTK"):
            if placeholder in md:
                warnings.append(f"{out_name}: unfilled placeholder {placeholder}")
    if warnings:
        print("\n  ! NEEDS ATTENTION BEFORE PUBLISHING:")
        for w in warnings:
            print(f"    - {w}")
        # A WARNING IS NOT ENOUGH. This printed "unfilled placeholder [NUMBER]"
        # on every run for days and the page still went on shipping a literal
        # [NUMBER] where Paddle requires a phone. Anything a human is expected
        # to notice every single time is something they will eventually stop
        # noticing, so this now fails the build instead of mentioning it.
        sys.exit("\n  BUILD FAILED - fill the placeholders above, then re-run.")


if __name__ == "__main__":
    print("Building legal pages...")
    main()
