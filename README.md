# Mathéo LD — blog

Astro's official blog starter, adapted for technical writing. Static output, no membership, newsletter, database, or server runtime. Source and published articles are public.

## Develop

Node 22.23.4+ (Node 24 recommended) and Python 3.12+.

```sh
npm ci
npm run dev -- --background
npm run check
npm test
npm run build
npm run preview
```

Production output is `dist/`. Pagefind search is generated during build and works in preview/production. No deployment or DNS changes are configured.

## Customize

- `src/config.ts`: name, description, navigation, optional Giscus configuration.
- `src/styles/theme.css`: colors, typography, spacing, width, automatic dark mode.
- `src/styles/home.css`: the landing page's cream, moss, and terracotta palette.
- `src/layouts/Base.astro`: shared document, navigation, SEO and footer.
- `src/components/`: reusable MDX components, diagrams and comments.
- `src/content/blog/`: new Markdown/MDX articles. The writing-guide draft demonstrates math, code and Mermaid.
- All eight articles and About are native MDX in `src/content/blog/`. About uses `kind: page` and is excluded from the article index and RSS.
- `scripts/`: notebook conversion.
- `migration/`: migration history and validation notes.

Set `SITE_URL` at build time to change the canonical origin (default https://matheold.com). The previous Ghost installation used https://flydexo.com in canonical URLs. Decide your production origin before launch. Existing article and About slugs are retained.

## Interactive landing page

The homepage's ASCII Sisyphus scene fills the viewport, with navigation and controls overlaid and the articles below. Portrait screens follow the climb and widen the view during the fall to keep both Sisyphus and the stone visible. It uses Canvas 2D and a small TypeScript animation, with no animation library or external assets. Click the boulder to help, drag along the slope in either direction, or use the help/hinder buttons. With a control focused, the arrow keys move the boulder uphill or downhill. The pause button stops the scene; reduced-motion preferences start it paused, and controls still move the stone in discrete steps. Animation also stops while the scene is offscreen or the tab is hidden.

The scene lives in `src/components/Sisyphus.astro`, its drawing and interactions in `src/scripts/sisyphus.ts`, its bent-knee skeleton in `src/scripts/sisyphus-pose.ts`, and its climb/fall/return cycle in `src/scripts/sisyphus-physics.ts`. `npm test` checks the complete loop, input effects, slope boundaries, 90° knee angles, and foot contact. The composition draws on the grid, silhouette, and deliberate-motion principles in [0xSero's ASCII-art skill](https://github.com/0xSero/ascii-art).

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

## Migrated articles

All articles are directly editable MDX with ordinary Markdown headings, lists, tables, image links, fenced code and KaTeX math. JSON and Python blocks use explicit language tags and Expressive Code's GitHub light/dark themes. Equations render at build time, with no browser-side Ghost math renderer.

The initial Ghost HTML snapshot and importer were retired; their history remains in Git. Edit the MDX files rather than reimporting HTML over them. Original article slugs and legacy heading anchors are preserved. Local images live in `public/media/`.

## Comments

Comments use [Giscus](https://giscus.app), backed by [GitHub Discussions in Flydexo/blog](https://github.com/Flydexo/blog/discussions). `src/config.ts` contains the repository and **Announcements** category IDs. Discussions are enabled on the repository.

The Giscus GitHub App is installed for `Flydexo/blog`; deploy this configuration to activate comments on the site. The repository must stay public, with Discussions enabled and the app granted access. If setting up another repository, [install the Giscus GitHub App](https://github.com/apps/giscus/installations/new) and update the IDs in `src/config.ts`. No API token or server is needed in the blog.

Each published article has its own thread, matched by pathname with strict matching. Giscus creates the discussion when someone first comments or reacts; readers sign in with GitHub to participate. Keep article paths stable to preserve their comment threads. The widget loads lazily, follows the reader's light/dark preference, and includes a direct GitHub link if the embed is unavailable. Comments are excluded from site search and do not appear on About or other non-article pages.

Moderate comments in GitHub Discussions. The Announcements category lets maintainers and Giscus create threads while readers can reply. To disable the widget, clear the Giscus configuration in `src/config.ts` and rebuild. There are no newsletter or membership integrations.

## Migration status

All eight articles and About are imported, including the complete STARK parts 2 and 3. Original URLs are preserved, Ghost media is localized, and former members-only posts are public. Subscription prompts are removed. Drafts, revisions, member records and private settings were not migrated. Browser comparison of rich cards and embeds remains recommended before production cutover.

## Dokploy Compose deployment

1. Create a **Docker Compose** application in Dokploy and select the `Flydexo/blog` repository, branch `main`. The Dokploy GitHub connection must have access to this repository.
2. Set the Compose path to `./docker-compose.yml` and use the repository root as the build context.
3. Optionally set `SITE_URL=https://matheold.com` in the application's environment. This is a **build argument**: redeploy after changing it so canonical URLs, RSS and the sitemap are regenerated.
4. Add your domain in Dokploy's **Domains** tab, selecting service `blog`, container port **8080**, and HTTPS. Dokploy manages routing/TLS through its existing `dokploy-network`; no host port is published.
5. Enable **Auto Deploy** for pushes to `main` in Dokploy and configure the repository webhook/GitHub integration as prompted. Deploy once to validate the connection.

The Compose file alone cannot enable Dokploy webhooks, grant repository access, or configure DNS. Point the domain at your Dokploy server when you are ready to switch traffic.

The Docker build installs Node and notebook dependencies, runs the full Astro + Pagefind build, then copies only static output into an unprivileged Nginx image. Runtime health checks use `/healthz`. Unknown paths return the custom page with HTTP 404; this is not an SPA fallback. No persistent volumes are required.

For a local Docker preview without Dokploy:

```sh
docker build -t matheold-blog .
docker run --rm -p 8080:8080 matheold-blog
```

Open http://localhost:8080. No deployment or DNS changes have been made by adding these files.
