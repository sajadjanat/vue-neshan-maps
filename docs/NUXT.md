# Nuxt 4 integration

[Overview](../README.md) · [فارسی](NUXT.fa.md) · [Feature guide](GUIDE.md) · [Runnable Nuxt app](../examples/nuxt4)

The dedicated Nuxt module and plugin are available from **2.1.0**. They use the same map components and preserve their existing props, events, slots and methods. Nuxt is an optional peer: ordinary Vue applications do not install it.

The included example uses Nuxt 4.6.1, which requires Node `^22.22.3`, `^24.15.0` or `>=26.0.0`. This is stricter than the standalone Vue package's tooling requirement. Validation uses Node 24.21.0.

## Recommended: Nuxt module

```sh
npm install vuejs-neshan-map-leaflet@^2.2.0
```

Add the module to your project's root `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  runtimeConfig: { public: { neshanWebKey: '' } },
})
```

Set the **web** key in your ignored `.env` for development:

```dotenv
NUXT_PUBLIC_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
```

For production, set that variable in the hosting environment. Nuxt's built server does not automatically read your development `.env`. A web key is intentionally public and must be restricted to your domains; keep service keys in private server runtime config.

The module registers `NeshanMapLibre` and `NeshanMapLeaflet`, adds package CSS once, auto-imports `useNeshanMapLibre`, `useNeshanMap` and `MAPLIBRE_STYLES`, and declares `runtimeConfig.public.neshanWebKey` if absent. You do not need an additional plugin, CSS import or `<ClientOnly>` for the basic map.

Create `app/pages/index.vue` and render `<NuxtPage />` from `app/app.vue`, or put this component directly in `app/app.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Coordinates, MapLibreMarker } from 'vuejs-neshan-map-leaflet'

const config = useRuntimeConfig()
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const traffic = ref(true)
const poi = ref(true)
const dark = ref(false)
const markers: MapLibreMarker[] = [
  { id: 'azadi', position: [35.6997, 51.338], popup: 'Azadi Square' },
]
const { map, onReady, onDestroy } = useNeshanMapLibre()
</script>

<template>
  <label><input v-model="traffic" type="checkbox">Traffic</label>
  <label><input v-model="poi" type="checkbox">Places</label>
  <label><input v-model="dark" type="checkbox">Dark map</label>
  <NeshanMapLibre
    v-model="center" v-model:zoom="zoom" :api-key="config.public.neshanWebKey"
    :map-style="dark ? MAPLIBRE_STYLES.dark : MAPLIBRE_STYLES.light"
    :traffic="traffic" :poi="poi" :markers="markers" :pick-on-click="true"
    :styles="{ height: '520px' }" @ready="onReady" @destroy="onDestroy"
  />
  <p>Center: {{ center }} · Zoom: {{ zoom }} · Ready: {{ Boolean(map) }}</p>
</template>
```

Type imports remain explicit. The module's components and composables are available through Nuxt auto-registration. For Leaflet, replace the component with `NeshanMapLeaflet`, use `:options="{ maptype: 'dreamy' }"` instead of `mapStyle` and omit traffic/POI. Use `useNeshanMap` for native Leaflet access. All [feature-guide examples](GUIDE.md) can be adapted with `useRuntimeConfig()` instead of Vite's `import.meta.env`.

## Module options

```ts
export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  neshanMap: { css: true, components: true, imports: true },
})
```

All options default to `true`. Disable `css` only if you import it elsewhere; disable `components` or `imports` to take over registration yourself. Tuple options also work: `modules: [['vuejs-neshan-map-leaflet/nuxt', { imports: false }]]`.

## Alternative: register a Nuxt plugin

For manual global registration, use the plugin entry **instead of** the module:

```ts
export default defineNuxtConfig({
  plugins: ['vuejs-neshan-map-leaflet/nuxt/plugin'],
  css: ['vuejs-neshan-map-leaflet/style.css'],
  runtimeConfig: { public: { neshanWebKey: '' } },
})
```

This plugin registers both components on `nuxtApp.vueApp`. CSS, public config and composable imports are your responsibility. In a page, explicitly import `useNeshanMapLibre` and `MAPLIBRE_STYLES` from the package; the plugin does not enable auto-imports.

You can also create `app/plugins/neshan.ts` yourself using the existing Vue plugin; this works with 2.0.1 as well:

```ts
import { NeshanMapPlugin } from 'vuejs-neshan-map-leaflet'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(NeshanMapPlugin)
})
```

Import CSS globally in `nuxt.config.ts`. Choose one registration method to avoid redundant registration.

## SSR and hydration

The component can render its container/loading state on the server; the SDK initializes on client mount. The module and plugin do not read `window`, request location or fetch map tiles during SSR. Call native methods after `ready` and wire `destroy` to clear composable refs during navigation.

Use `<ClientOnly>` or a `.client.vue` wrapper if your own surrounding plugin accesses browser globals. If using `<ClientOnly>`, give the fallback a fixed height to reduce layout shift. Do not initialize a native map in server setup.

## Run the repository example

```sh
npm ci
npm run build
cd examples/nuxt4
npm install
cp .env.example .env
npm run dev
```

Run the first two commands at the repository root. Replace the placeholder key in the example's `.env`. You can also enter a key in its runtime form; it is not saved. The example consumes the local built package and demonstrates SSR, automatic registration, live layers, style switching, editable markers and native refs.

```sh
npm run typecheck
npm run build
```

Run these two commands inside `examples/nuxt4`. A production build should succeed without a key; an authorized key is needed to load actual map data in the browser.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Cannot resolve `/nuxt` | Install 2.1.0+; 2.0.1 supports the manual `app/plugins/neshan.ts` approach. |
| Component/composable unknown | Check module registration; run `npx nuxt prepare` and restart the editor/dev server. |
| No map styles | With the manual plugin, add package CSS to `nuxt.config.ts`. |
| Empty production key | Set `NUXT_PUBLIC_NESHAN_WEB_KEY` on the running host; do not rely on a development `.env`. |
| Blank map after hydration | Check container height, key/domain/quota/network, WebGL and `DecompressionStream`. |
| Native ref stale after navigation | Wire both `@ready="onReady"` and `@destroy="onDestroy"`. |

See the official Nuxt documentation for [modules](https://nuxt.com/docs/4.x/guide/modules/recipes-basics), [plugins](https://nuxt.com/docs/4.x/directory-structure/app/plugins) and [runtime config](https://nuxt.com/docs/4.x/guide/going-further/runtime-config).

## Vazir font

Vazir 30.1.0 regular and bold are bundled as self-hosted WOFF2 files. The original SIL OFL license and author credits are included in `fonts`. No font CDN is required.

```ts
export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  css: ['vuejs-neshan-map-leaflet/fonts/vazir.css'],
})
```

```html
<main class="neshan-font-vazir" lang="fa" dir="rtl">
  <!-- Your map and Persian controls -->
</main>
```

The class styles the interface and HTML popups. Vector labels use the Neshan style glyphs; raster labels are part of tile images. This font does not replace either. GitHub controls its Markdown typography; Persian screenshots are captured with Vazir.

In 2.2.3 the Nuxt example Git-tooling critical advisories are fixed with a scoped override; two unpatched upstream high advisories remain. [Exact audit scope, consumer configuration and limitations](DEPENDENCY-SECURITY.md).
