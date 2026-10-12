<script setup lang="ts">
import { ref } from 'vue'
import type { Coordinates, MapLibreMarker } from 'vuejs-neshan-map-leaflet'

const config = useRuntimeConfig()
const key = ref('')
const webKey = ref(String(config.public.neshanWebKey || ''))
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const dark = ref(false)
const traffic = ref(true)
const poi = ref(true)
const status = ref('Waiting for map')
const { map, onReady, onDestroy } = useNeshanMapLibre()
const markers = ref<MapLibreMarker[]>([
  { id: 'azadi', position: [35.6997, 51.338], popup: 'Azadi Square', options: { draggable: true } },
])
function save(marker: MapLibreMarker, position: Coordinates) {
  markers.value = markers.value.map(item => item.id === marker.id ? { ...item, position } : item)
}
</script>

<template>
  <main>
    <h1>Neshan maps · Nuxt 4</h1>
    <p>SSR, auto-registered components, auto-imported composables and package CSS.</p>
    <form v-if="!webKey" @submit.prevent="webKey = key">
      <label>Neshan web key <input v-model="key" type="password" autocomplete="off" required></label>
      <button>Load map</button>
    </form>
    <template v-else>
      <nav aria-label="Map controls">
        <label><input v-model="traffic" type="checkbox">Traffic</label>
        <label><input v-model="poi" type="checkbox">POI</label>
        <label><input v-model="dark" type="checkbox">Dark map</label>
      </nav>
      <NeshanMapLibre
        v-model="center" v-model:zoom="zoom" :api-key="webKey"
        :map-style="dark ? MAPLIBRE_STYLES.dark : MAPLIBRE_STYLES.light"
        :traffic="traffic" :poi="poi" :markers="markers" :pick-on-click="true"
        :styles="{ height: '520px' }" @ready="onReady" @destroy="onDestroy"
        @marker-dragend="save" @tiles-loaded="status = 'Map resources loaded'"
        @warning="status = $event" @error="status = $event.message"
      />
      <p role="status">{{ status }} · Native map: {{ map ? 'ready' : 'waiting' }}</p>
      <p>Latitude {{ center[0].toFixed(5) }} · Longitude {{ center[1].toFixed(5) }} · Zoom {{ zoom }}</p>
    </template>
  </main>
</template>

<style>
body{margin:0;background:#edf3f7;color:#173449;font-family:system-ui,sans-serif}
main{max-width:1000px;margin:40px auto;padding:0 24px}h1{font-size:32px}
nav{display:flex;gap:24px;padding:18px 0}input,button{font:inherit}
button{padding:8px 14px}button:focus-visible,input:focus-visible{outline:3px solid #087f8c}
</style>
