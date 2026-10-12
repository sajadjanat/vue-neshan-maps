# Examples

[Overview](../README.md) · [Feature guide](GUIDE.md) · [آموزش فارسی](GUIDE.fa.md) · [API reference](API.md)

Each Vue example below is a complete single-file component for a Vite/Vue application. Set `VITE_NESHAN_WEB_KEY` in `.env.local` first. Never use a service key. These examples use public component coordinates in latitude/longitude order.

## Choose an example

| Goal | Component |
| --- | --- |
| Editable places and style switching | [Draggable markers](#draggable-markers-styles-and-native-access) |
| Render your own dataset | [GeoJSON paint](#geojson-and-custom-maplibre-paint) |
| Loading feedback and recovery | [Errors, diagnostics and location](#error-slots-diagnostics-and-location) |
| Extend an existing Leaflet map | [Native bounds](#leaflet-and-native-bounds) |
| Integrate your application | [Nuxt](#nuxt) · [Global registration](#global-registration) |

For a single example combining the main features, see the [complete map](GUIDE.md#complete-map).

## Draggable markers, styles and native access

The component owns the map; the composable stores shallow native refs. Dragging updates your own marker array. Switching style retains markers and their popups.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  NeshanMapLibre, MAPLIBRE_STYLES, useNeshanMapLibre,
  type Coordinates, type MapLibreMarker, type MapCircle,
} from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const dark = ref(false)
const { map, onReady, onDestroy } = useNeshanMapLibre()
const markers = ref<MapLibreMarker[]>([
  { id: 'azadi', position: [35.6997, 51.338], popup: 'Azadi Square', tooltip: 'Azadi', options: { draggable: true } },
])
const circles: MapCircle[] = [
  { id: 'service-area', center: [35.6997, 51.338], radius: 500, options: { color: '#0f766e', fillOpacity: 0.15 } },
]
function save(marker: MapLibreMarker, position: Coordinates) {
  markers.value = markers.value.map(item => item.id === marker.id ? { ...item, position } : item)
}
function flyToAzadi() {
  // Native MapLibre uses LONGITUDE first.
  map.value?.flyTo({ center: [51.338, 35.6997], zoom: 15 })
}
</script>

<template>
  <NeshanMapLibre
    v-model="center" v-model:zoom="zoom" :api-key="webKey"
    :map-style="dark ? MAPLIBRE_STYLES.dark : MAPLIBRE_STYLES.light"
    :traffic="true" :poi="true" :markers="markers" :circles="circles"
    :styles="{ height: '500px' }"
    @marker-dragend="save" @ready="onReady" @destroy="onDestroy"
  />
  <button @click="dark = !dark">Switch style</button>
  <button :disabled="!map" @click="flyToAzadi">Azadi Square</button>
</template>
```

## GeoJSON and custom MapLibre paint

GeoJSON uses **longitude, latitude**. Supply layer definitions without `source`; the wrapper adds and owns the source and prefixes layer IDs. Use native GeoJSON source options for clustering or other supported source features; provide matching cluster layers when enabling clustering.

```vue
<script setup lang="ts">
import { NeshanMapLibre, type MapLibreOverlayLayer } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const data: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { name: 'Azadi', category: 'landmark' },
    geometry: { type: 'Point', coordinates: [51.338, 35.6997] },
  }],
}
const layers: MapLibreOverlayLayer[] = [
  { id: 'landmarks', type: 'circle', filter: ['==', '$type', 'Point'],
    paint: { 'circle-radius': 9, 'circle-color': '#0f766e', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } },
]
</script>

<template>
  <NeshanMapLibre
    :api-key="webKey" :model-value="[35.6997, 51.338]" :zoom="14"
    :geojson="data" :geojson-layers="layers" :geojson-options="{ maxzoom: 18 }"
    :center-marker="false" :styles="{ height: '500px' }"
  />
</template>
```

## Error slots, diagnostics and location

Only call location from a user action. Handle permission denial and unavailable devices. The diagnostics counters describe the current rendered viewport, not all server features. This example avoids printing resource errors that might contain credentials.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLibre } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const component = ref<InstanceType<typeof NeshanMapLibre>>()
const status = ref('')
function inspect() {
  const result = component.value?.getDiagnostics()
  status.value = result ? `Traffic: ${result.trafficFeatures}, POI: ${result.poiFeatures}` : 'Map is not ready'
}
function locationError(error: { code: number; message: string }) {
  status.value = error.code === 1 ? 'Location permission denied' : 'Location unavailable'
}
</script>

<template>
  <NeshanMapLibre
    ref="component" :api-key="webKey" :traffic="true" :poi="true"
    @location-error="locationError" @location-found="status = 'Location received'"
  >
    <template #loading><span role="status">Preparing map…</span></template>
    <template #error="{ retry }">
      <div role="alert">Unable to initialize. Check your web key, domain and browser.
        <button @click="retry">Try again</button>
      </div>
    </template>
    <template #tile-error><span>Some resources failed. Check quota and network.</span></template>
  </NeshanMapLibre>
  <button @click="component?.locate({ setView: true, maxZoom: 16 })">My location</button>
  <button @click="inspect">Inspect layers</button>
  <p role="status">{{ status }}</p>
</template>
```

## Leaflet and native bounds

Leaflet native coordinates are latitude first. Do not pass obsolete traffic/POI options: Neshan no longer updates those layers. For a custom icon, supply a native `L.Icon` in marker options after obtaining `L` from `ready`.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLeaflet, useNeshanMap, type Coordinates, type MapMarker } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const { map, onReady, onDestroy } = useNeshanMap()
const markers: MapMarker[] = [{ id: 'azadi', position: [35.6997, 51.338], popup: 'Azadi Square' }]
function fit() {
  map.value?.fitBounds([[35.69, 51.32], [35.75, 51.39]], { padding: [24, 24] })
}
</script>

<template>
  <NeshanMapLeaflet
    v-model="center" v-model:zoom="zoom" :api-key="webKey"
    :options="{ maptype: 'dreamy' }" :markers="markers" :pick-on-click="true"
    @ready="onReady" @destroy="onDestroy"
  />
  <button :disabled="!map" @click="fit">Show area</button>
</template>
```

## Nuxt

Import package CSS in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  css: ['vuejs-neshan-map-leaflet/style.css'],
  runtimeConfig: { public: { neshanWebKey: '' } },
})
```

Set `NUXT_PUBLIC_NESHAN_WEB_KEY` to a domain-restricted web key. In a page, read `useRuntimeConfig().public.neshanWebKey`, import the component locally and pass it as `api-key`. `<ClientOnly>` is optional; the renderer already initializes only on mount. Do not place service keys in public runtime config.

## Global registration

```ts
import { createApp } from 'vue'
import App from './App.vue'
import NeshanMapPlugin from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

createApp(App).use(NeshanMapPlugin).mount('#app')
```

The default plugin registers both components. Named component exports also support individual `app.use(...)` registration. Direct local imports remain available.
