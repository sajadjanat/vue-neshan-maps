# Vue Neshan Map Leaflet · v2

Typed, reactive Neshan maps for **Vue 3.3+**. Includes a Composition API helper, location picking, declarative overlays and lazy SDK loading. This is a community wrapper, not an official Neshan product.

> Version 2 is a major migration. The wrapper tooling is modernized; the default map engine remains Neshan's hosted Leaflet 1.4.0 SDK. It does not claim to upgrade that vendor engine or replace it with MapLibre.

## Install

```sh
npm install vuejs-neshan-map-leaflet
```

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLeaflet, type Coordinates } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
</script>

<template>
  <NeshanMapLeaflet
    v-model="center"
    v-model:zoom="zoom"
    :api-key="webKey"
    :pick-on-click="true"
    :markers="[{ id: 'azadi', position: [35.6997, 51.338], popup: 'Azadi Square' }]"
    :styles="{ height: '500px' }"
  />
</template>
```

A **web** key is required to display tiles. Restrict it to your allowed domains in Neshan. Service API keys belong on a server; never put them in a Vue/Vite public environment variable. This package does not call search, geocoding or routing services. A polyline displays coordinates supplied by your app; it does not calculate a route.

Neshan's SDK and CSS load automatically on mount. Import the package CSS once for container and overlay styling. An existing `window.L` must be the Neshan SDK, not a vanilla Leaflet instance. The SDK uses a global namespace; multiple versions in one page are unsupported.

## Features

- `v-model` coordinates and `v-model:zoom`, with no feedback loop on equal positions.
- Reactive markers with text popups, tooltips, dragging and click events.
- Reactive polylines, circles and GeoJSON overlays; optional fit to markers.
- Center pin, custom pin slot and click-to-pick location.
- Exposed map methods, native Leaflet access and a Composition API helper.
- Shared lazy SDK promise, timeout, retry and configurable URLs/CSP nonce.
- Loading/error slots, accessible status text and automatic container resize handling.
- Unmount cleanup and cancellation of pending initialization; SSR-safe imports.
- Vue peer dependency, ESM/CommonJS exports and generated TypeScript declarations.

## Props

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `apiKey` | `string` | Web key; overrides `options.key` |
| `modelValue` | `[number, number]` | Latitude, longitude; falls back to `options.center`, then Tehran |
| `zoom` | `number` | Falls back to `options.zoom`, then `13` |
| `options` | `NeshanMapOptions` | Native constructor options; default dreamy, POI enabled, traffic disabled |
| `styles` | `Record<string, string \| number>` | Reactive container styles; default width 100%, height 450px |
| `centerMarker` | `boolean` | `true` |
| `pickOnClick` | `boolean` | `false`; pans the center to the clicked point |
| `markers` | `MapMarker[]` | `[]` |
| `polylines` | `MapPolyline[]` | `[]` |
| `circles` | `MapCircle[]` | `[]`; radius in meters |
| `geojson` | `GeoJSON.GeoJsonObject` | Optional GeoJSON (longitude first, per GeoJSON standard) |
| `geojsonOptions` | `L.GeoJSONOptions` | Native style/filter/callback options |
| `fitMarkers` | `boolean` | `false`; fits marker positions on overlay updates, max zoom 16 |
| `sdk` | `SdkOptions` | Optional `scriptUrl`, `styleUrl`, `timeout` (15000ms), `nonce` |
| `ariaLabel` | `string` | `Neshan map` |

`center`, `zoom`, key, maptype, POI and traffic updates are reactive. Changing key, maptype, POI, traffic or SDK configuration rebuilds the map and emits `destroy` then `ready`; consumer-owned native layers must be restored in `ready`. Other native `options` are constructor-only: remount with Vue's `:key` to change them. Uncontrolled maps preserve their current view when rebuilding. Overlay arrays are deeply watched and rebuilt as a group; for very large datasets use native Leaflet in `ready` instead of frequent full-array updates. IDs are application identifiers, not a differential update cache.

Popup and tooltip strings are rendered as **plain text**, including strings that contain HTML. Custom HTML can be added using native Leaflet; your app is responsible for sanitizing it.

```ts
interface MapMarker {
  id: string | number
  position: [number, number]
  popup?: string
  tooltip?: string
  options?: L.MarkerOptions
}
interface MapPolyline {
  id: string | number
  positions: [number, number][]
  options?: L.PolylineOptions
}
interface MapCircle {
  id: string | number
  center: [number, number]
  radius: number
  options?: L.CircleMarkerOptions
}
```

## Events and native access

| Event | Payload |
| --- | --- |
| `ready` | `{ map, L }` |
| `destroy` | none |
| `error` | `Error` for initialization/overlay failure; tile authentication/network errors remain SDK events |
| `update:modelValue` | `[latitude, longitude]` after moveend |
| `update:zoom` | zoom after zoomend |
| `latitude`, `longitude` | individual coordinates (v1 compatibility) |
| `click` | Leaflet mouse event |
| `moveend`, `zoomend` | Leaflet event |
| `marker-click` | `(marker, mouseEvent)` |
| `marker-dragend` | `(marker, [latitude, longitude])`; update your markers array to persist the new position |
| `location-found`, `location-error` | Native Leaflet location/error event |

```vue
<script setup lang="ts">
import { useNeshanMap, NeshanMapLeaflet } from 'vuejs-neshan-map-leaflet'
const { map, leaflet, onReady, onDestroy } = useNeshanMap()
function locate() { map.value?.locate({ setView: true, maxZoom: 16 }) }
</script>
<template>
  <NeshanMapLeaflet :api-key="webKey" @ready="onReady" @destroy="onDestroy" />
  <button @click="locate">My location</button>
</template>
```

Define `webKey` as in the first example. `useNeshanMap` provides shallow refs; call it in setup. The component owns map disposal. Use `@destroy="onDestroy"` to clear the helper refs on component unmount/rebuild. A template ref additionally exposes `map`, `leaflet`, `retry()`, `invalidateSize()`, `fitBounds(bounds, options?)`, `flyTo(center, zoom?, options?)`, and `locate(options?)`. Geolocation requires browser permission and HTTPS (or localhost).

Slots: `loading`, `error` (`{ error, retry }`), `center-marker`, and the default slot (`{ map, leaflet }`, after initialization). Put interactive map controls in the default slot with your own absolute positioning.

## Global plugin

```ts
import NeshanMapPlugin from 'vuejs-neshan-map-leaflet'
app.use(NeshanMapPlugin)
```

The named `NeshanMapLeaflet` export is also installable with `app.use(NeshanMapLeaflet)`. For local use, import it directly in `<script setup>`.

## SSR / Nuxt

The package imports without touching the DOM. The SDK loads in `onMounted`, so server rendering produces a loading placeholder. Import package CSS globally. With Nuxt you may also use `<ClientOnly>` if you prefer no server placeholder. Vue manages hydration; do not load the Neshan SDK in server code.

## CSP and custom SDK hosting

```ts
const sdk = {
  nonce: 'your-response-nonce',
  timeout: 20000,
  // scriptUrl: '/vendor/neshan/leaflet.js',
  // styleUrl: '/vendor/neshan/leaflet.css',
}
```

Pass with `:sdk="sdk"`. Configure CSP to allow the Neshan SDK, styles, tile hosts and their image/font resources. First initialization determines the shared SDK resources; a page cannot switch SDK versions after loading. `loadNeshanSdk(sdk?)` is also exported for explicit preloading in the browser.

## Migration from 1.x

1. Vue is now a peer dependency; use Vue 3.3 or newer.
2. Import `vuejs-neshan-map-leaflet/style.css`. Legacy `dist/style.css` remains an export alias.
3. Existing `options.key`, `options.center`, `styles`, `latitude` and `longitude` still work. Prefer `api-key` and two-way models for new apps.
4. The package now ships ESM and CommonJS, not a UMD script-tag build.
5. Default width is responsive (100%); set `styles.width` to preserve a fixed width.
6. The center pin uses a customizable default emoji instead of the old embedded image.
7. Native map references must be refreshed on each `ready` after SDK option changes.

## Development

Node 22.12+ or a supported newer LTS (24+).

```sh
npm ci
cp .env.example .env.local
# Set VITE_NESHAN_WEB_KEY to a domain-allowed WEB key, then:
npm run dev
npm run typecheck
npm test
npm run build
npm run build:demo
npm pack --dry-run
```

The playground also accepts a web key at runtime without saving it. Never commit `.env.local`. Tests use an SDK double and cover lifecycle, overlays, failures and SSR; they do not prove vendor tile availability. Live tiles need a valid domain-allowed web key. CI checks Node 22 and 24. Publishing is a separate maintainer action.

## راهنمای فارسی

‏این پکیج برای Vue 3 طراحی شده و انتخاب موقعیت، مارکرهای واکنشی، نمایش خطوط و محدوده‌ها، GeoJSON و دسترسی مستقیم به Leaflet را فراهم می‌کند. برای نمایش نقشه باید کلید وب نشان داشته باشید؛ کلید سرویس را فقط روی سرور استفاده کنید.

‏مختصات معمول پکیج به ترتیب عرض و طول جغرافیایی است. مختصات داخل GeoJSON مطابق استاندارد آن، طول و سپس عرض است. برای انتخاب موقعیت از `v-model` و برای کنترل زوم از `v-model:zoom` استفاده کنید.

‏برای اجرای نمونه، وابستگی‌ها را نصب و دستور `npm run dev` را اجرا کنید. کلید وب را در صفحهٔ نمونه وارد کنید یا در فایل محلی محیط قرار دهید. نمونه شامل تغییر سبک، ترافیک، انتخاب نقطه، مارکر قابل جابه‌جایی و دریافت موقعیت مرورگر است.

## References

- [Vue composables and lifecycle cleanup](https://vuejs.org/guide/reusability/composables)
- [Neshan web platform](https://platform.neshan.org/sdk/web-sdk/)
- [Neshan's original Leaflet wrapper and native map access](https://github.com/NeshanMaps/react-neshan-map-leaflet)
- [Leaflet API reference](https://leafletjs.com/reference.html)

MIT © Sajad Abasi
