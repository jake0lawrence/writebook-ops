#!/usr/bin/env node
/**
 * Bulk-import Markdown files in /content into Writebook pages (idempotent).
 *
 *   • Requires SSH key-based access to the droplet
 *       – env  SSH_HOST   e.g. books.jakelawrence.io
 *       – env  SSH_USER   e.g. root
 *
 *   • For every *.md file:
 *       – title = file name (strip leading digits + dashes)
 *       – body  = file contents
 *       – pubAt = YYYY-01-01 (derived from first two digits of the file name)
 *
 *   Re-running the script updates pages rather than duplicating them.
 */

import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join }  from "node:path";
import { execSync }                 from "node:child_process";

const DIR      = "content";
const SSH_USER = process.env.SSH_USER;
const SSH_HOST = process.env.SSH_HOST;
const SSH      = `${SSH_USER}@${SSH_HOST}`;

if (!SSH_USER || !SSH_HOST) {
  console.error("❌  Set SSH_USER and SSH_HOST env vars first.");
  process.exit(1);
}

/** Escape a JS string for safe insertion into a Bash string. */
function shEscape(str) {
  return str.replace(/([$`"\\])/g, "\\$1");
}

for (const file of readdirSync(DIR).filter(f => extname(f) === ".md")) {
  const bodyRaw = readFileSync(join(DIR, file), "utf8");
  const body    = shEscape(bodyRaw);

  const title = shEscape(
    basename(file, ".md")
      .replace(/^\d+-/, "") // drop leading index like 01-
      .replace(/-/g,  " ")
  );

  // publish date = 20YY-01-01, where YY comes from first two digits of file
  const yearDigits = file.match(/^(\d{2})/)?.[1] || "25";
  const pubAt      = `20${yearDigits}-01-01`;

  console.log(`→ Importing "${title}" …`);

  /* eslint-disable no-useless-escape */
  const ruby = `
body = <<~'MD'
${bodyRaw}
MD

page              = Page.find_or_initialize_by(title: "${title}")
page.body         = body
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
