# Vue Neshan Map

**Reactive Neshan maps for Vue 3. MapLibre and Leaflet, one typed component library.**

[![CI](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/actions/workflows/quality.yml/badge.svg)](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/actions)
[![npm](https://img.shields.io/npm/v/vuejs-neshan-map-leaflet)](https://www.npmjs.com/package/vuejs-neshan-map-leaflet)
[![MIT](https://img.shields.io/badge/License-MIT-0f766e.svg)](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE)

**English** · [فارسی](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/README.fa.md)

Build location pickers, draggable places, service areas and interactive maps. Use MapLibre for live traffic and points of interest, or keep Leaflet for an existing integration. This is a community project, independent of Neshan.

![Real Neshan MapLibre map with live traffic, POI and custom overlays](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/maplibre.png)

*Actual playground capture with an authorized web key. Colored roads show traffic; place labels show POI. The key is masked and is not included in the repository.*

## Documentation

- [Quick start](#quick-start)
- [Choose an engine](#choose-an-engine)
- [Markers and overlays](#markers-and-overlays)
- [Events, methods and slots](#events-methods-and-slots)
- [Complete API reference](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md)
- [Copyable examples](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md)
- [Persian guide](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/README.fa.md)
- [Migration and runtime](#migration-and-runtime) · [Troubleshooting](#troubleshooting)
- [Changelog](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/CHANGELOG.md) · [Releases](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/releases) · [Issues](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/issues)

## Features

- Vue 3 Composition API, TypeScript declarations, ESM and CommonJS.
- Coordinates and zoom through `v-model` and `v-model:zoom`.
- Live traffic and POI on MapLibre, visibility controls and traffic refresh.
- Stable markers, plain-text popups, tooltips and drag events.
- Independent polyline, polygon, meter-radius circle and GeoJSON overlays.
- Point picking, fit-to-markers, native access and browser location events.
- Lazy SDK loading, loading/error slots, retry, resize and unmount cleanup.
- SSR-safe imports and a Persian playground with measurement and engine switching.

## Choose an engine

| | `NeshanMapLibre` | `NeshanMapLeaflet` |
| --- | --- | --- |
| Renderer | Vector / WebGL | Raster / DOM |
| Official SDK | Neshan MapLibre 5.24.4 | Leaflet 1.9.4 / Neshan SDK 1.0.8 |
| Live traffic / POI | Supported with compatible styles | No longer updated by Neshan; ignored with warnings |
| Styles | Light, dark, monochrome light/dark, pastel; custom version-8 style | `dreamy`, `standard-night`; vendor-supported tile URLs |
| Component coordinates | `[latitude, longitude]` | `[latitude, longitude]` |
| Native options | MapLibre options | Leaflet options |
| Use case | New vector maps and live layers | Existing Leaflet applications/plugins |

## Quick start

Requires **Vue 3.5.43+**. Tooling: **Node 22.12+ within 22.x, or Node 24+**. MapLibre needs a modern browser with WebGL and `DecompressionStream`.

Install from npm:

```sh
npm install vuejs-neshan-map-leaflet@^2.0.1
```

Alternatively, install the tested GitHub release artifact:

```sh
npm install https://github.com/sajadjanat/vuejs-neshan-map-leaflet/releases/download/v2.0.1/vuejs-neshan-map-leaflet-2.0.1.tgz
```

Create a domain-allowed **web key** in the Neshan dashboard. For Vite, put it in your ignored `.env.local`:

```dotenv
VITE_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
```

Web keys are visible in browsers by design; restrict their allowed domains. **Service keys belong on your server**, never in public Vue environment variables. Search, geocoding and routing services are not included in this package.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLibre, MAPLIBRE_STYLES, type Coordinates } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const traffic = ref(true)
const poi = ref(true)
</script>

<template>
  <NeshanMapLibre
    v-model="center" v-model:zoom="zoom" :api-key="webKey"
    :map-style="MAPLIBRE_STYLES.light" :traffic="traffic" :poi="poi"
    :pick-on-click="true" :styles="{ height: '500px' }"
  />
  <label><input v-model="traffic" type="checkbox">Traffic</label>
  <label><input v-model="poi" type="checkbox">Places</label>
  <p>{{ center[0] }}, {{ center[1] }} · zoom {{ zoom }}</p>
</template>
```

Import package CSS once. Both components default to 100% width and a 450px height. `centerMarker` is a fixed visual center pin, separate from `markers`.

### Leaflet

Use the same `center`, `zoom` and `webKey` setup, import `NeshanMapLeaflet` instead, then use:

```vue
<NeshanMapLeaflet
  v-model="center" v-model:zoom="zoom" :api-key="webKey"
  :options="{ maptype: 'dreamy' }" :pick-on-click="true"
  :styles="{ height: '500px' }"
/>
```

![Real Leaflet map with markers and custom overlays](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/leaflet.png)

### Coordinate order

| API | Order | Example |
| --- | --- | --- |
| Component model, marker/shape positions, component `flyTo` | Latitude, longitude | `[35.6997, 51.338]` |
| GeoJSON, native MapLibre APIs, MapLibre `fitBounds` | Longitude, latitude | `[51.338, 35.6997]` |
| Leaflet `fitBounds` | Latitude, longitude | `[[35.69, 51.32], [35.73, 51.39]]` |

## Markers and overlays

Use unique, stable IDs and persist dragging in application state:

```ts
import { ref } from 'vue'
import type { Coordinates, MapLibreMarker, MapCircle, MapPolygon, MapPolyline } from 'vuejs-neshan-map-leaflet'

const markers = ref<MapLibreMarker[]>([
  { id: 'azadi', position: [35.6997, 51.338], popup: 'Azadi Square',
    tooltip: 'Drag to move', options: { draggable: true } },
])
function saveMarker(marker: MapLibreMarker, position: Coordinates) {
  markers.value = markers.value.map(item => item.id === marker.id ? { ...item, position } : item)
}
const circles: MapCircle[] = [
  { id: 'area', center: [35.6997, 51.338], radius: 500, options: { color: '#0f766e', fillOpacity: 0.15 } },
]
const polylines: MapPolyline[] = [
  { id: 'connection', positions: [[35.6997, 51.338], [35.7448, 51.3753]], options: { weight: 4 } },
]
const polygons: MapPolygon[] = [
  { id: 'zone', positions: [[35.70, 51.34], [35.72, 51.34], [35.72, 51.37]], options: { color: '#7c3aed' } },
]
```

Pass `:markers="markers"`, `:circles="circles"`, `:polylines="polylines"`, `:polygons="polygons"` and `@marker-dragend="saveMarker"` to the component. For Leaflet use the `MapMarker` type. Popup/tooltip strings are plain text. A polyline displays supplied coordinates; it does not calculate a road route.

MapLibre supports native `geojsonLayers` and `geojsonOptions`. Shape props support a documented subset of Leaflet-like paint options, not arbitrary Leaflet plugin options. See [API details](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md) and [GeoJSON examples](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md).

## Events, methods and slots

| Purpose | API |
| --- | --- |
| Native access | `ready` → `{ map, maplibre }` or `{ map, L }`; `destroy` clears consumer refs |
| Models | `update:modelValue`, `update:zoom`; compatibility `latitude`, `longitude` |
| Interaction | `click`, `moveend`, `zoomend`, `marker-click`, `marker-dragend` |
| Status | `error`, `warning`, `tiles-loading`, `tiles-loaded`, `tile-error` |
| Location | `location-found`, `location-error` |
| MapLibre live layers | `live-layers` → flags and matched layer IDs |
| Ref methods | `retry`, `fitToMarkers`, `flyTo`, `fitBounds`, `invalidateSize`, `locate` |
| MapLibre extras | `openPopup(id)`, `getDiagnostics()` |
| Slots | `loading`, `error` with `{ error, retry }`, `tile-error` with `{ state }`, `center-marker`, default native context |

`ready` confirms initialization, not tile authorization. MapLibre counts source readiness events; Leaflet counts raster tile results, so counts are not comparable. `getDiagnostics()` reports rendered MapLibre features in the current viewport/zoom, not totals for the dataset.

Use `useNeshanMapLibre()` or `useNeshanMap()` in setup and wire both `@ready="onReady"` and `@destroy="onDestroy"`. The component owns native map disposal. [Full payloads, defaults and signatures →](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md)

## Migration and runtime

- **From 1.x:** Vue is a peer dependency; import package CSS; replace UMD scripts with ESM/CommonJS. Leaflet `options.key`, `options.center`, `latitude` and `longitude` remain supported. Prefer explicit key and models.
- **SSR / Nuxt:** imports are SSR-safe; SDK initialization happens on mount. Import CSS globally. `<ClientOnly>` is optional. Do not initialize the renderer on the server.
- **Style updates:** MapLibre retains DOM markers/popups and restores custom layers/live visibility after `style.load`. Leaflet uses `setMapType` without replacing the map.
- **Native options:** remount with Vue `:key` to change constructor-only options. Web-key changes rebuild the map; refresh native references on `ready`.
- **Multiple maps:** concurrent Neshan MapLibre maps must use the same page-global key. Leaflet uses a global SDK namespace; mixing versions is unsupported.
- **Location:** HTTPS or localhost and browser permission are required. Location is only requested when your app calls `locate()`.
- **CSP/custom hosting:** Leaflet supports `sdk.scriptUrl`, `styleUrl`, `timeout`, `nonce`. MapLibre uses the installed SDK; allow its style/tile/font/worker resources in your CSP. See the API reference.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Blank map | CSS, height, web key, allowed domain, quota, network; WebGL/`DecompressionStream` for MapLibre |
| Missing traffic/POI | Use MapLibre and a style containing Neshan `traffic` / `points_source` sources/layers; inspect `warning` and `live-layers` |
| Marker jumps back after drag | Persist `marker-dragend` in your markers array |
| Wrong location | Latitude-first props versus longitude-first GeoJSON/native MapLibre |
| Location failure | HTTPS/localhost, permission and device availability; handle `location-error` |
| Partial Leaflet delivery | Supplemental vendor labels may return HTTP 204 without an image; inspect tile events separately from base-map delivery |

Traffic tiles are re-requested every 60 seconds while enabled; Neshan controls caching/freshness. Vendor availability and quotas are outside this wrapper. Keep required Neshan/OpenStreetMap attribution visible.

**Security limitation:** the official SDK pins a MapLibre version affected by [GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579). Style/control attribution is sanitized with DOMPurify and popups use text. Remote TileJSON attribution, native calls and custom DOM remain caller-owned: use trusted hosts and sanitize your HTML. These mitigations do not patch the vendor engine. `npm audit` currently reports two critical entries in the vendor dependency chain.

## Playground and contributing

```sh
git clone https://github.com/sajadjanat/vuejs-neshan-map-leaflet.git
cd vuejs-neshan-map-leaflet
npm ci
npm run dev
```

Enter a web key in the playground, or copy `.env.example` to `.env.local`. The runtime form does not save the key. Never commit environment files containing credentials.

```sh
npm run typecheck
npm test
npm run test:sdk
npm run build
npm run build:demo
npm run test:package
```

Validation includes 29 unit/contract tests, 9 tests using the actual pinned Leaflet SDK, strict installed-package TypeScript checks and real-map browser checks. Automated SDK tests stub image/quota networking and simulate location callbacks; actual device GPS was not requested. CI covers Node 22 and 24.

For issues, include engine/package/browser versions, a small reproduction and sanitized errors. Never include service keys or account tokens.

## Official references

[Neshan MapLibre](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/) · [Neshan Leaflet](https://platform.neshan.org/docs/sdk/web/leaflet/neshan-leaflet-sdk/) · [Vue](https://vuejs.org/guide/introduction.html) · [Leaflet API](https://leafletjs.com/reference-1.9.4.html)

MIT © Sajad Abasi. [License](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE).
