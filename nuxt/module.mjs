import { readFileSync } from 'node:fs'
import { defineNuxtModule, createResolver, addComponent, addImports } from 'nuxt/kit'

const { name: packageName } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

export default defineNuxtModule({
  meta: {
    name: packageName,
    configKey: 'neshanMap',
    compatibility: { nuxt: '^4.0.0' },
  },
  defaults: { css: true, components: true, imports: true },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const entry = packageName
    const css = resolver.resolve('../dist/vuejs-neshan-map-leaflet.css')
    if (options.css && !nuxt.options.css.includes(css)) nuxt.options.css.push(css)
    if (options.components) {
      for (const name of ['NeshanMapLibre', 'NeshanMapLeaflet']) {
        addComponent({ name, export: name, filePath: entry, global: true })
      }
    }
    if (options.imports) {
      addImports(['useNeshanMapLibre', 'useNeshanMap', 'MAPLIBRE_STYLES'].map(name => ({ name, from: entry })))
    }
    nuxt.options.runtimeConfig.public.neshanWebKey ??= ''
  },
})
