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
import type { Map as NativeMap, Marker, Popup, LayerSpecification, GeoJSONSource, VectorTileSource, LngLatBoundsLike, FlyToOptions, FitBoundsOptions, FilterSpecification } from 'maplibre-gl'
import type { Coordinates, TileState } from '../types'
import type { MapLibreProps, MapLibreMarker, MapLibreReady, MapLibreClickEvent, LiveLayerState, MapLibreOverlayLayer } from '../maplibre-types'
import {updateGeoJSON,AdvancedLayers,type OverlayEntry} from '../maplibre-layers'
import {normalizeResourceError,NeshanResourceError,type MapResourceFailure} from '../resource-errors'
import { loadNeshanMapLibre, loadMapLibreStyle, safeMapLibreOptions, MAPLIBRE_STYLES, lngLat, circleRing, closeRing, liveLayerGroups, setLiveLayers, claimMapLibreKey, releaseMapLibreKey, type MapLibreNamespace } from '../maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
const props=withDefaults(defineProps<MapLibreProps>(),{mapStyle:MAPLIBRE_STYLES.light,traffic:false,poi:false,markers:()=>[],polylines:()=>[],polygons:()=>[],circles:()=>[],centerMarker:true,pickOnClick:false,fitMarkers:false,styles:()=>({}),ariaLabel:'Neshan MapLibre map'})
const emit=defineEmits<{
  ready:[context:MapLibreReady];destroy:[];error:[error:Error];warning:[message:string];
  'update:modelValue':[coordinates:Coordinates];'update:zoom':[zoom:number];latitude:[latitude:number];longitude:[longitude:number];
  click:[event:MapLibreClickEvent];moveend:[event:unknown];zoomend:[event:unknown];
  'marker-click':[marker:MapLibreMarker,event:MouseEvent];'marker-dragend':[marker:MapLibreMarker,position:Coordinates];
  'location-found':[event:{latlng:{lat:number;lng:number};accuracy:number}];'location-error':[error:{code:number;message:string}];
  'tiles-loading':[state:TileState];'tiles-loaded':[state:TileState];'tile-error':[state:TileState];'live-layers':[state:LiveLayerState];
  'resource-error':[failure:MapResourceFailure];
  'cluster-click':[cluster:{clusterId:number;pointCount:number;coordinates:Coordinates}];
  'layer-click':[payload:{layerId:string;features:GeoJSON.Feature[];coordinates:Coordinates}];
}>()
const container=ref<HTMLDivElement>(),map=shallowRef<NativeMap>(),sdk=shallowRef<MapLibreNamespace>()
const loading=ref(true),error=shallowRef<Error>(),tileState=shallowRef<TileState>({status:'idle',loaded:0,failed:0})
const owner={},prefix=`vue-neshan-${Math.random().toString(36).slice(2)}`
let generation=0,styleGeneration=0,disposed=false,loaded=false,styleReady=false,controller:AbortController|undefined,observer:ResizeObserver|undefined
let timer:ReturnType<typeof setTimeout>|undefined,refreshTimer:ReturnType<typeof setInterval>|undefined,locationGeneration=0
let lastCenter:Coordinates=[35.6997,51.338],lastZoom=13
interface MarkerEntry {marker:Marker;data:MapLibreMarker;position:Coordinates;popup?:Popup;text?:string;options:string;element?:HTMLElement;cleanup:()=>void}
const entries=new Map<MapLibreMarker['id'],MarkerEntry>()
const overlayIds=new Map<string,OverlayEntry>()
let advanced:AdvancedLayers|undefined
const dirty=new Set<'lines'|'polygons'|'circles'|'geojson'|'advanced'>()
let renderQueued=false
function schedule(kind:'lines'|'polygons'|'circles'|'geojson'|'advanced'){
  dirty.add(kind);if(renderQueued)return;renderQueued=true
  queueMicrotask(()=>{renderQueued=false;const pending=[...dirty];dirty.clear();if(disposed||!loaded||!styleReady)return;for(const item of pending)safe(()=>item==='advanced'?syncAdvanced():render(item))})
}
function publicError(cause:unknown){let message=cause instanceof Error?cause.message:'Map operation failed';if(props.apiKey){message=message.replaceAll(props.apiKey,'[redacted]').replaceAll(encodeURIComponent(props.apiKey),'[redacted]')}return new Error(message)}
function report(cause:unknown){emit('error',publicError(cause))}
function safe(action:()=>void){try{action()}catch(cause){report(cause)}}
function state(status:TileState['status'],loadedCount=tileState.value.loaded,failed=tileState.value.failed){tileState.value={status,loaded:loadedCount,failed};if(status==='error')emit('tile-error',tileState.value);else if(status==='loaded')emit('tiles-loaded',tileState.value);else if(status==='loading')emit('tiles-loading',tileState.value)}
function clearMarkers(){entries.forEach(entry=>{entry.cleanup();entry.marker.remove()});entries.clear()}
function destroy(){
  clearTimeout(timer);clearInterval(refreshTimer);controller?.abort();observer?.disconnect();locationGeneration++;loaded=false;styleReady=false
  clearMarkers();overlayIds.clear();advanced=undefined;dirty.clear()
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
  const definitions=layers.map(layer=>({...layer,id:`${source}-${layer.id}`,source}) as LayerSpecification)
  overlayIds.set(kind,updateGeoJSON(instance,overlayIds.get(kind),source,data,definitions,sourceOptions))
}
function syncAdvanced(){if(loaded&&styleReady&&map.value){advanced??=new AdvancedLayers(map.value,`${prefix}-advanced`);advanced.sync(props.sources??{},props.layers??[])}}
function render(kind:'lines'|'polygons'|'circles'|'geojson'){
  if(!loaded||!styleReady||!map.value)return
  const features:GeoJSON.Feature[]=[]
  if(kind==='lines')props.polylines.forEach(line=>features.push({type:'Feature',properties:{color:line.options?.color??'#0d9488',weight:line.options?.weight??4,opacity:line.options?.opacity??1},geometry:{type:'LineString',coordinates:line.positions.map(lngLat)}}))
  if(kind==='polygons')props.polygons.forEach(polygon=>{const rings=typeof polygon.positions[0]?.[0]==='number'?[polygon.positions as Coordinates[]]:polygon.positions as Coordinates[][];features.push({type:'Feature',properties:{color:polygon.options?.color??'#7c3aed',fill:polygon.options?.fillColor??polygon.options?.color??'#7c3aed',opacity:polygon.options?.fill===false?0:polygon.options?.fillOpacity??0.2,weight:polygon.options?.weight??2},geometry:{type:'Polygon',coordinates:rings.map(closeRing)}})})
  if(kind==='circles')props.circles.forEach(circle=>features.push({type:'Feature',properties:{color:circle.options?.color??'#0d9488',fill:circle.options?.fillColor??circle.options?.color??'#0d9488',opacity:circle.options?.fill===false?0:circle.options?.fillOpacity??0.15,weight:circle.options?.weight??2},geometry:{type:'Polygon',coordinates:[circleRing(circle.center,circle.radius)]}}))
  if(kind==='lines'){
    const groups=new Map<string,number[]|undefined>()
    features.forEach((feature,index)=>{
      const line=props.polylines[index]
      const width=line.options?.weight??4,dash=line.options?.dashArray
      const pattern=typeof dash==='string'?dash.split(/[ ,]+/).filter(Boolean).map(Number):dash
      if(pattern?.some(value=>!Number.isFinite(value)||value<0))throw Error('Line dash values must be finite and non-negative')
      const normalized=pattern?.length?pattern.map(value=>value/Math.max(width,1)):undefined
      const key=JSON.stringify(normalized??[]);feature.properties!.dash=key;groups.set(key,normalized)
    })
    put(kind,{type:'FeatureCollection',features},[...groups].map(([key,pattern],index)=>({id:`line-${index}`,type:'line',filter:['==',['get','dash'],key],paint:{'line-color':['get','color'],'line-width':['get','weight'],'line-opacity':['get','opacity'],...(pattern?{'line-dasharray':pattern}:{})}})));return
  }
  if(kind!=='geojson'){put(kind,{type:'FeatureCollection',features},[{id:'fill',type:'fill',paint:{'fill-color':['get','fill'],'fill-opacity':['get','opacity']}},{id:'outline',type:'line',paint:{'line-color':['get','color'],'line-width':['get','weight']}}]);return}
  const options={...props.geojsonOptions}
  if(props.cluster!==undefined){options.cluster=Boolean(props.cluster);if(typeof props.cluster==='object')Object.assign(options,{clusterRadius:props.cluster.radius??50,clusterMaxZoom:props.cluster.maxZoom??14,clusterMinPoints:props.cluster.minPoints??2})}
  const clustered=options.cluster===true
  const cluster=typeof props.cluster==='object'?props.cluster:{}
  const heat=typeof props.heatmap==='object'?props.heatmap:{}
  const pointFilter:FilterSpecification=['all',['==',['geometry-type'],'Point'],['!', ['has','point_count']]]
  let layers:MapLibreOverlayLayer[]=props.geojsonLayers??[
    {id:'fill',type:'fill',filter:['==','$type','Polygon'],paint:{'fill-color':'#dc4d77','fill-opacity':0.16}},
    {id:'line',type:'line',filter:['!=','$type','Point'],paint:{'line-color':'#dc4d77','line-width':3}},
    ...(!props.heatmap?[{id:'point',type:'circle' as const,filter:pointFilter,paint:{'circle-color':cluster.pointColor??'#dc4d77','circle-radius':6}}]:[]),
  ]
  if(props.heatmap || overlayIds.has('heatmap')){
    put('heatmap',props.heatmap?(props.geojson??{type:'FeatureCollection',features:[]}):{type:'FeatureCollection',features:[]},props.heatmap?[{id:'heatmap',type:'heatmap',filter:pointFilter,maxzoom:heat.maxZoom??22,paint:{'heatmap-weight':heat.weightProperty?['max',0,['to-number',['get',heat.weightProperty],0]]:1,'heatmap-intensity':heat.intensity??1,'heatmap-radius':heat.radius??24,'heatmap-opacity':heat.opacity??0.8}}]:[],{...options,cluster:false})
  }
  if(clustered){
    const font=map.value.getStyle()?.layers.find(layer=>layer.type==='symbol'&&layer.layout?.['text-font'])
    const textFont=font?.type==='symbol'?font.layout?.['text-font']:undefined
    layers=[...layers,{id:'clusters',type:'circle',filter:['has','point_count'],paint:{'circle-color':cluster.color??'#087f8c','circle-radius':['step',['get','point_count'],18,100,24,1000,32],'circle-stroke-color':'#ffffff','circle-stroke-width':2}},
      {id:'cluster-count',type:'symbol',filter:['has','point_count'],layout:{'text-field':['to-string',['get','point_count_abbreviated']],'text-size':13,'text-allow-overlap':true,'text-ignore-placement':true,...(textFont?{'text-font':textFont}:{})},paint:{'text-color':cluster.textColor??'#ffffff'}}]
  }
  put(kind,props.geojson??{type:'FeatureCollection',features:[]},layers,options)
}
function liveLayers(){if(!loaded||!styleReady||!map.value)return;const groups=setLiveLayers(map.value,props.traffic,props.poi);emit('live-layers',{traffic:props.traffic,poi:props.poi,trafficLayers:groups.traffic,poiLayers:groups.poi});if(props.traffic&&!groups.traffic.length)emit('warning','The supplied style has no Neshan traffic layers');if(props.poi&&!groups.poi.length)emit('warning','The supplied style has no Neshan POI layers')}
function restore(){if(!loaded)return;safe(()=>{syncMarkers();for(const kind of ['lines','polygons','circles','geojson']as const)render(kind);syncAdvanced();liveLayers()})}
async function expandCluster(clusterId:number,center?:Coordinates){
  const instance=map.value,source=instance?.getSource(`${prefix}-geojson`) as GeoJSONSource|undefined
  if(!source?.getClusterExpansionZoom)throw Error('A clustered GeoJSON source is required')
  const zoom=await source.getClusterExpansionZoom(clusterId)
  if(instance===map.value&&!disposed)instance!.easeTo({...(center?{center:lngLat(center)}:{}),zoom})
  return zoom
}
function getClusterLeaves(clusterId:number,limit=10,offset=0){const source=map.value?.getSource(`${prefix}-geojson`) as GeoJSONSource|undefined;if(!source?.getClusterLeaves)return Promise.reject(Error('A clustered GeoJSON source is required'));return source.getClusterLeaves(clusterId,limit,offset)}
function fitToMarkers(){if(map.value&&sdk.value&&props.markers.length){const bounds=new sdk.value.LngLatBounds();props.markers.forEach(item=>bounds.extend(lngLat(item.position)));map.value.fitBounds(bounds,{padding:40,maxZoom:16,duration:0})}}
function view(){if(!map.value)return;const center=props.modelValue??lastCenter,zoom=props.zoom??map.value.getZoom();if(!Number.isFinite(zoom))throw new Error('Zoom must be finite');const point=map.value.getCenter();if(Math.abs(point.lat-center[0])>1e-8||Math.abs(point.lng-center[1])>1e-8||Math.abs(map.value.getZoom()-zoom)>1e-8)map.value.jumpTo({center:lngLat(center),zoom})}
async function initialize(){
  const current=++generation;destroy();loading.value=true;error.value=undefined;controller=new AbortController()
  try{
    const key=props.apiKey?.trim();if(!key?.startsWith('web.')||key.length<12)throw new NeshanResourceError({kind:key?.startsWith('service.')?'key-type':'invalid-key',message:'A valid Neshan web API key is required',retryable:false})
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
    instance.on('style.load',()=>{styleReady=true;overlayIds.clear();advanced?.reset();restore()})
    instance.on('dataloading',()=>{if(tileState.value.status!=='error')state('loading')})
    instance.on('sourcedata',event=>{if(event.isSourceLoaded)tileState.value={...tileState.value,loaded:tileState.value.loaded+1}})
    instance.on('idle',()=>{if(!tileState.value.failed)state('loaded');else state('error')})
    instance.on('error',event=>{const failure=normalizeResourceError(event.error);state('error',tileState.value.loaded,tileState.value.failed+1);emit('resource-error',failure);emit('warning',failure.message)})
    instance.on('moveend',event=>{const point=instance.getCenter();lastCenter=[point.lat,point.lng];emit('update:modelValue',lastCenter);emit('latitude',point.lat);emit('longitude',point.lng);emit('moveend',event)})
    instance.on('zoomend',event=>{lastZoom=instance.getZoom();emit('update:zoom',lastZoom);emit('zoomend',event)})
    instance.on('click',event=>{const point:Coordinates=[event.lngLat.lat,event.lngLat.lng];
      const clusterLayer=`${prefix}-geojson-clusters`
      const features=instance.getLayer(clusterLayer)?instance.queryRenderedFeatures(event.point,{layers:[clusterLayer]}):[]
      const feature=features[0]
      if(feature&&feature.geometry.type==='Point'){
        const coordinates:Coordinates=[feature.geometry.coordinates[1],feature.geometry.coordinates[0]],clusterId=Number(feature.properties.cluster_id)
        emit('cluster-click',{clusterId,pointCount:Number(feature.properties.point_count),coordinates})
        if(typeof props.cluster!=='object'||props.cluster.expandOnClick!==false)void expandCluster(clusterId,coordinates).catch(report)
      }else if(props.pickOnClick)instance.easeTo({center:lngLat(point)})
      const ids=advanced?.layerIds().filter(id=>instance.getLayer(id))??[]
      if(ids.length){const hits=instance.queryRenderedFeatures(event.point,{layers:ids});for(const id of new Set(hits.map(hit=>hit.layer.id))){emit('layer-click',{layerId:advanced!.publicLayerId(id)!,features:hits.filter(hit=>hit.layer.id===id),coordinates:point})}}
      emit('click',Object.assign(event,{coordinates:point}))})
    if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>instance.resize());observer.observe(container.value)}
    // Re-request live traffic using the public VectorTileSource API; HTTP caching remains server controlled.
    refreshTimer=setInterval(()=>{if(props.traffic&&loaded){const source=instance.getSource('traffic')as VectorTileSource|undefined;if(source?.tiles)source.setTiles([...source.tiles])}},60000)
  }catch(cause){if(!disposed&&current===generation){destroy();loading.value=false;error.value=publicError(cause);if(cause instanceof NeshanResourceError)emit('resource-error',normalizeResourceError(cause));report(error.value)}}
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
watch(()=>props.polylines,()=>schedule('lines'),{deep:true});watch(()=>props.polygons,()=>schedule('polygons'),{deep:true});watch(()=>props.circles,()=>schedule('circles'),{deep:true});watch(()=>[props.geojson,props.geojsonLayers,props.geojsonOptions,props.cluster,props.heatmap],()=>schedule('geojson'),{deep:true})
watch(()=>[props.sources,props.layers],()=>schedule('advanced'),{deep:true})
watch(()=>[props.traffic,props.poi],()=>safe(()=>{state('loading',0,0);liveLayers()}))
onMounted(initialize);onBeforeUnmount(()=>{disposed=true;generation++;styleGeneration++;destroy()})
defineExpose({map,maplibre:sdk,tileState,retry:initialize,fitToMarkers,locate,expandCluster,getClusterLeaves,invalidateSize:()=>map.value?.resize(),
  fitBounds:(bounds:LngLatBoundsLike,options?:FitBoundsOptions)=>map.value?.fitBounds(bounds,options),
  flyTo:(center:Coordinates,zoom?:number,options?:FlyToOptions)=>map.value?.flyTo({...options,center:lngLat(center),zoom}),
  openPopup:(id:MapLibreMarker['id'])=>{const entry=entries.get(id);if(entry?.popup&&!entry.popup.isOpen())entry.marker.togglePopup()},
  getDiagnostics:()=>{const instance=map.value;if(!instance||!loaded)return;const groups=liveLayerGroups(instance);const clusters=`${prefix}-geojson-clusters`;return{...groups,trafficVisible:props.traffic,poiVisible:props.poi,trafficFeatures:groups.traffic.length?instance.queryRenderedFeatures({layers:groups.traffic}).length:0,poiFeatures:groups.poi.length?instance.queryRenderedFeatures({layers:groups.poi}).length:0,overlays:[...overlayIds.keys()],markers:entries.size,styleLoaded:instance.isStyleLoaded(),clusterFeatures:instance.getLayer(clusters)?instance.queryRenderedFeatures({layers:[clusters]}).length:0,heatmap:Boolean(props.heatmap),advancedLayers:advanced?.layerIds()??[],sourceCount:Object.keys(instance.getStyle().sources??{}).length,layerCount:instance.getStyle().layers.length}},
})
</script>
