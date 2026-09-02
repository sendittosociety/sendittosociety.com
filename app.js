/* ── SEND IT TO SOCIETY ───────────────────────────────────────────────────────
   A scroll-driven walk through the city. Each [data-scene] pins a video and
   scrubs it by scroll position; copy layers inside a scene fade in and out
   across their own slice of that scene.

   THREE THINGS THIS FILE REFUSES TO DO, each learned the hard way:

   1. It does not depend on requestAnimationFrame. rAF is suspended in hidden
      and background tabs, and an earlier version put the copy fades inside a
      rAF loop — so a page opened in a background tab rendered no headline at
      all. Scroll events are already rate-limited; the work runs inline.

   2. It does not snapshot the breakpoint. Reading the media query once at load
      meant opening the site narrow and maximising left you in the mobile
      fallback permanently. The query is asked every frame.

   3. It is not load-bearing for the sale. Every headline ships visible in the
      HTML. If this file fails to parse, is blocked, or the videos never load,
      the page is still a readable sales page with poster stills behind it.
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
      loaded: false
    }
  })

  function sceneProgress(sc) {
    var r = sc.el.getBoundingClientRect()
    var travel = sc.el.offsetHeight - window.innerHeight
    if (travel <= 0) return 0
    var p = -r.top / travel
    return p < 0 ? 0 : p > 1 ? 1 : p
  }

  /* Load a scene's video only when it is nearly on screen. The hero carries
     data-eager so the first thing a visitor sees is never waiting on a scroll. */
  function maybeLoad(sc) {
    if (sc.loaded || !sc.video) return
    var src = sc.video.getAttribute('data-src')
    if (!src) { sc.loaded = true; return }
    var r = sc.el.getBoundingClientRect()
    var near = r.top < window.innerHeight * 1.6 && r.bottom > -window.innerHeight * 0.6
    if (!near && !sc.video.hasAttribute('data-eager')) return
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
      el.classList.toggle('on', p >= from && p <= to)
    }
  }

  var lastPaint = 0
  function paint() {
    for (var i = 0; i < scenes.length; i++) {
      var sc = scenes[i]
      maybeLoad(sc)
      var p = sceneProgress(sc)

      if (isPhone()) {
        /* Phones get the poster still and every layer readable in flow. */
        for (var j = 0; j < sc.layers.length; j++) sc.layers[j].classList.add('on')
        continue
      }

      paintLayers(sc, p)

      var v = sc.video
      if (!v || !v.duration || isNaN(v.duration)) continue
      /* Every frame is a keyframe, so a direct seek lands instantly and needs
         no easing to hide latency. */
      var t = p * (v.duration - 0.05)
      if (Math.abs(v.currentTime - t) > 0.02) {
        try { v.currentTime = t } catch (e) {}
      }
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
  scenes.forEach(function (sc) {
    if (sc.video) sc.video.addEventListener('loadedmetadata', paint)
  })
  paint()

  /* ── SOUND ──────────────────────────────────────────────────────────────────
     Muted by default and only ever started by a click. Browsers block
     unprompted audio, and rightly — a website that makes noise at a stranger
     without being asked is a website they close. */
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
        /* fade up, so it arrives rather than starts */
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
