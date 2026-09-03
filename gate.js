/* ── THE DOOR ─────────────────────────────────────────────────────────────────
   An invite gate for the private beta. One password, shared with whoever Chris
   wants inside, remembered per browser once entered.

   BE CLEAR ABOUT WHAT THIS IS. GitHub Pages is a static host: there is no
   server to check anything, so this runs in the visitor's own browser and a
   determined person can open the developer console and walk straight past it.
   What it genuinely stops is the case that actually matters right now — a link
   forwarded to somebody who was never meant to have it, opened casually. That
   is a real audience and this is a real door for them. It is not a lock, and
   nothing here should be relied on as one.

   THE PASSWORD IS NOT IN THIS FILE. Only its SHA-256 is, so reading the source
   does not hand anybody the word. That is worth doing even for a soft gate:
   the same password may end up reused somewhere it matters more.

   NO FLASH OF CONTENT. The stylesheet hides <body> until <html> carries
   .unlocked, and this file is loaded synchronously in <head>, so the page is
   never briefly readable before the gate paints over it.

   To change the password:  python tools/set-password.py "the new one"
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict'

  var HASH = '41135b5ae45f1a8b4951be2e30e921e78301c271674896db3aac85b0b025e014'
  var KEY = 'sits_invite_v1'

  function unlock() {
    document.documentElement.classList.add('unlocked')
  }

  async function sha256(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf))
      .map(function (b) { return b.toString(16).padStart(2, '0') }).join('')
  }

  /* Already in? Let them straight through. */
  try {
    if (localStorage.getItem(KEY) === HASH) { unlock(); return }
  } catch (e) { /* private mode: they will just enter it again */ }

  /* crypto.subtle needs a secure context. On plain http (a local file, or a dev
     server) it does not exist — and a gate that cannot verify anything must not
     lock the owner out of their own site. */
  if (!window.crypto || !crypto.subtle) { unlock(); return }

  function build() {
    var wrap = document.createElement('div')
    wrap.id = 'gate'
    wrap.innerHTML =
      '<form id="gateform" autocomplete="off">' +
        '<p class="g-eyebrow">// PRIVATE BETA</p>' +
        '<h1 class="g-h1">Invite only,<br>for now.</h1>' +
        '<p class="g-sub">Send It To Society is not open yet. If you were given a ' +
          'pass phrase, this is where it goes.</p>' +
        '<div class="g-row">' +
          '<input id="gatepw" type="password" placeholder="Pass phrase" ' +
            'autocomplete="off" autocapitalize="off" spellcheck="false" autofocus>' +
          '<button type="submit">ENTER</button>' +
        '</div>' +
        '<p class="g-err" id="gateerr" hidden>That is not it. Try again.</p>' +
        '<p class="g-fine">No pass phrase? <a href="mailto:sendittosociety@gmail.com">' +
          'sendittosociety@gmail.com</a></p>' +
      '</form>'
    document.body.appendChild(wrap)

    var form = document.getElementById('gateform')
    var input = document.getElementById('gatepw')
    var err = document.getElementById('gateerr')

    form.addEventListener('submit', async function (e) {
      e.preventDefault()
      var got = await sha256(input.value.trim())
      if (got === HASH) {
        try { localStorage.setItem(KEY, HASH) } catch (e2) { /* session only */ }
        wrap.classList.add('open')
        setTimeout(function () {
          if (wrap.parentNode) wrap.parentNode.removeChild(wrap)
          unlock()
        }, 420)
      } else {
        err.hidden = false
        wrap.classList.remove('shake')
        void wrap.offsetWidth            /* restart the animation */
        wrap.classList.add('shake')
        input.select()
      }
    })
    input.focus()
  }

  if (document.body) build()
  else document.addEventListener('DOMContentLoaded', build)
})()
