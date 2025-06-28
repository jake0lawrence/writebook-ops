# 40 • Bulk Content Import

Move faster by treating your chapters as **plain Markdown files** under Git, then letting a script
sync them into Writebook on every push.  
Below are two turnkey approaches (Node + Rails runner), plus an Actions workflow to glue it all
together.

---

## 1 Folder convention

```

content/
├─ 01-prologue.md
├─ 02-the-call.md
├─ 02-the-call.jpg        # referenced in markdown via ![](02-the-call.jpg)
└─ images/                # optional extra assets

````

*File naming → page ordering:* Writebook’s TOC sorts by created-at date, so the script sets
`published_at` from the numeric prefix (`01-`, `02-`, etc.).

---

## 2 Node.js importer (`scripts/import-chapters.js`)

```js
#!/usr/bin/env node
/**
 * Import Markdown files as Writebook pages via Rails runner.
 * Requires: SSH access + bin/rails present in container.
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";

const SSH = "root@books.jakelawrence.io";
const CONTENT_DIR = "content";

for (const file of readdirSync(CONTENT_DIR).filter(f => extname(f) === ".md")) {
  const body = readFileSync(join(CONTENT_DIR, file), "utf8")
                 .replace(/`/g, "\\`");          // escape backticks
  const title = basename(file, ".md").replace(/^\d+-/, "").replace(/-/g, " ");

  const cmd = `ssh ${SSH} `
    + `"cd /opt/writebook && `
    + `bin/rails runner \\"p = Page.find_or_initialize_by(title: \\\"${title}\\\"); `
    + `p.body = \\\"${body}\\\"; `
    + `p.published_at ||= Time.zone.parse('2025-01-01'); `
    + `p.save!\\""`;      // default date overridden by prefix logic if desired

  console.log(`Importing: ${title}`);
  execSync(cmd, { stdio: "inherit" });
}
````

**Highlights**

* Uses `rails runner` so Markdown is parsed exactly like the UI.
* Idempotent: re-runs update existing pages (`find_or_initialize_by`).
* Images: any `![alt](filename.jpg)` reference works if the file is pre-uploaded.

The same pattern was used by a community member who successfully imported **1,800 Markdown
posts** in one shot.&#x20;

---

## 3 Handling images & front-matter

| Challenge             | Solution                                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local images**      | `scp` JPG/PNG files to `/opt/writebook/storage/imports/` then reference them with a relative path in Markdown. Writebook’s Active Storage will serve them. |
| **Remote images**     | Leave the full URL in Markdown; Writebook proxies it unchanged.                                                                                            |
| **YAML front-matter** | Parse it (e.g. `gray-matter`) in the Node script; map keys like `tags`, `subtitle`, `publish_at` to Page columns.                                          |
| **Embedded HTML**     | ActionText allows safe HTML; escape as needed when passing through `rails runner`.                                                                         |

---

## 4 Triggering the import from GitHub Actions

`.github/workflows/content-sync.yml`

```yaml
name: Sync content on push
on:
  push:
    paths:
      - "content/**"

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Run importer
        run: |
          npm ci         # if you externalise helper libs
          node scripts/import-chapters.js
        env:
          SSH_AUTH_SOCK: /tmp/ssh_agent.sock
      - name: Add SSH key
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
```

*Push markdown → Action runs → pages appear seconds later.*

---

## 5 Python alternative (`scripts/import_from_dir.py`)

For Python fans:

```python
#!/usr/bin/env python3
import glob, os, subprocess, yaml, re, base64, html

SSH = "root@books.jakelawrence.io"
for path in glob.glob("content/*.md"):
    with open(path) as f:
        text = f.read()
    title = re.sub(r"^\d+-", "", os.path.basename(path)[:-3]).replace("-", " ").title()
    body  = html.escape(text).replace("`", "\\`")
    runner = (
        f"ssh {SSH} \"cd /opt/writebook && "
        f"bin/rails runner \\\"Page.find_or_create_by!(title: '{title}')"
        f".update!(body: '{body}')\\\"\""
    )
    subprocess.run(runner, shell=True, check=True)
```

Python is handy when you need richer parsing (e.g., converting Liquid tags, manipulating front-matter).
Adelowo’s guide also shows Python via **Ansible** for related tasks.&#x20;

---

## 6 Dry-run & validation

1. Run the script against a **development container** first (`docker compose -f dev.yml up`).
2. Visit `/the-imported-page-slug` to ensure Markdown renders + images load.
3. On production, monitor logs: `docker compose logs -f writebook`.
4. Roll back by deleting pages in the UI or via `rails console`.

---

### Ready checklist

* [ ] Markdown files reside under `content/` with numeric prefixes.
* [ ] SSH key stored in repo-level secret.
* [ ] `import-chapters.js` (or Python) committed & executable.
* [ ] `content-sync.yml` workflow merged to `main`.
* [ ] First push confirmed pages appear in Writebook.

Bulk importing **now takes seconds**—freeing you to focus on writing, not copy-pasting. ✨
