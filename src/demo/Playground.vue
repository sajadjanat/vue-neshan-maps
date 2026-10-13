<script setup lang="ts">
import { computed, ref, shallowRef, watch, onMounted, onBeforeUnmount, nextTick, type Component } from 'vue'
import type * as L from 'leaflet'
import { NeshanMapLeaflet, NeshanMapLibre, MAPLIBRE_STYLES, normalizeResourceError, type Coordinates, type MapMarker, type MapReady, type MapLibreReady, type MapLibreClickEvent, type MapLibreAdvancedLayer, type MapResourceFailure, type TileState } from '../index'
import { translate, type Language, type MessageKey } from './messages'
import { samplePoints, customArea, district, parseGeoJSON, distanceMeters } from './data'
import DemoIcon from './DemoIcon.vue'
import './demo.css'
import pkg from '../../package.json'

const language=ref<Language>(new URLSearchParams(location.search).get('lang')==='en' ? 'en' : 'fa')
const t=(key:MessageKey)=>translate(language.value,key)
const format=(value:number,digits=0)=>new Intl.NumberFormat(language.value==='fa'?'fa-IR':'en-US',{maximumFractionDigits:digits}).format(value)
const docs=computed(()=>`?view=docs&lang=${language.value}&doc=overview`)
watch(language, value=>{document.documentElement.lang=value;const url=new URL(location.href);url.searchParams.set('lang',value);history.replaceState(null,'',url)}, {immediate:true})
const tabs=['view','data','layers','develop'] as const
const tab=ref<typeof tabs[number]>('view')
const tabIcons={view:'map',data:'data',layers:'layers',develop:'code'}
const tabHelp={view:'viewHelp',data:'dataHelp',layers:'layersHelp',develop:'developHelp'} as const
function moveTab(offset:number){const direction=language.value==='fa'?-offset:offset;tab.value=tabs[(tabs.indexOf(tab.value)+tabs.length+direction)%tabs.length];nextTick(()=>document.getElementById(`tab-${tab.value}`)?.focus())}
const key=ref(import.meta.env.VITE_NESHAN_WEB_KEY??''), activeKey=ref(key.value), keyOpen=ref(!activeKey.value)
const hostname=location.hostname
const engine=ref<'maplibre'|'leaflet'>('maplibre'), style=ref<keyof typeof MAPLIBRE_STYLES>('light')
const mapEngine=computed<Component>(()=>engine.value==='maplibre'?NeshanMapLibre:NeshanMapLeaflet)
const traffic=ref(true), poi=ref(true), mode=ref<'pan'|'pick'|'measure'>('pan')
const center=ref<Coordinates>([35.72,51.36]), zoom=ref(12.2), focus=ref(false)
const mapComponent=shallowRef<InstanceType<typeof NeshanMapLibre>|InstanceType<typeof NeshanMapLeaflet>>()
const nativeLibre=shallowRef<MapLibreReady['map']>(), nativeLeaflet=shallowRef<MapReady['map']>()
const isReady=ref(false), locating=ref(false)
const tiles=ref<TileState>({status:'idle',loaded:0,failed:0})
watch(engine, value=>{tiles.value={status:activeKey.value?'loading':'idle',loaded:0,failed:0};if(value==='leaflet' && style.value!=='dark')style.value='light'})
const showPoints=ref(true), cluster=ref(true), heatmap=ref(false), autoExpand=ref(true), clusterRadius=ref(50), count=ref(1000), revision=ref(0)
const heatRadius=ref(18), intensity=ref(.4), heatOpacity=ref(.55)
const points=computed(()=>samplePoints(count.value,revision.value))
const clusterOptions=computed(()=>cluster.value ? {radius:clusterRadius.value,maxZoom:14,expandOnClick:autoExpand.value,color:'#315cf4',pointColor:'#238d86',textColor:'#fff'} : false)
const heatOptions=computed(()=>heatmap.value ? {weightProperty:'weight',radius:heatRadius.value,intensity:intensity.value,opacity:heatOpacity.value} : false)
const showMarkers=ref(true), showLine=ref(false), showCircle=ref(true), showPolygon=ref(false), showCustom=ref(false), show3d=ref(false)
const radius=ref(700), height=ref(450), layerOpacity=ref(.75)
const places=ref<MapMarker[]>([{id:'azadi',position:[35.6997,51.338],options:{draggable:true}},{id:'milad',position:[35.7448,51.3753],options:{draggable:true}}])
const namedPlaces=computed(()=>places.value.map((place,i)=>({...place,popup:`${t(i===0?'azadi':'milad')} — ${t('dragHelp')}`,tooltip:t(i===0?'azadi':'milad'),options:{...place.options,title:t(i===0?'azadi':'milad'),alt:t(i===0?'azadi':'milad')}})))
const markers=computed(()=>showMarkers.value ? namedPlaces.value : [])
const measured=ref<Coordinates[]>([]), distance=computed(()=>distanceMeters(measured.value))
const lines=computed(()=>[...(showLine.value?[{id:'connection',positions:places.value.map(p=>p.position),options:{color:'#238d86',weight:4,dashArray:'8 6'}}]:[]),...(measured.value.length>1?[{id:'measurement',positions:measured.value,options:{color:'#d98626',weight:4}}]:[])])
const circles=computed(()=>showCircle.value?[{id:'radius',center:places.value[0].position,radius:radius.value,options:{color:'#238d86',fillOpacity:.12}}]:[])
const polygons=computed(()=>showPolygon.value?[{id:'zone',positions:[[35.706,51.355],[35.716,51.355],[35.716,51.37],[35.706,51.37]] as Coordinates[],options:{color:'#e25980',fillOpacity:.2}}]:[])
const customGeoJSON=shallowRef<GeoJSON.Feature|GeoJSON.FeatureCollection>(customArea)
const jsonText=ref(JSON.stringify(customArea,null,2)), jsonError=ref('')
const advancedSources=computed(()=>({...(show3d.value?{districts:{type:'geojson' as const,data:district}}:{}),...(showCustom.value?{custom:{type:'geojson' as const,data:customGeoJSON.value}}:{})}))
const advancedLayers=computed<MapLibreAdvancedLayer[]>(()=>[
  ...(showCustom.value ? [
    {id:'custom-fill',type:'fill' as const,source:'custom',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#e25980','fill-opacity':.2}},
    {id:'custom-line',type:'line' as const,source:'custom',paint:{'line-color':'#b92d59','line-width':3}},
    {id:'custom-points',type:'circle' as const,source:'custom',filter:['==',['geometry-type'],'Point'],paint:{'circle-color':'#e25980','circle-radius':7}},
  ] satisfies MapLibreAdvancedLayer[] : []),
  ...(show3d.value ? [{id:'district-3d',type:'fill-extrusion' as const,source:'districts',paint:{'fill-extrusion-color':'#7860d4','fill-extrusion-height':height.value,'fill-extrusion-opacity':layerOpacity.value}}] satisfies MapLibreAdvancedLayer[] : []),
])
const selectedCluster=ref<{clusterId:number;pointCount:number;coordinates:Coordinates}>()
const clusterLeaves=ref<GeoJSON.Feature[]>([]), clusterError=ref('')
watch([points,style,engine,clusterRadius,cluster],()=>{selectedCluster.value=undefined;clusterLeaves.value=[];clusterError.value=''})
watch(show3d, value=>{nativeLibre.value?.easeTo({pitch:value?48:0,duration:650});if(value)tab.value='layers'})
const failure=ref<MapResourceFailure>(), isSimulation=ref(false), simulationCode=ref(481)
const failureKeys:Record<MapResourceFailure['kind'],MessageKey>={'invalid-key':'invalidKey','key-type':'keyType',domain:'domain',service:'service',quota:'quota','rate-limit':'rateLimit',forbidden:'forbidden',network:'network',server:'server',request:'request',decode:'decode',unknown:'unknown'}
const events=ref<{id:number;time:number;key:MessageKey;detail:string}[]>([])
let eventId=0
function record(event:MessageKey,detail=''){events.value=[{id:++eventId,time:Date.now(),key:event,detail},...events.value].slice(0,8)}
function resourceError(value:MapResourceFailure){failure.value=value;isSimulation.value=false;record('actual',value.kind)}
function simulate(){failure.value=normalizeResourceError({status:simulationCode.value,code:simulationCode.value});isSimulation.value=true;record('simulation',failure.value.kind)}
const diagnostics=shallowRef<ReturnType<InstanceType<typeof NeshanMapLibre>['getDiagnostics']>>()
function inspect(){if(mapComponent.value && 'getDiagnostics'in mapComponent.value)diagnostics.value=mapComponent.value.getDiagnostics()}
function ready(context:MapReady|MapLibreReady){if('L'in context)nativeLeaflet.value=context.map;else {nativeLibre.value=context.map;context.map.setPitch(show3d.value?48:0)}isReady.value=true;record('ready');nextTick(inspect)}
function destroyed(){isReady.value=false;nativeLibre.value=undefined;nativeLeaflet.value=undefined;locating.value=false;diagnostics.value=undefined}
function applyKey(){const value=key.value.trim();failure.value=undefined;tiles.value={status:'loading',loaded:0,failed:0};if(value===activeKey.value && value)void mapComponent.value?.retry();else activeKey.value=value;keyOpen.value=!value}
function disconnect(){activeKey.value='';key.value='';keyOpen.value=true;failure.value=undefined;tiles.value={status:'idle',loaded:0,failed:0}}
function focusKey(){keyOpen.value=true;nextTick(()=>document.getElementById('web-key')?.focus())}
function clicked(event:L.LeafletMouseEvent|MapLibreClickEvent){const point:Coordinates='coordinates'in event?event.coordinates:[event.latlng.lat,event.latlng.lng];if(mode.value==='measure')measured.value=[...measured.value,point];if(mode.value!=='pan')record('picked',point.map(x=>x.toFixed(5)).join(', '))}
function markerDragged(marker:MapMarker,point:Coordinates){places.value=places.value.map(item=>item.id===marker.id?{...item,position:point}:item);record('dragged',String(marker.id))}
function clusterClicked(value:NonNullable<typeof selectedCluster.value>){selectedCluster.value=value;clusterLeaves.value=[];clusterError.value='';record('clusterClicked',`${value.pointCount}`)}
async function readLeaves(){try{if(selectedCluster.value && mapComponent.value && 'getClusterLeaves'in mapComponent.value)clusterLeaves.value=await mapComponent.value.getClusterLeaves(selectedCluster.value.clusterId,10)}catch{clusterError.value=t('leavesExpired')}}
async function expand(){try{if(selectedCluster.value && mapComponent.value && 'expandCluster'in mapComponent.value)await mapComponent.value.expandCluster(selectedCluster.value.clusterId,selectedCluster.value.coordinates)}catch{clusterError.value=t('leavesExpired')}}
function updatePoints(){revision.value++;record('updated',String(count.value));nextTick(inspect)}
function applyGeoJSON(){try{customGeoJSON.value=parseGeoJSON(jsonText.value);jsonError.value='';showCustom.value=true;record('applied')}catch{jsonError.value=t('invalidJson')}}
function download(){const url=URL.createObjectURL(new Blob([JSON.stringify(points.value)],{type:'application/geo+json'}));const a=document.createElement('a');a.href=url;a.download='points.geojson';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function locate(){locating.value=true;mapComponent.value?.locate({setView:true,maxZoom:16,timeout:10000,enableHighAccuracy:true})}
function locationError(event:{code:number}){locating.value=false;record(event.code===1?'locationDenied':'locationFailed')}
function focusPlace(index:number){const p=places.value[index].position;if(nativeLibre.value){nativeLibre.value.flyTo({center:[p[1],p[0]],zoom:15});if(mapComponent.value && 'openPopup'in mapComponent.value)mapComponent.value.openPopup(places.value[index].id)}else nativeLeaflet.value?.setView(p,15)}
function reset(){center.value=[35.72,51.36];zoom.value=12.2;measured.value=[];mode.value='pan';nativeLibre.value?.jumpTo({center:[51.36,35.72],zoom:12.2,pitch:show3d.value?48:0,bearing:0});nativeLeaflet.value?.setView(center.value,zoom.value)}
const preset=ref('clusters')
function scenario(name:string){preset.value=name;showPoints.value=name==='clusters'||name==='density';engine.value='maplibre';mode.value='pan';cluster.value=name==='clusters';heatmap.value=name==='density';show3d.value=name==='volume';showMarkers.value=name==='places';showCircle.value=name==='places';showLine.value=name==='places';showPolygon.value=false;showCustom.value=false;reset();tab.value=name==='volume'?'layers':name==='places'?'view':'data'}
const snippetMode=ref<'vue'|'nuxt'>('vue'), copied=ref(false), copyError=ref(false)
const snippet=computed(()=>snippetMode.value==='nuxt' ? `// nuxt.config.ts\nexport default defineNuxtConfig({\n  modules: ['vue-neshan-maps/nuxt'],\n  runtimeConfig: { public: { neshanWebKey: '' } },\n})\n\n// .env\nNUXT_PUBLIC_NESHAN_WEB_KEY=web.YOUR_KEY\n\n// app/components/Map.client.vue\n<script setup lang="ts">\nconst config = useRuntimeConfig()\n<\/script>\n\n<template>\n  <NeshanMapLibre\n    :api-key="config.public.neshanWebKey"\n    :model-value="[35.72, 51.36]"\n    :traffic="true" :poi="true"\n    :styles="{ height: '600px' }"\n  />\n</template>` : `<script setup lang="ts">\nimport { ref } from 'vue'\nimport { ${engine.value==='maplibre'?'NeshanMapLibre, MAPLIBRE_STYLES':'NeshanMapLeaflet'} } from 'vue-neshan-maps'\nimport 'vue-neshan-maps/style.css'\nimport 'vue-neshan-maps/fonts/vazir.css'\n${engine.value==='maplibre'?'// Download this file from the Data tab.\nimport points from \'./points.geojson?raw\'\nconst geojson = JSON.parse(points)\n':''}const center = ref<[number, number]>([${center.value.map(x=>x.toFixed(5)).join(', ')}])\nconst zoom = ref(${zoom.value.toFixed(2)})\nconst webKey = import.meta.env.VITE_NESHAN_WEB_KEY\n<\/script>\n\n<template>\n  <${engine.value==='maplibre'?'NeshanMapLibre':'NeshanMapLeaflet'}\n    class="neshan-font-vazir"\n    v-model="center" v-model:zoom="zoom"\n    :api-key="webKey"\n${engine.value==='maplibre'?`    :map-style="MAPLIBRE_STYLES.${style.value}"\n    :traffic="${traffic.value}" :poi="${poi.value}"\n    :geojson="${showPoints.value?'geojson':'undefined'}"\n    :cluster='${JSON.stringify(clusterOptions.value)}'\n    :heatmap='${JSON.stringify(heatOptions.value)}'\n    @resource-error="console.info($event.kind)"\n`:`    :options="{ maptype: '${style.value==='dark'?'standard-night':'dreamy'}' }"\n`}    :styles="{ height: '600px' }"\n  />\n</template>`)
async function copyCode(){try{await navigator.clipboard.writeText(snippet.value);copied.value=true;copyError.value=false;setTimeout(()=>copied.value=false,2000)}catch{copyError.value=true}}
const status=computed(()=>!activeKey.value?t('idle'):tiles.value.status==='error'?t('tilePartial'):tiles.value.status==='loaded'?t('ready'):t('loading'))
function escapeFocus(event:KeyboardEvent){if(event.key==='Escape')focus.value=false}
let diagnosticTimer:ReturnType<typeof setInterval>
onMounted(()=>{diagnosticTimer=setInterval(inspect,5000);window.addEventListener('keydown',escapeFocus)})
onBeforeUnmount(()=>{clearInterval(diagnosticTimer);window.removeEventListener('keydown',escapeFocus)})
</script>

<template>
  <div class="demo-shell neshan-font-vazir" :dir="language==='fa'?'rtl':'ltr'">
    <a class="skip-link" href="#map-tools">{{ t('view') }}</a>
    <header class="site-nav">
      <a class="brand" href="./" :aria-label="t('brand')"><span class="brand-mark"><DemoIcon name="pin"/></span><span>{{ t('brand') }}<small>Vue 3 + MapLibre + Leaflet</small></span><span class="version" dir="ltr">v{{ pkg.version }}</span></a>
      <nav :aria-label="t('docs')"><a :href="docs">{{ t('docs') }}</a><a href="https://github.com/sajadjanat/vue-neshan-maps" target="_blank" rel="noopener noreferrer">GitHub</a><div class="language-switch" aria-label="Language"><button :aria-pressed="language==='fa'" @click="language='fa'">فارسی</button><button :aria-pressed="language==='en'" @click="language='en'">EN</button></div></nav>
    </header>
    <section class="intro"><div><h1>{{ t('title') }}</h1><p>{{ t('intro') }}</p></div><button class="connect-button" @click="keyOpen=!keyOpen"><DemoIcon name="key"/>{{ t(activeKey?'connected':'connection') }}</button></section>
    <form v-if="keyOpen" class="connection-card" @submit.prevent="applyKey">
      <div class="connection-copy"><span class="connection-symbol"><DemoIcon name="key"/></span><div><h2>{{ language==='fa'?'نقشه را با کلید خودتان امتحان کنید':'Explore with your own web key' }}</h2><p>{{ language==='fa'?'کلید وب نشان را وارد کنید تا نقشه و ابزارهای زنده فعال شوند.':'Connect a Neshan web key to activate the map and live tools.' }}</p><a :href="`?view=docs&lang=${language}&doc=keys`">{{ language==='fa'?'راهنمای دریافت و تنظیم کلید':'How to create and configure a key' }}</a></div></div>
      <div class="connection-entry"><div class="key-field"><label for="web-key">{{ t('keyLabel') }}</label><input id="web-key" v-model="key" type="password" placeholder="web.…" required autocomplete="off" spellcheck="false" dir="ltr" aria-describedby="key-privacy key-domain"></div><div class="connection-actions"><button class="primary" type="submit">{{ t('showMap') }}<DemoIcon name="arrow"/></button><button v-if="activeKey" class="text-button" type="button" @click="disconnect">{{ t('clearKey') }}</button><a href="https://platform.neshan.org/panel" target="_blank" rel="noopener noreferrer">{{ t('getKey') }}</a></div></div>
      <div class="connection-foot"><p id="key-privacy">{{ t('keyHelp') }}</p><p id="key-domain" class="domain-hint">{{ t('domainHelp') }} <code>{{ hostname }}</code></p></div>
    </form>
    <main class="demo-workspace" :class="{'is-focused':focus}">
      <aside id="map-tools" class="control-panel" :aria-label="t('view')">
        <div class="tab-nav" role="tablist" :aria-label="t('view')"><button v-for="item in tabs" :id="`tab-${item}`" :key="item" role="tab" :aria-selected="tab===item" :aria-controls="`panel-${item}`" :tabindex="tab===item?0:-1" @click="tab=item" @keydown.right.prevent="moveTab(1)" @keydown.left.prevent="moveTab(-1)"><DemoIcon :name="tabIcons[item]"/><span>{{ t(item) }}</span></button></div>
        <section :id="`panel-${tab}`" class="control-content" role="tabpanel" :aria-labelledby="`tab-${tab}`">
          <h2>{{ t(tab) }}</h2><p class="panel-description">{{ t(tabHelp[tab]) }}</p>
          <template v-if="tab==='view'">
            <label class="field">{{ t('engine') }}<select v-model="engine"><option value="maplibre">{{ t('vector') }}</option><option value="leaflet">{{ t('raster') }}</option></select></label>
            <label class="field">{{ t('style') }}<select v-model="style"><option value="light">{{ t('light') }}</option><option value="dark">{{ t('dark') }}</option><template v-if="engine==='maplibre'"><option value="pastel">{{ t('pastel') }}</option><option value="monochrome_light">{{ t('monoLight') }}</option><option value="monochrome_dark">{{ t('monoDark') }}</option></template></select></label>
            <h3>{{ t('liveLayers') }}</h3><div class="toggle-row"><label>{{ t('traffic') }}<input v-model="traffic" type="checkbox" role="switch" :disabled="engine==='leaflet'"></label></div><div class="toggle-row"><label>{{ t('poi') }}<input v-model="poi" type="checkbox" role="switch" :disabled="engine==='leaflet'"></label></div>
            <p v-if="engine==='leaflet'" class="note">{{ t('leafletNote') }}</p>
            <h3>{{ t('interaction') }}</h3><div class="segmented"><button v-for="item in (['pan','pick','measure'] as const)" :key="item" :aria-pressed="mode===item" @click="mode=item">{{ t(item) }}</button></div><p v-if="mode==='pick'" class="note">{{ t('pickHelp') }}</p>
            <div v-if="mode==='measure'" class="measurement"><p>{{ t('measureHelp') }}</p><strong>{{ format(distance/1000,2) }} <small>{{ t('km') }}</small></strong><div class="button-row"><button :disabled="!measured.length" @click="measured=measured.slice(0,-1)">{{ t('undo') }}</button><button :disabled="!measured.length" @click="measured=[]">{{ t('clear') }}</button></div></div>
            <div class="toggle-row"><label>{{ t('markers') }}<input v-model="showMarkers" type="checkbox" role="switch"></label></div><p class="note">{{ t('dragHelp') }}</p>
            <div class="place-buttons"><button v-for="(place,i) in namedPlaces" :key="place.id" :disabled="!isReady" @click="focusPlace(i)"><DemoIcon name="pin"/>{{ place.tooltip }}<DemoIcon name="chevron"/></button></div>
            <label class="range-field">{{ t('zoom') }}<output>{{ format(zoom,1) }}</output><input v-model.number="zoom" :aria-label="t('zoom')" type="range" min="4" max="19" step=".1"></label>
            <button class="secondary full-width" :disabled="!isReady || locating" @click="locate"><DemoIcon name="target"/>{{ t(locating?'locating':'locate') }}</button><p class="note">{{ t('locationHelp') }}</p>
          </template>
          <template v-else-if="tab==='data'">
            <p v-if="engine==='leaflet'" class="note">{{ t('leafletNote') }}</p><fieldset :disabled="engine==='leaflet'">
              <div class="toggle-row"><label>{{ t('pointLayer') }}<input v-model="showPoints" type="checkbox" role="switch"></label></div><label class="field">{{ t('pointCount') }}<select v-model.number="count"><option :value="100">{{ format(100) }}</option><option :value="1000">{{ format(1000) }}</option><option :value="5000">{{ format(5000) }}</option><option :value="10000">{{ format(10000) }}</option></select></label>
              <div class="toggle-row"><label>{{ t('clustering') }}<input v-model="cluster" type="checkbox" role="switch"></label></div><p class="note">{{ t('clusterHelp') }}</p><label v-if="cluster" class="range-field">{{ t('clusterRadius') }}<output>{{ format(clusterRadius) }}</output><input v-model.number="clusterRadius" :aria-label="t('clusterRadius')" type="range" min="20" max="100" step="5"></label><label class="check-field"><input v-model="autoExpand" type="checkbox">{{ t('autoExpand') }}</label>
              <div class="toggle-row"><label>{{ t('heatmap') }}<input v-model="heatmap" type="checkbox" role="switch"></label></div><p class="note">{{ t('heatHelp') }}</p>
              <template v-if="heatmap"><label class="range-field">{{ t('heatRadius') }}<output>{{ format(heatRadius) }}</output><input v-model.number="heatRadius" :aria-label="t('heatRadius')" type="range" min="5" max="60"></label><label class="range-field">{{ t('intensity') }}<output>{{ format(intensity,1) }}</output><input v-model.number="intensity" :aria-label="t('intensity')" type="range" min=".1" max="3" step=".1"></label><label class="range-field">{{ t('opacity') }}<output>{{ format(heatOpacity,2) }}</output><input v-model.number="heatOpacity" :aria-label="t('opacity')" type="range" min=".1" max="1" step=".05"></label></template>
              <div class="button-row"><button class="primary" @click="updatePoints"><DemoIcon name="refresh"/>{{ t('update') }}</button><button @click="download">{{ t('export') }}</button></div>
              <div class="cluster-detail"><h3>{{ t('selectedCluster') }}</h3><p class="note">{{ t('clusterHint') }}</p><template v-if="selectedCluster"><strong>{{ format(selectedCluster.pointCount) }} {{ t('points') }}</strong><div class="button-row"><button @click="readLeaves">{{ t('leaves') }}</button><button @click="expand">{{ t('expand') }}</button></div><pre v-if="clusterLeaves.length" dir="ltr" data-testid="cluster-leaves">{{ JSON.stringify(clusterLeaves.map(p=>({id:p.id,coordinates:'coordinates'in p.geometry?p.geometry.coordinates:undefined})),null,2) }}</pre><p v-if="clusterError" role="alert">{{ clusterError }}</p></template></div>
            </fieldset>
          </template>
          <template v-else-if="tab==='layers'">
            <div class="toggle-row"><label>{{ t('line') }}<input v-model="showLine" type="checkbox" role="switch"></label></div><div class="toggle-row"><label>{{ t('circle') }}<input v-model="showCircle" type="checkbox" role="switch"></label></div><label v-if="showCircle" class="range-field">{{ t('radius') }}<output>{{ format(radius) }}</output><input v-model.number="radius" :aria-label="t('radius')" type="range" min="100" max="2500" step="100"></label><div class="toggle-row"><label>{{ t('polygon') }}<input v-model="showPolygon" type="checkbox" role="switch"></label></div>
            <p v-if="engine==='leaflet'" class="note">{{ t('leafletNote') }}</p><fieldset :disabled="engine==='leaflet'">
              <div class="toggle-row"><label>{{ t('extrusion') }}<input v-model="show3d" type="checkbox" role="switch"></label></div><p class="note">{{ t('extrusionHelp') }}</p><template v-if="show3d"><label class="range-field">{{ t('height') }}<output>{{ format(height) }}</output><input v-model.number="height" :aria-label="t('height')" type="range" min="100" max="1500" step="50"></label><label class="range-field">{{ t('opacity') }}<output>{{ format(layerOpacity,2) }}</output><input v-model.number="layerOpacity" :aria-label="t('opacity')" type="range" min=".1" max="1" step=".05"></label></template>
              <div class="toggle-row"><label>{{ t('geojson') }}<input v-model="showCustom" type="checkbox" role="switch"></label></div><details class="json-editor"><summary>{{ t('editor') }}</summary><p class="note">{{ t('editorHelp') }}</p><textarea v-model="jsonText" :aria-label="t('editor')" dir="ltr" spellcheck="false" maxlength="1000000" rows="12"/><div class="button-row"><button class="primary" @click="applyGeoJSON">{{ t('apply') }}</button><button @click="jsonText=JSON.stringify(customArea,null,2);applyGeoJSON()">{{ t('restore') }}</button></div><p v-if="jsonError" class="error-text" role="alert">{{ jsonError }}</p></details>
            </fieldset>
          </template>
          <template v-else>
            <h3>{{ t('code') }}</h3><div class="code-header"><div class="segmented"><button :aria-pressed="snippetMode==='vue'" @click="snippetMode='vue'">Vue 3</button><button :aria-pressed="snippetMode==='nuxt'" @click="snippetMode='nuxt'">Nuxt 4</button></div><button :aria-label="t('copy')" @click="copyCode"><DemoIcon :name="copied?'check':'copy'"/>{{ t(copied?'copied':'copy') }}</button></div><pre class="code-block" dir="ltr" tabindex="0"><code>{{ snippet }}</code></pre><p class="note">{{ t('codeHelp') }}</p><p v-if="copyError" role="status">{{ t('copyFailed') }}</p>
            <h3>{{ t('errors') }}</h3><p class="note">{{ t('simulationHelp') }}</p><div class="button-row"><select v-model.number="simulationCode" :aria-label="t('errors')"><option :value="480">480 · {{ t('invalidKey') }}</option><option :value="481">481 · {{ t('quota') }}</option><option :value="482">482 · {{ t('rateLimit') }}</option><option :value="483">483 · {{ t('keyType') }}</option><option :value="484">484 · {{ t('domain') }}</option><option :value="485">485 · {{ t('service') }}</option><option :value="500">500 · {{ t('server') }}</option></select><button @click="simulate">{{ t('simulate') }}</button></div>
            <div v-if="failure" class="failure-card" role="status"><small>{{ t(isSimulation?'simulation':'actual') }}</small><p>{{ t(failureKeys[failure.kind]) }}</p><dl><dt dir="ltr">kind</dt><dd dir="ltr">{{ failure.kind }}</dd><dt dir="ltr">HTTP / code</dt><dd dir="ltr">{{ failure.status??'—' }} / {{ failure.code??'—' }}</dd><dt>{{ t('retryable') }}</dt><dd>{{ t(failure.retryable?'yes':'no') }}</dd><template v-if="failure.retryAfter!==undefined"><dt dir="ltr">Retry-After</dt><dd>{{ format(failure.retryAfter) }} {{ t('seconds') }}</dd></template></dl><button v-if="!isSimulation && activeKey" @click="applyKey">{{ t('retry') }}</button></div>
          </template>
        </section>
        <div class="panel-bottom"><span class="status-dot" :class="{'is-ready':tiles.status==='loaded','is-error':tiles.status==='error'}"/><span>{{ status }}</span></div>
      </aside>
      <div class="map-column">
        <div class="map-toolbar"><div class="presets"><button v-for="item in [{id:'places',key:'showcase',icon:'pin'},{id:'clusters',key:'clustering',icon:'data'},{id:'density',key:'density',icon:'layers'},{id:'volume',key:'volume',icon:'layers'}]" :key="item.id" :aria-pressed="preset===item.id" @click="scenario(item.id)"><DemoIcon :name="item.icon"/>{{ t(item.key as MessageKey) }}</button></div><button class="icon-button" :aria-label="t(focus?'exitFull':'fullView')" @click="focus=!focus"><DemoIcon :name="focus?'close':'expand'"/></button></div>
        <div class="map-stage">
          <component :is="mapEngine" v-if="activeKey" :key="engine" ref="mapComponent" v-model="center" v-model:zoom="zoom" :api-key="activeKey" :map-style="MAPLIBRE_STYLES[style]" :options="engine==='leaflet'?{maptype:style==='dark'?'standard-night':'dreamy'}:undefined" :traffic="engine==='maplibre' && traffic" :poi="engine==='maplibre' && poi" :markers="markers" :polylines="lines" :circles="circles" :polygons="polygons" :geojson="engine==='maplibre' && showPoints?points:undefined" :cluster="clusterOptions" :heatmap="heatOptions" :sources="advancedSources" :layers="advancedLayers" :pick-on-click="mode==='pick'" :center-marker="mode==='pick'" :styles="{height:'100%',width:'100%'}" :aria-label="t('brand')" @ready="ready" @destroy="destroyed" @click="clicked" @marker-dragend="markerDragged" @cluster-click="clusterClicked" @layer-click="record('layerClicked',$event.layerId)" @resource-error="resourceError" @error="record('actual',$event.message.replaceAll(activeKey,'[redacted]'))" @tiles-loading="tiles=$event" @tiles-loaded="tiles=$event;inspect()" @tile-error="tiles=$event" @location-found="locating=false;record('located')" @location-error="locationError">
            <template #loading><div class="map-loading"><span class="loader"/>{{ t('loading') }}</div></template><template #error="{retry}"><div class="map-error"><DemoIcon name="info"/><p>{{ failure?t(failureKeys[failure.kind]):t('unknown') }}</p><button class="primary" @click="retry">{{ t('retry') }}</button><button @click="keyOpen=true">{{ t('connected') }}</button></div></template><template #tile-error><div class="tile-notice">{{ failure?t(failureKeys[failure.kind]):t('tilePartial') }}</div></template>
          </component>
          <div v-else class="map-empty"><div class="contour contour-one"/><div class="contour contour-two"/><div class="contour contour-three"/><span class="empty-pin"><DemoIcon name="pin"/></span><h2>{{ t('emptyTitle') }}</h2><p>{{ t('emptyHelp') }}</p><button class="primary" @click="focusKey">{{ t('connection') }}<DemoIcon name="arrow"/></button></div>
          <div v-if="isReady" class="map-floating"><span class="live-label"><span class="status-dot is-ready"/>{{ engine==='maplibre'?'MapLibre':'Leaflet' }}</span><button :aria-label="t('reset')" @click="reset"><DemoIcon name="refresh"/></button><button :aria-label="t('fit')" @click="mapComponent?.fitToMarkers()"><DemoIcon name="pin"/></button></div>
        </div>
        <div class="map-readout"><div><span>{{ t('coordinate') }}</span><strong dir="ltr" data-testid="coordinates">{{ center[0].toFixed(5) }}, {{ center[1].toFixed(5) }}</strong></div><div><span>{{ t('zoom') }}</span><strong>{{ format(zoom,1) }}</strong></div><button :disabled="!isReady || engine==='leaflet'" @click="inspect"><DemoIcon name="data"/>{{ t('inspect') }}</button></div>
        <section class="activity-panel"><div class="activity-header"><h2>{{ t('diagnostics') }}</h2><span>{{ t('rendered') }}</span></div><div class="metrics"><div><strong>{{ diagnostics?format(diagnostics.trafficFeatures):'—' }}</strong><span>{{ t('traffic') }}</span></div><div><strong>{{ diagnostics?format(diagnostics.poiFeatures):'—' }}</strong><span>{{ t('poi') }}</span></div><div><strong>{{ diagnostics?format(diagnostics.clusterFeatures):'—' }}</strong><span>{{ t('clustering') }}</span></div><div><strong>{{ diagnostics?format(diagnostics.sourceCount):'—' }}</strong><span>{{ t('sources') }}</span></div><div><strong>{{ diagnostics?format(diagnostics.layerCount):'—' }}</strong><span>{{ t('nativeLayers') }}</span></div></div>
          <div class="event-header"><h3>{{ t('events') }}</h3><button class="text-button" :disabled="!events.length" @click="events=[]">{{ t('clear') }}</button></div><p v-if="!events.length" class="note">{{ t('noEvents') }}</p><ol v-else class="event-log" aria-live="polite" aria-relevant="additions"><li v-for="event in events.slice(0,4)" :key="event.id"><time>{{ new Date(event.time).toLocaleTimeString(language==='fa'?'fa-IR':'en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) }}</time><span>{{ t(event.key) }}</span><code v-if="event.detail" dir="ltr">{{ event.detail }}</code></li></ol>
        </section>
      </div>
    </main>
    <footer class="site-footer"><p>{{ t('sampleNote') }}</p><a :href="docs" target="_blank" rel="noopener noreferrer">{{ t('docs') }}<DemoIcon name="arrow"/></a></footer>
  </div>
</template>
