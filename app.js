/* ── SEND IT TO SOCIETY ───────────────────────────────────────────────────────
   A scroll-driven walk through the city. Each [data-scene] pins a video and
   scrubs it by scroll position; copy layers inside a scene fade across their
   own slice of that scene.

   SMOOTHNESS IS THE BRIEF, and it is won or lost in three places:

   1. THE ENCODE. Every frame is a keyframe. Measured in this browser: a
      12-frame keyframe group costs 35 ms per seek, all-keyframe costs 7.8 ms,
      and the 60 fps budget is 16.7 ms. No amount of clever JS rescues a file
      that cannot be seeked in time.

   2. NO EASING. An earlier version eased currentTime toward a target, which
      meant ten seeks per gesture instead of one. Easing exists to hide slow
      seeks; once seeks are fast it is pure cost, and tracking the scroll
      exactly is what actually feels right.

   3. NO LAYOUT READS WHILE SCROLLING. getBoundingClientRect() on five scenes
      per scroll event forces five synchronous layouts. Offsets are measured
      once and recomputed only on resize; scrolling reads nothing but scrollY.

   And three things this file refuses to do, each learned the hard way:
   it does not depend on requestAnimationFrame (suspended in hidden tabs), it
   does not snapshot the breakpoint (a maximised window must leave the mobile
   fallback), and it is not load-bearing for the sale — every headline ships
   visible in the HTML.
   ─────────────────────────────────────────────────────────────────────────── */

(function () {
  'use strict'

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var mqPhone = window.matchMedia('(max-width: 820px)')
  function isPhone() { return mqPhone.matches }

  /* ── BOOT ───────────────────────────────────────────────────────────────── */
  var boot = document.getElementById('boot')
  var bootlog = document.getElementById('bootlog')
  var bootbar = document.querySelector('.boot-bar i')
  var bootskip = document.getElementById('bootskip')

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
    setTimeout(function () { if (boot && boot.parentNode) boot.parentNode.removeChild(boot) }, 700)
  }

  var booted = false
  try { booted = sessionStorage.getItem('sits_booted') === '1' } catch (e) {}

  if (boot && (booted || reduce)) {
    boot.parentNode.removeChild(boot)
  } else if (boot) {
    if (bootskip) bootskip.addEventListener('click', endBoot)
    boot.addEventListener('click', endBoot)
    var li = 0
    var tick = function () {
      if (li < LINES.length) {
        bootlog.textContent += (li ? '\n' : '') + LINES[li]
        if (bootbar) bootbar.style.width = Math.round(((li + 1) / LINES.length) * 100) + '%'
        li++
        setTimeout(tick, li === LINES.length ? 400 : 175)
      } else {
        setTimeout(endBoot, 360)
      }
    }
    setTimeout(tick, 240)
    setTimeout(endBoot, 6000)   /* a boot that can hang is worse than no boot */
  }

  /* ── SCENES ─────────────────────────────────────────────────────────────── */
  var scenes = [].slice.call(document.querySelectorAll('[data-scene]')).map(function (el) {
    return {
      el: el,
      video: el.querySelector('video'),
      layers: [].slice.call(el.querySelectorAll('.layer')),
      loaded: false,
      top: 0,
      h: 0
    }
  })

  /* Measured once, and again only on resize. Nothing here runs during a scroll. */
  function measure() {
    var y = window.pageYOffset || document.documentElement.scrollTop
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i]
      sc.top = sc.el.getBoundingClientRect().top + y
      sc.h = sc.el.offsetHeight
    }
  }

  function maybeLoad(sc) {
    if (sc.loaded || !sc.video) return
    var src = sc.video.getAttribute('data-src')
    if (!src) { sc.loaded = true; return }
    sc.video.setAttribute('src', src)
    sc.video.removeAttribute('data-src')
    sc.video.load()
    sc.loaded = true
  }

  function paintLayers(sc, p) {
    for (var i = 0; i < sc.layers.length; i++) {
      var el = sc.layers[i]
      var from = parseFloat(el.getAttribute('data-from') || '0')
      var to = parseFloat(el.getAttribute('data-to') || '1')
      var on = p >= from && p <= to
      /* Touch the class list only on a real change — toggling every frame
         invalidates style for nothing. */
      if (el.classList.contains('on') !== on) el.classList.toggle('on', on)
    }
  }

  /* NEVER SEEK PAST WHAT HAS DOWNLOADED.
     Decode is fast, but asking for a second that has not arrived yet costs
     ~300 ms of stall while the browser fetches it — measured, and it is the
     only remaining source of jank. So the picture is clamped to the buffered
     edge instead: scrolling ahead of the download holds on the last real frame
     and catches up on its own, which reads as the video lagging slightly
     rather than the PAGE freezing. Those are very different feelings. */
  function clampToBuffered(v, t) {
    var b = v.buffered
    if (!b || !b.length) return v.currentTime
    for (var i = 0; i < b.length; i++) {
      if (t >= b.start(i) - 0.05 && t <= b.end(i)) return t
    }
    /* Not in any buffered range — hold at the end of the range we are in. */
    var cur = v.currentTime
    for (var j = 0; j < b.length; j++) {
      if (cur >= b.start(j) - 0.05 && cur <= b.end(j)) {
        return t > cur ? Math.max(b.start(j), b.end(j) - 0.08) : Math.min(b.end(j), b.start(j) + 0.02)
      }
    }
    return cur
  }

  function paint() {
    var y = window.pageYOffset || document.documentElement.scrollTop
    var vh = window.innerHeight
    var phone = isPhone()

    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i]

      /* Cached numbers only — no getBoundingClientRect, so no forced layout. */
      var near = sc.top < y + vh * 1.6 && sc.top + sc.h > y - vh * 0.6
      if (near) maybeLoad(sc)

      if (phone) {
        for (var j = 0; j < sc.layers.length; j++) sc.layers[j].classList.add('on')
        continue
      }
      if (!near) continue

      var travel = sc.h - vh
      var p = travel > 0 ? (y - sc.top) / travel : 0
      if (p < 0) p = 0; else if (p > 1) p = 1

      paintLayers(sc, p)

      var v = sc.video
      if (!v || !v.duration || isNaN(v.duration)) continue
      var t = clampToBuffered(v, p * (v.duration - 0.05))
      /* Track the scroll exactly. Every frame is a keyframe, so this lands in
         about 8 ms — well inside a 60 fps frame — and no easing is needed. */
      if (Math.abs(v.currentTime - t) > 0.015) {
        try { v.currentTime = t } catch (e) {}
      }
    }
  }

  /* rAF coalesces to at most one paint per frame. If rAF never fires — hidden
     tab, throttled context — the timestamp fallback keeps the page correct. */
  var queued = false
  var rafAlive = false
  var lastDirect = 0

  function flush() { queued = false; rafAlive = true; paint() }

  function onScroll() {
    if (!queued) { queued = true; requestAnimationFrame(flush) }
    if (!rafAlive) {
      var now = (window.performance && performance.now) ? performance.now() : Date.now()
      if (now - lastDirect >= 16) { lastDirect = now; paint() }
    }
  }

  function onResize() { measure(); paint() }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)
  if (mqPhone.addEventListener) mqPhone.addEventListener('change', onResize)
  document.addEventListener('visibilitychange', paint)
  scenes.forEach(function (sc) {
    if (sc.video) sc.video.addEventListener('loadedmetadata', paint)
  })
  window.addEventListener('load', onResize)

  measure()
  paint()

  /* ── SOUND ──────────────────────────────────────────────────────────────────
     Muted by default and only ever started by a click. A site that makes noise
     at a stranger unasked is a site they close. */
  var snd = document.getElementById('sound')
  var amb = document.getElementById('amb')
  if (snd && amb) {
    var on = false
    snd.addEventListener('click', function () {
      on = !on
      snd.setAttribute('aria-pressed', on ? 'true' : 'false')
      snd.classList.toggle('on', on)
      snd.querySelector('.lbl').textContent = on ? 'SOUND ON' : 'SOUND OFF'
      if (on) {
        amb.volume = 0
        var pr = amb.play()
        if (pr && pr.catch) pr.catch(function () {})
        var step = 0
        var up = setInterval(function () {
          step++
          amb.volume = Math.min(0.5, step * 0.04)
          if (step >= 13) clearInterval(up)
        }, 60)
      } else {
        amb.pause()
      }
    })
  }
})()
