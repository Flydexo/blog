import {defineCollection} from 'astro:content';
import {z} from 'astro/zod';
import {glob} from 'astro/loaders';
export const collections={blog:defineCollection({loader:glob({pattern:'**/*.{md,mdx}',base:'./src/content/blog'}),schema:z.object({title:z.string(),description:z.string(),pubDate:z.coerce.date(),kind:z.enum(['post','page']).default('post'),draft:z.boolean().default(false),tags:z.array(z.string()).default([])})})};
