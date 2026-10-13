export default defineNuxtConfig({
  css: ['vue-neshan-maps/fonts/vazir.css'],
  modules: ['vue-neshan-maps/nuxt'],
  neshanMap: { css: true, components: true, imports: true },
  compatibilityDate: '2026-10-12',
  devtools: { enabled: false },
  runtimeConfig: { public: { neshanWebKey: '' } },
})
