<script setup lang="ts">
import { ref, computed } from 'vue'
import { NeshanMapLeaflet, useNeshanMap, type Coordinates, type MapMarker } from './index'
const key = ref(import.meta.env.VITE_NESHAN_WEB_KEY ?? '')
const activeKey = ref(key.value)
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const maptype = ref('dreamy')
const traffic = ref(false)
const showMarkers = ref(true)
const pick = ref(false)
const { map, onReady, onDestroy } = useNeshanMap()
const places: MapMarker[] = [
  { id: 'azadi', position: [35.6997, 51.338], popup: 'میدان آزادی', tooltip: 'آزادی' },
  { id: 'milad', position: [35.7448, 51.3753], popup: 'برج میلاد', options: { draggable: true } },
]
const markers = computed(() => showMarkers.value ? places : [])
const status = ref('کلید وب نشان را وارد کنید')
function applyKey() {
  activeKey.value = key.value.trim()
  status.value = activeKey.value ? 'در حال اتصال…' : 'کلید وب نشان را وارد کنید'
}
</script>

<template>
  <main>
    <header><span class="badge">VUE 3 · TYPESCRIPT · LEAFLET</span><h1>نقشه، به سبک شما.</h1><p>محیط آزمایش نسخهٔ دوم پکیج نقشه نشان</p></header>
    <form @submit.prevent="applyKey"><label for="key">کلید وب نشان</label><div class="key-row"><input id="key" v-model="key" type="password" placeholder="web.…" autocomplete="off" dir="ltr" /><button>نمایش نقشه</button></div><small>کلید فقط در حافظهٔ همین صفحه نگهداری می‌شود؛ کلید سرویس برای نمایش نقشه قابل استفاده نیست.</small></form>
    <section class="workspace">
      <aside>
        <h2>کنترل نقشه</h2>
        <label>سبک نقشه<select v-model="maptype"><option>dreamy</option><option>standard-day</option><option>standard-night</option><option>neshan</option></select></label>
        <label><input v-model="traffic" type="checkbox" /> ترافیک</label>
        <label><input v-model="showMarkers" type="checkbox" /> مکان‌های نمونه</label>
        <label><input v-model="pick" type="checkbox" /> انتخاب موقعیت با کلیک</label>
        <button type="button" @click="map?.locate({ setView: true, maxZoom: 16 })">موقعیت من</button>
        <button type="button" @click="center = [35.6997, 51.338]; zoom = 13">بازگشت به تهران</button>
        <dl><dt>عرض جغرافیایی</dt><dd>{{ center[0].toFixed(6) }}</dd><dt>طول جغرافیایی</dt><dd>{{ center[1].toFixed(6) }}</dd><dt>بزرگ‌نمایی</dt><dd>{{ zoom }}</dd></dl>
        <p role="status">{{ status }}</p>
      </aside>
      <NeshanMapLeaflet v-if="activeKey" v-model="center" v-model:zoom="zoom" :api-key="activeKey" :options="{ maptype, traffic }" :markers="markers" :pick-on-click="pick" :polylines="[{id: 'route', positions: places.map(p => p.position), options: { color: '#0d9488', weight: 4 }}]" :circles="[{id: 'area', center: places[0].position, radius: 500, options: { color: '#0d9488' }}]" :styles="{ height: '600px' }" aria-label="نقشهٔ تعاملی نشان" @ready="context => { onReady(context); status = 'نقشه آماده است' }" @destroy="onDestroy" @error="status = $event.message" @location-error="status = $event.message" @marker-dragend="(_, point) => center = point">
        <template #loading>در حال بارگیری نقشه…</template>
        <template #error="{ error, retry }"><span>{{ error.message }}</span><button @click="retry">تلاش دوباره</button></template>
      </NeshanMapLeaflet>
      <div v-else class="empty"><span>◎</span><h2>آمادهٔ کشف</h2><p>برای دیدن نقشه، کلید وب نشان را وارد کنید.</p></div>
    </section>
    <footer>خط نمونه یک مسیر نمایشی مستقیم است؛ خروجی سرویس مسیریابی نیست. دریافت موقعیت به اجازهٔ مرورگر و HTTPS نیاز دارد.</footer>
  </main>
</template>

<style>
*{box-sizing:border-box}body{margin:0;background:#f2f5f4;color:#172e2b;font-family:Tahoma,Arial,sans-serif}main{max-width:1280px;margin:auto;padding:44px 24px}header{margin-bottom:30px}.badge{font:12px monospace;letter-spacing:2px;color:#0f766e}h1{font-size:clamp(30px,5vw,56px);margin:14px 0}p{line-height:1.8;color:#56716b}form{padding:22px;background:white;border:1px solid #dbe5e1;border-radius:16px;margin-bottom:24px}label{display:block;font-size:14px}.key-row{display:flex;gap:12px;margin:12px 0}input[type=password],select{padding:12px;border:1px solid #bfd2ca;border-radius:8px;background:white;min-width:0}input[type=password]{flex:1}small,footer{font-size:12px;line-height:1.9;color:#56716b}button{padding:11px 18px;border:0;border-radius:8px;background:#0f766e;color:white;cursor:pointer;font:inherit}button:hover{background:#115e59}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}.workspace{display:grid;grid-template-columns:250px 1fr;border:1px solid #dbe5e1;border-radius:18px;overflow:hidden;background:white}aside{padding:24px}aside label{margin:20px 0}select{display:block;width:100%;margin-top:10px}aside button{width:100%;margin:6px 0}h2{font-size:19px}dl{border-top:1px solid #dbe5e1;margin-top:24px;padding-top:14px}dt{font-size:12px;color:#56716b}dd{margin:6px 0 14px;font:16px monospace;direction:ltr;text-align:right}.empty{min-height:600px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,#d7eee5,#eef4f0)}.empty span{font-size:100px;color:#0f766e}footer{margin-top:20px}@media(max-width:760px){main{padding:24px 14px}.workspace{grid-template-columns:1fr}.key-row{flex-direction:column}.empty{min-height:350px}aside{display:flex;flex-wrap:wrap;gap:12px}aside>*{flex:1 1 140px}aside dl{display:none}}
</style>
