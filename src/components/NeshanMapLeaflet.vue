<template>
  <div class="neshan-map" :style="styles" :aria-busy="loading" :aria-label="ariaLabel">
    <div ref="container" class="neshan-map__canvas" />
    <div v-if="centerMarker && !loading && !error" class="neshan-map__pin" aria-hidden="true"><slot name="center-marker"><span class="neshan-map__pin-shape" /></slot></div>
    <div v-if="loading" class="neshan-map__status" role="status"><slot name="loading">Loading map…</slot></div>
    <div v-if="error" class="neshan-map__status" role="alert"><slot name="error" :error="error" :retry="retry">{{ error.message }} <button type="button" @click="retry">Retry</button></slot></div>
    <div v-if="tileState.status === 'error' && !error" class="neshan-map__tile-warning" role="status"><slot name="tile-error" :state="tileState">Some map tiles could not load. Check the web key, allowed domain and network.</slot></div>
    <slot v-if="map" :map="map" :leaflet="leaflet" :tile-state="tileState" />
  </div>
</template>
<script lang="ts">
let nextMapId = 0
</script>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type * as L from 'leaflet'
import { loadNeshanSdk, type LeafletNamespace } from '../loader'
import { createMarkers } from '../overlays'
import type { Coordinates, NeshanMapProps, MapReady, MapMarker, NeshanLeafletMap, TileState } from '../types'
const props = withDefaults(defineProps<NeshanMapProps>(), {
  options: () => ({}), styles: () => ({}), centerMarker: true, pickOnClick: false,
  markers: () => [], polylines: () => [], polygons: () => [], circles: () => [], fitMarkers: false, ariaLabel: 'Neshan map',
})
const emit = defineEmits<{
  ready: [context: MapReady]; destroy: []; error: [error: Error]; warning: [message: string];
  'update:modelValue': [coordinates: Coordinates]; 'update:zoom': [zoom: number]; latitude: [latitude: number]; longitude: [longitude: number];
  click: [event: L.LeafletMouseEvent]; moveend: [event: L.LeafletEvent]; zoomend: [event: L.LeafletEvent];
  'marker-click': [marker: MapMarker, event: L.LeafletMouseEvent]; 'marker-dragend': [marker: MapMarker, coordinates: Coordinates];
  'location-found': [event: L.LocationEvent]; 'location-error': [event: L.ErrorEvent];
  'tiles-loading': [state: TileState]; 'tiles-loaded': [state: TileState]; 'tile-error': [state: TileState];
}>()
const container = ref<HTMLDivElement>()
const map = shallowRef<NeshanLeafletMap>()
const leaflet = shallowRef<LeafletNamespace>()
const loading = ref(true)
const error = shallowRef<Error>()
const tileState = shallowRef<TileState>({status:'idle',loaded:0,failed:0})
let markers: ReturnType<typeof createMarkers> | undefined
const groups: Partial<Record<'lines'|'circles'|'polygons'|'geojson',L.LayerGroup>> = {}
let observer: ResizeObserver | undefined
let disposed = false
let generation = 0
let queued = false
let previousCenter: L.LatLng | undefined
let previousZoom: number | undefined
const tileLayers = new Map<L.TileLayer,{loaded:number;failed:number;loading:boolean;cleanup:()=>void}>()
function reportError(cause: unknown) { error.value = cause instanceof Error ? cause : new Error(String(cause)); emit('error',error.value) }
function reportLayerError(cause: unknown) { emit('error',cause instanceof Error ? cause : new Error(String(cause))) }
function validatePoint(point: L.LatLngExpression) {
  const value = leaflet.value!.latLng(point)
  if (!Number.isFinite(value.lat) || !Number.isFinite(value.lng) || Math.abs(value.lat)>90 || Math.abs(value.lng)>180) throw new Error('Coordinates must be finite latitude/longitude values in range')
}
function publishTileState() {
  const states = [...tileLayers.values()]
  const loaded = states.reduce((sum,s)=>sum+s.loaded,0), failed=states.reduce((sum,s)=>sum+s.failed,0)
  const status = failed ? 'error' : states.some(s=>s.loading) ? 'loading' : loaded ? 'loaded' : 'idle'
  const before = tileState.value
  tileState.value = {status,loaded,failed}
  if (status==='loading' && before.status!=='loading') emit('tiles-loading',tileState.value)
  if (status==='loaded' && (before.status!=='loaded' || before.loaded!==loaded)) emit('tiles-loaded',tileState.value)
  if (failed>before.failed) emit('tile-error',tileState.value)
}
function trackLayer(layer: L.Layer) {
  const sdk=leaflet.value!
  if (!sdk.TileLayer || !(layer instanceof sdk.TileLayer) || tileLayers.has(layer)) return
  const state={loaded:0,failed:0,loading:layer.isLoading(),cleanup:()=>{}}
  const begin=()=>{state.loaded=0;state.failed=0;state.loading=true;publishTileState()}
  const success=(event:L.LeafletEvent)=>{
    // The vendor serves an HTTP-success placeholder when the key/quota is rejected.
    // A successful image request therefore does not necessarily mean a real map tile.
    const tile=(event as L.TileEvent).tile as HTMLImageElement | undefined
    if(tile?.src && new URL(tile.src,document.baseURI).pathname==='/sdk/images/tile-empty.png') state.failed++
    else state.loaded++
    publishTileState()
  }
  const failure=()=>{state.failed++;publishTileState()}
  const finish=()=>{state.loading=false;publishTileState()}
  layer.on('loading',begin).on('tileload',success).on('tileerror',failure).on('load',finish)
  state.cleanup=()=>{layer.off('loading',begin).off('tileload',success).off('tileerror',failure).off('load',finish)}
  tileLayers.set(layer,state);publishTileState()
}
function destroy() {
  observer?.disconnect();observer=undefined
  tileLayers.forEach(state=>state.cleanup());tileLayers.clear()
  if (map.value) {
    previousCenter=map.value.getCenter();previousZoom=map.value.getZoom()
    map.value.stopLocate();map.value.remove();map.value.off();map.value=undefined;emit('destroy')
  }
  container.value?.replaceChildren();markers=undefined
  for(const key of Object.keys(groups) as (keyof typeof groups)[]) delete groups[key]
  tileState.value={status:'idle',loaded:0,failed:0}
}
function syncMarkers() {
  if (!map.value || !leaflet.value) return
  props.markers.forEach(marker=>validatePoint(marker.position))
  markers ??= createMarkers(leaflet.value,map.value,{click:(marker,event)=>emit('marker-click',marker,event),dragend:(marker,point)=>emit('marker-dragend',marker,point)})
  markers.sync(props.markers)
}
function fitToMarkers() {
  if (map.value && leaflet.value && props.markers.length) map.value.fitBounds(leaflet.value.latLngBounds(props.markers.map(marker=>marker.position)),{padding:[24,24],maxZoom:16})
}
function renderGroup(kind: keyof typeof groups) {
  const sdk=leaflet.value, instance=map.value
  if(!sdk || !instance) return
  const group=groups[kind] ?? (groups[kind]=sdk.layerGroup().addTo(instance))
  group.clearLayers()
  if(kind==='lines') props.polylines.forEach(line=>sdk.polyline(line.positions,line.options).addTo(group))
  if(kind==='polygons') props.polygons.forEach(polygon=>sdk.polygon(polygon.positions,polygon.options).addTo(group))
  if(kind==='circles') props.circles.forEach(circle=>{
    validatePoint(circle.center)
    if(!Number.isFinite(circle.radius)||circle.radius<0) throw new Error('Circle radius must be a non-negative number in meters')
    sdk.circle(circle.center,{...circle.options,radius:circle.radius}).addTo(group)
  })
  if(kind==='geojson' && props.geojson) sdk.geoJSON(props.geojson,props.geojsonOptions).addTo(group)
}
function safe(action:()=>void) { try {action()} catch(cause) {reportLayerError(cause)} }
function warnUnsupported() {
  if(props.options.traffic || props.options.poi) emit('warning','Neshan Leaflet no longer updates traffic/POI tiles. These options are ignored.')
}
function updateView() {
  if(!map.value || !leaflet.value) return
  const center=props.modelValue ?? props.options.center
  const zoom=props.zoom ?? props.options.zoom ?? map.value.getZoom()
  if(!Number.isFinite(zoom)) throw new Error('Zoom must be finite')
  if(center) validatePoint(center)
  if(center && (!map.value.getCenter().equals(leaflet.value.latLng(center)) || zoom!==map.value.getZoom())) map.value.setView(center,zoom)
  else if(zoom!==map.value.getZoom()) map.value.setZoom(zoom)
}
async function initialize() {
  const current=++generation
  destroy();loading.value=true;error.value=undefined
  try {
    const key=(props.apiKey ?? props.options.key)?.trim()
    if(!key || !key.startsWith('web.') || key.length<12) throw new Error('A valid Neshan web API key is required; service keys cannot display a map')
    const sdk=await loadNeshanSdk(props.sdk)
    if(disposed || current!==generation || !container.value) return
    leaflet.value=sdk
    const center=props.modelValue ?? props.options.center ?? previousCenter ?? [35.6997,51.338]
    validatePoint(center)
    const zoom=props.zoom ?? props.options.zoom ?? previousZoom ?? 13
    if(!Number.isFinite(zoom)) throw new Error('Zoom must be finite')
    container.value.id ||= `neshan-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${++nextMapId}`}`
    const instance=new sdk.Map(container.value.id,{...props.options,key,poi:false,traffic:false,maptype:props.options.maptype ?? 'dreamy',center,zoom} as L.MapOptions) as NeshanLeafletMap
    map.value=instance
    instance.on('layeradd',event=>trackLayer((event as L.LayerEvent).layer))
    instance.on('layerremove',event=>{const layer=(event as L.LayerEvent).layer as L.TileLayer;tileLayers.get(layer)?.cleanup();tileLayers.delete(layer);publishTileState()})
    instance.eachLayer(trackLayer)
    instance.on('moveend',event=>{const point=instance.getCenter();emit('update:modelValue',[point.lat,point.lng]);emit('latitude',point.lat);emit('longitude',point.lng);emit('moveend',event)})
    instance.on('zoomend',event=>{emit('update:zoom',instance.getZoom());emit('zoomend',event)})
    instance.on('click',event=>{const mouse=event as L.LeafletMouseEvent;if(props.pickOnClick) instance.panTo(mouse.latlng);emit('click',mouse)})
    instance.on('locationfound',event=>emit('location-found',event as L.LocationEvent))
    instance.on('locationerror',event=>emit('location-error',event as L.ErrorEvent))
    syncMarkers();for(const kind of ['lines','polygons','circles','geojson'] as const) renderGroup(kind)
    if(props.fitMarkers) fitToMarkers()
    if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>instance.invalidateSize({pan:false}));observer.observe(container.value)}
    loading.value=false;warnUnsupported();emit('ready',{map:instance,L:sdk})
  } catch(cause){if(!disposed && current===generation){destroy();loading.value=false;reportError(cause)}}
}
function retry(){return initialize()}
function scheduleRebuild(){if(queued||disposed)return;queued=true;queueMicrotask(()=>{queued=false;if(!disposed)void initialize()})}
watch([()=>props.apiKey,()=>props.options.key],scheduleRebuild)
watch(()=>props.sdk,scheduleRebuild,{deep:true})
watch(()=>props.options.maptype,value=>safe(()=>map.value?.setMapType(value ?? 'dreamy')))
watch(()=>[props.options.traffic,props.options.poi],warnUnsupported)
watch(()=>[props.modelValue,props.zoom,props.options.center,props.options.zoom],()=>safe(updateView),{deep:true})
watch(()=>props.markers,()=>safe(()=>{syncMarkers();if(props.fitMarkers)fitToMarkers()}),{deep:true})
watch(()=>props.fitMarkers,value=>{if(value)safe(fitToMarkers)})
watch(()=>props.polylines,()=>safe(()=>renderGroup('lines')),{deep:true})
watch(()=>props.polygons,()=>safe(()=>renderGroup('polygons')),{deep:true})
watch(()=>props.circles,()=>safe(()=>renderGroup('circles')),{deep:true})
watch(()=>[props.geojson,props.geojsonOptions],()=>safe(()=>renderGroup('geojson')),{deep:true})
onMounted(initialize)
onBeforeUnmount(()=>{disposed=true;generation++;destroy()})
defineExpose({map,leaflet,tileState,retry,fitToMarkers,invalidateSize:()=>map.value?.invalidateSize(),
  fitBounds:(bounds:L.LatLngBoundsExpression,options?:L.FitBoundsOptions)=>map.value?.fitBounds(bounds,options),
  flyTo:(center:L.LatLngExpression,zoom?:number,options?:L.ZoomPanOptions)=>map.value?.flyTo(center,zoom,options),
  locate:(options?:L.LocateOptions)=>map.value?.locate({timeout:10000,...options}),
})
</script>
<style>
.neshan-map{position:relative;width:100%;height:450px;min-height:160px;background:#eef2f5;isolation:isolate}
.neshan-map__canvas{width:100%;height:100%}
.neshan-map__pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:401;pointer-events:none}
.neshan-map__pin-shape{display:block;width:23px;height:23px;border:3px solid white;border-radius:50% 50% 50% 0;background:#e04e63;transform:rotate(-45deg);box-shadow:0 2px 5px #0005}
.neshan-map__status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;padding:24px;background:#eef2f5;color:#263445;z-index:500}
.neshan-map__tile-warning{position:absolute;bottom:35px;left:12px;right:12px;z-index:500;padding:10px 14px;background:#fff4dc;color:#784d12;border:1px solid #e4bd6a;border-radius:8px;font:13px/1.6 sans-serif;pointer-events:none}
</style>
