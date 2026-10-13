<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Marked } from 'marked'
import { pages, groups, pageById, type Language } from './catalog'
import { renderMarkdown, slug } from './markdown'
import LiveExample from './LiveExample.vue'
import DemoIcon from '../demo/DemoIcon.vue'
import '../demo/demo.css'
import './docs.css'
import pkg from '../../package.json'
import { resolveRoute, siteHref } from '../site/routes'
import { applySeo } from '../site/seo'
const initialRoute=resolveRoute(new URL(location.href))
const language=ref<Language>(initialRoute.language)
const id=ref(pageById(initialRoute.doc??'overview').id),query=ref(''),menuOpen=ref(false),webKey=ref('')
const search=ref<HTMLInputElement>(),article=ref<HTMLElement>(),title=ref<HTMLElement>()
const activeHeading=ref(''),toast=ref('')
const text=(en:string,fa:string)=>language.value==='fa'?fa:en
const page=computed(()=>pageById(id.value)),index=computed(()=>pages.indexOf(page.value))
const rendered=computed(()=>renderMarkdown(page.value.body[language.value],language.value))
const normalize=(s:string)=>s.toLowerCase().replace(/[\u200e\u200f\u200c]/g,'').replaceAll('ي','ی').replaceAll('ك','ک')
const results=computed(()=>{const needle=normalize(query.value.trim());return needle?pages.filter(p=>normalize(p.title[language.value]+' '+p.summary[language.value]+' '+p.body[language.value]).includes(needle)):pages})
const groupLabels=computed(()=>groups[language.value].split('|'))
const reading=computed(()=>new Intl.NumberFormat(language.value==='fa'?'fa-IR':'en-US').format(Math.max(1,Math.ceil(page.value.body[language.value].split(/\s+/).length/180))))
const href=(doc:string,lang:Language=language.value)=>siteHref({language:lang,view:'docs',doc})
const sourcePath=computed(()=>['overview','quickstart','keys'].includes(id.value)?'src/docs/catalog.ts':`docs/${page.value.source}${language.value==='fa'?'.fa':''}.md`)
const sourceLink=computed(()=>`https://github.com/sajadjanat/vue-neshan-maps/blob/master/${sourcePath.value}`)
let observer:IntersectionObserver|undefined,toastTimer:ReturnType<typeof setTimeout>|undefined
function observe(){observer?.disconnect();const headings=article.value?.querySelectorAll('h2[id],h3[id]');if(!headings?.length)return;activeHeading.value=headings[0].id;observer=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);if(visible[0])activeHeading.value=visible[0].target.id},{rootMargin:'-95px 0px -65% 0px'});headings.forEach(el=>observer!.observe(el))}
async function navigate(doc:string,hash='',push=true){id.value=pageById(doc).id;menuOpen.value=false;query.value='';if(push)history.pushState(null,'',href(id.value)+(hash?`#${hash}`:''));await nextTick();if(hash)document.getElementById(hash)?.scrollIntoView();else{window.scrollTo({top:0});title.value?.focus({preventScroll:true})}}
function changeLanguage(value:Language){language.value=value;history.pushState(null,'',href(id.value,value));menuOpen.value=false}
function restore(){const route=resolveRoute(new URL(location.href));language.value=route.language;void navigate(route.doc??'overview',decodeURIComponent(location.hash.slice(1)),false)}
function keydown(event:KeyboardEvent){if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();menuOpen.value=true;nextTick(()=>search.value?.focus())}if(event.key==='Escape'){menuOpen.value=false;query.value=''}}
function findAnchor(anchor:string){for(const p of pages){const headings=new Marked().lexer(p.body[language.value]).filter(token=>token.type==='heading');if(headings.some(token=>slug((token as {text:string}).text)===anchor))return p.id}}
async function contentClick(event:MouseEvent){
  const target=event.target as HTMLElement
  const copy=target.closest<HTMLButtonElement>('[data-copy-code]')
  if(copy){try{await navigator.clipboard.writeText(copy.closest('.doc-code')?.querySelector('code')?.textContent??'');toast.value=text('Code copied','کد کپی شد')}catch{toast.value=text('Select and copy the code manually.','کد را انتخاب و دستی کپی کنید.')}clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2300);return}
  const anchor=target.closest<HTMLAnchorElement>('a');if(!anchor)return
  const link=anchor.getAttribute('href')??''
  if(link.startsWith('#')){const hash=decodeURIComponent(link.slice(1));if(!document.getElementById(hash)){const doc=findAnchor(hash);if(doc){event.preventDefault();await navigate(doc,hash)}}return}
  if(!link.startsWith('https://github.com/sajadjanat/vue-neshan-maps/blob/master/'))return
  const file=link.split('#')[0].split('/').pop()??''
  const destinations:Record<string,string>={'README':'overview','GUIDE':'quickstart','API':'api','NUXT':'nuxt','ADVANCED':'clusters','MIGRATION':'migration','DEPENDENCY-SECURITY':'security','EXAMPLES':'quickstart','DEMO':'overview'}
  const destination=destinations[file.replace(/(?:\.fa)?\.md$/,'')]
  if(destination&&(/\.md(?:#|$)/.test(link))){event.preventDefault();language.value=file.endsWith('.fa.md')?'fa':'en';const hash=decodeURIComponent(link.split('#')[1]??'');const doc=hash?findAnchor(hash)??destination:destination;await navigate(doc,hash)}
}
watch([id,language],async()=>{if(!import.meta.env.SSR)applySeo({language:language.value,view:'docs',doc:page.value.id},{title:page.value.title[language.value],description:page.value.summary[language.value],group:groupLabels.value[page.value.group]});await nextTick();observe()},{immediate:true})
onMounted(async()=>{history.replaceState(null,'',href(id.value)+location.hash);window.addEventListener('popstate',restore);window.addEventListener('keydown',keydown);await nextTick();observe();if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView()})
onBeforeUnmount(()=>{observer?.disconnect();clearTimeout(toastTimer);window.removeEventListener('popstate',restore);window.removeEventListener('keydown',keydown)})
</script>

<template>
  <div class="documentation-shell neshan-font-vazir" :dir="language==='fa'?'rtl':'ltr'">
    <a class="docs-skip" href="#docs-content">{{ text('Skip to content','پرش به محتوای اصلی') }}</a>
    <header class="docs-header"><a :href="href('overview')" class="docs-brand" @click.prevent="navigate('overview')"><span class="docs-logo"><DemoIcon name="pin"/></span><span>Vue Neshan Maps<small>{{ text('Developer documentation','راهنمای توسعه‌دهندگان') }}</small></span></a><nav :aria-label="text('Site navigation','ناوبری سایت')"><a :href="siteHref({language,view:'demo'})">{{ text('Playground','آزمایشگاه نقشه') }}</a><a href="https://github.com/sajadjanat/vue-neshan-maps" target="_blank" rel="noopener noreferrer">GitHub</a><span class="docs-version" dir="ltr">v{{ pkg.version }}</span><div class="language-switch"><a :href="href(id,'fa')" :aria-current="language==='fa'?'true':undefined" @click.prevent="changeLanguage('fa')">فارسی</a><a :href="href(id,'en')" :aria-current="language==='en'?'true':undefined" @click.prevent="changeLanguage('en')">EN</a></div></nav></header>
    <button class="docs-menu-button" :aria-expanded="menuOpen" aria-controls="docs-sidebar" @click="menuOpen=!menuOpen"><DemoIcon name="layers"/>{{ menuOpen?text('Close navigation','بستن فهرست'):text('Browse documentation','فهرست مستندات') }}</button>
    <div class="docs-layout">
      <aside id="docs-sidebar" class="docs-sidebar" :class="{'is-open':menuOpen}" :aria-label="text('Documentation chapters','بخش‌های مستندات')">
        <div class="docs-sidebar-inner"><label class="docs-search"><span>{{ text('Search documentation','جستجو در مستندات') }}</span><div><input ref="search" v-model="query" type="search" :placeholder="text('Search a feature…','جستجوی قابلیت…')" aria-controls="docs-chapters"><kbd dir="ltr">⌘ K</kbd></div></label><p v-if="query" class="docs-search-count" role="status">{{ results.length }} {{ text('chapters found','بخش پیدا شد') }}</p><nav id="docs-chapters"><section v-for="(group,groupIndex) in groupLabels" :key="group" v-show="results.some(p=>p.group===groupIndex)"><h2>{{ group }}</h2><a v-for="item in results.filter(p=>p.group===groupIndex)" :key="item.id" :href="href(item.id)" :aria-current="id===item.id?'page':undefined" @click.prevent="navigate(item.id)">{{ item.title[language] }}<span v-if="item.example" class="chapter-live" :title="text('Includes a live example','دارای مثال زنده')" aria-hidden="true"/></a></section></nav><p v-if="!results.length" class="docs-no-results">{{ text('No chapters match. Try a prop name such as traffic or cluster.','بخشی پیدا نشد. نام گزینه‌ای مثل traffic یا cluster را امتحان کنید.') }}</p><a class="docs-sidebar-footer" href="https://www.npmjs.com/package/vue-neshan-maps" target="_blank" rel="noopener noreferrer">{{ text('Package on npm','پکیج در npm') }} <span dir="ltr">↗</span></a></div>
      </aside>
      <main id="docs-content" class="docs-content" ref="article">
        <nav class="docs-breadcrumb" :aria-label="text('Breadcrumb','مسیر صفحه')"><a :href="siteHref({language,view:'demo'})">{{ text('Playground','دموی نقشه') }}</a><span aria-hidden="true">/</span><a :href="href('overview')" @click.prevent="navigate('overview')">{{ text('Documentation','مستندات') }}</a><span aria-hidden="true">/</span>{{ page.title[language] }}</nav>
        <div class="docs-article-heading"><h1 ref="title" tabindex="-1">{{ page.title[language] }}</h1><p>{{ page.summary[language] }}</p><div class="docs-meta"><span>{{ reading }} {{ text('min read','دقیقه مطالعه') }}</span><span>Vue 3 / Nuxt 4</span><span v-if="page.example" class="docs-live-label">{{ text('Live example included','همراه مثال زنده') }}</span></div></div>
        <details class="docs-mobile-toc"><summary>{{ text('On this page','مطالب این صفحه') }}</summary><a v-for="heading in rendered.headings" :key="heading.id" :href="`#${heading.id}`">{{ heading.text }}</a></details>
        <LiveExample v-if="page.example" :key="page.id" :id="page.example" :language="language" v-model:web-key="webKey"/>
        <div class="docs-prose" @click="contentClick" v-html="rendered.html"/>
        <div class="docs-article-footer"><span>{{ text('Found something unclear?','بخشی نیاز به توضیح بیشتر دارد؟') }}</span><a :href="sourceLink" target="_blank" rel="noopener noreferrer">{{ text('View the source','مشاهدهٔ متن راهنما') }}</a><a href="https://github.com/sajadjanat/vue-neshan-maps/issues" target="_blank" rel="noopener noreferrer">{{ text('Report an issue','گزارش ایراد') }}</a></div>
        <nav class="docs-pagination" :aria-label="text('Adjacent chapters','بخش‌های قبل و بعد')"><a v-if="index>0" :href="href(pages[index-1].id)" @click.prevent="navigate(pages[index-1].id)"><small>{{ text('Previous','بخش قبلی') }}</small>{{ pages[index-1].title[language] }}</a><a v-if="index<pages.length-1" :href="href(pages[index+1].id)" @click.prevent="navigate(pages[index+1].id)"><small>{{ text('Next','بخش بعدی') }}</small>{{ pages[index+1].title[language] }}</a></nav>
        <footer class="docs-footer">{{ text('Independent community library. Map services and attribution belong to Neshan and OpenStreetMap.','کتابخانهٔ مستقل جامعهٔ توسعه‌دهندگان؛ سرویس و انتساب نقشه متعلق به نشان و OpenStreetMap است.') }} · <a href="https://github.com/sajadjanat">Sajad Abasi</a> · <a href="https://github.com/sajadjanat/vue-neshan-maps/blob/master/LICENSE">MIT</a></footer>
      </main>
      <aside class="docs-toc" :aria-label="text('On this page','مطالب این صفحه')"><div><h2>{{ text('On this page','مطالب این صفحه') }}</h2><nav><a v-for="heading in rendered.headings" :key="heading.id" :href="`#${heading.id}`" :class="{'toc-subheading':heading.level===3}" :aria-current="activeHeading===heading.id?'location':undefined">{{ heading.text }}</a></nav><a class="docs-toc-help" :href="sourceLink" target="_blank" rel="noopener noreferrer">{{ text('View page source','مشاهدهٔ منبع صفحه') }}</a></div></aside>
    </div>
    <p v-if="toast" class="docs-toast" role="status">{{ toast }}</p>
  </div>
</template>
