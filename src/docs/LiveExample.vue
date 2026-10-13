<script setup lang="ts">
import { computed, ref, shallowRef, watch, onBeforeUnmount } from 'vue'
import { NeshanMapLibre, NeshanMapLeaflet, MAPLIBRE_STYLES, normalizeResourceError, type Coordinates, type MapLibreReady, type MapReady, type MapResourceFailure } from '../index'
import type { ExampleId, Language } from './catalog'
import { exampleCode, examplePoints, exampleArea, exampleLayers, exampleCircles, exampleLines, examplePolygons, makeMarkers, initialCenter, hasPoints } from './examples'
const props=defineProps<{id:ExampleId;language:Language;webKey:string}>()
const emit=defineEmits<{'update:webKey':[value:string]}>()
const text=(en:string,fa:string)=>props.language==='fa'?fa:en
const pane=ref<'preview'|'code'>('preview'),running=ref(false),dark=ref(false),traffic=ref(props.id==='styles'||props.id==='live'),poi=ref(traffic.value)
const cluster=ref(props.id==='clusters'),heatmap=ref(props.id==='heatmap'),radius=ref(50),intensity=ref(.7),shapes=ref(true)
const center=ref<Coordinates>([...initialCenter]),zoom=ref(12.2),markers=ref(makeMarkers(props.language))
const libreRef=shallowRef<InstanceType<typeof NeshanMapLibre>>(),leafletRef=shallowRef<InstanceType<typeof NeshanMapLeaflet>>()
const nativeLibre=shallowRef<MapLibreReady['map']>(),ready=ref(false),formError=ref(''),copied=ref(false)
const events=ref<string[]>([]),failure=shallowRef<MapResourceFailure>(),leaves=ref<number>(),selected=ref<{clusterId:number;coordinates:Coordinates;pointCount:number}>()
const simulated=ref(false),simulationCode=ref(481)
const code=computed(()=>exampleCode({id:props.id,language:props.language,dark:dark.value,traffic:traffic.value,poi:poi.value,cluster:cluster.value,heatmap:heatmap.value,radius:radius.value,intensity:intensity.value,shapes:shapes.value}))
const pointCluster=computed(()=>cluster.value?{radius:radius.value,maxZoom:14,expandOnClick:false}:false)
const pointHeatmap=computed(()=>heatmap.value?{weightProperty:'weight',intensity:intensity.value,radius:24,opacity:.6}:false)
const diagnostics=shallowRef<ReturnType<InstanceType<typeof NeshanMapLibre>['getDiagnostics']>>()
const visibleMarkers=computed(()=>['markers','methods','leaflet'].includes(props.id)?markers.value:[])
const isLeaflet=computed(()=>props.id==='leaflet')
function record(value:string){events.value=[value,...events.value].slice(0,4)}
function inspect(){diagnostics.value=libreRef.value?.getDiagnostics()}
function run(){const key=props.webKey.trim();if(!key.startsWith('web.')){formError.value=text('Enter a Neshan web key, starting with web.','کلید وب نشان با پیشوند web. را وارد کنید.');return}emit('update:webKey',key);formError.value='';failure.value=undefined;simulated.value=false;running.value=true}
function stop(){running.value=false;ready.value=false;nativeLibre.value=undefined;selected.value=undefined;leaves.value=undefined;events.value=[];diagnostics.value=undefined}
function switchPane(){pane.value=pane.value==='preview'?'code':'preview';queueMicrotask(()=>document.getElementById(`example-${pane.value}-tab`)?.focus())}
function onReady(context:MapLibreReady|MapReady){ready.value=true;if('maplibre'in context){nativeLibre.value=context.map;context.map.setPitch(props.id==='advanced'?48:0)}record(text('ready: map initialized','ready: نقشه ساخته شد'));inspect()}
function onResourceError(value:MapResourceFailure){failure.value=value;simulated.value=false;record(`resource-error: ${value.kind}`)}
function onError(){record(text('error: initialization or operation failed; check key and network','error: راه‌اندازی یا عملیات ناموفق؛ کلید و شبکه را بررسی کنید'))}
function markerDragged(marker:{id:string|number},position:Coordinates){markers.value=markers.value.map(item=>item.id===marker.id?{...item,position}:item);record(`marker-dragend: ${position.map(v=>v.toFixed(4)).join(', ')}`)}
function fly(){if(isLeaflet.value)leafletRef.value?.flyTo([35.7448,51.3753],15);else libreRef.value?.flyTo([35.7448,51.3753],15);record('flyTo: Milad Tower')}
function fit(){if(isLeaflet.value)leafletRef.value?.fitToMarkers();else libreRef.value?.fitToMarkers();record('fitToMarkers')}
function locate(){if(isLeaflet.value)leafletRef.value?.locate();else libreRef.value?.locate();record('locate: permission requested')}
async function readLeaves(){try{if(selected.value){leaves.value=(await libreRef.value?.getClusterLeaves(selected.value.clusterId,10))?.length;record(`getClusterLeaves: ${leaves.value}`)}}catch{record(text('Cluster changed; select it again.','خوشه تغییر کرده؛ دوباره انتخاب کنید.'))}}
async function expand(){try{if(selected.value)await libreRef.value?.expandCluster(selected.value.clusterId,selected.value.coordinates)}catch{record(text('Cluster changed; select it again.','خوشه تغییر کرده؛ دوباره انتخاب کنید.'))}}
function simulate(){failure.value=normalizeResourceError({status:simulationCode.value});simulated.value=true;record(`simulation: ${failure.value.kind}`)}
let copyTimer:ReturnType<typeof setTimeout>|undefined
async function copy(){try{await navigator.clipboard.writeText(code.value);copied.value=true;clearTimeout(copyTimer);copyTimer=setTimeout(()=>copied.value=false,2000)}catch{formError.value=text('Clipboard unavailable. Select the code and copy it manually.','کلیپ‌بورد در دسترس نیست؛ کد را انتخاب و دستی کپی کنید.')}}
watch([radius,cluster,dark],()=>{selected.value=undefined;leaves.value=undefined})
watch(()=>props.language,()=>{markers.value=makeMarkers(props.language)})
onBeforeUnmount(()=>clearTimeout(copyTimer))
</script>

<template>
  <section class="live-example" :aria-label="text('Interactive example','مثال تعاملی')">
    <div class="example-heading"><div><span class="example-live-dot"/>{{ text('Interactive example','مثال تعاملی') }}<small>{{ isLeaflet?'Leaflet':'MapLibre' }}</small></div><div class="example-tabs" role="tablist" :aria-label="text('Example view','نمای مثال')"><button id="example-preview-tab" role="tab" :tabindex="pane==='preview'?0:-1" @keydown.right.prevent="switchPane" @keydown.left.prevent="switchPane" :aria-selected="pane==='preview'" aria-controls="example-preview" @click="pane='preview'">{{ text('Preview','پیش‌نمایش') }}</button><button id="example-code-tab" role="tab" :tabindex="pane==='code'?0:-1" @keydown.right.prevent="switchPane" @keydown.left.prevent="switchPane" :aria-selected="pane==='code'" aria-controls="example-code" @click="pane='code'">{{ text('Vue code','کد Vue') }}</button></div></div>
    <div v-show="pane==='preview'" id="example-preview" role="tabpanel" aria-labelledby="example-preview-tab">
      <form v-if="!running" class="example-connect" @submit.prevent="run"><div><h3>{{ text('Run on a real Neshan map','اجرا روی نقشهٔ واقعی نشان') }}</h3><p>{{ text('Bring a domain-allowed web key. Sample geometry; real basemap.','کلید وب با مجوز دامنه وارد کنید. هندسه نمونه است؛ نقشهٔ پایه واقعی است.') }}</p></div><label for="docs-web-key">{{ text('Neshan web key','کلید وب نشان') }}<input id="docs-web-key" :value="webKey" @input="emit('update:webKey',($event.target as HTMLInputElement).value)" type="password" placeholder="web.…" required dir="ltr" autocomplete="off" spellcheck="false" aria-describedby="example-key-help"></label><button class="primary" type="submit">{{ text('Run example','اجرای مثال') }}</button><p id="example-key-help" class="example-privacy">{{ text('Allow sajadjanat.github.io. Your key stays in memory and is excluded from copied code.','دامنهٔ sajadjanat.github.io را مجاز کنید. کلید فقط در حافظه می‌ماند و وارد کد کپی‌شده نمی‌شود.') }}</p></form>
      <div v-if="running" class="example-controls"><label><input v-model="dark" type="checkbox">{{ text('Dark style','سبک تاریک') }}</label><template v-if="!isLeaflet"><label><input v-model="traffic" type="checkbox">{{ text('Traffic','ترافیک') }}</label><label><input v-model="poi" type="checkbox">{{ text('Places','مکان‌ها') }}</label></template><button @click="stop">{{ text('Stop / edit key','توقف / ویرایش کلید') }}</button></div>
      <div v-if="running && hasPoints(id)" class="example-controls"><label><input v-model="cluster" type="checkbox">{{ text('Cluster','خوشه‌بندی') }}</label><label><input v-model="heatmap" type="checkbox">{{ text('Heatmap','هیت‌مپ') }}</label><label v-if="cluster">{{ text('Cluster radius','شعاع خوشه') }}<input v-model.number="radius" type="range" min="30" max="100" step="5"><output>{{ radius }}</output></label><label v-if="heatmap">{{ text('Intensity','شدت') }}<input v-model.number="intensity" type="range" min=".1" max="2" step=".1"><output>{{ intensity }}</output></label></div>
      <div v-if="running && ['methods','markers','leaflet','shapes'].includes(id)" class="example-controls"><template v-if="id!=='shapes'"><button :disabled="!ready" @click="fly">{{ text('Fly to Milad','حرکت به برج میلاد') }}</button><button :disabled="!ready" @click="fit">{{ text('Fit markers','نمایش همهٔ مارکرها') }}</button><button v-if="id==='methods'" :disabled="!ready" @click="locate">{{ text('My location (permission)','موقعیت من (با اجازه)') }}</button></template><label v-else><input v-model="shapes" type="checkbox">{{ text('Show geometry','نمایش هندسه') }}</label></div>
      <div v-if="running" class="example-map">
        <NeshanMapLibre v-if="!isLeaflet" ref="libreRef" v-model="center" v-model:zoom="zoom" :api-key="webKey" :map-style="dark?MAPLIBRE_STYLES.dark:MAPLIBRE_STYLES.light" :traffic="traffic" :poi="poi" :markers="visibleMarkers" :geojson="hasPoints(id)?examplePoints:undefined" :cluster="pointCluster" :heatmap="pointHeatmap" :circles="id==='shapes'&&shapes?exampleCircles:[]" :polylines="id==='shapes'&&shapes?exampleLines:[]" :polygons="id==='shapes'&&shapes?examplePolygons:[]" :sources="id==='advanced'?{district:{type:'geojson',data:exampleArea}}:undefined" :layers="id==='advanced'?exampleLayers:[]" :pick-on-click="id==='model'" :center-marker="id==='model'" :styles="{height:'360px'}" :aria-label="text('Documentation live map','نقشهٔ زندهٔ مستندات')" @ready="onReady" @destroy="ready=false" @marker-dragend="markerDragged" @moveend="inspect" @tiles-loaded="inspect" @resource-error="onResourceError" @error="onError" @cluster-click="selected=$event" @layer-click="record(`layer-click: ${$event.layerId}`)" @location-found="record('location-found')" @location-error="record(`location-error: ${$event.code}`)">
          <template #loading>{{ text('Loading map…','در حال بارگیری نقشه…') }}</template>
          <template #error="{ retry }"><span>{{ text('Map could not initialize. Check the web key and network.','نقشه راه‌اندازی نشد. کلید وب و اتصال شبکه را بررسی کنید.') }}</span><button type="button" @click="retry">{{ text('Retry','تلاش دوباره') }}</button></template>
          <template #tile-error>{{ text('Some map resources could not load. Check the key, allowed domain, permissions and quota.','بعضی منابع نقشه بارگیری نشدند. کلید، دامنهٔ مجاز، دسترسی‌ها و سهمیه را بررسی کنید.') }}</template>
        </NeshanMapLibre>
        <NeshanMapLeaflet v-else ref="leafletRef" v-model="center" v-model:zoom="zoom" :api-key="webKey" :options="{maptype:dark?'standard-night':'dreamy'}" :markers="visibleMarkers" :center-marker="false" :styles="{height:'360px'}" :aria-label="text('Documentation Leaflet map','نقشهٔ Leaflet مستندات')" @ready="onReady" @destroy="ready=false" @marker-dragend="markerDragged" @error="onError">
          <template #loading>{{ text('Loading map…','در حال بارگیری نقشه…') }}</template>
          <template #error="{ retry }"><span>{{ text('Map could not initialize. Check the web key and network.','نقشه راه‌اندازی نشد. کلید وب و اتصال شبکه را بررسی کنید.') }}</span><button type="button" @click="retry">{{ text('Retry','تلاش دوباره') }}</button></template>
          <template #tile-error>{{ text('Some map resources could not load. Check the key, allowed domain, permissions and quota.','بعضی منابع نقشه بارگیری نشدند. کلید، دامنهٔ مجاز، دسترسی‌ها و سهمیه را بررسی کنید.') }}</template>
        </NeshanMapLeaflet>
      </div>
      <div v-if="running" class="example-readout" dir="ltr">{{ center.map(v=>v.toFixed(5)).join(', ') }} · zoom {{ zoom.toFixed(1) }}<span v-if="diagnostics"> · {{ text('traffic','ترافیک') }} {{ diagnostics.trafficFeatures }} · POI {{ diagnostics.poiFeatures }}</span></div>
      <div v-if="selected" class="example-controls"><span>{{ text('Selected cluster','خوشهٔ انتخاب‌شده') }}: {{ selected.pointCount }}</span><button @click="readLeaves">{{ text('Read 10 leaves','خواندن ۱۰ عضو') }}</button><button @click="expand">{{ text('Expand cluster','گسترش خوشه') }}</button><output v-if="leaves!==undefined">{{ leaves }} {{ text('leaves returned','عضو دریافت شد') }}</output></div>
      <div v-if="id==='errors'" class="example-simulation"><strong>{{ text('Simulate a response','شبیه‌سازی پاسخ') }}</strong><p>{{ text('This simulation sends no network request and consumes no quota.','این شبیه‌سازی درخواست شبکه نمی‌فرستد و سهمیه مصرف نمی‌کند.') }}</p><div class="example-controls"><label>{{ text('Response code','کد پاسخ') }}<select v-model.number="simulationCode"><option v-for="n in [480,481,482,483,484,485,500]" :key="n" :value="n">{{ n }}</option></select></label><button @click="simulate">{{ text('Simulate','شبیه‌سازی') }}</button></div></div>
      <p v-if="failure" role="status" class="example-failure"><strong>{{ simulated?text('Simulation','شبیه‌سازی'):text('Real resource error','خطای واقعی منبع') }}:</strong> <code>{{ failure.kind }}</code> · {{ text('Retryable','امکان تلاش دوباره') }}: {{ failure.retryable }}</p>
      <ol v-if="events.length" class="example-events" :aria-label="text('Recent example events','رویدادهای اخیر مثال')"><li v-for="(event,i) in events" :key="i"><code dir="ltr">{{ event }}</code></li></ol>
    </div>
    <div v-show="pane==='code'" id="example-code" class="example-source" role="tabpanel" aria-labelledby="example-code-tab"><div class="doc-code-bar"><span>Vue 3 · TypeScript</span><button @click="copy">{{ copied?text('Copied','کپی شد'):text('Copy complete example','کپی مثال کامل') }}</button></div><pre dir="ltr" tabindex="0"><code>{{ code }}</code></pre><p>{{ text('Set VITE_NESHAN_WEB_KEY in your ignored .env.local. This code reflects the controls above; your actual key is never included.','متغیر VITE_NESHAN_WEB_KEY را در .env.local خارج از Git تنظیم کنید. کد مطابق کنترل‌های همین مثال است و کلید واقعی در آن نیست.') }}</p></div>
    <p v-if="formError" class="example-failure" role="alert">{{ formError }}</p>
  </section>
</template>
