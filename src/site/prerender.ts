import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import DocsView from '../docs/DocsView.vue'
import Playground from '../demo/Playground.vue'
import { pages, groups } from '../docs/catalog'
import { pageSeo, demoInfo, applySeo } from './seo'
import { routePath, type SiteRoute } from './routes'
export const routes: SiteRoute[] = (['fa', 'en'] as const).flatMap(language=>[{language,view:'demo' as const},...pages.map(page=>({language,view:'docs' as const,doc:page.id}))])
export async function renderPage(route: SiteRoute) {
  const page=pages.find(p=>p.id===route.doc)
  const info=page?{title:page.title[route.language],description:page.summary[route.language],group:groups[route.language].split('|')[page.group]}:demoInfo[route.language]
  applySeo(route,info)
  return { path:routePath(route), seo:pageSeo(route,info), html:await renderToString(createSSRApp(route.view==='docs'?DocsView:Playground)) }
}
