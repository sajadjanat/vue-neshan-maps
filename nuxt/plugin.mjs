import { defineNuxtPlugin } from 'nuxt/app'
import { NeshanMapPlugin } from '../dist/vuejs-neshan-map-leaflet.js'

// Optional manual integration. The Nuxt module registers components separately.
export default defineNuxtPlugin({
  name: 'vue-neshan-maps',
  setup(nuxtApp) { nuxtApp.vueApp.use(NeshanMapPlugin) },
})
