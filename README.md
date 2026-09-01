# sendittosociety.com

The public website for SITS. Static HTML, no build step for the landing page,
served free by GitHub Pages at **https://sendittosociety.com**.

## Files

| File | What it is |
|---|---|
| `index.html` | The landing page. Edit directly. |
| `style.css` | One stylesheet for every page. |
| `terms.html` `privacy.html` `refund.html` `contact.html` | **Generated — do not edit these.** |
| `build.py` | Regenerates the four legal pages. |
| `CNAME` | Tells GitHub Pages which domain to serve. Do not delete. |

## Changing the legal pages

The legal text lives in `../sits-app/site/*.md`. That is the single source of
truth. Edit the markdown, then:

```
python build.py
```

The script rewrites the four HTML pages and warns about any unfilled
placeholder. Editing the `.html` directly will be silently overwritten the next
time the script runs.

## Publishing a change

```
git add -A
git commit -m "what changed"
git push
```

GitHub Pages redeploys in about a minute.

## Still to do

- [ ] Real screenshot in place of the placeholder in `index.html`
- [ ] Phone number on the contact page (currently `[NUMBER]`)
- [ ] Paddle checkout link on the Buy button (currently `href="#"`)
