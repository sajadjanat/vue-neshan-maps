<template>
  <div class="neshan-map" :style="styles" :aria-busy="loading" :aria-label="ariaLabel">
    <div ref="container" class="neshan-map__canvas" />
    <div v-if="centerMarker && !loading && !error" class="neshan-map__pin" aria-hidden="true"><slot name="center-marker">📍</slot></div>
    <div v-if="loading" class="neshan-map__status" role="status"><slot name="loading">Loading map…</slot></div>
    <div v-if="error" class="neshan-map__status" role="alert"><slot name="error" :error="error" :retry="retry">{{ error.message }} <button type="button" @click="retry">Retry</button></slot></div>
    <slot v-if="map" :map="map" :leaflet="leaflet" />
  </div>
</template>

<script lang="ts">
let nextMapId = 0
</script>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type * as L from 'leaflet'
import { loadNeshanSdk, type LeafletNamespace } from '../loader'
import type { Coordinates, NeshanMapProps, MapReady, MapMarker } from '../types'

const props = withDefaults(defineProps<NeshanMapProps>(), {
  options: () => ({}), styles: () => ({}), centerMarker: true, pickOnClick: false,
  markers: () => [], polylines: () => [], circles: () => [], fitMarkers: false,
  ariaLabel: 'Neshan map',
})
const emit = defineEmits<{
  ready: [context: MapReady]; destroy: []; error: [error: Error];
  'update:modelValue': [coordinates: Coordinates]; 'update:zoom': [zoom: number];
  latitude: [latitude: number]; longitude: [longitude: number];
  click: [event: L.LeafletMouseEvent]; moveend: [event: L.LeafletEvent]; zoomend: [event: L.LeafletEvent];
  'marker-click': [marker: MapMarker, event: L.LeafletMouseEvent];
  'marker-dragend': [marker: MapMarker, coordinates: Coordinates];
  'location-found': [event: L.LocationEvent]; 'location-error': [event: L.ErrorEvent];
}>()
const container = ref<HTMLDivElement>()
const map = shallowRef<L.Map>()
const leaflet = shallowRef<LeafletNamespace>()
const loading = ref(true)
const error = shallowRef<Error>()
let layers: L.LayerGroup | undefined
let observer: ResizeObserver | undefined
let disposed = false
let generation = 0
let queued = false
let previousCenter: L.LatLng | undefined
let previousZoom: number | undefined

function reportError(cause: unknown) {
  error.value = cause instanceof Error ? cause : new Error(String(cause))
  emit('error', error.value)
}
function destroy() {
  observer?.disconnect(); observer = undefined
  if (map.value) {
    previousCenter = map.value.getCenter(); previousZoom = map.value.getZoom()
    // remove() must fire unload before listeners are cleared (vendor cleanup hooks).
    map.value.remove(); map.value.off(); map.value = undefined; emit('destroy')
  }
  container.value?.replaceChildren()
  layers = undefined
}
// Popup strings are text, never HTML (which Leaflet otherwise interprets).
function textContent(value: string) { const node = document.createElement('span'); node.textContent = value; return node }
function renderLayers() {
  const instance = map.value
  const sdk = leaflet.value
  if (!instance || !sdk) return
  layers?.clearLayers()
  layers ??= sdk.layerGroup().addTo(instance)
  for (const marker of props.markers) {
    const item = sdk.marker(marker.position, marker.options).addTo(layers)
    if (marker.popup !== undefined) item.bindPopup(textContent(marker.popup))
    if (marker.tooltip !== undefined) item.bindTooltip(textContent(marker.tooltip))
    item.on('click', event => emit('marker-click', marker, event as L.LeafletMouseEvent))
    item.on('dragend', () => { const point = item.getLatLng(); emit('marker-dragend', marker, [point.lat, point.lng]) })
  }
  for (const line of props.polylines) sdk.polyline(line.positions, line.options).addTo(layers)
  for (const circle of props.circles) sdk.circle(circle.center, { ...circle.options, radius: circle.radius }).addTo(layers)
  if (props.geojson) sdk.geoJSON(props.geojson, props.geojsonOptions).addTo(layers)
  if (props.fitMarkers && props.markers.length) instance.fitBounds(sdk.latLngBounds(props.markers.map(marker => marker.position)), { padding: [24, 24], maxZoom: 16 })
}
function updateView() {
  const instance = map.value
  const sdk = leaflet.value
  if (!instance || !sdk) return
  const center = props.modelValue ?? props.options.center
  const zoom = props.zoom ?? props.options.zoom ?? instance.getZoom()
  if (center && (!instance.getCenter().equals(sdk.latLng(center)) || zoom !== instance.getZoom())) instance.setView(center, zoom)
  else if (zoom !== instance.getZoom()) instance.setZoom(zoom)
}
async function initialize() {
  const current = ++generation
  destroy(); loading.value = true; error.value = undefined
  try {
    const key = props.apiKey ?? props.options.key
    if (!key || key === 'YOUR_API_KEY') throw new Error('A Neshan web API key is required')
    if (key.startsWith('service.')) throw new Error('Use a Neshan web key for maps; service keys are for server APIs')
    const sdk = await loadNeshanSdk(props.sdk)
    if (disposed || current !== generation || !container.value) return
    leaflet.value = sdk
    // Neshan's vendor extension indexes maps by the constructor's string ID.
    // Unlike vanilla Leaflet, passing an HTMLElement can collide across maps.
    container.value.id ||= `neshan-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${++nextMapId}`}`
    const instance = new sdk.Map(container.value.id, {
      maptype: 'dreamy', poi: true, traffic: false, ...props.options, key,
      center: props.modelValue ?? props.options.center ?? previousCenter ?? [35.6997, 51.338],
      zoom: props.zoom ?? props.options.zoom ?? previousZoom ?? 13,
    } as L.MapOptions)
    map.value = instance
    instance.on('moveend', event => {
      const point = instance.getCenter()
      emit('update:modelValue', [point.lat, point.lng]); emit('latitude', point.lat); emit('longitude', point.lng); emit('moveend', event)
    })
    instance.on('zoomend', event => { emit('update:zoom', instance.getZoom()); emit('zoomend', event) })
    instance.on('click', event => { const mouse = event as L.LeafletMouseEvent; if (props.pickOnClick) instance.panTo(mouse.latlng); emit('click', mouse) })
    instance.on('locationfound', event => emit('location-found', event as L.LocationEvent))
    instance.on('locationerror', event => emit('location-error', event as L.ErrorEvent))
    renderLayers()
    if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(() => instance.invalidateSize({ pan: false })); observer.observe(container.value) }
    loading.value = false
    emit('ready', { map: instance, L: sdk })
  } catch (cause) { if (!disposed && current === generation) { destroy(); loading.value = false; reportError(cause) } }
}
function retry() { return initialize() }
function scheduleRebuild() {
  if (queued || disposed) return
  queued = true
  queueMicrotask(() => { queued = false; if (!disposed) void initialize() })
}
// Neshan layer options do not have a stable public mutation API: rebuild safely.
watch(() => [props.apiKey, props.options.key, props.options.maptype, props.options.poi, props.options.traffic, props.sdk], scheduleRebuild, { deep: true })
watch(() => [props.modelValue, props.zoom, props.options.center, props.options.zoom], updateView, { deep: true })
watch(() => [props.markers, props.polylines, props.circles, props.geojson, props.geojsonOptions, props.fitMarkers], () => { try { renderLayers() } catch (cause) { reportError(cause) } }, { deep: true })
onMounted(initialize)
onBeforeUnmount(() => { disposed = true; generation++; destroy() })
defineExpose({ map, leaflet, retry, invalidateSize: () => map.value?.invalidateSize(),
  fitBounds: (bounds: L.LatLngBoundsExpression, options?: L.FitBoundsOptions) => map.value?.fitBounds(bounds, options),
  flyTo: (center: L.LatLngExpression, zoom?: number, options?: L.ZoomPanOptions) => map.value?.flyTo(center, zoom, options),
  locate: (options?: L.LocateOptions) => map.value?.locate(options),
})
</script>

<style>
.neshan-map { position: relative; width: 100%; height: 450px; min-height: 160px; background: #eef2f5; isolation: isolate; }
.neshan-map__canvas { width: 100%; height: 100%; }
.neshan-map__pin { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -100%); z-index: 401; font-size: 36px; pointer-events: none; }
.neshan-map__status { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 24px; background: #eef2f5; color: #263445; z-index: 500; }
</style>
