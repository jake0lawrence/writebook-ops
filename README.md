# writebook-ops &nbsp;📚⚙️  
Automation, CI/CD, backup & tooling for the self-hosted Writebook instance at **books.jakelawrence.io**.

[![CI](https://github.com/jake0lawrence/writebook-ops/actions/workflows/lint.yml/badge.svg)](./actions)
[![Deploy](https://github.com/jake0lawrence/writebook-ops/actions/workflows/deploy.yml/badge.svg)](./actions)
![MIT](https://img.shields.io/github/license/jake0lawrence/writebook-ops)

---

## ✨ What’s inside

| Area | Highlights |
|------|------------|
| **Docs** (`/docs/`) | Architecture, CI/CD, backup strategy, content importer, theming, integrations, FAQ. |
| **GitHub Actions** (`.github/workflows/`) | 🔀 Lint/test &nbsp;🚀 Build-and-deploy &nbsp;⬆️ Weekly upstream sync &nbsp;☁️ Nightly backup. |
| **Scripts** (`/scripts/`) | `backup.sh`, `import-chapters.js`, `teaser-maker.mjs`, `healthcheck.sh`. |
| **Cron** (`/cron/`) | Single entry that calls `backup.sh` at 02:05 daily. |
| **Dockerfile (fork)** | Builds Writebook + custom CSS/GA patches into a tagged image. |

> **Mission:** treat writing like software—version-controlled, reproducible, and fully automated.

---

## 📂 Repository layout

