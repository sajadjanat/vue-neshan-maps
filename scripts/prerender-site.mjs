import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
const output=resolve('demo-dist'), origin='https://sajadjanat.github.io', base='/vue-neshan-maps/'
const template=await readFile(join(output,'index.html'),'utf8')
const dom=new JSDOM(template,{url:origin+base})
Object.assign(globalThis,{window:dom.window,document:dom.window.document,location:dom.window.location,history:dom.window.history})
const server=await createServer({configFile:resolve('vite.demo.config.ts'),mode:'production',server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[]},appType:'custom'})
try {
 const {routes,renderPage}=await server.ssrLoadModule('/src/site/prerender.ts')
 const styles=(await readdir(join(output,'assets'))).filter(file=>file.endsWith('.css'))
 for(const file of styles){const href=base+'assets/'+file;if(!document.querySelector(`link[href="${href}"]`)){const el=document.createElement('link');el.rel='stylesheet';el.href=href;document.head.append(el)}}
 await mkdir(join(output,'docs/images'),{recursive:true})
 for(const file of await readdir('docs/images'))if(/\.(?:png|jpg)$/.test(file))await copyFile(join('docs/images',file),join(output,'docs/images',file))
 const urls=[]
 for(const route of routes){
  const path=`${route.language}/${route.view==='docs'?`docs/${route.doc}/`:''}`
  history.replaceState(null,'',origin+base+path)
  const result=await renderPage(route)
  document.getElementById('app').innerHTML=result.html
  for(const image of document.querySelectorAll('img[src]'))if(image.src.startsWith(origin+base+'docs/images/')&&image.src.endsWith('.png')){const bytes=await readFile(join(output,image.src.slice((origin+base).length)));image.width=bytes.readUInt32BE(16);image.height=bytes.readUInt32BE(20)}
  const old=document.querySelector('noscript');old?.remove()
  const nojs=document.createElement('noscript');nojs.textContent=route.language==='fa'?'متن مستندات بدون JavaScript خواندنی است؛ اجرای نقشه و کنترل‌های تعاملی به JavaScript و کلید وب نیاز دارد.':'Documentation is readable without JavaScript. Live maps and interactive controls require JavaScript and a web key.';document.body.append(nojs)
  const destination=join(output,path);await mkdir(destination,{recursive:true});await writeFile(join(destination,'index.html'),dom.serialize())
  if(route.language==='fa'&&route.view==='demo')await writeFile(join(output,'index.html'),dom.serialize())
  urls.push(result.seo.url)
 }
 await writeFile(join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>`  <url><loc>${url}</loc></url>`).join('\n')+'\n</urlset>\n')
 // Crawlers only consult /robots.txt at the origin root. Project-path copy is informational.
 await writeFile(join(output,'robots.txt'),'# Install at the origin root to control crawling.\nUser-agent: *\nAllow: /\nSitemap: '+origin+base+'sitemap.xml\n')
 await writeFile(join(output,'.nojekyll'),'')
 await mkdir(join(output,'social'),{recursive:true})
 for(const lang of ['fa','en'])await copyFile(`docs/images/maplibre-light${lang==='fa'?'-fa':''}.jpg`,join(output,`social/map-demo-${lang}.jpg`))
 const notfound=new JSDOM(template,{url:origin+base+'404.html'})
 notfound.window.document.title='Page not found | Vue Neshan Maps'
 const robots=notfound.window.document.createElement('meta');robots.name='robots';robots.content='noindex, follow';notfound.window.document.head.append(robots)
 notfound.window.document.querySelectorAll('script').forEach(el=>el.remove())
 notfound.window.document.getElementById('app').innerHTML=`<main style="padding:40px;font:16px/1.9 sans-serif"><h1>Page not found · صفحه پیدا نشد</h1><p><a href="${base}fa/">دموی فارسی</a> · <a href="${base}en/">English demo</a> · <a href="${base}fa/docs/overview/">مستندات فارسی</a> · <a href="${base}en/docs/overview/">English docs</a></p></main>`
 await writeFile(join(output,'404.html'),notfound.serialize())
 console.log(`Prerendered ${routes.length} localized pages, root alias, sitemap and real 404 page.`)
} finally {await server.close();dom.window.close()}
