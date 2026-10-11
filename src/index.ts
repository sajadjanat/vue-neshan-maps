import type { App, Plugin } from 'vue'
import Component from './components/NeshanMapLeaflet.vue'
import MapLibreComponent from './components/NeshanMapLibre.vue'
export const NeshanMapLeaflet: typeof Component & { install(app: App): void } = Object.assign(Component, {
  install(app: App) { app.component('NeshanMapLeaflet', Component) },
})
export const NeshanMapLibre: typeof MapLibreComponent & { install(app:App):void } = Object.assign(MapLibreComponent, {
  install(app:App){app.component('NeshanMapLibre',MapLibreComponent)},
})
export const NeshanMapPlugin: Plugin = { install(app){NeshanMapLeaflet.install(app);NeshanMapLibre.install(app)} }
export default NeshanMapPlugin
export { loadNeshanSdk } from './loader'
export { useNeshanMap } from './useNeshanMap'
export { useNeshanMapLibre } from './useNeshanMapLibre'
export type { LeafletNamespace, SdkOptions } from './loader'
export type * from './types'
export { loadNeshanMapLibre, MAPLIBRE_STYLES } from './maplibre'
export type { MapLibreNamespace } from './maplibre'
export type * from './maplibre-types'
