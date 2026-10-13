import { describe, it, expect } from 'vitest'
import { resolveRoute, canonicalUrl } from '../src/site/routes'
import { applySeo, pageSeo, demoInfo } from '../src/site/seo'
import { pages } from '../src/docs/catalog'

describe('localized site SEO',()=>{
  it('resolves clean paths and preserves historical query links',()=>{
    expect(resolveRoute(new URL('https://example.com/vue-neshan-maps/en/docs/nuxt/'))).toEqual({language:'en',view:'docs',doc:'nuxt'})
    expect(resolveRoute(new URL('https://example.com/vue-neshan-maps/?view=docs&lang=fa&doc=clusters'))).toEqual({language:'fa',view:'docs',doc:'clusters'})
    expect(resolveRoute(new URL('https://example.com/?lang=en'))).toEqual({language:'en',view:'demo'})
    expect(canonicalUrl({language:'fa',view:'docs',doc:'nuxt'})).toBe('https://sajadjanat.github.io/vue-neshan-maps/fa/docs/nuxt/')
  })
  it('describes all translated pages without invented review or pricing data',()=>{
    for(const language of ['fa','en'] as const)for(const page of pages){
      const seo=pageSeo({language,view:'docs',doc:page.id},{title:page.title[language],description:page.summary[language]})
      expect(seo.alternates.map(a=>a.language)).toEqual(['fa','en'])
      expect(seo.schema['@graph'].find(n=>n['@type']==='TechArticle')).toMatchObject({headline:page.title[language],inLanguage:language})
      expect(JSON.stringify(seo.schema)).not.toMatch(/aggregateRating|reviewCount|priceCurrency|FAQPage|SearchAction/)
      expect(seo.schema['@graph'].filter(n=>n['@type']==='BreadcrumbList')).toHaveLength(1)
    }
  })
  it('replaces all head signals after chapter and language changes without duplicates',()=>{
    document.head.innerHTML=''
    applySeo({language:'fa',view:'demo'},demoInfo.fa)
    applySeo({language:'en',view:'docs',doc:'nuxt'},{title:'Nuxt 4',description:'Nuxt module and manual plugin'})
    applySeo({language:'en',view:'docs',doc:'nuxt'},{title:'Nuxt 4',description:'Nuxt module and manual plugin'})
    expect(document.documentElement.lang).toBe('en');expect(document.documentElement.dir).toBe('ltr')
    expect(document.head.querySelectorAll('link[rel=canonical]')).toHaveLength(1)
    expect(document.head.querySelectorAll('link[hreflang]')).toHaveLength(3)
    expect(document.head.querySelectorAll('#site-schema')).toHaveLength(1)
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toContain('/en/docs/nuxt/')
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('en_US')
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image')
    expect(JSON.parse(document.getElementById('site-schema')!.textContent)['@context']).toBe('https://schema.org')
  })
})
