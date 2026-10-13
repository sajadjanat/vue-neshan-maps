import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
const root='demo-dist', base='https://sajadjanat.github.io/vue-neshan-maps/'
const xml=await readFile(join(root,'sitemap.xml'),'utf8')
const sitemap=new JSDOM(xml,{contentType:'application/xml'})
assert.equal(sitemap.window.document.querySelector('parsererror'),null)
const urls=[...sitemap.window.document.querySelectorAll('loc')].map(el=>el.textContent)
assert.equal(urls.length,40);assert.equal(new Set(urls).size,40)
const titles=new Set(), descriptions=new Set()
for(const url of urls){
 assert.ok(url.startsWith(base));assert.ok(!/[?#]/.test(url))
 const path=url.slice(base.length), language=path.split('/')[0]
 const html=await readFile(join(root,path,'index.html'),'utf8'), dom=new JSDOM(html,{url}),doc=dom.window.document
 assert.equal(doc.documentElement.lang,language);assert.equal(doc.documentElement.dir,language==='fa'?'rtl':'ltr')
 assert.equal(doc.querySelectorAll('h1').length,1)
 assert.ok(doc.querySelector('#app').textContent.trim().length>500,'Content must exist without executing JavaScript')
 assert.ok(doc.querySelector('title').textContent.length>5);titles.add(doc.title)
 const description=doc.querySelector('meta[name=description]').content;assert.ok(description.length>20);descriptions.add(description)
 assert.equal(doc.querySelectorAll('link[rel=canonical]').length,1);assert.equal(doc.querySelector('link[rel=canonical]').href,url)
 const alts=[...doc.querySelectorAll('link[rel=alternate][hreflang]')];assert.equal(alts.length,3)
 for(const other of ['fa','en']){const alternate=alts.find(el=>el.hreflang===other);assert.ok(urls.includes(alternate.href));assert.equal(alternate.href,url.replace(`/${language}/`,`/${other}/`))}
 assert.equal(alts.find(el=>el.hreflang==='x-default').href,url.replace(`/${language}/`,'/fa/'))
 assert.equal(doc.querySelector('meta[property="og:url"]').content,url)
 assert.equal(doc.querySelector('meta[property="og:title"]').content,doc.title)
 assert.equal(doc.querySelector('meta[property="og:locale"]').content,language==='fa'?'fa_IR':'en_US')
 assert.equal(doc.querySelector('meta[name="twitter:card"]').content,'summary_large_image')
 assert.match(doc.querySelector('meta[name=robots]').content,/index, follow/)
 assert.equal(doc.querySelector('link[rel=icon]').href,base+'favicon.svg');await access(join(root,'favicon.svg'))
 const schema=JSON.parse(doc.getElementById('site-schema').textContent);assert.equal(schema['@context'],'https://schema.org')
 const graph=schema['@graph'];assert.equal(new Set(graph.map(n=>n['@id'])).size,graph.length)
 assert.ok(graph.find(n=>n['@type']==='SoftwareSourceCode').codeRepository.includes('sajadjanat/vue-neshan-maps'))
 const web=graph.find(n=>n['@type']==='WebPage');assert.equal(web.url,url);assert.equal(web.inLanguage,language)
 if(path.includes('/docs/')){assert.ok(doc.querySelector('.docs-prose').textContent.length>100);assert.equal(graph.find(n=>n['@type']==='TechArticle').headline,doc.querySelector('h1').textContent);assert.ok(graph.find(n=>n['@type']==='BreadcrumbList').itemListElement.length>=2)}
 for(const el of doc.querySelectorAll('link[rel=stylesheet],script[src]')){const href=el.href||el.src;assert.ok(href.startsWith(base+'assets/'));await access(join(root,new URL(href).pathname.slice('/vue-neshan-maps/'.length)))}
 for(const el of doc.querySelectorAll('a[href]')){const target=new URL(el.getAttribute('href'),url);if(target.href.startsWith(base)&&!target.search){const dest=target.pathname.slice('/vue-neshan-maps/'.length);if(dest.endsWith('/'))await access(join(root,dest,'index.html'))}}
 await access(join(root,doc.querySelector('meta[property="og:image"]').content.slice(base.length)))
 for(const input of doc.querySelectorAll('input[type=password]'))assert.equal(input.value,'','Public prerender must never contain a visitor key')
 assert.ok(!/(?:web|service)\.[a-f0-9]{32}/i.test(html),'No real API key may be baked into HTML')
 dom.window.close()
}
assert.equal(titles.size,40);assert.equal(descriptions.size,40)
const missing=new JSDOM(await readFile(join(root,'404.html'),'utf8'));assert.match(missing.window.document.querySelector('meta[name=robots]').content,/noindex/);assert.equal(missing.window.document.querySelectorAll('script').length,0)
const alias=new JSDOM(await readFile(join(root,'index.html'),'utf8'));assert.equal(alias.window.document.querySelector('link[rel=canonical]').href,base+'fa/')
sitemap.window.close();missing.window.close();alias.window.close()
console.log('40 prerendered pages passed: no-JS content, unique metadata, canonical/hreflang reciprocity, JSON-LD, internal links, assets, sitemap, 404 and credential scan.')
