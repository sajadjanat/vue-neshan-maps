<div align="center">

# Vue Neshan Maps

### Bring your places to life.

Reactive maps for Vue 3 · MapLibre + Leaflet · TypeScript

[![npm](https://img.shields.io/npm/v/vuejs-neshan-map-leaflet?color=087f8c&label=npm)](https://www.npmjs.com/package/vuejs-neshan-map-leaflet)
[![CI](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/actions/workflows/quality.yml/badge.svg)](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/actions/workflows/quality.yml)
[![License](https://img.shields.io/badge/license-MIT-173449)](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE)

**English** · [فارسی](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/README.fa.md)

[Get started](#quick-start) · [Feature guide](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.md) · [API reference](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md) · [Examples](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md)

</div>

![Neshan vector map in a Vue application: Tehran, live traffic, places and custom geometry](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/maplibre-light.png)

<p align="center"><sub>Real Neshan basemap and live layers. Markers, the service area and the dashed connection are sample application data. The interface illustrates what you can build; the component supplies the map.</sub></p>

Build a location picker, show your branches, outline a delivery area or add live traffic to your app. Two Vue components connect Neshan's renderers to reactive state, with typed overlays, lifecycle events and native access when you need it. A community library, independent of Neshan.

## One library, two engines

| Build with | What you get |
| --- | --- |
| **Vue models** | Keep center and zoom in sync; pick a point and persist dragged markers. |
| **Live vector layers** | Traffic and POI on MapLibre, five map styles and reactive visibility. |
| **Your geography** | Markers, text popups, tooltips, lines, polygons, meter-radius circles and GeoJSON. |
| **Application controls** | Fly to a place, frame markers, request browser location and access the native renderer. |
| **Lifecycle handling** | Lazy SDK initialization, loading/error slots, retry, automatic resize and cleanup. |

## Find your way

| I want to… | Read |
| --- | --- |
| Display my first map | [Quick start](#quick-start) |
| Pick an address, add places or draw a service area | [Feature guide](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.md) |
| Copy a complete Vue component | [Runnable examples](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md) |
| Check a prop, event, slot or method | [API reference](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md) |
| Use Nuxt, native APIs or migrate from 1.x | [Integration guide](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.md#integration) |
| Diagnose blank tiles or missing traffic | [Troubleshooting](#troubleshooting) |

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

For point picking, editable markers, shapes, GeoJSON, native controls and status handling, follow the [feature guide](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.md). Each section explains what your application owns and what the component updates.


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

## Map styles in practice

Light and dark styles use the same component state. Markers and custom overlays survive style changes.

![Dark Neshan MapLibre map with live traffic and custom overlays](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/maplibre-dark.png)

The two screenshots are real browser captures. POI density and traffic detail depend on the viewport, zoom, vendor style and available data.

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

## Project links

[Changelog](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/CHANGELOG.md) · [Releases](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/releases) · [Report an issue](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/issues)

## Official references

[Neshan MapLibre](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/) · [Neshan Leaflet](https://platform.neshan.org/docs/sdk/web/leaflet/neshan-leaflet-sdk/) · [Vue](https://vuejs.org/guide/introduction.html) · [Leaflet API](https://leafletjs.com/reference-1.9.4.html)

MIT © Sajad Abasi. [License](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE).
