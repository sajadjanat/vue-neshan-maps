# API reference

[Overview](../README.md) · [Feature guide](GUIDE.md) · [آموزش فارسی](GUIDE.fa.md) · [Complete examples](EXAMPLES.md)

[Nuxt 4: module and plugin](NUXT.md)
This reference covers 2.2.0. Start with the [README](../README.md#quick-start) for installation or the [feature guide](GUIDE.md) for task-based explanations. Named imports below are all from `vuejs-neshan-map-leaflet`.

## On this page

[MapLibre](#maplibre-live-traffic-and-places) · [Methods](#component-ref-methods) · [Shape options](#shape-option-compatibility) · [Slots](#slots) · [Leaflet props](#leaflet-props) · [Leaflet events](#leaflet-events-and-native-access) · [Plugin](#global-plugin) · [Nuxt](#ssr--nuxt) · [CSP](#leaflet-csp-and-custom-sdk-hosting) · [Migration](#migration-from-1x)

Typed, reactive Neshan **Leaflet and MapLibre** maps for **Vue 3.5.43+**. Includes Composition API helpers, live traffic/POI on MapLibre, location picking, declarative overlays and lazy SDK loading. This is a community wrapper, not an official Neshan product.

> Version 2 uses the official Neshan Leaflet **1.9.4 / SDK 1.0.8**. Neshan states that traffic and POI layers are no longer updated in this SDK. Those legacy options are ignored with a warning instead of loading obsolete tiles.

## MapLibre: live traffic and places

Use `NeshanMapLibre` for the patched vector renderer and adapted Neshan connection and live layers. Existing `NeshanMapLeaflet` imports and `useNeshanMap` remain available. Both components use **latitude, longitude** for public coordinates; native MapLibre and GeoJSON use longitude first.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLibre, MAPLIBRE_STYLES, useNeshanMapLibre, type Coordinates } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'
const center = ref<Coordinates>([35.7, 51.34])
const zoom = ref(13)
const traffic = ref(true), poi = ref(true)
const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const { map, onReady, onDestroy } = useNeshanMapLibre()
</script>
<template>
  <NeshanMapLibre
    v-model="center" v-model:zoom="zoom" :api-key="webKey"
    :map-style="MAPLIBRE_STYLES.light" :traffic="traffic" :poi="poi"
    :markers="[{ id: 'azadi', position: [35.7, 51.34], popup: 'Azadi', options: { draggable: true } }]"
    :pick-on-click="true" :styles="{ height: '550px' }"
    @ready="onReady" @destroy="onDestroy"
  />
  <label><input v-model="traffic" type="checkbox">Traffic</label>
  <label><input v-model="poi" type="checkbox">Places</label>
</template>
```

MapLibre GL JS **6.14.0** and an adapter-only fork of the Neshan connector load dynamically on mount. The self-contained worker is included; CSP must allow `worker-src blob:`. Package CSS includes its styles. SSR imports do not evaluate the renderer. Modern browsers with WebGL and `DecompressionStream` are required. All concurrent Neshan MapLibre maps on a page must use the same API key; the wrapper rejects conflicting keys because the vendor protocol stores a global key.

| MapLibre prop | Behavior |
| --- | --- |
| `apiKey`, `modelValue`, `zoom` | Web key and latitude-first controlled view |
| `mapStyle` | Official `MAPLIBRE_STYLES.light`, `dark`, `monochrome_light`, `monochrome_dark`, `pastel`; or a style URL/version-8 object |
| `traffic`, `poi` | Default `false`; toggles layers sourced from `traffic` / `points_source` in the supplied style |
| `markers` | `MapLibreMarker[]`; stable IDs, text popup, title tooltip, dragging; native `MarkerOptions` or a custom `element` |
| `polylines`, `polygons`, `circles` | Same coordinate models as Leaflet; line color/weight/opacity/dashArray, polygon/circle color/fillColor/fillOpacity/weight supported; radius in meters |
| `geojson` | GeoJSON features/collection/geometry, longitude first |
| `geojsonLayers` | Optional native layer definitions without source; otherwise point, line and polygon styles are supplied |
| `cluster` | Boolean or `MapLibreClusterOptions`; automatic cluster circles, counts and click expansion |
| `heatmap` | Boolean or `MapLibreHeatmapOptions`; separate unclustered weighted point source |
| `sources`, `layers` | Native source definitions and typed `MapLibreAdvancedLayer[]`; scoped IDs, `beforeId`, restoration |
| `geojsonOptions` | Native GeoJSON source options; Leaflet style callbacks do not apply |
| `options` | Native Neshan MapLibre constructor options; remount to change them |
| `styles`, `centerMarker`, `pickOnClick`, `fitMarkers`, `ariaLabel` | Same purpose as the Leaflet component |

Style changes keep the map, DOM markers and open popups, then restore custom GeoJSON layers and traffic/POI visibility on `style.load`. Traffic re-requests visible tiles every 60 seconds while enabled; HTTP caching and data freshness are controlled by Neshan. Custom styles must actually include the corresponding Neshan sources/layers; missing live layers emit a warning.

`ready` payload is `{ map, maplibre }`. `click` is the native event plus `coordinates: [latitude, longitude]`. Drag events match Leaflet's `(marker, coordinates)` shape. Location events contain `{ latlng: { lat, lng }, accuracy }` or `{ code, message }`. Loading/tile/error/warning, coordinate, zoom and destroy events and slots follow the Leaflet names below. MapLibre tile counters count source readiness/error events, rather than raster image counts. `live-layers` reports enabled flags and matched layer IDs.

A component ref exposes `map`, `maplibre`, `tileState`, `retry`, `fitToMarkers`, `invalidateSize`, `locate`, `openPopup(id)`, `flyTo(latitudeFirstCenter, zoom?, options?)`, `fitBounds(nativeLongitudeFirstBounds, options?)`, and `getDiagnostics()` (rendered traffic/POI feature counts, custom overlay kinds and marker count). Use `useNeshanMapLibre` with `@ready`/`@destroy` to retain native refs. Picking, marker edits, measurement and engine switching in the playground preserve application-owned coordinates.

### MapLibre defaults and event payloads

`apiKey` is required. The default view is `[35.6997, 51.338]`, zoom `13`, `MAPLIBRE_STYLES.light`; `traffic`, `poi`, `pickOnClick`, `fitMarkers` default to `false`, `centerMarker` to `true`, and shape/marker arrays to empty. The default `ariaLabel` is `Neshan MapLibre map`. `styles` augments the container's default 100% width / 450px height.

| Event | MapLibre payload |
| --- | --- |
| `ready` | `MapLibreReady`: `{ map, maplibre }` |
| `destroy` | No arguments |
| `error`, `warning` | `Error` / message string |
| `update:modelValue`, `latitude`, `longitude` | Latitude-first tuple / individual numbers |
| `update:zoom` | Number |
| `click` | `MapLibreClickEvent`: native mouse event with `coordinates: Coordinates` |
| `moveend`, `zoomend` | Native events |
| `marker-click` | Two arguments: `MapLibreMarker`, DOM `MouseEvent` |
| `marker-dragend` | Two arguments: `MapLibreMarker`, `Coordinates` |
| `tiles-loading`, `tiles-loaded`, `tile-error` | `TileState`: `{ status: 'idle' \| 'loading' \| 'loaded' \| 'error', loaded, failed }` |
| `location-found` | `{ latlng: { lat, lng }, accuracy }`; accuracy is meters |
| `location-error` | `{ code, message }`; browser geolocation error code |
| `resource-error` | `MapResourceFailure`: safe kind/message, optional status/code/retryAfter, retryable |
| `cluster-click` | `{ clusterId, pointCount, coordinates }` |
| `layer-click` | `{ layerId, features, coordinates }` for managed advanced layers |
| `live-layers` | `LiveLayerState`: `{ traffic, poi, trafficLayers: string[], poiLayers: string[] }` |

### Component ref methods

| Method | MapLibre | Leaflet |
| --- | --- | --- |
| `retry()` | Reinitialize; returns a promise | Reinitialize; returns a promise |
| `fitToMarkers()` | Padding 40px, max zoom 16 | Padding `[24,24]`, max zoom 16 |
| `invalidateSize()` | Native `resize()` | Native `invalidateSize()` |
| `flyTo(center, zoom?, options?)` | Public center is latitude first; native `FlyToOptions` | Native latitude-first center and zoom/pan options |
| `fitBounds(bounds, options?)` | Native longitude-first `LngLatBoundsLike` / `FitBoundsOptions` | Native latitude-first bounds / `FitBoundsOptions` |
| `locate(options?)` | `setView` default true, `maxZoom` default 16, `timeout` default 10000, `enableHighAccuracy` default true; one-shot browser position | Native `L.LocateOptions` with wrapper timeout default 10000ms; other defaults from Leaflet |
| `openPopup(id)` | Opens existing marker popup if closed | Use the native Leaflet map/layer API |
| `getDiagnostics()` | See below | Not provided |
| `expandCluster(id, center?)` | Promise of expansion zoom; optional latitude-first center | Not provided |
| `getClusterLeaves(id, limit = 10, offset = 0)` | Promise of GeoJSON point features | Not provided |

MapLibre diagnostics return `undefined` before map load, otherwise:

```ts
interface Diagnostics {
  traffic: string[] // Matching style layer IDs
  poi: string[]
  trafficVisible: boolean // Requested prop value
  poiVisible: boolean
  trafficFeatures: number // Rendered viewport features, not global totals
  poiFeatures: number
  overlays: string[] // Managed kinds: lines, polygons, circles, geojson
  markers: number
  styleLoaded: boolean | void // Native renderer result
}
```

Readiness/visibility flags alone do not prove data has loaded. At low zoom POI may be hidden by the style's zoom rules; rendered counts can be zero even when the toggle is enabled. Source events count readiness notifications rather than unique raster images. Tile failures persist in the current MapLibre state until reinitialization, style/live-layer changes reset the counters; `retry()` performs a full reinitialization.

### Shape option compatibility

| Overlay | MapLibre supported options | Leaflet |
| --- | --- | --- |
| Polyline | `color`, `weight`, `opacity`, `dashArray` (numbers or comma/space string; translated from pixel lengths to line-width ratios) | Native `L.PolylineOptions` |
| Polygon | `color`, `weight`, `fill`, `fillColor`, `fillOpacity`; ring arrays support holes | Native `L.PolylineOptions` |
| Circle | `color`, `weight`, `fill`, `fillColor`, `fillOpacity`; radius meters, geodesic polygon approximation | Native `L.CircleMarkerOptions` with meter-radius `L.circle` |
| GeoJSON | `geojsonOptions` uses native source options; `geojsonLayers` uses layer definitions without `source` | Native `L.GeoJSONOptions`, including callbacks |

`MapLibreMarker.options` is `Omit<MarkerOptions, 'element'>`; supply a custom DOM node through the separate `element` property. Tooltip text is a DOM title; native marker options are not interchangeable between engines. Marker IDs must be unique. Shape IDs are part of the shared data model; geometry updates retain worker sources and layers when definitions stay unchanged; individual native shape instances are not exposed by ID.

### Slots

| Slot | Context / behavior |
| --- | --- |
| `loading` | No props; shown during initialization |
| `error` | `{ error, retry }`; initialization error |
| `tile-error` | `{ state }`; partial resource failure without disposing the map |
| `center-marker` | No props; replaces the fixed center pin visual |
| Default | MapLibre: `{ map, maplibre, tileState }`; Leaflet: `{ map, leaflet, tileState }` |

MapLibre default content appears after initialization; Leaflet default content appears once a native map exists. Use explicit positioning for controls inside the default slot. MapLibre's initialization watchdog is 30 seconds; Leaflet's SDK loader timeout is configurable with `sdk.timeout` (default 15 seconds).

**Patched renderer:** 2.2.0 replaces the vulnerable bundled engine with MapLibre GL JS **6.14.0**. Neshan tile/RTL/branding compatibility comes from an adapter-only ISC fork of SDK 5.24.4, maintained by this community package. Attribution sanitization and text popups remain. See [security, CSP and compatibility](ADVANCED.md#security-and-renderer-compatibility). The release audit reports zero known vulnerabilities; this is a dependency snapshot, not a guarantee about application code.

## Install

```sh
npm install vuejs-neshan-map-leaflet@^2.2.0
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
- Reactive polylines, polygons, circles and GeoJSON overlays; optional fit to markers.
- Center pin, custom pin slot and click-to-pick location.
- Exposed map methods, native Leaflet access and a Composition API helper.
- Shared lazy SDK promise, timeout, retry and configurable URLs/CSP nonce.
- Loading/error/tile-error slots, tile loading events and automatic container resize handling.
- Unmount cleanup and cancellation of pending initialization; SSR-safe imports.
- Vue peer dependency, ESM/CommonJS exports and generated TypeScript declarations.

## Leaflet props

| Prop | Type | Default / behavior |
| --- | --- | --- |
| `apiKey` | `string` | Web key; overrides `options.key` |
| `modelValue` | `[number, number]` | Latitude, longitude; falls back to `options.center`, then Tehran |
| `zoom` | `number` | Falls back to `options.zoom`, then `13` |
| `options` | `NeshanMapOptions` | Native constructor options; default dreamy; POI/traffic ignored |
| `styles` | `Record<string, string \| number>` | Reactive container styles; default width 100%, height 450px |
| `centerMarker` | `boolean` | `true` |
| `pickOnClick` | `boolean` | `false`; pans the center to the clicked point |
| `markers` | `MapMarker[]` | `[]` |
| `polylines` | `MapPolyline[]` | `[]` |
| `polygons` | `MapPolygon[]` | `[]`; coordinates or coordinate rings |
| `circles` | `MapCircle[]` | `[]`; radius in meters |
| `geojson` | `GeoJSON.GeoJsonObject` | Optional GeoJSON (longitude first, per GeoJSON standard) |
| `geojsonOptions` | `L.GeoJSONOptions` | Native style/filter/callback options |
| `fitMarkers` | `boolean` | `false`; fits marker positions on overlay updates, max zoom 16 |
| `sdk` | `SdkOptions` | Optional `scriptUrl`, `styleUrl`, `timeout` (15000ms), `nonce` |
| `ariaLabel` | `string` | `Neshan map` |

`center` and `zoom` updates move the existing map. Changing `maptype` uses Neshan's documented `setMapType`, preserving native layers and open popups. The documented style names are `dreamy` and `standard-night`; custom tile URLs are also accepted. Other names depend on vendor availability.

Changing the API key or SDK configuration rebuilds the map and emits `destroy` then `ready`; restore consumer-owned layers after those changes. Other native options are constructor-only: remount with Vue's `:key` to change them. Uncontrolled maps preserve their view when rebuilding.

Marker IDs must be unique. Markers retain identity when their position, text or unrelated overlays change. Changing native marker options recreates that marker. Lines, polygons, circles and GeoJSON each rebuild independently when their own props change. For very large datasets use native Leaflet in `ready`.

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

## Leaflet events and native access

| Event | Payload |
| --- | --- |
| `ready` | `{ map, L }` |
| `destroy` | none |
| `error` | `Error` for initialization/overlay failure |
| `warning` | Unsupported legacy option message |
| `tiles-loading`, `tiles-loaded`, `tile-error` | `{ status, loaded, failed }` for the current tile batch |
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

`ready` means the engine initialized, not that tiles authenticated successfully. Listen for `tiles-loaded` and `tile-error` separately. Tile errors do not dispose the map; a successful new batch clears the warning. Counts aggregate currently tracked tile layers.

Define `webKey` as in the first example. `useNeshanMap` provides shallow refs; call it in setup. The component owns map disposal. Use `@destroy="onDestroy"` to clear the helper refs on component unmount/rebuild. A template ref additionally exposes `map`, `leaflet`, `tileState`, `retry()`, `fitToMarkers()`, `invalidateSize()`, `fitBounds(bounds, options?)`, `flyTo(center, zoom?, options?)`, and `locate(options?)`. Geolocation requires browser permission and HTTPS (or localhost).

Slots: `loading`, `error` (`{ error, retry }`), `tile-error` (`{ state }`), `center-marker`, and the default slot (`{ map, leaflet, tileState }`, after initialization). Put interactive map controls in the default slot with your own absolute positioning.

## Global plugin

```ts
import NeshanMapPlugin from 'vuejs-neshan-map-leaflet'
app.use(NeshanMapPlugin)
```

Both named component exports are installable individually. The default plugin registers `NeshanMapLeaflet` and `NeshanMapLibre`. For local use, import the desired component directly in `<script setup>`.

## SSR / Nuxt

The package imports without touching the DOM. The SDK loads in `onMounted`, so server rendering produces a loading placeholder. Import package CSS globally. With Nuxt you may also use `<ClientOnly>` if you prefer no server placeholder. Vue manages hydration; do not load the Neshan SDK in server code.

## Leaflet CSP and custom SDK hosting

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

1. Vue is now a peer dependency; use Vue 3.5.43 or newer.
2. Import `vuejs-neshan-map-leaflet/style.css`. Legacy `dist/style.css` remains an export alias.
3. Existing `options.key`, `options.center`, `styles`, `latitude` and `longitude` still work. Prefer `api-key` and two-way models for new apps.
4. The package now ships ESM and CommonJS, not a UMD script-tag build.
5. Default width is responsive (100%); set `styles.width` to preserve a fixed width.
6. The center pin uses customizable CSS instead of the old embedded image.
7. Native map references must be refreshed on each `ready` after key or SDK configuration changes.

## Development

Node 22.12+ or a supported newer LTS (24+).

```sh
npm ci
cp .env.example .env.local
# Set VITE_NESHAN_WEB_KEY to a domain-allowed WEB key, then:
npm run dev
npm run typecheck
npm test
npm run test:sdk
npm run build
npm run build:demo
npm run test:package
npm pack --dry-run
```

The playground accepts a web key at runtime without saving it. Never commit `.env.local`. Unit tests cover loader failures, lifecycle and SSR. `test:sdk` downloads the pinned official SDK (cached under ignored `work/`) and exercises its real renderer, marker dragging events, styles, picking, zoom, fit bounds, overlay validation and tile failure recovery in jsdom. Image networking and quota requests are stubbed, and location events are simulated; these tests do not prove live tiles or device GPS. Live tiles require a valid domain-allowed web key. CI checks Node 22 and 24. Publishing is a separate maintainer action.

## References

- [Vue composables and lifecycle cleanup](https://vuejs.org/guide/reusability/composables)
- [Neshan Leaflet SDK documentation](https://platform.neshan.org/docs/sdk/web/leaflet/neshan-leaflet-sdk/)
- [Neshan MapLibre SDK documentation](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/)
- [Neshan's original Leaflet wrapper and native map access](https://github.com/NeshanMaps/react-neshan-map-leaflet)
- [Leaflet 1.9.4 API reference](https://leafletjs.com/reference-1.9.4.html)

MIT © Sajad Abasi

## Advanced MapLibre examples

See [clusters, heatmap, sources/layers, performance, structured errors and security](ADVANCED.md), including defaults and complete Vue/Nuxt usage.
