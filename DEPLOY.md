# Putting the site live

Everything here is done once. After that, publishing a change is three
commands (see README).

---

## 1 · Make the GitHub account

<https://github.com/signup> — use **sendittosociety@gmail.com**.

**The username must be `sendittosociety`.** This is not a preference — the app
already ships with its update feed pointed at `github.com/sendittosociety/sits-releases`
(`build.publish` in package.json). A different username means editing that and
rebuilding. If it is taken, tell me and I will change the config to match
whatever you get instead.

**Turn on 2FA immediately.** Settings → Password and authentication. Same
reasoning as Porkbun: this account will hold the app's update feed.

---

## 2 · Create two repositories

| Repo | Visibility | What goes in it |
|---|---|---|
| `sendittosociety.com` | **Public** | This folder. The site is public anyway. |
| `sits-app` | **Private** | The application source. Nobody sees it. |
| `sits-releases` | **Public** | Installers only, no code. This is the update feed the shipped app already looks at, and it must be public or customers' update checks fail. |

Create both **empty** — no README, no .gitignore, no licence. Both folders
already have those, and letting GitHub add its own creates a conflict on the
first push.

---

## 3 · Push the site

From this folder:

```
git remote add origin https://github.com/USERNAME/sendittosociety.com.git
git branch -M main
git push -u origin main
```

GitHub will ask you to sign in the first time. It wants a **Personal Access
Token**, not your password — the browser prompt handles this for you.

---

## 4 · Switch Pages on

In the repo: **Settings → Pages**.

- Source: **Deploy from a branch**
- Branch: **main**, folder **/ (root)**, Save

The `CNAME` file in this folder means GitHub already knows the custom domain is
`sendittosociety.com`. It will say the DNS check is failing. That is expected —
DNS is the next step.

---

## 5 · Point the domain at it

Porkbun → **Domain Management** → `sendittosociety.com` → **DNS**.

**Delete Porkbun's default records first.** A new domain ships with A and CNAME
records aimed at their parking page; leaving them in place fights the ones below.

Then add these. Type / Host / Answer:

```
A       (blank)   185.199.108.153
A       (blank)   185.199.109.153
A       (blank)   185.199.110.153
A       (blank)   185.199.111.153
AAAA    (blank)   2606:50c0:8000::153
AAAA    (blank)   2606:50c0:8001::153
AAAA    (blank)   2606:50c0:8002::153
AAAA    (blank)   2606:50c0:8003::153
CNAME   www       USERNAME.github.io
```

All four A records are GitHub's, and all four are needed — they are redundant
servers, not alternatives.

---

## 6 · Wait, then force HTTPS

DNS takes anywhere from ten minutes to a few hours. Once **Settings → Pages**
stops complaining, tick **Enforce HTTPS**.

That checkbox is greyed out until GitHub has issued the certificate, and it
cannot issue one until DNS resolves. If it is grey, the answer is always "wait
longer," never "something is broken."

---

## Before this is a page you'd want a stranger to read

- [ ] Screenshot in place of the placeholder in `index.html`
- [ ] Phone number on the contact page — currently `[NUMBER]`
- [ ] Paddle checkout link on the Buy button — currently `href="#"`
