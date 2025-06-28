# 20 • CI / CD Workflow

> **Goal:** every change — whether a new chapter, CSS tweak, or upstream Writebook update — ships to production with **one push**, while keeping the droplet reproducible and secrets safe.

---

## 1 Workflow patterns

| Pattern | Purpose | Trigger |
|---------|---------|---------|
| **Lint + test** | Ensure scripts & Markdown pass formatting / unit tests before deploy. | `push` & PRs |
| **Build → push Docker image** | Bake Writebook fork **plus** custom patches into a version-tagged image (`ghcr.io/jake/writebook:YYYYMMDD`). | `push` to `main` |
| **SSH deploy** | Pull the new image on the droplet and restart containers with zero downtime. | Same job, after image push |
| **Weekly upstream pull** | Fetch `37signals/writebook` → open PR → build & deploy if merged. | `schedule: cron` |
| **Nightly backup** | Off-site copy of `db.sqlite3` + `storage/` (details in **30-backups.md**). | `schedule: cron` |

These patterns mirror real-world setups shared by early Writebook adopters, where GitHub Actions
build the container, push to GHCR, and deploy via SSH in a single workflow run.

---

## 2 Secrets management best practices

* **GitHub → droplet**  
  * Store `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER` as **encrypted repository secrets**.  
  * Use `actions/ssh-key-and-known-hosts` or `appleboy/ssh-action@v1` to load keys automatically.
* **App secrets** (`SECRET_KEY_BASE`, ENV vars)  
  * **_Never_** commit them: inject at build-time with `--build-arg` or set as droplet env vars.  
  * In Actions, reference them only as `${{ secrets.SECRET_KEY_BASE }}`.
* **AWS / Spaces creds** (for backups)  
  * Scope access to a single bucket (`writebook-backups/*`).  
  * Rotate keys; keep the latest two versions active.  
* **Do not** store personal ONCE license tokens in the repo or workflows.

---

## 3 Example workflow files

### 📝 `.github/workflows/lint.yml`
```yaml
name: Lint & Unit-Test
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run lint && npm test
````

*Runs quickly; blocks the deploy job if any check fails.*

---

### 🚀 `.github/workflows/deploy.yml`

```yaml
name: Build & Deploy
on:
  push:
    branches: [main]

env:
  IMAGE_NAME: ghcr.io/jake/writebook

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build image
        run: |
          docker build \
            --build-arg SECRET_KEY_BASE=${{ secrets.SECRET_KEY_BASE }} \
            -t $IMAGE_NAME:${{ github.sha }} .
      - name: Push image
        run: docker push $IMAGE_NAME:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            docker pull $IMAGE_NAME:${{ github.sha }}
            docker tag  $IMAGE_NAME:${{ github.sha }} $IMAGE_NAME:latest
            cd /opt/writebook
            docker compose up -d
```

**Call-outs**

1. **`docker build`** injects `SECRET_KEY_BASE` at build-time.
2. **Two-stage job** keeps credentials minimal: the build runner never gets SSH keys.
3. Droplet only ever runs images from GHCR, avoiding `docker build` on-server.

---

### 🔄 `.github/workflows/upstream-sync.yml`

```yaml
name: Weekly upstream rebase
on:
  schedule:
    - cron:  '0 3 * * 1'   # 03:00 every Monday (server quiet hours)
jobs:
  rebase:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.PAT_WITH_PR_SCOPE }}
      - name: Pull upstream & open PR
        run: |
          git remote add upstream https://github.com/37signals/writebook.git
          git fetch upstream
          git checkout -B upstream-sync upstream/main
          git rebase main
          git push -f origin upstream-sync
          gh pr create --title "Weekly upstream sync" \
                       --body "Rebase of upstream/main onto fork."
```

*Once merged, the normal `push → Build & Deploy` pipeline handles shipping the update.*
This mirrors community guidance to disable ONCE auto-update and control updates via Git.

---

## 4 Lint / test tips

* **Markdown lint:** `markdownlint-cli` catches broken links or mis-indented code.
* **Shellcheck:** static-analyse Bash scripts.
* **CI smoke test:** Spin up the container with `docker run -d -p 8080:3000` then wait for `/healthz` before marking the build green.

---

## 5 Troubleshooting deploys

| Symptom                                 | Likely cause                                  | Fix                                                                                                                                         |
| --------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker: pull access denied` on droplet | GHCR repo is private & droplet not logged in. | `docker login ghcr.io` once on the server (or use a [`DOCKER_AUTH_CONFIG` secret](https://github.com/docker/login-action#login-to-ghcrio)). |
| Container restarts immediately          | `SECRET_KEY_BASE` mismatch.                   | Re-build image with correct secret or set env var in `compose.yml`.                                                                         |
| PR auto-merge failed on upstream sync   | Rebase conflict in your patch set.            | `git rebase --rebase-merges` locally, fix conflicts, push.                                                                                  |

---

### Next steps

1. Commit these workflow files.
2. Add repository secrets (`SSH_*`, `SECRET_KEY_BASE`, `S3_KEY`).
3. Push to `main` — watch lint, build, deploy run green.
4. Merge the first “Weekly upstream sync” PR next Monday.

With this CI/CD foundation, shipping new chapters or patches becomes *routine* — you write, GitHub ships. 🚀
