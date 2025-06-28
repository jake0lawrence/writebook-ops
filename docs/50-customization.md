# 50 • Look & Feel Customization

> **Objective:** achieve a unique visual brand for your book(s) **without losing changes** the next
> time you pull upstream updates.  This guide shows where to place overrides, how to add fonts &
> graphics, and how to track a small patch-set in Git so every deploy bakes your style in.

---

## 1 Safe theming basics

| Principle | How to implement |
|-----------|------------------|
| **Keep overrides external** | Place custom styles in `app/assets/stylesheets/custom.css` (the file name doesn’t matter—**location** does).  The updater ignores anything outside the core bundles, so your file persists. :contentReference[oaicite:0]{index=0} |
| **Don’t edit core `.css`/`.scss`** | Changes in `product.css` or `application.scss` will be clobbered on update.  Instead, *import* them in your sheet and override what you need: <br>`@import "product"; /* now add overrides */` |
| **Namespace sparsely** | Use body-level utility classes (`body.writebook-front`) to scope styles to Writebook, so future upstream elements don’t accidentally inherit. |
| **Commit overrides** | Track the `custom.css` file in your fork so CI builds include it automatically.  Zero manual copy-paste after deploy. |

---

## 2 Adding fonts & images

### Self-hosted fonts

1. Download `.woff2` / `.woff` files into `app/assets/fonts/`.
2. Reference them in `custom.css`:

   ```css
   @font-face {
     font-family: "Quicksand";
     src: url("/assets/quicksand.woff2") format("woff2");
     font-display: swap;
   }
   body { font-family: "Quicksand", system-ui, sans-serif; }
   ```

3. Precompiled by Rails’ asset pipeline; no further config needed.

### Hero / background images

* Drop images into `app/assets/images/branding/`.
* Reference with the asset helper in ERB:

  ```erb
  <div class="hero" style="background-image:url('<%= asset_path("branding/cover_bg.jpg") %>')">
  ```

*Large images*: enable Cloudflare proxy or object-storage CDN if >1 MB.

---

## 3 Branded cover template

Writebook renders the “cover” (first public page) using `app/views/pages/show.html.erb`.
Steps to make a template that all new books inherit:

1. **Copy the view** into your fork:
   `app/views/pages/_cover.html.erb`

2. Add placeholders:

   ```erb
   <div class="cover my-32 text-center">
     <h1><%= @page.title %></h1>
     <p class="subtitle"><%= @page.subtitle %></p>
     <%= image_tag "branding/cover_ornament.svg", class: "mx-auto mb-8" %>
   </div>
   ```

3. In `show.html.erb`, render the partial when `@page.cover?`.

4. Style via `custom.css`:

   ```css
   .cover h1 { font-size: clamp(3rem, 5vw, 5rem); letter-spacing:-.02em; }
   .subtitle { font-style: italic; opacity:.7; }
   ```

---

## 4 Keeping a **small patch set** in Git

1. **Branch per feature** (`feat/ga-tracking`, `style/brand-colors`).
2. **Rebase vs. upstream weekly** (see upstream-sync Action).
3. **Label patch files** in PRs with `#css`, `#view`, `#analytics` to track surface area.
4. Use **`git format-patch upstream/main -o patches/`** to snapshot deltas; re-apply with
   `git am` if you ever need a fresh clone.

Routine:

```bash
# sync Monday
git fetch upstream
git checkout main && git rebase upstream/main
# apply outstanding patches if any conflicts
# push → CI builds image with styles baked in
```

---

## 5 When updates touch the UI

Upstream sometimes tweaks CSS class names.  Mitigation workflow:

1. CI fails visual regression test (optional Percy or Playwright screenshot diff).
2. Review release notes; adjust your overrides in `custom.css`.
3. Merge PR → new image ships automatically.

---

### Quick checklist

* [ ] `custom.css` created and imported via asset pipeline
* [ ] Brand fonts in `assets/fonts`, loaded with `@font-face`
* [ ] Cover partial `_cover.html.erb` committed & styled
* [ ] Patches rebased cleanly after upstream sync

With this pattern your design evolves **in Git**, ships via CI, and survives every
update—no more editing containers by hand. 🎨🚀
