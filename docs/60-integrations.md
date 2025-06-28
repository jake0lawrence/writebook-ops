# 60 • Integrations & Growth Loops

> Turn Writebook into a **content engine** by wiring in analytics, email
> marketing, and social triggers — all automated and update-safe.

---

## 1 Google Analytics (GA4 / UA)

### Why bake GA into the image?

Directly editing `application.html.erb` inside a running container works
**once**, but a future auto-update or CI build will overwrite it.
Developer **Daniel Dallos** showed this in  
*[Google Analytics on Writebook — The Dummy’s Guide][dallos-ga]* and
recommended: **fork Writebook, add GA in source, rebuild on every deploy**.

### Implementation steps

1. **Insert snippet in your fork**

   ```erb
   <!-- app/views/layouts/application.html.erb -->
   <% if ENV["GA_ID"].present? %>
     <script async src="https://www.googletagmanager.com/gtag/js?id=<%= ENV["GA_ID"] %>"></script>
     <script>
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', '<%= ENV["GA_ID"] %>');
     </script>
   <% end %>
   ```

2. **Pass `GA_ID` at build-time** in `deploy.yml`:

   ```yaml
   docker build \
     --build-arg GA_ID=${{ secrets.GA_ID }} \
     -t $IMAGE_NAME:${{ github.sha }} .
   ```

3. **Verify real-time** hits in GA after deploy.

(Admin pageviews fire events; filter by IP or user-property if desired.)

---

## 2 Newsletter workflows ✉️

| Scenario                          | Tool / API                          | Skeleton                                           |
| --------------------------------- | ----------------------------------- | -------------------------------------------------- |
| Push a new chapter to subscribers | **Mailchimp TXN** or **Buttondown** | Node script converts Markdown → MJML → HTML email. |
| Weekly digest of latest pages     | **Zapier** RSS → Email              | Combine with RSS worker (see § 3).                 |
| Auto-cross-post to Substack       | Substack API (`substack-js`)        | GitHub Action triggers on `content/**.md` push.    |

### Example **`newsletter.yml`** (Buttondown)

```yaml
name: Send chapter email
on:
  push:
    paths: ["content/**.md"]

jobs:
  blast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build HTML email
        run: npx markdown-email "${{ github.event.head_commit.added[0] }}" > body.html
      - name: Send via Buttondown
        env:
          BD_KEY: ${{ secrets.BUTTONDOWN_KEY }}
        run: |
          curl -X POST https://api.buttondown.email/v1/emails \
               -H "Authorization: Token $BD_KEY" \
               -d "subject=New chapter is live!" \
               --data-urlencode body@body.html
```

---

## 3 RSS / JSON feeds

Writebook doesn’t ship feeds yet.
A tiny **Cloudflare Worker** can expose Atom:

```js
import { Feed } from "feed";

export default {
  async fetch() {
    const res   = await fetch("https://books.jakelawrence.io/api/pages.json");
    const pages = await res.json();

    const feed = new Feed({
      title: "Books • Jake Lawrence",
      link:  "https://books.jakelawrence.io"
    });

    pages.forEach(p => feed.addItem({
      id:      p.id,
      title:   p.title,
      link:    p.url,
      content: p.body
    }));

    return new Response(feed.atom1(), {
      headers: { "content-type": "application/atom+xml" }
    });
  }
}
```

Use this feed to power Revue, Zapier, Buttondown, etc.

---

## 4 Social automation

### Auto-tweet teasers

```js
// scripts/teaser-tweet.mjs
import { TwitterApi } from "twitter-api-v2";
import fetch              from "node-fetch";

const [ , , slug ] = process.argv;
const twitter = new TwitterApi(process.env.TW_BEARER);

const j = await (await fetch(`https://books.jakelawrence.io/${slug}.json`)).json();
const tweet = `📖 ${j.title}\n\n${j.summary}\n\nRead more 👇\n${j.url}`;

await twitter.v2.tweet(tweet);
```

GitHub Action:

```yaml
on:
  workflow_run:
    workflows: ["Sync content on push"]
    types: [completed]

jobs:
  tweet:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Tweet teaser
        run: node scripts/teaser-tweet.mjs "${{ github.event.workflow_run.head_branch }}"
        env: { TW_BEARER: ${{ secrets.TW_BEARER }} }
```

Swap SDKs (`mastodon-api`, `atproto`) for Mastodon / Bluesky.

---

## 5 Webhook growth loops

| Event                            | Webhook target           | Purpose                         |
| -------------------------------- | ------------------------ | ------------------------------- |
| **Backup success**               | Slack Incoming Webhook   | “✅ 02:05 backup • 188 MiB”      |
| **Deploy finished**              | Discord channel          | Post release notes to readers.  |
| **New comment** (future feature) | Netlify Function → Email | Alert author for quick replies. |

Each integrates as an extra step in existing CI workflows.

---

## 6 Implementation checklist

* [ ] `GA_ID` secret added; snippet baked at build-time.
* [ ] `newsletter.yml` merged; first email sent to test list.
* [ ] Feed worker deployed at `https://feeds.books.jakelawrence.io`.
* [ ] `TW_BEARER` secret added; tweet script verified.
* [ ] Webhook URLs stored in secrets and referenced in CI steps.

---

## 7 Further reading & thanks

* **Writebook** – [https://once.com/writebook](https://once.com/writebook)
* **ONCE by 37signals** – [https://once.com](https://once.com)
* **Google Analytics on Writebook — The Dummy’s Guide** by Daniel Dallos
  [https://medium.com/tweakedtech/google-analytics-on-writebook-the-dummys-guide-f5e09f9eeb8c](https://medium.com/tweakedtech/google-analytics-on-writebook-the-dummys-guide-f5e09f9eeb8c)
* **Lanre Adelowo’s Writebook CI/CD series**
  [https://lanre.wtf/blog/2024/07/14/writebook](https://lanre.wtf/blog/2024/07/14/writebook)
* **Writebook Forum** – [https://discourse.once.com/c/writebook](https://discourse.once.com/c/writebook)

Contributions welcome—open a PR to add more integration recipes! 🚀
