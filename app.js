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

  /* ── SCENES ─────────────────────────────────────────────────────────────── */
  /* A scene can hold more than one plate. Each carries its own slice of the
     scene's progress, so THE CLIMB plays the bedroom across the first half and
     the penthouse across the second — one scroll, two rooms. */
  var scenes = [].slice.call(document.querySelectorAll('[data-scene]')).map(function (el) {
    var vids = [].slice.call(el.querySelectorAll('video')).map(function (v) {
      return {
        el: v,
        from: parseFloat(v.getAttribute('data-from') || '0'),
        to: parseFloat(v.getAttribute('data-to') || '1')
      }
    })
    return {
      el: el,
      videos: vids,
      layers: [].slice.call(el.querySelectorAll('.layer')),
      badges: [].slice.call(el.querySelectorAll('.badge')),
      lines: [].slice.call(el.querySelectorAll('.tierline')),
      shown: 0,
      tier: -1,
      loaded: false,
      top: 0,
      h: 0
    }
  })

  /* Chapters are every landmark on the page, not just the scenes — Act II's
     bands are stops on the rail too. */
  var chapters = [].slice.call(document.querySelectorAll('[data-chapter]')).map(function (el) {
    return {
      el: el,
      name: el.getAttribute('data-chapter'),
      act: el.getAttribute('data-act') || '',
      top: 0
    }
  })

  /* Measured once, and again only on resize. Nothing here runs during a scroll. */
  function measure() {
    var y = window.pageYOffset || document.documentElement.scrollTop
    var i
    for (i = 0; i < scenes.length; i++) {
      var sc = scenes[i]
      sc.top = sc.el.getBoundingClientRect().top + y
      sc.h = sc.el.offsetHeight
    }
    for (i = 0; i < chapters.length; i++) {
      chapters[i].top = chapters[i].el.getBoundingClientRect().top + y
    }
  }

  /* ── CHAPTER RAIL ─────────────────────────────────────────────────────────
     A level-select down the right edge, grouped under ACT I and ACT II. It
     exists because "the page is too long" is mostly a feeling of not knowing
     where you are — ten labelled stops turn an unknown scroll into a known one
     — and because the two-act shape is worth stating rather than implying.

     It reads only the offsets measure() already cached, and touches a class
     only when the chapter actually changes. */
  var rail = document.getElementById('rail')
  var railLinks = []
  var curChapter = -1

  function jumpTo(e) {
    e.preventDefault()
    var i = +this.getAttribute('data-i')
    window.scrollTo({ top: chapters[i].top + 2, behavior: 'smooth' })
  }

  if (rail) {
    var act = null
    for (var ri = 0; ri < chapters.length; ri++) {
      if (chapters[ri].act && chapters[ri].act !== act) {
        act = chapters[ri].act
        var hd = document.createElement('p')
        hd.className = 'ract'
        hd.textContent = 'ACT ' + act
        rail.appendChild(hd)
      }
      var a = document.createElement('a')
      a.href = '#'
      a.setAttribute('data-i', ri)
      a.innerHTML = '<span class="t"></span><span class="d"></span>'
      a.firstChild.textContent = chapters[ri].name
      a.addEventListener('click', jumpTo)
      rail.appendChild(a)
      railLinks.push({ a: a, i: ri })
    }
  }

  function paintRail(y, vh, phone) {
    /* Gone on the opening frame — the first thing anyone sees should be the
       headline, not a table of contents — and present from then on. */
    var show = !phone && y > vh * 0.55
    if (rail.classList.contains('on') !== show) rail.classList.toggle('on', show)
    if (!show) return

    var mid = y + vh * 0.5
    var idx = 0
    for (var i = 0; i < chapters.length; i++) if (chapters[i].top <= mid) idx = i
    if (idx === curChapter) return
    curChapter = idx
    for (var k = 0; k < railLinks.length; k++) {
      railLinks[k].a.classList.toggle('cur', railLinks[k].i === idx)
    }
  }

  /* WAKE A PLATE UP BEFORE IT IS EVER SHOWN.
     paint() only ever seeks the VISIBLE plate, which is right for the frame
     budget — but it meant a scene's second plate sat at currentTime 0 with no
     decoded frame at all until the instant it was faded in. It then had to
     fetch and decode from cold while already on screen, and the climb, being
     the only two-plate scene on the page, was the only place that showed:
     scroll into the penthouse and the picture was blank or stuck.

     One seek, once, as soon as metadata lands. 0.04 rather than 0 because
     seeking to the time it already reports does nothing — the browser has to
     be asked to MOVE before it will decode and present a frame. */
  function primePlate(v) {
    if (v._primed) return
    v._primed = true
    var go = function () { try { v.currentTime = 0.04 } catch (e) {} }
    if (v.readyState >= 1) go()
    else v.addEventListener('loadedmetadata', go, { once: true })
  }

  function maybeLoad(sc) {
    if (sc.loaded) return
    sc.loaded = true
    for (var i = 0; i < sc.videos.length; i++) {
      var v = sc.videos[i].el
      var src = v.getAttribute('data-src')
      if (!src) continue
      /* The markup says preload="none" so nothing downloads before it is
         wanted. Once it IS wanted we want the whole file, not the metadata:
         a plate that arrives in pieces is a plate that freezes mid-scrub. */
      v.setAttribute('preload', 'auto')
      v.setAttribute('src', src)
      v.removeAttribute('data-src')
      v.load()
      primePlate(v)
    }
  }

  /* THE CLIMB. Nine tiers lit in order as the scene scrolls, the one you are
     standing on raised, and its building line brought with it. Every line is
     already in the HTML; this only moves classes, and only when the tier
     actually changes. */
  function paintLadder(sc, p) {
    var n = sc.badges.length
    var i = Math.floor(p * n)
    if (i < 0) i = 0; else if (i > n - 1) i = n - 1
    if (i === sc.tier) return
    sc.tier = i
    for (var k = 0; k < n; k++) {
      sc.badges[k].classList.toggle('lit', k <= i)
      sc.badges[k].classList.toggle('now', k === i)
      if (sc.lines[k]) sc.lines[k].classList.toggle('on', k === i)
    }
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
      /* 2.6 viewports of warning, not 1.6. A plate that has not finished
         downloading gets held on its last buffered frame by clampToBuffered,
         which is the right failure — the page never stalls — but it reads as
         a still image rather than a video, and the last scene is where it bit:
         it is the biggest file and the one with the least runway. */
      var near = sc.top < y + vh * 2.6 && sc.top + sc.h > y - vh * 0.6
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
      if (sc.badges.length) paintLadder(sc, p)

      /* The visible plate is the last one whose slice has begun. */
      var vis = 0
      for (var q = 0; q < sc.videos.length; q++) if (p >= sc.videos[q].from) vis = q
      if (sc.videos.length > 1 && vis !== sc.shown) {
        sc.videos[sc.shown].el.classList.remove('show')
        sc.videos[vis].el.classList.add('show')
        sc.shown = vis
      }

      /* ONLY THE VISIBLE PLATE IS SEEKED. Two seeks in a frame is ~18 ms
         against a 16.7 ms budget, and the plate fading out is frozen on the
         last frame of its own slice — which is exactly what a dissolve wants
         anyway. */
      var vd = sc.videos[vis]
      if (!vd) continue
      var v = vd.el
      if (!v.duration || isNaN(v.duration)) continue
      var span = vd.to - vd.from
      var lp = span > 0 ? (p - vd.from) / span : 0
      if (lp < 0) lp = 0; else if (lp > 1) lp = 1
      var t = clampToBuffered(v, lp * (v.duration - 0.05))
      /* Track the scroll exactly. Every frame is a keyframe, so this lands in
         about 8 ms — well inside a 60 fps frame — and no easing is needed. */
      if (Math.abs(v.currentTime - t) > 0.015) {
        try { v.currentTime = t } catch (e) {}
      }
    }

    if (railLinks.length) paintRail(y, vh, phone)
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
    sc.videos.forEach(function (vd) { vd.el.addEventListener('loadedmetadata', paint) })
  })
  window.addEventListener('load', onResize)

  measure()
  paint()

  /* ── BOOT, AND THE WARM-UP ──────────────────────────────────────────────────
     The boot screen used to be decoration on a fixed timer. It is a real gate
     now: it holds until the hero has enough of itself banked to be scrubbed
     without stalling and every poster has decoded, so that the first thing
     anyone does — scroll — is smooth rather than a slideshow.

     THREE NUMBERS, each a compromise between "no lag once you are inside" and
     "do not make a stranger watch a progress bar":
       BOOT_MIN  the console sequence is part of the brand; never shorter
       BOOT_MAX  never hold anyone longer, however slow their connection
       WARM      seconds of the hero to bank before opening the door

     Then, once they are in, the remaining plates are fetched ONE AT A TIME in
     scene order. Sequential and not parallel on purpose: seven files racing
     each other means the one you are about to scroll into arrives last, which
     is exactly how the closing drive ended up frozen on its first frame. */
  var BOOT_MIN = 2400
  var BOOT_MAX = 9000
  var WARM = 8

  var boot = document.getElementById('boot')
  var bootlog = document.getElementById('bootlog')
  var bootbar = document.querySelector('.boot-bar i')
  var bootpct = document.querySelector('#bootstat b')
  var bootskip = document.getElementById('bootskip')
  var heroVid = scenes.length && scenes[0].videos.length ? scenes[0].videos[0].el : null

  var posterTotal = 0
  var posterDone = 0
  function warmPosters() {
    var seen = {}
    scenes.forEach(function (sc) {
      sc.videos.forEach(function (vd) {
        var src = vd.el.getAttribute('poster')
        if (!src || seen[src]) return
        seen[src] = 1
        posterTotal++
        var im = new Image()
        im.onload = im.onerror = function () { posterDone++ }
        im.src = src
      })
    })
  }

  /* 0 to 1. Weighted toward the hero because that is what gets scrubbed first;
     the posters matter too, since a scene whose poster has not decoded is a
     black rectangle until its video does. */
  function warmth() {
    var vid = 0
    if (heroVid && heroVid.duration) {
      var b = heroVid.buffered
      if (b.length) vid = Math.min(1, b.end(b.length - 1) / Math.min(WARM, heroVid.duration))
    }
    var pos = posterTotal ? posterDone / posterTotal : 1
    return vid * 0.7 + pos * 0.3
  }

  /* ALWAYS FETCH WHAT IS AHEAD, not what is next in the list. The first version
     of this walked the scenes in order, which meant that somebody who had
     scrolled to the fourth scene was still having their bandwidth spent on the
     first — the one they had already read past. Now it picks the nearest
     unloaded scene the reader has NOT yet gone by, and only falls back to
     something behind them when there is nothing left in front. */
  function nextToPrefetch() {
    var y = window.pageYOffset || document.documentElement.scrollTop
    var behind = -1
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].loaded) continue
      if (scenes[i].top + scenes[i].h > y) return i
      if (behind === -1) behind = i
    }
    return behind
  }

  function prefetch() {
    var i = nextToPrefetch()
    if (i < 0) return
    var sc = scenes[i]
    maybeLoad(sc)
    var started = Date.now()
    var check = function () {
      var done = true
      for (var k = 0; k < sc.videos.length; k++) {
        var v = sc.videos[k].el
        var b = v.buffered
        if (!v.duration || !b.length || b.end(b.length - 1) < v.duration - 0.4) { done = false; break }
      }
      /* Give up on a plate after 25 s rather than blocking the queue behind it
         — the next scene is more use than this one arriving complete. */
      if (done || Date.now() - started > 25000) prefetch()
      else setTimeout(check, 400)
    }
    setTimeout(check, 400)
  }

  function endBoot() {
    if (!boot || boot.classList.contains('gone')) return
    boot.classList.add('gone')
    try { sessionStorage.setItem('sits_booted', '1') } catch (e) {}
    setTimeout(function () {
      if (boot && boot.parentNode) boot.parentNode.removeChild(boot)
    }, 700)
    prefetch()
  }

  var booted = false
  try { booted = sessionStorage.getItem('sits_booted') === '1' } catch (e) {}

  warmPosters()

  if (boot && (booted || reduce)) {
    boot.parentNode.removeChild(boot)
    prefetch()
  } else if (boot) {
    if (bootskip) bootskip.addEventListener('click', endBoot)
    boot.addEventListener('click', endBoot)

    var LINES = [
      'SEND_IT_TO_SOCIETY v1.0',
      'mounting studio ..................... OK',
      'no account required ................. OK',
      'nothing leaves this machine ......... OK'
    ]
    var li = 0
    var typed = function () {
      if (li >= LINES.length) return
      bootlog.textContent += (li ? '\n' : '') + LINES[li]
      li++
      setTimeout(typed, 165)
    }
    setTimeout(typed, 200)

    var t0 = Date.now()
    var poll = setInterval(function () {
      var w = warmth()
      var el = Date.now() - t0
      /* The bar never goes backwards and never sits at zero on a slow line:
         it shows whichever of real progress or elapsed time is further along,
         so it always looks like something is happening — because it is. */
      var shown = Math.max(w, Math.min(el / BOOT_MAX, 0.97))
      if (bootbar) bootbar.style.width = Math.round(shown * 100) + '%'
      if (bootpct) bootpct.textContent = Math.round(shown * 100) + '%'
      if ((w >= 1 && el >= BOOT_MIN) || el >= BOOT_MAX) {
        clearInterval(poll)
        if (bootbar) bootbar.style.width = '100%'
        if (bootpct) bootpct.textContent = 'READY'
        setTimeout(endBoot, 420)
      }
    }, 120)
  } else {
    prefetch()
  }

  /* ── OPEN ALL ─────────────────────────────────────────────────────────────
     The datasheet is <details>, so it already works without this. Fourteen
     clicks is a lot to ask of someone who wants the whole thing, though, so
     there is one button that does it — and the offsets change when it fires. */
  var allBtn = document.getElementById('allspecs')
  if (allBtn) {
    allBtn.addEventListener('click', function () {
      var open = allBtn.getAttribute('data-open') !== 'true'
      var list = document.querySelectorAll('.spec')
      for (var i = 0; i < list.length; i++) list[i].open = open
      allBtn.setAttribute('data-open', open ? 'true' : 'false')
      allBtn.textContent = open ? 'CLOSE ALL ▴' : 'OPEN ALL ▾'
      measure()
      paint()
    })
  }
  /* Any single row opening or closing moves everything below it, so the cached
     offsets have to be rebuilt or the rail starts pointing at the wrong place. */
  document.addEventListener('toggle', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('spec')) {
      measure()
      paint()
    }
  }, true)

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

/* ── CURSOR ───────────────────────────────────────────────────────────────────
   A soft glow that follows the pointer, and a thin trail of falling glyphs
   behind it.

   THE CONSTRAINT: the scroll scrub owns the frame budget. So this writes only
   transform and opacity (both composited, neither triggers layout), spawns at
   most one glyph every 45 ms, hard-caps how many exist at once, and removes
   each one when its CSS animation ends rather than running a JS loop. On touch
   devices and under reduced-motion it does not run at all.
   ───────────────────────────────────────────────────────────────────────── */
;(function () {
  'use strict'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  if (window.matchMedia('(hover: none)').matches) return

  var glow = document.getElementById('glow')
  if (!glow) return

  var GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ01'
  var MAX_ALIVE = 70
  var MIN_GAP_MS = 14

  var alive = 0
  var lastSpawn = 0
  var gx = 0, gy = 0, tx = 0, ty = 0
  var running = false

  /* The glow lags the pointer very slightly — a dot welded to the cursor reads
     as a rendering artifact; one that trails by a few frames reads as light.
     Tightened from .18: at the smaller radius the lag was visible as a gap
     between the arrow and its own light. */
  function follow() {
    gx += (tx - gx) * 0.32
    gy += (ty - gy) * 0.32
    glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)'
    if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) requestAnimationFrame(follow)
    else running = false
  }

  function spawn(x, y) {
    if (alive >= MAX_ALIVE) return
    var el = document.createElement('span')
    el.className = 'rain'
    el.textContent = GLYPHS.charAt((Math.random() * GLYPHS.length) | 0)
    el.style.left = (x + (Math.random() * 34 - 17)) + 'px'
    el.style.top = (y + (Math.random() * 14 - 7)) + 'px'
    el.style.opacity = String(0.35 + Math.random() * 0.5)
    document.body.appendChild(el)
    alive++
    el.addEventListener('animationend', function () {
      if (el.parentNode) el.parentNode.removeChild(el)
      alive--
    })
  }

  var lastMove = 0

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return
    tx = e.clientX; ty = e.clientY
    lastMove = Date.now()
    if (!glow.classList.contains('on')) glow.classList.add('on')
    if (!running) { running = true; requestAnimationFrame(follow) }

    var now = e.timeStamp || Date.now()
    if (now - lastSpawn >= MIN_GAP_MS) { lastSpawn = now; spawn(e.clientX, e.clientY) }
  }, { passive: true })

  document.addEventListener('mouseleave', function () { glow.classList.remove('on') })
  document.addEventListener('mouseenter', function () { glow.classList.add('on') })

  /* ── HEADLINES THAT ANSWER THE POINTER ──────────────────────────────────────
     Every headline is split into characters once. When the pointer crosses one,
     a wave starts AT THE POINT IT CROSSED and travels outward — each letter's
     delay is its distance from that x. So the text reacts to where you touched
     it, not just that you touched it.

     THREE RULES, all of them the scroll scrub's doing:
     - transform only, so the wave is composited and never repaints;
     - x positions are measured once per element and cached until resize
       (a page scrolling does not move anything sideways, so they cannot go
       stale mid-gesture);
     - it fires only if the POINTER moved recently. Scrolling the page under a
       still cursor also fires pointerenter, and rippling every headline you
       drift past would be noise paid for out of the scrub's frame budget. */
  var HEADS = [].slice.call(document.querySelectorAll('.layer h1, .layer h2, .h2, .tc-name, .actstamp .an, .spec h3'))
  /* Longer than the line flash, so a re-entry cannot stack two glows. */
  var COOLDOWN = 1250

  function split(el) {
    /* Per-character spans can make a screen reader spell the line out, so the
       whole string becomes the element's accessible name first. <br> has no
       textContent, so it is turned back into the space it reads as. */
    var kids = [].slice.call(el.childNodes)
    var label = kids.map(function (n) {
      return n.nodeType === 3 ? n.nodeValue : ' '
    }).join('')
    el.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim())
    for (var i = 0; i < kids.length; i++) {
      var n = kids[i]
      if (n.nodeType !== 3) continue          /* leave <br> alone */
      /* WORDS FIRST, THEN CHARACTERS. An inline-block per character lets the
         browser break the line between any two letters — the hero headline
         came back as "YOUTUBE CHAN / NEL." Each word gets its own nowrap
         inline-block box, so breaks can still only happen at real spaces. */
      var frag = document.createDocumentFragment()
      var parts = n.nodeValue.split(/(\s+)/)
      for (var w = 0; w < parts.length; w++) {
        var word = parts[w]
        if (word === '') continue
        if (/^\s+$/.test(word)) {
          frag.appendChild(document.createTextNode(word))
          continue
        }
        var ws = document.createElement('span')
        ws.className = 'w'
        for (var c = 0; c < word.length; c++) {
          var sp = document.createElement('span')
          sp.className = 'ch'
          sp.textContent = word.charAt(c)
          ws.appendChild(sp)
        }
        frag.appendChild(ws)
      }
      el.replaceChild(frag, n)
    }
    el._chars = [].slice.call(el.querySelectorAll('.ch'))
    el._xs = null
  }

  function ripple(el, fromX) {
    var now = Date.now()
    if (el._last && now - el._last < COOLDOWN) return
    el._last = now

    if (!el._xs) {
      el._xs = el._chars.map(function (c) {
        var r = c.getBoundingClientRect()
        return r.left + r.width / 2
      })
      el._lo = Math.min.apply(null, el._xs)
      el._hi = Math.max.apply(null, el._xs)
    }

    /* A headline is a block, so its box runs the full width of the band while
       the text may sit centred in the middle of it. Entering from the edge
       would put every character the same 340 ms away and the wave would fire
       flat, so the crossing point is clamped to where the text actually is. */
    if (fromX < el._lo) fromX = el._lo
    else if (fromX > el._hi) fromX = el._hi

    var max = 0
    for (var i = 0; i < el._chars.length; i++) {
      var d = Math.min(340, Math.abs(el._xs[i] - fromX) * 0.85)
      el._chars[i].style.setProperty('--d', d.toFixed(0) + 'ms')
      if (d > max) max = d
    }

    el.classList.remove('rip')
    void el.offsetWidth                       /* restart the animation */
    el.classList.add('rip')
    clearTimeout(el._t)
    /* The line flash runs 1.15s regardless of where the wave started, so the
       class has to outlive whichever finishes last. */
    el._t = setTimeout(function () { el.classList.remove('rip') },
                       Math.max(1250, max + 700))
  }

  HEADS.forEach(function (el) {
    split(el)
    el.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return
      if (Date.now() - lastMove > 420) return
      ripple(el, e.clientX)
    })
  })

  window.addEventListener('resize', function () {
    for (var i = 0; i < HEADS.length; i++) HEADS[i]._xs = null
  })
})()
