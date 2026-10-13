import { SITE, canonicalUrl, type SiteRoute } from './routes'
export interface PageInfo { title: string; description: string; group?: string }
const REPO = 'https://github.com/sajadjanat/vue-neshan-maps'
export const demoInfo = {
  fa: { title: 'دموی نقشه نشان برای Vue 3 و Nuxt | Vue Neshan Maps', description: 'نقشه نشان در Vue 3 و Nuxt 4 را با کلید وب خودتان امتحان کنید: ترافیک زنده، مکان‌ها، خوشه‌بندی، هیت‌مپ و لایه‌های سه‌بعدی، همراه راهنمای فارسی و انگلیسی.' },
  en: { title: 'Neshan maps for Vue 3 & Nuxt: live demo | Vue Neshan Maps', description: 'Try Neshan maps in Vue 3 and Nuxt 4 with your own web key: live traffic, POI, clusters, heatmaps and 3D layers, with bilingual developer guides.' },
}
export function pageSeo(route: SiteRoute, info: PageInfo) {
  const url = canonicalUrl(route), fa = route.language === 'fa'
  const image = new URL(`social/map-demo-${route.language}.jpg`, SITE).href
  const author = { '@type': 'Person', '@id': `${SITE}#author`, name: 'Sajad Abasi', url: 'https://github.com/sajadjanat' }
  const software = { '@type': 'SoftwareSourceCode', '@id': `${SITE}#library`, name: 'Vue Neshan Maps', codeRepository: REPO, url: 'https://www.npmjs.com/package/vue-neshan-maps', programmingLanguage: ['TypeScript', 'JavaScript', 'Vue'], license: `${REPO}/blob/master/LICENSE`, author: { '@id': author['@id'] }, description: 'Community Vue 3 and Nuxt integration for Neshan MapLibre and Leaflet maps.' }
  const website = { '@type': 'WebSite', '@id': `${SITE}#website`, name: 'Vue Neshan Maps', url: SITE, inLanguage: ['fa', 'en'], publisher: { '@id': author['@id'] } }
  const breadcrumb = { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
    { '@type': 'ListItem', position: 1, name: fa ? 'دموی نقشه' : 'Map playground', item: canonicalUrl({language: route.language, view: 'demo'}) },
    ...(route.view === 'docs' ? [{ '@type': 'ListItem', position: 2, name: fa ? 'مستندات' : 'Documentation', item: canonicalUrl({language: route.language, view: 'docs', doc: 'overview'}) }, ...(route.doc !== 'overview' ? [{ '@type': 'ListItem', position: 3, name: info.title, item: url }] : [])] : []),
  ] }
  const page = { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: info.title, description: info.description, inLanguage: route.language, isPartOf: { '@id': website['@id'] }, about: { '@id': software['@id'] }, ...(route.view === 'docs' ? { breadcrumb: { '@id': breadcrumb['@id'] } } : {}), primaryImageOfPage: { '@type': 'ImageObject', url: image }, ...(route.view === 'docs' ? { mainEntity: { '@id': `${url}#article` } } : {}) }
  const article = { '@type': 'TechArticle', '@id': `${url}#article`, headline: info.title, description: info.description, inLanguage: route.language, url, mainEntityOfPage: { '@id': page['@id'] }, about: { '@id': software['@id'] }, author: { '@id': author['@id'] }, image, ...(info.group ? { articleSection: info.group } : {}) }
  return { url, image, title: route.view === 'docs' ? `${info.title} | Vue Neshan Maps` : info.title, description: info.description, locale: fa ? 'fa_IR' : 'en_US', imageAlt: fa ? 'دموی نقشه نشان در Vue با رابط فارسی' : 'Neshan map demo in Vue with English controls', alternates: (['fa', 'en'] as const).map(language=>({language, url: canonicalUrl({...route, language})})), schema: { '@context': 'https://schema.org', '@graph': [author, software, website, ...(route.view === 'docs' ? [breadcrumb] : []), page, ...(route.view === 'docs' ? [article] : [])] } }
}
export function applySeo(route: SiteRoute, info: PageInfo) {
  const seo = pageSeo(route, info)
  document.documentElement.lang = route.language; document.documentElement.dir = route.language === 'fa' ? 'rtl' : 'ltr'; document.title = seo.title
  function meta(key: string, content: string, attribute = 'name') { let el=document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`); if(!el){el=document.createElement('meta');el.setAttribute(attribute,key);document.head.append(el)}el.content=content }
  function link(rel:string, href:string, language?:string){const selector=language?`link[rel="${rel}"][hreflang="${language}"]`:`link[rel="${rel}"]`;let el=document.head.querySelector<HTMLLinkElement>(selector);if(!el){el=document.createElement('link');el.rel=rel;if(language)el.hreflang=language;document.head.append(el)}el.href=href}
  meta('description',seo.description);meta('robots','index, follow, max-image-preview:large')
  for(const [key,value] of Object.entries({'og:title':seo.title,'og:description':seo.description,'og:url':seo.url,'og:type':route.view==='docs'?'article':'website','og:site_name':'Vue Neshan Maps','og:locale':seo.locale,'og:image':seo.image,'og:image:alt':seo.imageAlt}))meta(key,value,'property')
  document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach(el=>el.remove());meta('og:locale:alternate',route.language==='fa'?'en_US':'fa_IR','property')
  for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':seo.title,'twitter:description':seo.description,'twitter:image':seo.image,'twitter:image:alt':seo.imageAlt}))meta(key,value)
  link('canonical',seo.url);for(const alt of seo.alternates)link('alternate',alt.url,alt.language);link('alternate',seo.alternates[0].url,'x-default')
  let json=document.getElementById('site-schema');if(!json){json=document.createElement('script');json.id='site-schema';json.setAttribute('type','application/ld+json');document.head.append(json)}json.textContent=JSON.stringify(seo.schema).replaceAll('<','\\u003c')
}
