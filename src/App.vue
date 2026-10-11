<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue'
import type * as L from 'leaflet'
import { NeshanMapLeaflet, NeshanMapLibre, MAPLIBRE_STYLES, useNeshanMap, type MapLibreReady, type MapLibreClickEvent, type Coordinates, type MapMarker, type TileState, type MapReady } from './index'
const key=ref(import.meta.env.VITE_NESHAN_WEB_KEY ?? '')
const activeKey=ref(key.value)
const center=ref<Coordinates>([35.72,51.36]), zoom=ref(12)
const engine=ref<'leaflet'|'maplibre'>('maplibre'), traffic=ref(true), poi=ref(true)
const nativeLibre=shallowRef<MapLibreReady['map']>(), liveInfo=ref('')
const maptype=ref('dreamy'), mode=ref<'pan'|'pick'|'measure'>('pan')
const showMarkers=ref(true), showLine=ref(true), showCircle=ref(true), showPolygon=ref(false), showGeojson=ref(false)
const radius=ref(500), focused=ref(false), locating=ref(false)
const mapComponent=shallowRef<InstanceType<typeof NeshanMapLeaflet>|InstanceType<typeof NeshanMapLibre>>()
const {map:leafletMap,leaflet,onReady,onDestroy}=useNeshanMap()
const map=computed(()=>nativeLibre.value??leafletMap.value)
function destroyed(){onDestroy();nativeLibre.value=undefined;locating.value=false}
function checkLive(){if(mapComponent.value && 'getDiagnostics' in mapComponent.value){const report=mapComponent.value.getDiagnostics();liveInfo.value=report ? `ترافیک: ${report.trafficVisible ? 'روشن' : 'خاموش'}، ${report.trafficFeatures} عارضه · POI: ${report.poiVisible ? 'روشن' : 'خاموش'}، ${report.poiFeatures} مکان · ${report.markers} مارکر، ${report.overlays.length} لایهٔ سفارشی` : 'در انتظار نقشه'}}
const places=shallowRef<MapMarker[]>([
  {id:'azadi',position:[35.6997,51.338],popup:'میدان آزادی — برای جابه‌جایی مارکر را بکشید.',tooltip:'میدان آزادی',options:{draggable:true,title:'میدان آزادی',alt:'مارکر میدان آزادی'}},
  {id:'milad',position:[35.7448,51.3753],popup:'برج میلاد — موقعیت مارکر قابل تغییر است.',tooltip:'برج میلاد',options:{draggable:true,title:'برج میلاد',alt:'مارکر برج میلاد'}},
])
const measured=ref<Coordinates[]>([])
const markers=computed(()=>showMarkers.value ? places.value : [])
const lines=computed(()=>[
  ...(showLine.value ? [{id:'sample-line',positions:places.value.map(p=>p.position),options:{color:'#0d9488',weight:4}}] : []),
  ...(measured.value.length>1 ? [{id:'measurement',positions:measured.value,options:{color:'#d97706',weight:4,dashArray:'8 6'}}] : []),
])
const circles=computed(()=>showCircle.value ? [{id:'radius',center:places.value[0].position,radius:radius.value,options:{color:'#0d9488',fillOpacity:0.12}}] : [])
const polygons=computed(()=>showPolygon.value ? [{id:'district',positions:[[35.714,51.35],[35.728,51.35],[35.728,51.37],[35.714,51.37]] as Coordinates[],options:{color:'#7c3aed',fillOpacity:0.16}}] : [])
const sampleGeojson: GeoJSON.Feature={type:'Feature',properties:{name:'محدودهٔ نمونه'},geometry:{type:'Polygon',coordinates:[[[51.365,35.735],[51.38,35.735],[51.38,35.745],[51.365,35.745],[51.365,35.735]]]}}
const geojsonOptions:L.GeoJSONOptions={style:{color:'#dc4d77',fillOpacity:0.16}}
function meters(a:Coordinates,b:Coordinates){const rad=Math.PI/180,dlat=(b[0]-a[0])*rad,dlon=(b[1]-a[1])*rad,h=Math.sin(dlat/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dlon/2)**2;return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))}
const distance=computed(()=>measured.value.slice(1).reduce((sum,point,index)=>sum+meters(measured.value[index],point),0))
const tiles=ref<TileState>({status:'idle',loaded:0,failed:0})
const status=ref('کلید وب نشان را وارد کنید'), lastAction=ref('برای دیدن توضیح مکان، روی مارکر کلیک کنید.')
const tileText=computed(()=>tiles.value.status==='loaded' ? `کاشی‌ها بارگیری شدند (${tiles.value.loaded})` : tiles.value.status==='error' ? tiles.value.loaded>0 ? `نقشه نمایش داده شد؛ ${tiles.value.failed} کاشی بدون تصویر یا ناموفق` : 'دریافت تصویر نقشه ناموفق بود؛ کلید، دامنه و شبکه را بررسی کنید.' : tiles.value.status==='loading' ? 'در حال دریافت کاشی‌های نقشه…' : 'در انتظار نقشه')
function applyKey(){const next=key.value.trim();if(next===activeKey.value && next)void mapComponent.value?.retry();else activeKey.value=next;status.value=next ? 'در حال راه‌اندازی…' : 'کلید وب نشان را وارد کنید'}
function ready(context:MapReady|MapLibreReady){if('L'in context)onReady(context);else nativeLibre.value=context.map;status.value='موتور نقشه آماده است';mapComponent.value?.fitToMarkers()}
function markerDragged(marker:MapMarker,point:Coordinates){places.value=places.value.map(item=>item.id===marker.id ? {...item,position:point} : item);lastAction.value='موقعیت جدید مارکر ذخیره شد؛ خط و شعاع هم به‌روز شدند.'}
function clicked(event:L.LeafletMouseEvent|MapLibreClickEvent){const point:Coordinates='coordinates'in event ? event.coordinates : [event.latlng.lat,event.latlng.lng];if(mode.value==='measure'){measured.value=[...measured.value,point];lastAction.value='نقطهٔ اندازه‌گیری اضافه شد؛ نقطهٔ بعدی را روی نقشه انتخاب کنید.'}else if(mode.value==='pick')lastAction.value='مختصات مرکز روی نقطهٔ انتخاب‌شده قرار گرفت.'}
function locate(){if(!map.value)return;locating.value=true;lastAction.value='در انتظار موقعیت مرورگر…';mapComponent.value?.locate({setView:true,maxZoom:16,timeout:10000,enableHighAccuracy:true})}
function locationError(event:{code:number;message:string}){locating.value=false;lastAction.value=event.code===1 ? 'اجازهٔ دسترسی به موقعیت داده نشد. دسترسی مکان را در مرورگر فعال کنید.' : event.code===3 ? 'دریافت موقعیت زمان‌بر شد؛ دوباره تلاش کنید.' : 'مرورگر نتوانست موقعیت را پیدا کند.'}
function focusPlace(place:MapMarker){if(nativeLibre.value){nativeLibre.value.flyTo({center:[place.position[1],place.position[0]],zoom:16});if(mapComponent.value && 'openPopup' in mapComponent.value)mapComponent.value.openPopup(place.id);return}leafletMap.value?.setView(place.position,16);leafletMap.value?.eachLayer(layer=>{if(leaflet.value && layer instanceof leaflet.value.Marker && layer.getElement()?.dataset.markerId===String(place.id))layer.openPopup()})}
function reset(){measured.value=[];mode.value='pan';mapComponent.value?.fitToMarkers();lastAction.value='نمای نقشه روی مکان‌های نمونه تنظیم شد.'}
</script>
<template>
  <main>
    <header><span class="badge">VUE 3 · NESHAN MAPLIBRE + LEAFLET</span><h1>نقشه، به سبک شما.</h1><p>مکان انتخاب کنید، مارکرها را جابه‌جا کنید و فاصله را روی نقشه اندازه بگیرید.</p></header>
    <form @submit.prevent="applyKey"><label for="key">کلید وب نشان</label><div class="key-row"><input id="key" v-model="key" type="password" placeholder="web.…" autocomplete="off" dir="ltr" /><button>نمایش نقشه</button></div><small>کلید در حافظهٔ همین صفحه می‌ماند. کلید سرویس برای نمایش نقشه قابل استفاده نیست.</small></form>
    <section class="workspace" :class="{'workspace--focus':focused}">
      <aside>
        <div class="section-title"><h2>ابزارهای نقشه</h2><span class="live-dot" :class="{'live-dot--ready':tiles.status==='loaded','live-dot--partial':tiles.status==='error' && tiles.loaded>0}" /></div>
        <label>موتور نقشه<select v-model="engine" @change="liveInfo=''"><option value="maplibre">MapLibre — ترافیک و POI</option><option value="leaflet">Leaflet — سازگار با نسخهٔ قبلی</option></select></label>
        <label>سبک نقشه<select v-model="maptype" :disabled="!map"><option value="dreamy">روشن — Dreamy</option><option value="standard-night">تاریک — Standard Night</option></select></label>
        <label>حالت تعامل<select v-model="mode" :disabled="!map"><option value="pan">جابه‌جایی نقشه</option><option value="pick">انتخاب نقطه</option><option value="measure">اندازه‌گیری فاصله</option></select></label>
        <p v-if="mode==='measure'" class="measure-result">{{ measured.length }} نقطه · {{ (distance/1000).toFixed(2) }} کیلومتر<button type="button" class="subtle" @click="measured=measured.slice(0,-1)">حذف آخرین نقطه</button><button type="button" class="subtle" @click="measured=[]">پاک‌کردن اندازه‌گیری</button></p>
        <fieldset :disabled="!map"><legend>لایه‌های نمایشی</legend>
          <label><input v-model="showMarkers" type="checkbox" /> مارکرهای قابل جابه‌جایی</label>
          <label><input v-model="showLine" type="checkbox" /> خط بین مکان‌ها</label>
          <label><input v-model="showCircle" type="checkbox" /> محدودهٔ شعاعی</label>
          <label v-if="showCircle">شعاع محدوده: {{ radius }} متر<input v-model.number="radius" type="range" min="100" max="2000" step="100" aria-label="شعاع محدوده" /></label>
          <label><input v-model="showPolygon" type="checkbox" /> چندضلعی نمونه</label>
          <label><input v-model="showGeojson" type="checkbox" /> لایهٔ GeoJSON</label>
        </fieldset>
        <fieldset :disabled="!map || engine==='leaflet'"><legend>لایه‌های زندهٔ نشان</legend><label><input v-model="traffic" type="checkbox" /> ترافیک زنده</label><label><input v-model="poi" type="checkbox" /> مکان‌ها (POI)</label></fieldset><small v-if="engine==='leaflet'">ترافیک و POI به موتور MapLibre نیاز دارند.</small><template v-else><button type="button" class="subtle" :disabled="!map" @click="checkLive">بررسی لایه‌های زنده</button><p role="status" class="live-info">{{ liveInfo }}</p></template>
        <div class="actions"><button type="button" :disabled="!map || locating" @click="locate">{{ locating ? 'در حال مکان‌یابی…' : 'موقعیت من' }}</button><button type="button" :disabled="!map" @click="reset">نمایش همهٔ مکان‌ها</button><button type="button" class="subtle" :disabled="!map" @click="focused=!focused">{{ focused ? 'خروج از نمای بزرگ' : 'نمای بزرگ نقشه' }}</button></div>
        <div class="places"><button v-for="place in places" :key="place.id" type="button" class="subtle" :disabled="!map" @click="focusPlace(place)">{{ place.tooltip }}</button></div>
        <label>بزرگ‌نمایی: {{ Number(zoom.toFixed(2)) }}<input v-model.number="zoom" type="range" min="4" max="19" :disabled="!map" aria-label="بزرگ‌نمایی" /></label>
        <dl><dt>عرض جغرافیایی مرکز</dt><dd data-testid="latitude">{{ center[0].toFixed(6) }}</dd><dt>طول جغرافیایی مرکز</dt><dd data-testid="longitude">{{ center[1].toFixed(6) }}</dd></dl>
      </aside>
      <div class="map-panel">
        <component :is="engine==='maplibre' ? NeshanMapLibre : NeshanMapLeaflet" v-if="activeKey" :key="engine" ref="mapComponent" v-model="center" v-model:zoom="zoom" :api-key="activeKey" :options="engine==='leaflet' ? {maptype} : undefined" :map-style="maptype==='standard-night' ? MAPLIBRE_STYLES.dark : MAPLIBRE_STYLES.light" :traffic="traffic" :poi="poi" :markers="markers" :polylines="lines" :circles="circles" :polygons="polygons" :geojson="showGeojson ? sampleGeojson : undefined" :geojson-options="engine==='leaflet' ? geojsonOptions : undefined" :pick-on-click="mode==='pick'" :center-marker="mode==='pick'" :styles="{height:focused ? 'calc(100vh - 130px)' : '640px'}" aria-label="نقشهٔ تعاملی نشان" @ready="ready" @destroy="destroyed" @click="clicked" @error="status=$event.message" @warning="lastAction=$event" @marker-dragend="markerDragged" @tiles-loading="tiles=$event" @tiles-loaded="tiles=$event" @tile-error="tiles=$event" @location-found="locating=false;lastAction='موقعیت مرورگر روی نقشه نمایش داده شد.'" @location-error="locationError">
          <template #loading>در حال راه‌اندازی نقشه…</template>
          <template #error="{error,retry}"><div class="error-message"><p>{{ error.message }}</p><button @click="retry">تلاش دوباره</button></div></template>
          <template #tile-error>{{ tiles.loaded>0 ? 'نقشهٔ پایه نمایش داده شده؛ دریافت برخی کاشی‌های تکمیلی ناموفق است.' : 'دریافت نقشه ناموفق است؛ کلید وب، دامنهٔ مجاز و اتصال شبکه را بررسی کنید.' }}</template>
        </component>
        <div v-else class="empty"><span>◎</span><h2>آمادهٔ کشف</h2><p>کلید وب نشان را وارد کنید تا نقشه و ابزارها فعال شوند.</p></div>
        <div class="map-status" role="status"><span>{{ status }}</span><span>{{ tileText }}</span></div>
        <div class="action-status" role="status">{{ lastAction }}</div>
      </div>
    </section>
    <footer>خط بین مکان‌ها مسیر محاسبه‌شده نیست. اندازه‌گیری، فاصلهٔ جغرافیایی بین نقاط است. دریافت موقعیت به اجازهٔ مرورگر و HTTPS یا localhost نیاز دارد.</footer>
  </main>
</template>
<style>
*{box-sizing:border-box}body{margin:0;background:#f2f5f4;color:#172e2b;font-family:Tahoma,Arial,sans-serif}main{max-width:1440px;margin:auto;padding:36px 24px}header{margin-bottom:26px}.badge{font:12px monospace;letter-spacing:2px;color:#0f766e}h1{font-size:clamp(30px,5vw,52px);margin:14px 0}p{line-height:1.8;color:#56716b}form{padding:20px;background:white;border:1px solid #dbe5e1;border-radius:16px;margin-bottom:24px}label{display:block;font-size:13px}.key-row{display:flex;gap:12px;margin:12px 0}input[type=password],select{padding:11px;border:1px solid #bfd2ca;border-radius:8px;background:white;min-width:0}input[type=password]{flex:1}input[type=range]{width:100%;accent-color:#0f766e;margin:10px 0 0}small,footer{font-size:12px;line-height:1.9;color:#56716b}a{color:#0f766e}button{padding:10px 14px;border:0;border-radius:8px;background:#0f766e;color:white;cursor:pointer;font:inherit;font-size:13px}button:hover{background:#115e59}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}.workspace{display:grid;grid-template-columns:290px minmax(0,1fr);border:1px solid #dbe5e1;border-radius:18px;overflow:hidden;background:white}.workspace--focus{position:fixed;inset:12px;z-index:10000;box-shadow:0 0 0 20px #172e2b55}aside{padding:22px;max-height:740px;overflow:auto}aside label{margin:15px 0}.section-title{display:flex;align-items:center;justify-content:space-between}.live-dot{width:9px;height:9px;border-radius:50%;background:#c2cbc7}.live-dot--ready{background:#10b981}.live-dot--partial{background:#d97706}select{display:block;width:100%;margin-top:9px}.actions{display:grid;gap:8px;margin:20px 0 12px}.subtle{color:#0f766e;background:#eaf4ef}.subtle:hover{background:#d3e9df}.places{display:flex;gap:8px}.places button{flex:1}.unsupported{color:#87948e}fieldset{border:1px solid #dbe5e1;border-radius:10px;padding:0 12px 6px;margin:20px 0}legend{font-size:12px;color:#56716b;padding:0 6px}h2{font-size:18px}dl{border-top:1px solid #dbe5e1;padding-top:14px}dt{font-size:12px;color:#56716b}dd{margin:6px 0 12px;font:15px monospace;direction:ltr;text-align:right}.map-panel{min-width:0;display:flex;flex-direction:column}.empty{min-height:640px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,#d7eee5,#eef4f0)}.empty span{font-size:100px;color:#0f766e}.map-status{padding:12px 16px;display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;border-top:1px solid #dbe5e1;font-size:12px;line-height:1.8}.action-status{padding:4px 16px 14px;font-size:12px;line-height:1.8;color:#56716b}.measure-result{padding:12px;background:#fff5e4;border-radius:10px;font-size:13px}.measure-result button{display:block;margin-top:8px}.error-message{text-align:center}footer{margin-top:20px}@media(max-width:760px){main{padding:24px 14px}.workspace{grid-template-columns:1fr}.key-row{flex-direction:column}.empty{min-height:350px}aside{max-height:360px}.workspace--focus aside{max-height:180px}.workspace--focus{overflow:auto}}
</style>
