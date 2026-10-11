<template>
  <div class="neshan-map" :style="styles" :aria-label="ariaLabel" :aria-busy="loading">
    <div ref="container" class="neshan-map__canvas" />
    <div v-if="centerMarker && !loading && !error" class="neshan-map__pin" aria-hidden="true"><slot name="center-marker"><span class="neshan-map__pin-shape" /></slot></div>
    <div v-if="loading" class="neshan-map__status" role="status"><slot name="loading">Loading map…</slot></div>
    <div v-if="error" class="neshan-map__status" role="alert"><slot name="error" :error="error" :retry="retry">{{ error.message }} <button type="button" @click="retry">Retry</button></slot></div>
    <div v-if="tileState.status==='error' && !error" class="neshan-map__tile-warning" role="status"><slot name="tile-error" :state="tileState">Some map resources could not load. Check the web key, domain and network.</slot></div>
    <slot v-if="map && !loading" :map="map" :maplibre="sdk" :tile-state="tileState" />
  </div>
</template>
<script setup lang="ts">
import { shallowRef, ref, watch, onMounted, onBeforeUnmount, toRaw } from 'vue'
import type { Map as NativeMap, Marker, Popup, LayerSpecification, GeoJSONSource, VectorTileSource, LngLatBoundsLike, FlyToOptions, FitBoundsOptions } from 'maplibre-gl'
import type { Coordinates, TileState } from '../types'
import type { MapLibreProps, MapLibreMarker, MapLibreReady, MapLibreClickEvent, LiveLayerState, MapLibreOverlayLayer } from '../maplibre-types'
import { loadNeshanMapLibre, loadMapLibreStyle, safeMapLibreOptions, MAPLIBRE_STYLES, lngLat, circleRing, closeRing, liveLayerGroups, setLiveLayers, claimMapLibreKey, releaseMapLibreKey, type MapLibreNamespace } from '../maplibre'
import '@neshan-maps-platform/maplibre-sdk/style.css'
const props=withDefaults(defineProps<MapLibreProps>(),{mapStyle:MAPLIBRE_STYLES.light,traffic:false,poi:false,markers:()=>[],polylines:()=>[],polygons:()=>[],circles:()=>[],centerMarker:true,pickOnClick:false,fitMarkers:false,styles:()=>({}),ariaLabel:'Neshan MapLibre map'})
const emit=defineEmits<{
  ready:[context:MapLibreReady];destroy:[];error:[error:Error];warning:[message:string];
  'update:modelValue':[coordinates:Coordinates];'update:zoom':[zoom:number];latitude:[latitude:number];longitude:[longitude:number];
  click:[event:MapLibreClickEvent];moveend:[event:unknown];zoomend:[event:unknown];
  'marker-click':[marker:MapLibreMarker,event:MouseEvent];'marker-dragend':[marker:MapLibreMarker,position:Coordinates];
  'location-found':[event:{latlng:{lat:number;lng:number};accuracy:number}];'location-error':[error:{code:number;message:string}];
  'tiles-loading':[state:TileState];'tiles-loaded':[state:TileState];'tile-error':[state:TileState];'live-layers':[state:LiveLayerState];
}>()
const container=ref<HTMLDivElement>(),map=shallowRef<NativeMap>(),sdk=shallowRef<MapLibreNamespace>()
const loading=ref(true),error=shallowRef<Error>(),tileState=shallowRef<TileState>({status:'idle',loaded:0,failed:0})
const owner={},prefix=`vue-neshan-${Math.random().toString(36).slice(2)}`
let generation=0,styleGeneration=0,disposed=false,loaded=false,styleReady=false,controller:AbortController|undefined,observer:ResizeObserver|undefined
let timer:ReturnType<typeof setTimeout>|undefined,refreshTimer:ReturnType<typeof setInterval>|undefined,locationGeneration=0
let lastCenter:Coordinates=[35.6997,51.338],lastZoom=13
interface MarkerEntry {marker:Marker;data:MapLibreMarker;position:Coordinates;popup?:Popup;text?:string;options:string;element?:HTMLElement;cleanup:()=>void}
const entries=new Map<MapLibreMarker['id'],MarkerEntry>()
const overlayIds=new Map<string,{layers:string[];source:string}>()
function report(cause:unknown){emit('error',cause instanceof Error?cause:new Error('Map operation failed'))}
function safe(action:()=>void){try{action()}catch(cause){report(cause)}}
function state(status:TileState['status'],loadedCount=tileState.value.loaded,failed=tileState.value.failed){tileState.value={status,loaded:loadedCount,failed};if(status==='error')emit('tile-error',tileState.value);else if(status==='loaded')emit('tiles-loaded',tileState.value);else if(status==='loading')emit('tiles-loading',tileState.value)}
function clearMarkers(){entries.forEach(entry=>{entry.cleanup();entry.marker.remove()});entries.clear()}
function destroy(){
  clearTimeout(timer);clearInterval(refreshTimer);controller?.abort();observer?.disconnect();locationGeneration++;loaded=false;styleReady=false
  clearMarkers();overlayIds.clear()
  if(map.value){const point=map.value.getCenter();lastCenter=[point.lat,point.lng];lastZoom=map.value.getZoom();map.value.remove();map.value=undefined;emit('destroy')}
  releaseMapLibreKey(owner);tileState.value={status:'idle',loaded:0,failed:0}
}
function syncMarkers(){
  if(!map.value||!sdk.value||!loaded)return
  const ids=new Set(props.markers.map(marker=>marker.id));if(ids.size!==props.markers.length)throw new Error('Marker IDs must be unique')
  props.markers.forEach(item=>lngLat(item.position))
  for(const [id,entry] of entries)if(!ids.has(id)){entry.cleanup();entry.marker.remove();entries.delete(id)}
  for(const item of props.markers){
    const options=JSON.stringify(item.options??{});let entry=entries.get(item.id)
    if(entry&&(entry.options!==options||entry.element!==item.element)){entry.cleanup();entry.marker.remove();entries.delete(item.id);entry=undefined}
    if(!entry){
      const marker=new sdk.value.Marker({...item.options,element:item.element?toRaw(item.element):undefined}).setLngLat(lngLat(item.position)).addTo(map.value)
      const element=marker.getElement();element.dataset.markerId=String(item.id);element.setAttribute('role','button');element.tabIndex=0
      const current={marker,data:item,position:[...item.position] as Coordinates,options,element:item.element,cleanup:()=>{}} as MarkerEntry
      const click=(event:MouseEvent)=>emit('marker-click',current.data,event)
      const keydown=(event:KeyboardEvent)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();marker.togglePopup()}}
      element.addEventListener('click',click);element.addEventListener('keydown',keydown)
      marker.on('dragend',()=>{const point=marker.getLngLat();emit('marker-dragend',current.data,[point.lat,point.lng])})
      current.cleanup=()=>{element.removeEventListener('click',click);element.removeEventListener('keydown',keydown)}
      entry=current;entries.set(item.id,entry)
    }
    entry.data=item
    if(entry.position.some((n,i)=>n!==item.position[i])){entry.marker.setLngLat(lngLat(item.position));entry.position=[...item.position]}
    const element=entry.marker.getElement();element.title=item.tooltip??'';element.setAttribute('aria-label',item.tooltip??`Marker ${item.id}`)
    if(entry.text!==item.popup){
      if(item.popup===undefined){entry.marker.setPopup(null);entry.popup=undefined}
      else if(entry.popup)entry.popup.setText(item.popup)
      else{entry.popup=new sdk.value.Popup({offset:25}).setText(item.popup);entry.marker.setPopup(entry.popup)}
      entry.text=item.popup
    }
  }
}
function put(kind:string,data:GeoJSON.GeoJSON,layers:MapLibreOverlayLayer[],sourceOptions:Record<string,unknown>={}){
  const instance=map.value!;const source=`${prefix}-${kind}`
  const old=overlayIds.get(kind)
  if(old){old.layers.forEach(id=>{if(instance.getLayer(id))instance.removeLayer(id)});if(instance.getSource(old.source))instance.removeSource(old.source)}
  instance.addSource(source,{...sourceOptions,type:'geojson',data})
  const ids:string[]=[]
  for(const layer of layers){const id=`${source}-${layer.id}`;instance.addLayer({...layer,id,source} as LayerSpecification);ids.push(id)}
  overlayIds.set(kind,{source,layers:ids})
}
function render(kind:'lines'|'polygons'|'circles'|'geojson'){
  if(!loaded||!styleReady||!map.value)return
  const features:GeoJSON.Feature[]=[]
  if(kind==='lines')props.polylines.forEach(line=>features.push({type:'Feature',properties:{color:line.options?.color??'#0d9488',weight:line.options?.weight??4,opacity:line.options?.opacity??1},geometry:{type:'LineString',coordinates:line.positions.map(lngLat)}}))
  if(kind==='polygons')props.polygons.forEach(polygon=>{const rings=typeof polygon.positions[0]?.[0]==='number'?[polygon.positions as Coordinates[]]:polygon.positions as Coordinates[][];features.push({type:'Feature',properties:{color:polygon.options?.color??'#7c3aed',fill:polygon.options?.fillColor??polygon.options?.color??'#7c3aed',opacity:polygon.options?.fill===false?0:polygon.options?.fillOpacity??0.2,weight:polygon.options?.weight??2},geometry:{type:'Polygon',coordinates:rings.map(closeRing)}})})
  if(kind==='circles')props.circles.forEach(circle=>features.push({type:'Feature',properties:{color:circle.options?.color??'#0d9488',fill:circle.options?.fillColor??circle.options?.color??'#0d9488',opacity:circle.options?.fill===false?0:circle.options?.fillOpacity??0.15,weight:circle.options?.weight??2},geometry:{type:'Polygon',coordinates:[circleRing(circle.center,circle.radius)]}}))
  if(kind==='lines'){
    features.forEach((feature,index)=>{feature.properties!.index=index})
    put(kind,{type:'FeatureCollection',features},props.polylines.map((line,index)=>{
      const width=line.options?.weight??4,dash=line.options?.dashArray
      const pattern=typeof dash==='string'?dash.split(/[ ,]+/).filter(Boolean).map(Number):dash
      return {id:`line-${index}`,type:'line',filter:['==',['get','index'],index],paint:{'line-color':line.options?.color??'#0d9488','line-width':width,'line-opacity':line.options?.opacity??1,...(pattern?.length?{'line-dasharray':pattern.map(value=>value/Math.max(width,1))}:{})}}
    }));return
  }
  if(kind!=='geojson'){put(kind,{type:'FeatureCollection',features},[{id:'fill',type:'fill',paint:{'fill-color':['get','fill'],'fill-opacity':['get','opacity']}},{id:'outline',type:'line',paint:{'line-color':['get','color'],'line-width':['get','weight']}}]);return}
  put(kind,props.geojson??{type:'FeatureCollection',features:[]},props.geojsonLayers??[
    {id:'fill',type:'fill',filter:['==','$type','Polygon'],paint:{'fill-color':'#dc4d77','fill-opacity':0.16}},
    {id:'line',type:'line',filter:['!=','$type','Point'],paint:{'line-color':'#dc4d77','line-width':3}},
    {id:'point',type:'circle',filter:['==','$type','Point'],paint:{'circle-color':'#dc4d77','circle-radius':6}},
  ],props.geojsonOptions)
}
function liveLayers(){if(!loaded||!styleReady||!map.value)return;const groups=setLiveLayers(map.value,props.traffic,props.poi);emit('live-layers',{traffic:props.traffic,poi:props.poi,trafficLayers:groups.traffic,poiLayers:groups.poi});if(props.traffic&&!groups.traffic.length)emit('warning','The supplied style has no Neshan traffic layers');if(props.poi&&!groups.poi.length)emit('warning','The supplied style has no Neshan POI layers')}
function restore(){if(!loaded)return;safe(()=>{syncMarkers();for(const kind of ['lines','polygons','circles','geojson']as const)render(kind);liveLayers()})}
function fitToMarkers(){if(map.value&&sdk.value&&props.markers.length){const bounds=new sdk.value.LngLatBounds();props.markers.forEach(item=>bounds.extend(lngLat(item.position)));map.value.fitBounds(bounds,{padding:40,maxZoom:16,duration:0})}}
function view(){if(!map.value)return;const center=props.modelValue??lastCenter,zoom=props.zoom??map.value.getZoom();if(!Number.isFinite(zoom))throw new Error('Zoom must be finite');const point=map.value.getCenter();if(Math.abs(point.lat-center[0])>1e-8||Math.abs(point.lng-center[1])>1e-8||Math.abs(map.value.getZoom()-zoom)>1e-8)map.value.jumpTo({center:lngLat(center),zoom})}
async function initialize(){
  const current=++generation;destroy();loading.value=true;error.value=undefined;controller=new AbortController()
  try{
    const key=props.apiKey?.trim();if(!key?.startsWith('web.')||key.length<12)throw new Error('A valid Neshan web API key is required')
    claimMapLibreKey(owner,key)
    const [namespace,style]=await Promise.all([loadNeshanMapLibre(),loadMapLibreStyle(props.mapStyle,controller.signal)])
    if(disposed||current!==generation||!container.value)return
    const center=props.modelValue??lastCenter,zoom=props.zoom??lastZoom;if(!Number.isFinite(zoom))throw new Error('Zoom must be finite')
    sdk.value=namespace
    const instance=new namespace.Map({...safeMapLibreOptions(props.options),container:container.value,apiKey:key,style,center:lngLat(center),zoom,rtl:props.options?.rtl??{lazy:false}})
    map.value=instance;instance.addControl(new namespace.NavigationControl(),'top-left')
    state('loading',0,0)
    timer=setTimeout(()=>{if(!loaded){loading.value=false;error.value=new Error('Map resources timed out. Check the web key, domain, WebGL and network.');report(error.value)}},30000)
    instance.on('load',()=>{clearTimeout(timer);loaded=true;loading.value=false;error.value=undefined;restore();if(props.fitMarkers)safe(fitToMarkers);emit('ready',{map:instance,maplibre:namespace})})
    instance.on('style.load',()=>{styleReady=true;overlayIds.clear();restore()})
    instance.on('dataloading',()=>{if(tileState.value.status!=='error')state('loading')})
    instance.on('sourcedata',event=>{if(event.isSourceLoaded)tileState.value={...tileState.value,loaded:tileState.value.loaded+1}})
    instance.on('idle',()=>{if(!tileState.value.failed)state('loaded');else state('error')})
    instance.on('error',()=>{state('error',tileState.value.loaded,tileState.value.failed+1);emit('warning','A map resource request failed. Check the web key, domain, quota and network.')})
    instance.on('moveend',event=>{const point=instance.getCenter();lastCenter=[point.lat,point.lng];emit('update:modelValue',lastCenter);emit('latitude',point.lat);emit('longitude',point.lng);emit('moveend',event)})
    instance.on('zoomend',event=>{lastZoom=instance.getZoom();emit('update:zoom',lastZoom);emit('zoomend',event)})
    instance.on('click',event=>{const point:Coordinates=[event.lngLat.lat,event.lngLat.lng];if(props.pickOnClick)instance.easeTo({center:lngLat(point)});emit('click',Object.assign(event,{coordinates:point}))})
    if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>instance.resize());observer.observe(container.value)}
    // Re-request live traffic using the public VectorTileSource API; HTTP caching remains server controlled.
    refreshTimer=setInterval(()=>{if(props.traffic&&loaded){const source=instance.getSource('traffic')as VectorTileSource|undefined;if(source?.tiles)source.setTiles([...source.tiles])}},60000)
  }catch(cause){if(!disposed&&current===generation){destroy();loading.value=false;error.value=cause instanceof Error?cause:new Error('Unable to initialize map');report(error.value)}}
}
async function styleChanged(){
  if(!map.value||!loaded){if(!disposed)void initialize();return}const current=++styleGeneration;const instance=map.value
  try{const style=await loadMapLibreStyle(props.mapStyle,controller?.signal);if(current!==styleGeneration||instance!==map.value)return;styleReady=false;state('loading',0,0);instance.setStyle(style,{diff:false})}catch(cause){if(!disposed&&instance===map.value)report(cause)}
}
function retry(){return initialize()}
function locate(options:{setView?:boolean;maxZoom?:number;timeout?:number;enableHighAccuracy?:boolean}={}){
  if(!map.value)return
  const current=++locationGeneration
  if(!navigator.geolocation){emit('location-error',{code:2,message:'Geolocation is unavailable'});return}
  navigator.geolocation.getCurrentPosition(position=>{if(current!==locationGeneration||!map.value)return;const {latitude:lat,longitude:lng,accuracy}=position.coords;if(options.setView!==false)map.value.flyTo({center:[lng,lat],zoom:options.maxZoom??16});emit('location-found',{latlng:{lat,lng},accuracy})},failure=>{if(current===locationGeneration&&!disposed)emit('location-error',{code:failure.code,message:failure.message})},{timeout:10000,enableHighAccuracy:true,...options})
}
watch(()=>props.apiKey,initialize)
watch(()=>props.mapStyle,styleChanged,{deep:true})
watch(()=>[props.modelValue,props.zoom],()=>safe(view),{deep:true})
watch(()=>props.markers,()=>safe(()=>{syncMarkers();if(props.fitMarkers)fitToMarkers()}),{deep:true})
watch(()=>props.fitMarkers,value=>{if(value)safe(fitToMarkers)})
watch(()=>props.polylines,()=>safe(()=>render('lines')),{deep:true});watch(()=>props.polygons,()=>safe(()=>render('polygons')),{deep:true});watch(()=>props.circles,()=>safe(()=>render('circles')),{deep:true});watch(()=>[props.geojson,props.geojsonLayers,props.geojsonOptions],()=>safe(()=>render('geojson')),{deep:true})
watch(()=>[props.traffic,props.poi],()=>safe(()=>{state('loading',0,0);liveLayers()}))
onMounted(initialize);onBeforeUnmount(()=>{disposed=true;generation++;styleGeneration++;destroy()})
defineExpose({map,maplibre:sdk,tileState,retry:initialize,fitToMarkers,locate,invalidateSize:()=>map.value?.resize(),
  fitBounds:(bounds:LngLatBoundsLike,options?:FitBoundsOptions)=>map.value?.fitBounds(bounds,options),
  flyTo:(center:Coordinates,zoom?:number,options?:FlyToOptions)=>map.value?.flyTo({...options,center:lngLat(center),zoom}),
  openPopup:(id:MapLibreMarker['id'])=>{const entry=entries.get(id);if(entry?.popup&&!entry.popup.isOpen())entry.marker.togglePopup()},
  getDiagnostics:()=>{const instance=map.value;if(!instance||!loaded)return;const groups=liveLayerGroups(instance);return{...groups,trafficVisible:props.traffic,poiVisible:props.poi,trafficFeatures:groups.traffic.length?instance.queryRenderedFeatures({layers:groups.traffic}).length:0,poiFeatures:groups.poi.length?instance.queryRenderedFeatures({layers:groups.poi}).length:0,overlays:[...overlayIds.keys()],markers:entries.size,styleLoaded:instance.isStyleLoaded()}},
})
</script>
