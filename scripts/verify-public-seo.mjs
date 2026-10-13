import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
const base='https://sajadjanat.github.io/vue-neshan-maps/'
const sitemap=await fetch(base+'sitemap.xml');assert.equal(sitemap.status,200)
const xml=new JSDOM(await sitemap.text(),{contentType:'application/xml'})
const urls=[...xml.window.document.querySelectorAll('loc')].map(el=>el.textContent);assert.equal(urls.length,40)
const images=new Set(),queue=[...urls]
async function check(){while(queue.length){const url=queue.shift(),response=await fetch(url);assert.equal(response.status,200,url);assert.match(response.headers.get('content-type'),/text\/html/);const html=await response.text(),dom=new JSDOM(html,{url}),doc=dom.window.document;const language=new URL(url).pathname.split('/')[2];assert.equal(doc.documentElement.lang,language);assert.equal(doc.querySelector('link[rel=canonical]').href,url);assert.ok(doc.querySelector('#app').textContent.length>500);assert.equal(doc.querySelectorAll('link[hreflang]').length,3);for(const alt of doc.querySelectorAll('link[hreflang]'))assert.ok(urls.includes(alt.href));const schema=JSON.parse(doc.getElementById('site-schema').textContent);assert.equal(schema['@context'],'https://schema.org');assert.equal(schema['@graph'].find(n=>n['@type']==='WebPage').url,url);images.add(doc.querySelector('meta[property="og:image"]').content);assert.ok(!/(?:web|service)\.[a-f0-9]{32}/i.test(html));dom.window.close()}}
await Promise.all(Array.from({length:4},check))
for(const url of images){const response=await fetch(url);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/jpeg/)}
const missing=await fetch(base+'en/docs/does-not-exist/');assert.equal(missing.status,404);assert.match(await missing.text(),/noindex/)
const rootRobots=await fetch('https://sajadjanat.github.io/robots.txt')
console.log(JSON.stringify({canonicalPages:urls.length,originalHtmlVerified:true,images:images.size,real404:true,originRobotsStatus:rootRobots.status}))
xml.window.close()
