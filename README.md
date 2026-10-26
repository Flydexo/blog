# Mathéo LD — blog

Astro's official blog starter, adapted for technical writing. Static output, no membership, newsletter, database, or server runtime. Source repository is private; published articles are intended to be public.

## Develop

Node 22.23.4+ (Node 24 recommended) and Python 3.12+.

```sh
npm ci
npm run dev
npm run check
npm run build
npm run preview
```

Production output is `dist/`. Pagefind search is generated during build and works in preview/production. No deployment or DNS changes are configured.

## Customize

- `src/config.ts`: name, description, navigation, optional Giscus configuration.
- `src/styles/theme.css`: colors, typography, spacing, width, automatic dark mode.
- `src/layouts/Base.astro`: shared document, navigation, SEO and footer.
- `src/components/`: reusable MDX components, diagrams and comments.
- `src/content/blog/`: new Markdown/MDX articles. The writing-guide draft demonstrates math, code and Mermaid.
- `src/data/ghost.json`: imported HTML preserved for fidelity, metadata and original slugs.
- `scripts/`: explicit Ghost import and notebook conversion.
- `migration/report.json`: imported entries, incomplete drafts and localized media.

Set `SITE_URL` at build time to change the canonical origin (default https://matheold.com). The previous Ghost installation used https://flydexo.com in canonical URLs. Decide your production origin before launch. Existing article and About slugs are retained.

## Write

Add `src/content/blog/my-article.mdx`:

```md
---
title: My article
description: A short summary
pubDate: 2026-10-26
draft: false
tags: [AI]
---

Inline math $E=mc^2$ and display equations use KaTeX.
```

Use fenced code blocks for Expressive Code. Import `Mermaid.astro` as shown in the writing guide. Add Astro components or install a framework integration for hydrated demos. Drafts are excluded from routes, search and RSS. Do not place private information in public assets.

## Jupyter

Install `python3 -m pip install -r requirements.txt`. Put `.ipynb` sources in `notebooks/`. The first Markdown cell must contain the same YAML frontmatter shown above. Build converts saved outputs using nbconvert; it **never executes cells**. Markdown, images and existing outputs are included; widget state and arbitrary rich HTML outputs may require a custom MDX component. Generated Markdown and figures are ignored by Git. Notebook authors must review outputs for secrets before committing.

## Ghost import

```sh
npm run import:ghost -- /path/to/posts.json /path/to/pages.json
```

Accepts Content/Admin API JSON or a Ghost database export containing rendered HTML. It imports published records only, stores local copies of Ghost media, preserves original slugs, rewrites internal links and removes script tags and simple subscription prompts. Only import trusted author-owned HTML. Review imported rich cards and embeds visually.

Public API members-only bodies are incomplete and are retained as drafts. Once full published article bodies are available from Ghost, rerun with `--complete` to publish **all** entries regardless of former visibility. Do not use that flag with truncated public API output. Import replaces the generated dataset; include both posts and pages each time. Keep raw exports outside the repository: they can contain account or member information.

## Comments

Giscus is optional and disabled until configured in `src/config.ts`. It needs a separate **public** GitHub Discussions repository; the private source repo cannot host public Giscus discussions. Obtain repository/category IDs from giscus.app. There are no newsletter or membership integrations.

## Migration status

Six complete articles and About are ready for publication. Two previously members-only articles remain incomplete drafts because Ghost admin login returned HTTP 403. Their original URLs must be restored with complete content before production cutover. Keep Ghost online until that is resolved and article links, media, equations and embeds have been visually compared. Original Ghost metadata and content are preserved where the public API exposes them; drafts, revisions, member records and private settings were not migrated.

## Hosting later

Serve `dist/` using any static HTTP server. For Dokploy, configure a static build or container when deployment is requested. Route unknown paths to `404.html` with HTTP 404; do not use SPA fallback. Preserve trailing slashes. Keep the old site until validation and DNS cutover are complete.
