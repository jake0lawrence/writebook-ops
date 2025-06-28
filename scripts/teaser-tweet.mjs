#!/usr/bin/env node
/**
 * Tweet a teaser for a given slug using Twitter API v2.
 *   TW_BEARER must be set in env / GitHub secret.
 */
import { TwitterApi } from "twitter-api-v2";
import fetch          from "node-fetch";

const [ , , slug ] = process.argv;
if (!slug) {
  console.error("Usage: teaser-tweet.mjs <slug>");
  process.exit(1);
}

const meta = await (await fetch(`https://books.jakelawrence.io/${slug}.json`)).json();
const text = `📖 ${meta.title}\n\n${meta.summary}\n\nRead full chapter 👇\n${meta.url}`;

const client = new TwitterApi(process.env.TW_BEARER);
await client.v2.tweet(text);
console.log("✅ Tweet sent.");
