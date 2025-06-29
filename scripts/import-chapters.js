#!/usr/bin/env node
/**
 * Bulk-import Markdown files in /content into Writebook pages (idempotent).
 *
 *   • Needs SSH key-based access to the droplet
 *       – env  SSH_HOST   (e.g. books.jakelawrence.io)
 *       – env  SSH_USER   (e.g. root)
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

/** Escape text for safe insertion into Bash-quoted string. */
const shEscape = str => str.replace(/([$`"\\])/g, "\\$1");

for (const file of readdirSync(DIR).filter(f => extname(f) === ".md")) {
  const bodyRaw = readFileSync(join(DIR, file), "utf8");
  const bodyEsc = shEscape(bodyRaw);

  const title = shEscape(
    basename(file, ".md")
      .replace(/^\d+-/, "") // drop numeric prefix
      .replace(/-/g, " ")
  );

  const yy    = file.match(/^(\d{2})/)?.[1] || "25";   // derive year
  const pubAt = `20${yy}-01-01`;

  console.log(`→ Importing "${title}"`);

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
