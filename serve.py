#!/usr/bin/env python3
"""Local dev server that supports HTTP Range requests.

WHY THIS EXISTS. The hero is a video scrubbed by scroll position, which means
the browser must SEEK it. Seeking requires the server to answer Range requests
("give me bytes 400000-500000"). Python's stock http.server does not implement
them, so the video reported `seekable: [[0, 0]]`, every currentTime write
snapped back to zero, and the whole mechanic looked broken when it was not.

GitHub Pages does support ranges, so production was always going to be fine —
but a mechanic you cannot test locally is a mechanic you are shipping on faith.

    python serve.py [port]
"""

import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


class RangeHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Advertise range support, and stop the browser caching stale JS/CSS
        # while we are iterating on it.
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def guess_type(self, path):
        # GitHub Pages sends "text/html; charset=utf-8"; Python's stock server
        # sends bare "text/html" and lets the browser guess. That difference hid
        # a real mojibake bug in a page that had no charset meta of its own.
        t = super().guess_type(path)
        if t in ("text/html", "text/css", "application/javascript", "text/javascript"):
            return t + "; charset=utf-8"
        return t

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return super().send_head()

        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None

        size = os.fstat(f.fileno()).st_size
        m = RANGE_RE.match(rng.strip())
        if not m:
            f.close()
            self.send_error(400, "Malformed Range")
            return None

        start_s, end_s = m.group(1), m.group(2)
        if start_s == "":                      # suffix form: bytes=-500
            length = int(end_s or 0)
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(start_s)
            end = int(end_s) if end_s else size - 1

        if start >= size or start > end:
            f.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None

        end = min(end, size - 1)
        f.seek(start)

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return _Slice(f, end - start + 1)


class _Slice:
    """Reads at most `remaining` bytes, so copyfile stops at the range end."""

    def __init__(self, f, remaining):
        self.f = f
        self.remaining = remaining

    def read(self, n=-1):
        if self.remaining <= 0:
            return b""
        if n < 0 or n > self.remaining:
            n = self.remaining
        data = self.f.read(n)
        self.remaining -= len(data)
        return data

    def close(self):
        self.f.close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8899
    here = os.path.dirname(os.path.abspath(__file__))
    handler = partial(RangeHandler, directory=here)
    print(f"serving {here} on http://localhost:{port}  (Range requests supported)")
    ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
