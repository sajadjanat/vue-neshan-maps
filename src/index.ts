import type { App, Plugin } from 'vue'
import Component from './components/NeshanMapLeaflet.vue'
export const NeshanMapLeaflet: typeof Component & { install(app: App): void } = Object.assign(Component, {
  install(app: App) { app.component('NeshanMapLeaflet', Component) },
})
export const NeshanMapPlugin: Plugin = { install: NeshanMapLeaflet.install }
export default NeshanMapPlugin
export { loadNeshanSdk } from './loader'
export { useNeshanMap } from './useNeshanMap'
export type { LeafletNamespace, SdkOptions } from './loader'
export type * from './types'
