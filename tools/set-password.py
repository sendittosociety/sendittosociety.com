#!/usr/bin/env python3
"""Set the invite pass phrase for the site.

    python tools/set-password.py "the new phrase"

Writes only the SHA-256 into gate.js, never the phrase itself, so reading the
shipped source does not hand anybody the word. Everyone already inside stays
inside only if the phrase is unchanged -- change it and every browser is asked
again, which is exactly what you want the day a link leaks.
"""
import hashlib
import re
import sys
from pathlib import Path

if len(sys.argv) < 2 or not sys.argv[1].strip():
    sys.exit('usage: python tools/set-password.py "the new phrase"')

phrase = sys.argv[1].strip()
if len(phrase) < 6:
    sys.exit("Use at least six characters. A short phrase is guessable by hand.")

digest = hashlib.sha256(phrase.encode("utf-8")).hexdigest()
gate = Path(__file__).resolve().parent.parent / "gate.js"
src = gate.read_text(encoding="utf-8")
new, n = re.subn(r"var HASH = '[0-9a-f]{64}'", f"var HASH = '{digest}'", src, count=1)
if n != 1:
    sys.exit("Could not find the HASH line in gate.js -- has it been edited?")
gate.write_text(new, encoding="utf-8", newline="\n")

print(f"\n  Pass phrase set. gate.js now carries only its hash.")
print(f"  {digest}\n")
print("  Commit and push, then tell whoever needs in.")
print("  Anyone already inside will be asked again.\n")
