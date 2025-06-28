#!/usr/bin/env node
/**
 * Duplicate an existing page, trim to `N` words, mark public = true.
 * Usage: ./teaser-maker.mjs <slug> [words=500]
 */
import { execSync } from "node:child_process";

const [ , , slug, words = 500 ] = process.argv;
if (!slug) {
  console.error("Usage: teaser-maker.mjs <slug> [words]");
  process.exit(1);
}

const SSH = `${process.env.SSH_USER}@${process.env.SSH_HOST}`;
const ruby = `
page = Page.find_by!(slug: '${slug}');
teaser = page.dup;
teaser.title = "(Preview) " + page.title;
teaser.body  = page.body.split[0,${words}].join(" ") + "...";
teaser.public = true;
teaser.save!
puts "Created teaser page → \#{teaser.slug}"
`;

execSync(
  `ssh -oStrictHostKeyChecking=no ${SSH} ` +
  `"cd /opt/writebook && bin/rails runner \\\"${ruby}\\\""`
, { stdio: "inherit" });
