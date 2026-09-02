/* ── SEND IT TO SOCIETY ───────────────────────────────────────────────────────
   Two things happen here: a boot sequence, and a video whose TIME is driven by
   scroll position instead of by playing.

   Everything degrades to a readable page. If the video never loads, if JS
   throws, if the device is a phone — the poster still and the copy are already
   in the DOM and already legible. Nothing below is load-bearing for the sale.
   ─────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict'

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* The breakpoint is LIVE, not a snapshot. Reading it once at load meant that
     opening the site in a narrow window and then maximising left you in the
     mobile fallback forever — no video, no scrub, no way back short of a
     reload. Same for a tablet rotating. Ask the query every frame instead. */
  var mqPhone = window.matchMedia('(max-width: 820px)')
  function isPhone() { return mqPhone.matches }

  /* ── BOOT ─────────────────────────────────────────────────────────────────
     Once per session, so the visit that actually buys — usually the second —
     is not gated behind a cutscene. */
  var boot = document.getElementById('boot')
  var log = document.getElementById('bootlog')
  var bar = document.querySelector('.boot-bar i')
  var skip = document.getElementById('bootskip')

  var LINES = [
    'SEND_IT_TO_SOCIETY v1.0',
    'mounting studio ..................... OK',
    'loading city ........................ OK',
    'no account required ................. OK',
    'nothing leaves this machine ......... OK',
    '',
    'READY.'
  ]

  function endBoot() {
    if (!boot || boot.classList.contains('gone')) return
    boot.classList.add('gone')
    try { sessionStorage.setItem('sits_booted', '1') } catch (e) {}
    setTimeout(function () { if (boot) boot.remove() }, 700)
  }

  var seen = false
  try { seen = sessionStorage.getItem('sits_booted') === '1' } catch (e) {}

  if (!boot) {
    /* nothing to do */
  } else if (seen || reduce) {
    boot.remove()
  } else {
    if (skip) skip.addEventListener('click', endBoot)
    var i = 0
    var step = function () {
      if (i < LINES.length) {
        log.textContent += (i ? '\n' : '') + LINES[i]
        if (bar) bar.style.width = Math.round(((i + 1) / LINES.length) * 100) + '%'
        i++
        setTimeout(step, i === LINES.length ? 420 : 190)
      } else {
        setTimeout(endBoot, 380)
      }
    }
    setTimeout(step, 260)
    /* A boot that can hang is worse than no boot. */
    setTimeout(endBoot, 6000)
  }

  /* ── SCROLL-SCRUBBED HERO ─────────────────────────────────────────────────
     The video is encoded with every frame a keyframe, which is what makes
     seeking instant. currentTime is only written inside rAF and only when it
     has actually moved — writing it per scroll event stutters badly. */
  var vid = document.getElementById('cityvid')
  var scroller = document.querySelector('.hero-scroll')
  var copies = [].slice.call(document.querySelectorAll('.hero-copy'))

  function progress() {
    if (!scroller) return 0
    var r = scroller.getBoundingClientRect()
    var travel = scroller.offsetHeight - window.innerHeight
    if (travel <= 0) return 0
    var p = -r.top / travel
    return p < 0 ? 0 : p > 1 ? 1 : p
  }

  /* Copy layers fade in and out across their own slice of the scroll. This
     runs even without video, so the words never depend on the picture. */
  function paintCopy(p) {
    for (var n = 0; n < copies.length; n++) {
      var el = copies[n]
      var from = parseFloat(el.getAttribute('data-from') || '0')
      var to = parseFloat(el.getAttribute('data-to') || '1')
      var on = p >= from && p <= to
      el.classList.toggle('on', on)
    }
  }

  var target = 0
  var current = 0
  var ready = false
  var ticking = false

  if (vid) {
    var onMeta = function () {
      ready = true
      /* Nudge the first frame in so it is decoded and painted before scrolling. */
      try { vid.currentTime = 0.001 } catch (e) {}
      request()
    }
    if (vid.readyState >= 1) onMeta()
    else vid.addEventListener('loadedmetadata', onMeta)
  }

  /* NOT DRIVEN BY requestAnimationFrame.
     rAF is suspended in background and hidden tabs, and an earlier version of
     this file put BOTH the video seek and the copy fade inside a rAF loop —
     which meant a page loaded out of view rendered no headline at all until it
     was focused. Scroll events are already rate-limited by the browser and the
     work below is a couple of class toggles plus one seek, so it runs inline
     and the page is never one throttled callback away from being blank. */
  var lastPaint = 0

  function paint() {
    var p = progress()

    /* On a phone the copy is laid out in flow and always visible; forcing the
       first layer on keeps it readable if the CSS ever changes underneath. */
    if (isPhone()) {
      if (copies[0]) copies[0].classList.add('on')
      return
    }

    paintCopy(p)
    if (!vid || !ready || !vid.duration) return

    /* The clip is encoded with every frame a keyframe, so a direct seek lands
       immediately and needs no easing to hide latency. */
    var t = p * (vid.duration - 0.05)
    if (Math.abs(vid.currentTime - t) > 0.02) {
      try { vid.currentTime = t } catch (e) {}
    }
  }

  function request() {
    var now = (window.performance && performance.now) ? performance.now() : Date.now()
    if (now - lastPaint < 16) return
    lastPaint = now
    paint()
  }

  window.addEventListener('scroll', request, { passive: true })
  window.addEventListener('resize', request)
  if (mqPhone.addEventListener) mqPhone.addEventListener('change', request)
  document.addEventListener('visibilitychange', paint)
  paint()
})()
