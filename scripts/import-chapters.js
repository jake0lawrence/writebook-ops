#!/usr/bin/env node
/**
 * Bulk-import Markdown files under /content into Writebook pages.
 * Idempotent: reruns will update existing pages (matched on title).
 *
 * Requires:
 *   - SSH key-based access to droplet (SSH_HOST, SSH_USER).
 *   - Rails runner inside container.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join }  from "node:path";
import { execSync }                 from "node:child_process";

const SSH   = `${process.env.SSH_USER}@${process.env.SSH_HOST}`;
const DIR   = "content";

function sanitize(str) {
  return str.replace(/`/g, "\\`").replace(/[$"]/g, "\\$&");
}

for (const file of readdirSync(DIR).filter(f => extname(f) === ".md")) {
  const md     = sanitize(readFileSync(join(DIR, file), "utf8"));
  const title  = sanitize(basename(file, ".md").replace(/^\d+-/, "").replace(/-/g, " "));
  const pubAt  = `20${file.slice(0,2)}-01-01`;             // derive year from prefix, fallback

  console.log(`→ Importing "${title}"`);

  execSync(
    `ssh -oStrictHostKeyChecking=no ${SSH} ` +
    `"cd /opt/writebook && ` +
    `bin/rails runner \\\` +
"      p = Page.find_or_initialize_by(title: '" + title + "'); " +
      `p.body = \\\\\${md}\\\\\; ` +
      `p.published_at ||= Time.zone.parse('${pubAt}'); ` +
      `p.save!` +
    `\\\`
  , { stdio: "inherit" });
}
