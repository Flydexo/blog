import {defineConfig} from 'astro/config';
import {unified} from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
export default defineConfig({site:process.env.SITE_URL || 'https://matheold.com', trailingSlash:'always', integrations:[expressiveCode(),mdx(),sitemap()],markdown:{processor:unified({remarkPlugins:[remarkMath],rehypePlugins:[rehypeKatex]})}});
