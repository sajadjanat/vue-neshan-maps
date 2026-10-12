export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  neshanMap: { css: true, components: true, imports: true },
  compatibilityDate: '2026-10-12',
  devtools: { enabled: false },
  runtimeConfig: { public: { neshanWebKey: '' } },
})
