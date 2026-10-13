export type SiteLanguage = 'fa' | 'en'
export const SITE = 'https://sajadjanat.github.io/vue-neshan-maps/'
export interface SiteRoute { language: SiteLanguage; view: 'demo' | 'docs'; doc?: string }
export function resolveRoute(url: URL): SiteRoute {
  const path = url.pathname.replace(/^\/vue-neshan-maps\//, '/').split('/').filter(Boolean)
  const language: SiteLanguage = url.searchParams.get('lang') === 'en' ? 'en' : url.searchParams.get('lang') === 'fa' ? 'fa' : path[0] === 'en' ? 'en' : 'fa'
  const docs = url.searchParams.get('view') === 'docs' || path[1] === 'docs'
  return { language, view: docs ? 'docs' : 'demo', ...(docs ? { doc: url.searchParams.get('doc') || path[2] || 'overview' } : {}) }
}
export function routePath(route: SiteRoute) { return `${route.language}/${route.view === 'docs' ? `docs/${route.doc || 'overview'}/` : ''}` }
export function siteHref(route: SiteRoute) { return `${import.meta.env.BASE_URL}${routePath(route)}` }
export function canonicalUrl(route: SiteRoute) { return new URL(routePath(route), SITE).href }
