#!/usr/bin/env node
/**
 * Bulk-import Markdown files in /content into Writebook pages (idempotent).
 *
 * ENV REQUIREMENTS
 *   SSH_HOST   — droplet hostname or IP  (e.g. books.jakelawrence.io)
 *   SSH_USER   — user with Rails access (e.g. root or deploy)
 *
 * HOW IT WORKS
 *   • Reads every *.md file in /content
 *   • Derives the page title from the file name
 *   • Uses the first two digits of the file name as YY → publishes 20YY-01-01
 *   • Pushes the content into Writebook via `bin/rails runner`
 *   • Re-runs update existing pages rather than duplicating them
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join }  from "node:path";
import { execSync }                 from "node:child_process";

const DIR      = "content";
const SSH_USER = process.env.SSH_USER;
const SSH_HOST = process.env.SSH_HOST;
const SSH      = `${SSH_USER}@${SSH_HOST}`;

if (!SSH_USER || !SSH_HOST) {
  console.error("❌  Set SSH_USER and SSH_HOST environment variables first.");
  process.exit(1);
}

for (const file of readdirSync(DIR).filter(f => extname(f) === ".md")) {
  const bodyRaw = readFileSync(join(DIR, file), "utf8");

  const title = basename(file, ".md")
    .replace(/^\d+-/, "")       // strip leading numeric prefix (e.g. 01-)
    .replace(/-/g, " ");

  const yy    = file.match(/^(\d{2})/)?.[1] || "25";  // default to 2025
  const pubAt = `20${yy}-01-01`;

  console.log(`→ Importing “${title}”`);

  /* eslint-disable no-useless-escape */
  const ruby = `
page = Page.find_or_initialize_by(title: "${title}")
page.body         = <<~'MD'
${bodyRaw}
MD
page.published_at ||= Time.zone.parse("${pubAt}")
page.save!
  `.trim();
  /* eslint-enable */

  const cmd = [
    "ssh", "-o", "StrictHostKeyChecking=no",
    SSH,
    `"cd /opt/once/current && bin/rails runner - <<'RUBY'\n${ruby}\nRUBY"`
  ].join(" ");

  execSync(cmd, { stdio: "inherit", shell: "/bin/bash" });
}
