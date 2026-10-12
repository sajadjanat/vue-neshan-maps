import type { NuxtModule } from 'nuxt/schema'

export interface ModuleOptions {
  /** Add the package's CSS. Default: true. */
  css?: boolean
  /** Register both map components globally. Default: true. */
  components?: boolean
  /** Auto-import the composables and MAPLIBRE_STYLES. Default: true. */
  imports?: boolean
}

declare const module: NuxtModule<ModuleOptions>
export default module

declare module 'nuxt/schema' {
  interface NuxtConfig { neshanMap?: ModuleOptions }
  interface NuxtOptions { neshanMap?: ModuleOptions }
  interface PublicRuntimeConfig { neshanWebKey: string }
}
