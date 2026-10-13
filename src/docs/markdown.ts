import { SITE } from '../site/routes'
import { Marked, Renderer } from 'marked'
import DOMPurify from 'dompurify'
export interface Heading { id:string; text:string; level:number }
const escape = (text:string) => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
export const slug = (text:string) => text.replace(/[\u200e\u200f\u2066-\u2069]/g,'').replace(/<[^>]*>/g,'').replace(/[`*_]/g,'').trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').replace(/\s+/g,'-')
export function renderMarkdown(source:string, language:'fa'|'en') {
  const headings:Heading[]=[]; const seen=new Map<string,number>(); const renderer=new Renderer()
  renderer.heading = function(token) {
    const base=slug(token.text), count=seen.get(base)??0;seen.set(base,count+1)
    const id=count?`${base}-${count}`:base
    if(token.depth===2||token.depth===3)headings.push({id,text:token.text.replace(/[`*_\u200f]/g,''),level:token.depth})
    return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}<a class="heading-anchor" href="#${id}" aria-label="${language==='fa'?'پیوند این بخش':'Link to section'}">#</a></h${token.depth}>`
  }
  renderer.code = token => `<div class="doc-code"><div class="doc-code-bar"><span>${escape(token.lang??'code')}</span><button type="button" data-copy-code>${language==='fa'?'کپی کد':'Copy code'}</button></div><pre dir="ltr" tabindex="0"><code>${escape(token.text)}</code></pre></div>`
  renderer.link=function(token){
    if(!/^(?:[a-z]+:|#|\?)/i.test(token.href)){
      const base='https://github.com/sajadjanat/vue-neshan-maps/blob/master/docs/'
      token={...token,href:new URL(token.href,base).href}
      if(!/\.[a-z]+(?:#|$)/i.test(token.href))token.href=token.href.replace('/blob/master/','/tree/master/')
    }
    return Renderer.prototype.link.call(this,token)
  }
  renderer.image=function(token){return Renderer.prototype.image.call(this,{...token,href:/^images\//.test(token.href)?new URL('docs/'+token.href,SITE).href:/^(?:[a-z]+:|\/)/i.test(token.href)?token.href:new URL(token.href,'https://raw.githubusercontent.com/sajadjanat/vue-neshan-maps/master/docs/').href}).replace('<img ', '<img loading="lazy" decoding="async" ')}
  renderer.table=function(token){return `<div class="doc-table" tabindex="0">${Renderer.prototype.table.call(this,token)}</div>`}
  const parser=new Marked({gfm:true,renderer})
  const html=DOMPurify.sanitize(parser.parse(source,{async:false}),{FORBID_TAGS:['script','style','iframe','form','input'],FORBID_ATTR:['style'],ADD_ATTR:['tabindex','dir','data-copy-code'],ALLOW_DATA_ATTR:true})
  return {html,headings}
}
// Extract a complete second-level section without confusing headings inside code.
export function section(markdown:string,title:string):string {
  const lines=markdown.split(/\r?\n/);let fence=false,start=-1,end=lines.length
  for(let i=0;i<lines.length;i++){
    if(/^```/.test(lines[i]))fence=!fence
    if(fence||!/^## /.test(lines[i]))continue
    const heading=lines[i].slice(3).replace(/[\u200e\u200f]/g,'').trim()
    if(start>=0){end=i;break}
    if(heading===title)start=i
  }
  if(start<0)throw Error(`Missing documentation section: ${title}`)
  return lines.slice(start,end).join('\n')
}
