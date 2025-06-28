# 00 • Overview

## Mission

`writebook-ops` is a **companion automation layer** for a self-hosted Writebook instance.  
Its goals are to:

* keep the production droplet reproducible, testable, and one-command deployable  
* safeguard the content database and uploaded assets via off-site backups  
* accelerate authoring workflows (bulk chapter import, teaser generation, etc.)  
* provide a single source of truth for _all_ infrastructure, scripts, and docs

In short: **treat your book like software**—version-controlled, CI/CD-driven, and observable.  
Community examples show this approach dramatically reduces manual ops toil while letting you customise Writebook without fear of overwriting changes during auto-updates. :contentReference[oaicite:0]{index=0}  

---

## How the pieces fit together 🔗

| Layer | What lives here | Why it’s separate |
|-------|-----------------|-------------------|
| **Writebook (Docker)** | Rails app, Traefik, SQLite | Black-box service managed by ONCE installer; updates come in via container rebuilds. |
| **`writebook-ops` repo** | Scripts (`scripts/`), Cron definitions (`cron/`), GitHub Actions workflows (`.github/workflows/`), and Docs (`docs/`) | Keeps *your* code, content tooling, and infra definitions under Git. Nothing here is overwritten by upstream Writebook updates. |
| **GitHub Actions** | • Build & push custom Docker images  <br>• SSH deploy  <br>• Weekly upstream pull + diff  <br>• Scheduled backups | Automates CI/CD so every commit or schedule tick keeps prod in sync. :contentReference[oaicite:1]{index=1} |
| **Cron inside droplet** | Nightly `backup.sh`, health-checks, log rotation | Runs even if GitHub is down; minimal critical tasks. |

---

## High-level data-flow diagram (ASCII)

```text
                +--------------------------+
   Markdown --->| GitHub Repo (content)    |          Upstream Writebook
     edits      | + scripts + workflows    |          releases (weekly)
                +-----+----------+---------+                  |
                      | push     | GH Action (schedule)       |
                      |          v                           v
                      |   +--------------+    docker pull  +----------------+
                      |   | CI Job       | --------------> | Build Image    |
                      |   | (test/lint)  |                 | with patches   |
                      |   +------+-------+                 +--------+-------+
                      |          | ssh deploy                         |
                      v          v                                    |
             +----------------------+                     +----------v-----------+
             |  Droplet (books.*)   |  once restart       |   S3 / Spaces        |
             |  • Traefik           |<--------------------|   Nightly backup.tgz |
             |  • Writebook Rails   |   cron 02:00        +----------------------+
             |  • SQLite db         |
             +----------+-----------+
                        ^
                        | web UI
                  Readers / Authors
````

**Key flows**

1. **Content & code** → committed → CI builds image → deploys via SSH.
2. **Nightly cron** executes `backup.sh`, calls `once data backup`, pushes tarball to S3.&#x20;
3. **Weekly Action** pulls upstream Writebook, rebases local fork, triggers new build.
4. Authors interact only with the production URL; all ops is hands-off.

---

## Where to go next

* [10-architecture.md](10-architecture.md) – droplet layout & “fork + disable auto-update” pattern
* [20-ci-cd.md](20-ci-cd.md) – full workflow YAML with secret handling
* [30-backups.md](30-backups.md) – backup strategy & restore drills
* …and the rest of the `/docs` suite for deeper dives.
