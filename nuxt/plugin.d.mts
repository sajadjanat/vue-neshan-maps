import type { Plugin } from 'nuxt/app'
import type { NeshanMapLibre, NeshanMapLeaflet } from '../dist/index.js'

declare const plugin: Plugin
export default plugin

declare module 'vue' {
  interface GlobalComponents {
    NeshanMapLibre: typeof NeshanMapLibre
    NeshanMapLeaflet: typeof NeshanMapLeaflet
  }
}
