import ghost from '../data/ghost.json';
import {getCollection} from 'astro:content';
export async function posts(){const articles=await getCollection('blog',({data})=>!data.draft);return [...ghost.filter(p=>p.kind==='post'&&!p.draft).map(p=>({slug:p.slug,title:p.title,description:p.description,date:p.date,tags:p.tags})),...articles.map(p=>({slug:p.id,title:p.data.title,description:p.data.description,date:p.data.pubDate.toISOString(),tags:p.data.tags}))].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));}
