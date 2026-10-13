import { describe,it,expect } from 'vitest'
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from '@vue/compiler-sfc'
import { pages } from '../src/docs/catalog'
import { renderMarkdown,section } from '../src/docs/markdown'
import { exampleCode,examplePoints } from '../src/docs/examples'

describe('online documentation contracts',()=>{
  it('has complete bilingual chapters and stable table-of-contents targets',()=>{
    expect(new Set(pages.map(page=>page.id)).size).toBe(pages.length)
    for(const page of pages)for(const language of ['en','fa'] as const){
      expect(page.title[language].length).toBeGreaterThan(2)
      expect(page.body[language].length).toBeGreaterThan(100)
      const result=renderMarkdown(page.body[language],language)
      expect(result.headings.length).toBeGreaterThan(0)
      expect(new Set(result.headings.map(h=>h.id)).size).toBe(result.headings.length)
      for(const heading of result.headings)expect(result.html).toContain(`id="${heading.id}"`)
    }
  })
  it('covers every declared component prop in the Persian API reference',()=>{
    const reference=readFileSync(resolve('docs/API.fa.md'),'utf8')
    for(const [file,name] of [['src/types.ts','NeshanMapProps'],['src/maplibre-types.ts','MapLibreProps']]){
      const source=readFileSync(resolve(file),'utf8').split(`interface ${name} {`)[1].split('\n}')[0]
      const names=[...source.matchAll(/^  (\w+)\??:/gm)].map(match=>match[1])
      expect(names.length).toBeGreaterThan(10)
      for(const name of names)expect(reference,`Undocumented prop ${name}`).toContain(`\`${name}\``)
    }
  })
  it('does not interpret unsafe Markdown HTML, links or executable code',()=>{
    const result=renderMarkdown('<script>alert(1)</script>\n<img src=x onerror="alert(1)">\n[bad](javascript:alert(1))\n\n```html\n<script>alert(2)</script>\n```','en')
    expect(result.html).not.toMatch(/<script|onerror=|href="javascript:/i)
    expect(result.html).toContain('&lt;script&gt;alert(2)&lt;/script&gt;')
  })
  it('keeps wide tables in a keyboard-scrollable container on narrow screens',()=>{
    const result=renderMarkdown('| Option | Meaning |\n| --- | --- |\n| traffic | Live traffic |','en')
    expect(result.html).toMatch(/<div class="doc-table" tabindex="0"><table>/)
  })
  it('ignores code-fence headings and disambiguates repeated heading IDs',()=>{
    const source='## First\n\n```bash\n## Not a heading\n```\n\nbody\n## Second\nnext'
    expect(section(source,'First')).toContain('Not a heading')
    expect(section(source,'First')).not.toContain('## Second')
    const result=renderMarkdown('## Same\nA\n## Same\nB','en')
    expect(result.headings.map(h=>h.id)).toEqual(['same','same-1'])
  })
  it('produces standalone, non-secret Vue examples for strict type checking',()=>{
    const dir=resolve('work/docs-examples');mkdirSync(dir,{recursive:true})
    const ids=[...new Set(pages.flatMap(page=>page.example?[page.example]:[]))]
    for(const id of ids)for(const language of ['en','fa'] as const){
      const code=exampleCode({id,language,dark:false,traffic:true,poi:true,cluster:id==='clusters',heatmap:id==='heatmap',radius:50,intensity:.7,shapes:true})
      expect(parse(code).errors,`${id}/${language}`).toEqual([])
      expect(code).toContain('VITE_NESHAN_WEB_KEY')
      expect(code).not.toMatch(/(?:web|service)\.[a-f0-9]{32}/i)
      writeFileSync(`${dir}/${id}-${language}.vue`,code)
    }
    const combined=exampleCode({id:'clusters',language:'fa',dark:true,traffic:false,poi:false,cluster:true,heatmap:true,radius:75,intensity:1.2,shapes:false})
    writeFileSync(`${dir}/combined.vue`,combined)
    writeFileSync(`${dir}/tsconfig.json`,JSON.stringify({extends:'../../tsconfig.json',compilerOptions:{noEmit:true,paths:{'vue-neshan-maps':[resolve('src/index.ts')]}},include:['*.vue']}))
    expect(examplePoints.features).toHaveLength(120)
    for(const feature of examplePoints.features){expect(feature.geometry.type).toBe('Point');expect(feature.properties?.weight).toBeGreaterThan(0)}
  })
})
