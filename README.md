# writebook-ops &nbsp;📚⚙️  
Automation, CI/CD, backups & growth-hacking scripts for my self-hosted **[Writebook](https://once.com/writebook)** instance at **https://books.jakelawrence.io**.

[![CI](https://github.com/jake0lawrence/writebook-ops/actions/workflows/lint.yml/badge.svg)](https://github.com/jake0lawrence/writebook-ops/actions)  
[![Deploy](https://github.com/jake0lawrence/writebook-ops/actions/workflows/deploy.yml/badge.svg)](https://github.com/jake0lawrence/writebook-ops/actions)  
![MIT](https://img.shields.io/github/license/jake0lawrence/writebook-ops)

> **Mission:** treat writing like software — reproducible builds, Git-first content, and one-push deploys.

---

## ✨ What’s inside

| Area | Highlights |
|------|------------|
| **Docs** (`/docs/`) | Architecture, CI/CD, backup strategy, bulk importer, theming & integrations, FAQ. |
| **GitHub Actions** (`.github/workflows/`) | 🔀 Lint/test 🚀 Build + deploy ⬆️ Weekly upstream sync ☁️ Nightly S3 backup. |
| **Scripts** (`/scripts/`) | `backup.sh`, `import-chapters.js`, `teaser-maker.mjs`, `healthcheck.sh`. |
| **Cron** (`/cron/`) | Single entry that calls `backup.sh` nightly at 02:05. |
| **Dockerfile (fork)** | Builds Writebook + custom CSS + GA snippet into a tagged image. |

---

## 📂 Repository layout

```

writebook-ops/
├─ .github/workflows/   # CI jobs
├─ scripts/             # Bash / Node / Python helpers
├─ cron/                # backup schedule
├─ docs/                # deep-dive guides (see index below)
├─ .env.example         # fill & copy to .env
├─ .gitignore
├─ LICENSE              # MIT
└─ README.md

```

*Big-picture diagram lives in **`docs/00-overview.md`***  

---

## 🚀 Quick start

1. **Clone & configure**

```
   git clone git@github.com:jake0lawrence/writebook-ops.git
   cd writebook-ops
   cp .env.example .env    # fill SSH_HOST, S3_BUCKET, GA_ID, etc.
```

2. **Run local lint/tests**

   ```bash
   npm ci && npm run lint && npm test
   ```

3. **Push to `main`**

   * Lint → Build Docker → Push image to GHCR → SSH deploy → Live.
   * Markdown added to `content/` auto-imports via **content-sync** workflow.

## 📜 Documentation index

| Doc                      | What you’ll find                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **00-overview\.md**      | Repo goals, component diagram, data-flow ASCII map.                                                              |
| **10-architecture.md**   | Droplet layout (Ubuntu → Docker → Traefik → Writebook), “fork + disable auto-update” rationale.                  |
| **20-ci-cd.md**          | Full GitHub Actions patterns, secret handling, sample `deploy.yml`, weekly upstream rebases.                     |
| **30-backups.md**        | Nightly `once data backup` → S3, restore drills, cost table.                                                     |
| **40-content-import.md** | Bulk Markdown importer (Node & Python examples), image handling, GH Action trigger.                              |
| **50-customization.md**  | Persistent theming (custom CSS, fonts, cover partial), keeping a small patch-set.                                |
| **60-integrations.md**   | Google Analytics (GA4) build-time injection, Mailchimp/Buttondown email workflow, auto-tweet script, RSS worker. |
| **90-faq.md**            | Auto-update gotchas, 127.0.1.1 DNS confusion, SSL fixes, help links.                                             |

---

## 🛠 Key scripts

| Script               | Purpose                                                      | One-liner                              |
| -------------------- | ------------------------------------------------------------ | -------------------------------------- |
| `backup.sh`          | Safe snapshot (`once data backup`), sync to S3, prune local. | `./scripts/backup.sh`                  |
| `import-chapters.js` | Idempotent Markdown → Pages via `rails runner`.              | `node scripts/import-chapters.js`      |
| `teaser-maker.mjs`   | Duplicate a page, trim to 500 words, set public.             | `node scripts/teaser-maker.mjs <slug>` |
| `healthcheck.sh`     | Ping `/healthz`, Slack alert if non-200.                     | Cron every 5 min                       |

---

## 🔄 Workflows in action

| Workflow              | Trigger              | What happens                                                                           |
| --------------------- | -------------------- | -------------------------------------------------------------------------------------- |
| **lint.yml**          | `push`, PR           | ESLint + Prettier + Shellcheck + unit tests.                                           |
| **deploy.yml**        | Merge/push to `main` | Build image with GA ID arg → Push to GHCR → SSH restart containers.                    |
| **upstream-sync.yml** | Weekly cron          | Rebase fork on upstream [37signals](https://github.com/37signals/writebook) & open PR. |
| **backup.yml**        | Nightly cron         | Runs `backup.sh` via SSH; uploads tarball to S3 / DO Spaces.                           |

Implementation details in **`docs/20-ci-cd.md`**.

---

## 🎨 Custom look

* Override styles in `app/assets/stylesheets/custom.css` — survives updates per [Jason Fried’s note](https://twitter.com/jasonfried/status/1684567890123456789).
* Use Google Fonts or self-hosted `.woff2`; reference via Rails asset helpers.
* Branded cover partial lives in `app/views/pages/_cover.html.erb`.

Full walkthrough: **`docs/50-customization.md`**

---

## 📦 Backup & restore cheatsheet

```bash
# manual snapshot
once data backup /var/backups/writebook_$(date +%F).tgz

# restore on a fresh droplet
docker compose down
tar -xzf backup.tgz -C /opt/writebook/data
docker compose up -d
```

More details + cost table: **`docs/30-backups.md`**

---

## 🤝 Community & references

* **[37signals](https://37signals.com)** — creators of ONCE & Writebook.
* **[Writebook product page](https://once.com/writebook)** — pricing & docs.
* **[ONCE](https://once.com/)** — one-line installer that powers this stack.
* **Lanre Adelowo** — excellent CI/CD + Ansible articles on self-hosting Writebook
  [https://lanreadelowo.com/tags/writebook](https://lanreadelowo.com/tags/writebook)
* **Daniel Dallos** — *“Google Analytics on Writebook — The Dummy’s Guide”*
  [https://dallos.dev/posts/google-analytics-writebook](https://dallos.dev/posts/google-analytics-writebook)
* **Writebook Forum** — [https://discourse.once.com/c/writebook](https://discourse.once.com/c/writebook) (ask anything).

---

## 🗺 Roadmap

* ✅ Visual regression tests
* ☐ Slack webhook for successful deploy
* ☐ Optional Fly.io staging environment

PRs and ideas welcome!

---

## 📝 License

Scripts & docs © 2025 Jake Lawrence — released under the **[MIT License](LICENSE)**.
Writebook itself remains © [37signals](https://37signals.com) and distributed under their single-installation **ONCE** license (not included here).

Enjoy—and happy shipping! 🚀
