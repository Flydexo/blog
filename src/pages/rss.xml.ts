import rss from '@astrojs/rss';import {posts} from '../lib/posts';import {site} from '../config';import type {APIContext} from 'astro';
export async function GET(context:APIContext){return rss({title:site.title,description:site.description,site:context.site!,items:(await posts()).map(p=>({title:p.title,description:p.description,pubDate:new Date(p.date),link:'/'+p.slug+'/'}))});}
