import { defineNuxtModule, createResolver, addComponent, addImports } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'vuejs-neshan-map-leaflet',
    configKey: 'neshanMap',
    compatibility: { nuxt: '^4.0.0' },
  },
  defaults: { css: true, components: true, imports: true },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const entry = 'vuejs-neshan-map-leaflet'
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
