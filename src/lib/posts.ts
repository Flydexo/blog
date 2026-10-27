import { getCollection } from 'astro:content';

export async function posts() {
  const articles = await getCollection('blog', ({ data }) => !data.draft && data.kind === 'post');
  return articles.map(({ id, data }) => ({
    slug: id,
    title: data.title,
    description: data.description,
    date: data.pubDate.toISOString(),
    tags: data.tags,
  })).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
