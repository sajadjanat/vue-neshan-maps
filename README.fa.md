<div align="center">

# Vue Neshan Maps

### ‏نقشه‌ای زنده برای برنامهٔ شما

‏نقشهٔ واکنش‌پذیر برای Vue 3 · دو موتور MapLibre و Leaflet · پشتیبانی TypeScript

[![npm](https://img.shields.io/npm/v/vue-neshan-maps?color=087f8c&label=npm)](https://www.npmjs.com/package/vue-neshan-maps)
[![CI](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/actions/workflows/quality.yml/badge.svg)](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/actions/workflows/quality.yml)
[![License](https://img.shields.io/badge/license-MIT-173449)](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE)

‏**فارسی** · [English](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/README.md)

‏**[دموی آنلاین فارسی](https://sajadjanat.github.io/vuejs-neshan-map-leaflet/?lang=fa)** · [English demo](https://sajadjanat.github.io/vuejs-neshan-map-leaflet/?lang=en)

‏[شروع سریع](#installation) · [آموزش امکانات](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.fa.md) · [مرجع API](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md) · [مثال‌های کامل](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md) · [راهنمای Nuxt 4](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/NUXT.fa.md)

</div>

‏نام جدید پکیج **`vue-neshan-maps`** است. [راهنمای مهاجرت و سازگاری نام قبلی](docs/MIGRATION.fa.md)؛ آدرس ریپو و دمو ثابت می‌ماند.

‏در [دموی آنلاین](https://sajadjanat.github.io/vuejs-neshan-map-leaflet/?lang=fa) خوشه‌بندی، هیت‌مپ، لایهٔ سه‌بعدی، ویرایش GeoJSON و ابزارهای انتخاب مکان را با نقشهٔ واقعی امتحان کنید. کلید وب خودتان را وارد کنید و دامنهٔ `sajadjanat.github.io` را در نشان مجاز کنید. کلید فقط در حافظهٔ صفحه می‌ماند. [راهنمای دمو](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/DEMO.fa.md).



![نقشهٔ واقعی تهران با ترافیک، مکان‌ها، مارکرها و محدودهٔ خدمات](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/maplibre-light-fa.jpg)

‏نقشه و لایه‌های ترافیک و مکان‌ها از نشان بارگیری شده‌اند. مارکرها، محدوده و خط‌چین، داده‌های نمونهٔ برنامه‌اند. این رابط یک نمونهٔ طراحی است؛ کامپوننت، نقشه را در رابط دلخواه شما قرار می‌دهد.

‏انتخاب موقعیت، نمایش شعب، ترسیم محدودهٔ ارسال و نمایش ترافیک را به برنامهٔ Vue اضافه کنید. این کتابخانه، دو موتور نشان را با وضعیت واکنش‌پذیر، لایه‌های تایپ‌شده و رویدادهای چرخهٔ عمر در اختیار شما می‌گذارد. پروژه مستقل از نشان و با مشارکت جامعه توسعه داده می‌شود.

## ‏امکانات در یک نگاه

| قابلیت | کاربرد |
| --- | --- |
| ‏مدل‌های Vue | ‏همگام‌سازی مرکز و زوم، انتخاب نقطه و ذخیرهٔ موقعیت مارکرهای قابل کشیدن |
| ‏لایه‌های زنده | ‏ترافیک و مکان‌ها در MapLibre، پنج سبک و کنترل نمایش واکنش‌پذیر |
| ‏داده‌های شما | ‏مارکر، پاپ‌آپ متنی، راهنما، خط، چندضلعی، دایرهٔ متری و GeoJSON |
| ‏تحلیل مکانی | ‏خوشه‌بندی خودکار نقاط، هیت‌مپ وزنی، منابع و لایه‌های اختصاصی و حجم سه‌بعدی |
| ‏کنترل برنامه | ‏حرکت به نقطه، نمایش همهٔ مارکرها، موقعیت مرورگر و دسترسی به موتور بومی |
| ‏چرخهٔ عمر | ‏بارگیری تنبل، وضعیت و خطا، تلاش دوباره، تغییر اندازه و پاک‌سازی خودکار |

## ‏از کجا شروع کنم؟

| هدف | راهنما |
| --- | --- |
| ‏نمایش اولین نقشه | ‏[شروع سریع](#installation) |
| ‏انتخاب آدرس، مارکر و محدودهٔ خدمات | ‏[آموزش امکانات](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.fa.md) |
| ‏استفاده از کامپوننت کامل | ‏[مثال‌های قابل اجرا](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md) |
| ‏بررسی تنظیمات و امضاها | ‏[مرجع API](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md) و جدول‌های همین صفحه |
| ‏اتصال Nuxt، موتور بومی و مهاجرت | ‏[راهنمای یکپارچه‌سازی](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/GUIDE.fa.md#integration) |
| ‏خوشه‌بندی، تراکم و لایه‌های پیشرفته | ‏[آموزش MapLibre پیشرفته](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/ADVANCED.fa.md) |

<a id="engines"></a>

## ‏انتخاب موتور

| ویژگی | `NeshanMapLibre` | `NeshanMapLeaflet` |
| --- | --- | --- |
| ‏رندر | ‏برداری با WebGL | ‏کاشی تصویری و DOM |
| ‏موتور و اتصال | `MapLibre 6.14.0` و آداپتر سازگارشدهٔ نشان | `Leaflet 1.9.4 / SDK 1.0.8` |
| ‏ترافیک و مکان‌ها | ‏با سبک سازگار پشتیبانی می‌شود | ‏نشان دیگر به‌روزرسانی نمی‌کند؛ گزینه‌ها با هشدار نادیده گرفته می‌شوند |
| ‏سبک | ‏روشن، تاریک، دو تک‌رنگ، پاستلی یا سبک سفارشی نسخهٔ ۸ | `dreamy`, `standard-night` |
| ‏مختصات کامپوننت | ‏عرض و سپس طول جغرافیایی | ‏عرض و سپس طول جغرافیایی |
| ‏کاربرد | ‏نقشهٔ برداری جدید و لایه‌های زنده | ‏برنامه و افزونهٔ موجود Leaflet |

<a id="installation"></a>

## نصب و شروع سریع

‏به `Vue 3.5.43+` نیاز دارید. ابزارهای توسعه با `Node 22.12+` در شاخهٔ ۲۲، یا نسخهٔ ۲۴ و بالاتر اجرا می‌شوند. برای موتور برداری، مرورگر باید از `WebGL` و `DecompressionStream` پشتیبانی کند.

‏بسته را از رجیستری npm نصب کنید:

```sh
npm install vue-neshan-maps@^2.3.0
```

‏از پنل نشان یک **کلید وب** با دامنه‌های مجاز بسازید. برای پروژهٔ `Vite` آن را در فایل نادیده‌گرفته‌شدهٔ `.env.local` قرار دهید:

```dotenv
VITE_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
```

‏کلید وب در مرورگر قابل مشاهده است؛ محدودیت دامنه را تنظیم کنید. کلید سرویس فقط باید روی سرور بماند و نباید در متغیر عمومی Vue قرار بگیرد. این پکیج سرویس جست‌وجو، تبدیل آدرس یا محاسبهٔ مسیر را فراخوانی نمی‌کند.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLibre, MAPLIBRE_STYLES, type Coordinates } from 'vue-neshan-maps'
import 'vue-neshan-maps/style.css'

const webKey = import.meta.env.VITE_NESHAN_WEB_KEY
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const traffic = ref(true)
const poi = ref(true)
</script>

<template>
  <NeshanMapLibre
    v-model="center" v-model:zoom="zoom" :api-key="webKey"
    :map-style="MAPLIBRE_STYLES.light" :traffic="traffic" :poi="poi"
    :pick-on-click="true" :styles="{ height: '500px' }"
  />
  <label><input v-model="traffic" type="checkbox">ترافیک</label>
  <label><input v-model="poi" type="checkbox">مکان‌ها</label>
  <p>{{ center[0] }}, {{ center[1] }}</p>
</template>
```

‏فایل CSS پکیج را یک بار وارد کنید. اندازهٔ پیش‌فرض نقشه عرض کامل و ارتفاع ۴۵۰ پیکسل است. گزینهٔ `centerMarker` یک نشانگر ثابت در مرکز تصویر است و با مارکرهای آرایهٔ `markers` تفاوت دارد.

### نمونهٔ Leaflet

‏در مثال بالا `NeshanMapLeaflet` را وارد کنید و این قالب را جایگزین کنید؛ متغیرهای مرکز، زوم و کلید همان هستند:

```vue
<NeshanMapLeaflet
  v-model="center" v-model:zoom="zoom" :api-key="webKey"
  :options="{ maptype: 'dreamy' }" :pick-on-click="true"
  :styles="{ height: '500px' }"
/>
```

‏موتور Leaflet را در [دموی آنلاین](https://sajadjanat.github.io/vuejs-neshan-map-leaflet/?lang=fa) امتحان کنید.

### ترتیب مختصات

| بخش | ترتیب | مثال |
| --- | --- | --- |
| مدل، موقعیت مارکر و شکل‌ها، متد `flyTo` کامپوننت | عرض، طول | `[35.6997, 51.338]` |
| GeoJSON، API بومی MapLibre و `fitBounds` آن | طول، عرض | `[51.338, 35.6997]` |
| متد `fitBounds` در Leaflet | عرض، طول | `[[35.69, 51.32], [35.73, 51.39]]` |

## ‏استفاده در Nuxt 4

‏ماژول، هر دو کامپوننت، composableها و CSS را خودکار ثبت می‌کند:

```ts
export default defineNuxtConfig({
  modules: ['vue-neshan-maps/nuxt'],
  runtimeConfig: { public: { neshanWebKey: '' } },
})
```

‏متغیر `NUXT_PUBLIC_NESHAN_WEB_KEY` را تنظیم و کلید را با `useRuntimeConfig()` بخوانید. [آموزش کامل ماژول، پلاگین دستی، SSR و تنظیمات محصول](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/NUXT.fa.md).

<a id="overlays"></a>

## مارکر و لایه‌های نقشه

‏برای هر مارکر شناسهٔ یکتا و پایدار تعیین کنید. پس از کشیدن مارکر، مختصات جدید را در آرایهٔ خودتان ذخیره کنید؛ در غیر این صورت وضعیت برنامه همچنان مختصات قبلی را نگه می‌دارد.

```ts
import { ref } from 'vue'
import type { Coordinates, MapLibreMarker, MapCircle, MapPolygon, MapPolyline } from 'vue-neshan-maps'

const markers = ref<MapLibreMarker[]>([
  { id: 'azadi', position: [35.6997, 51.338], popup: 'میدان آزادی',
    tooltip: 'برای تغییر موقعیت بکشید', options: { draggable: true } },
])
function saveMarker(marker: MapLibreMarker, position: Coordinates) {
  markers.value = markers.value.map(item => item.id === marker.id ? { ...item, position } : item)
}
const circles: MapCircle[] = [
  { id: 'area', center: [35.6997, 51.338], radius: 500, options: { color: '#0f766e', fillOpacity: 0.15 } },
]
const polylines: MapPolyline[] = [
  { id: 'connection', positions: [[35.6997, 51.338], [35.7448, 51.3753]], options: { weight: 4 } },
]
const polygons: MapPolygon[] = [
  { id: 'zone', positions: [[35.70, 51.34], [35.72, 51.34], [35.72, 51.37]], options: { color: '#7c3aed' } },
]
```

‏آرایه‌ها را با `:markers`، `:circles`، `:polylines` و `:polygons` به نقشه بدهید و رویداد `@marker-dragend="saveMarker"` را متصل کنید. برای Leaflet از نوع `MapMarker` استفاده کنید. پاپ‌آپ و راهنمای مارکر متن ساده هستند؛ HTML داخل رشته اجرا نمی‌شود.

‏شعاع دایره بر حسب متر است. خط فقط نقاط داده‌شده را وصل می‌کند و مسیریابی خیابانی انجام نمی‌دهد. اندازه‌گیری فاصله و تغییر موتور از ابزارهای نمونهٔ پروژه هستند و ورودی مستقلی در کامپوننت ندارند.

<a id="props"></a>

## مرجع ورودی‌ها

| ورودی مشترک | نوع / رفتار |
| --- | --- |
| `apiKey` | کلید وب؛ در MapLibre الزامی، در Leaflet جایگزین `options.key` |
| `modelValue` | نوع `Coordinates`؛ کنترل مرکز با `v-model`، پیش‌فرض تهران |
| `zoom` | عدد؛ مدل `v-model:zoom`، پیش‌فرض ۱۳ |
| `options` | تنظیمات بومی موتور؛ بیشتر گزینه‌ها فقط هنگام ساخت نقشه خوانده می‌شوند |
| `styles` | اندازه و ظاهر ظرف نقشه؛ عرض کامل و ارتفاع ۴۵۰ پیکسل |
| `centerMarker` | نشانگر ثابت مرکز؛ پیش‌فرض `true` |
| `pickOnClick` | انتقال مرکز به نقطهٔ کلیک؛ پیش‌فرض `false` |
| `markers` | آرایهٔ `MapLibreMarker[]` یا `MapMarker[]`؛ پیش‌فرض خالی |
| `polylines` | آرایهٔ `MapPolyline[]`؛ پیش‌فرض خالی |
| `polygons` | آرایهٔ `MapPolygon[]`؛ یک حلقه یا چند حلقه، پیش‌فرض خالی |
| `circles` | آرایهٔ `MapCircle[]`؛ شعاع متر، پیش‌فرض خالی |
| `geojson` | هندسه یا مجموعهٔ عوارض با ترتیب طول، عرض |
| `geojsonOptions` | تنظیمات منبع GeoJSON در MapLibre یا تنظیمات لایه در Leaflet |
| `fitMarkers` | تنظیم نما روی مارکرها هنگام به‌روزرسانی؛ پیش‌فرض `false`، سقف زوم ۱۶ |
| `ariaLabel` | نام دسترس‌پذیر ظرف نقشه |

| ورودی اختصاصی | رفتار |
| --- | --- |
| MapLibre: `mapStyle` | نشانی یا شیء سبک نسخهٔ ۸؛ پیش‌فرض `MAPLIBRE_STYLES.light` |
| MapLibre: `traffic`, `poi` | پیش‌فرض `false`؛ کنترل لایه‌های منابع `traffic` و `points_source` |
| MapLibre: `geojsonLayers` | آرایهٔ تعریف لایهٔ بومی بدون `source`؛ پیش‌فرض شامل استایل نقطه، خط و چندضلعی |
| Leaflet: `sdk` | تنظیمات `scriptUrl`، `styleUrl`، `timeout` پیش‌فرض ۱۵۰۰۰ میلی‌ثانیه، `nonce` |
| Leaflet: `options.maptype` | پیش‌فرض `dreamy`؛ تغییر زنده با `setMapType` |

‏در MapLibre برای خط `color`، `weight`، `opacity` و `dashArray` پشتیبانی می‌شود. برای چندضلعی و دایره `color`، `weight`، `fill`، `fillColor` و `fillOpacity` پشتیبانی می‌شود؛ سایر گزینه‌های اختصاصی Leaflet به موتور برداری منتقل نمی‌شوند. برای کنترل بیشتر از لایه‌های بومی GeoJSON استفاده کنید.

‏سبک‌های آماده: `light`، `dark`، `monochrome_light`، `monochrome_dark` و `pastel` در `MAPLIBRE_STYLES`. تغییر سبک، مارکر و پاپ‌آپ باز را نگه می‌دارد و پس از `style.load` لایه‌های سفارشی و وضعیت ترافیک و مکان‌ها را برمی‌گرداند.

<a id="events"></a>

## رویدادها، متدها و اسلات‌ها

| رویداد | داده |
| --- | --- |
| `ready` | در MapLibre: `{ map, maplibre }`؛ در Leaflet: `{ map, L }` |
| `destroy` | بدون داده؛ برای پاک کردن ارجاع‌های برنامه |
| `update:modelValue`, `update:zoom` | مختصات عرض/طول و مقدار زوم جدید |
| `latitude`, `longitude` | مختصات جداگانه برای سازگاری نسخهٔ قبل |
| `click` | رویداد بومی؛ در MapLibre همراه `coordinates: [lat, lng]` |
| `moveend`, `zoomend` | رویداد بومی موتور |
| `marker-click` | دو آرگومان: مارکر و رویداد کلیک |
| `marker-dragend` | دو آرگومان: مارکر و مختصات جدید |
| `error`, `warning` | خطای `Error` یا پیام هشدار متنی |
| `tiles-loading`, `tiles-loaded`, `tile-error` | وضعیت `{ status, loaded, failed }` |
| `location-found` | در MapLibre: `{ latlng: { lat, lng }, accuracy }`؛ در Leaflet رویداد بومی مکان |
| `location-error` | در MapLibre: `{ code, message }`؛ در Leaflet رویداد بومی خطا |
| `live-layers` | فقط MapLibre: وضعیت روشن/خاموش و شناسهٔ لایه‌های منطبق |

‏رویداد `ready` فقط آماده‌شدن موتور است، نه تایید کلید یا تحویل همهٔ کاشی‌ها. در MapLibre شمارنده‌ها رویداد آمادگی منابع را می‌شمارند؛ در Leaflet نتیجهٔ بارگیری کاشی تصویری را. این دو عدد قابل مقایسه نیستند.

| متد ref کامپوننت | رفتار |
| --- | --- |
| `retry()` | تلاش دوبارهٔ راه‌اندازی |
| `fitToMarkers()` | تنظیم نما روی مارکرها |
| `invalidateSize()` | محاسبهٔ مجدد اندازه |
| `flyTo(center, zoom?, options?)` | انتقال نرم؛ مرکز عرض، طول |
| `fitBounds(bounds, options?)` | محدوده با ترتیب مختصات بومی همان موتور |
| `locate(options?)` | درخواست موقعیت مرورگر؛ نیازمند اجازه و HTTPS یا localhost |
| `openPopup(id)` | فقط MapLibre: بازکردن پاپ‌آپ مارکر |
| `getDiagnostics()` | فقط MapLibre: تعداد عوارض رندرشدهٔ ترافیک/مکان، مارکرها، نوع لایه‌ها و وضعیت سبک |

‏در setup از `useNeshanMapLibre()` یا `useNeshanMap()` استفاده کنید و هر دو رویداد `@ready="onReady"` و `@destroy="onDestroy"` را متصل کنید. ارجاع‌ها shallow هستند و مالک حذف نقشه خود کامپوننت است. برای دسترسی مستقیم بومی، از `map.value` استفاده کنید.

‏اسلات‌ها: `loading`، `error` با `{ error, retry }`، `tile-error` با `{ state }`، `center-marker` و اسلات پیش‌فرض با نقشه، namespace موتور و `tileState`. برای کنترل‌های تعاملی روی نقشه، جای‌گذاری CSS کنترل را خودتان تعیین کنید. [مثال کامل اسلات و متدها](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md).

‏پلاگین پیش‌فرض هر دو کامپوننت را سراسری ثبت می‌کند؛ واردکردن محلی برای setup هم پشتیبانی می‌شود:

```ts
import NeshanMapPlugin from 'vue-neshan-maps'
app.use(NeshanMapPlugin)
```

<a id="migration"></a>

## مهاجرت و اجرای سمت سرور

- ‏در مهاجرت از نسخهٔ ۱، Vue وابستگی همتا است؛ فایل CSS را وارد کنید و به جای UMD از ESM یا CommonJS استفاده کنید. نام قدیمی `dist/style.css` همچنان alias است.
- ‏ورودی‌های Leaflet شامل `options.key` و `options.center` و رویدادهای مختصات قبلی حفظ شده‌اند؛ برای کد جدید از کلید صریح و مدل‌ها استفاده کنید.
- ‏واردکردن پکیج در SSR امن است؛ موتور در `onMounted` بارگیری می‌شود. در Nuxt فایل CSS را سراسری قرار دهید؛ استفاده از `<ClientOnly>` اختیاری است.
- ‏برای تغییر گزینه‌های فقط‌سازنده، با `:key` کامپوننت را دوباره بسازید. تغییر کلید وب نقشه را بازسازی می‌کند؛ ارجاع بومی را در هر `ready` تازه کنید.
- ‏تمام نقشه‌های هم‌زمان MapLibre در یک صفحه باید کلید وب یکسان داشته باشند. SDK نشان کلید را سراسری نگه می‌دارد. Leaflet نیز namespace سراسری دارد و ترکیب چند نسخه پشتیبانی نمی‌شود.
- ‏برای CSP، منابع سبک، کاشی، فونت و worker موتور را مجاز کنید. گزینهٔ `sdk.nonce` فقط برای بارگیری Leaflet است؛ به MapLibre تعلق ندارد.

<a id="troubleshooting"></a>

## عیب‌یابی و محدودیت‌ها

| مشکل | بررسی |
| --- | --- |
| نقشه خالی است | کلید وب، دامنه، سهمیه، شبکه، واردکردن CSS و ارتفاع ظرف؛ قابلیت‌های WebGL/DecompressionStream در موتور برداری |
| ترافیک یا مکان نیست | موتور MapLibre، منابع سازگار در سبک، رویدادهای `warning` و `live-layers` |
| مارکر پس از کشیدن برمی‌گردد | ذخیرهٔ مختصات رویداد در آرایهٔ برنامه |
| نقطه جای اشتباه است | ترتیب عرض/طول در props و طول/عرض در GeoJSON و API بومی MapLibre |
| موقعیت مرورگر دریافت نمی‌شود | اجازهٔ مرورگر، HTTPS/localhost و در دسترس بودن دستگاه |
| بخشی از کاشی‌های Leaflet خطا دارد | برخی کاشی‌های تکمیلی برچسب نشان پاسخ ۲۰۴ بدون تصویر می‌دهند؛ وضعیت پایه و لایهٔ تکمیلی را جدا بررسی کنید |

‏در زمان روشن‌بودن ترافیک، کاشی‌های آن هر ۶۰ ثانیه دوباره درخواست می‌شوند. کش و تازگی داده را نشان تعیین می‌کند. شمارش عوارض `getDiagnostics()` مربوط به نمای فعلی و زوم فعلی است، نه کل داده‌ها. لوگو و حقوق انتساب نشان و OpenStreetMap را حفظ کنید.

‏**موتور وصله‌شده:** در `2.2.0` موتور آسیب‌پذیر با `MapLibre GL JS 6.14.0` جایگزین شده است. اتصال کاشی، راست‌به‌چپ و انتساب نشان از فورک محدود به آداپتر SDK رسمی حفظ شده‌اند؛ این اتصال سازگارشده را جامعه نگه‌داری می‌کند. پاک‌سازی انتساب و پاپ‌آپ متنی حفظ شده است. [امنیت، CSP و سازگاری](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/ADVANCED.fa.md#امنیت-و-سازگاری-موتور) را بخوانید. بررسی وابستگی‌ها در این انتشار صفر آسیب‌پذیری شناخته‌شده گزارش می‌کند؛ این نتیجه تضمین امنیت همهٔ برنامه نیست.

## ‏نمای تاریک

![نقشهٔ تاریک نشان با ترافیک و لایه‌های نمونه](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/maplibre-dark-fa.jpg)

‏این تصویر نیز از نقشهٔ واقعی گرفته شده است. تغییر سبک، وضعیت مارکرها و لایه‌های سفارشی را حفظ می‌کند. تراکم مکان‌ها به زوم، سبک و داده‌های نشان بستگی دارد.


<details>
<summary>‏تصاویر دموی فارسی: خوشه‌بندی، هیت‌مپ و سه‌بعدی</summary>

![خوشه‌بندی نقاط و کنترل‌های فارسی](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/advanced-clusters-fa.jpg)

![هیت‌مپ وزن‌دار و تنظیمات فارسی](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/advanced-heatmap-fa.jpg)

![لایهٔ سه‌بعدی و تنظیم ارتفاع و شفافیت به فارسی](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/advanced-3d-fa.jpg)

</details>

## توسعه و تست

```sh
git clone https://github.com/sajadjanat/vuejs-neshan-map-leaflet.git vue-neshan-maps
cd vue-neshan-maps
npm ci
npm run dev
```

‏کلید را در فرم نمونه وارد کنید یا `.env.example` را به `.env.local` کپی کنید. فرم کلید را ذخیره نمی‌کند. فایل‌های محیط دارای کلید را کامیت نکنید.

```sh
npm run typecheck
npm test
npm run test:sdk
npm run build
npm run build:demo
npm run test:package
```

‏۵۵ تست واحد/قرارداد و ۱۰ تست با SDK واقعی Leaflet، ساخت و نصب مستقل بسته با TypeScript سخت‌گیرانه بررسی شده‌اند. شبکهٔ تصویر و سهمیه در تست خودکار شبیه‌سازی می‌شود. ترافیک، مکان‌ها و ابزارها با نقشهٔ واقعی مرورگر بررسی شدند؛ GPS واقعی دستگاه درخواست نشده و callbackهای آن شبیه‌سازی شده‌اند. CI روی Node ۲۲ و ۲۴ اجرا می‌شود.

‏برای گزارش اشکال، نسخهٔ پکیج، موتور و مرورگر، مثال کوچک بازتولید و خطای بدون اطلاعات حساس ارسال کنید. کلید سرویس و توکن حساب را در issue قرار ندهید.

## منابع رسمی و مجوز

‏[مستندات MapLibre نشان](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/) · [مستندات Leaflet نشان](https://platform.neshan.org/docs/sdk/web/leaflet/neshan-leaflet-sdk/) · [Vue](https://vuejs.org/guide/introduction.html)

‏مجوز MIT؛ توسعه توسط Sajad Abasi. [متن مجوز](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE).

## ‏فونت وزیر

‏فونت وزیر نسخهٔ ۳۰٫۱٫۰ با وزن‌های معمولی و ضخیم همراه بسته است؛ فایل‌ها از پروژهٔ شما سرو می‌شوند و به CDN نیاز ندارند. مجوز و نام پدیدآورندگان در پوشهٔ `fonts` حفظ شده است.

```ts
import 'vue-neshan-maps/fonts/vazir.css'
```

```html
<div class="neshan-font-vazir" lang="fa" dir="rtl">
  <!-- Your map, popups and Persian controls -->
</div>
```

‏این کلاس فونت رابط و پاپ‌آپ‌های HTML را تنظیم می‌کند. نوشته‌های نقشهٔ برداری از گلیف‌های سبک نشان می‌آیند و نوشته‌های نقشهٔ تصویری داخل کاشی‌ها هستند؛ این فونت آن‌ها را تغییر نمی‌دهد. خود متن Markdown گیت‌هاب هم از فونت سایت گیت‌هاب استفاده می‌کند؛ تصاویر فارسی با وزیر ثبت شده‌اند.

## ‏خوشه‌بندی، هیت‌مپ و لایه‌های پیشرفته

‏نسخهٔ `2.2` خوشه‌بندی خودکار نقاط، هیت‌مپ وزنی، منابع و لایه‌های بومی شامل حجم سه‌بعدی، خطای دقیق کلید و سهمیه و به‌روزرسانی هندسه بدون بازسازی بی‌دلیل را اضافه می‌کند. [آموزش کامل همراه مثال](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/ADVANCED.fa.md) · [English](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/ADVANCED.md).

‏[وضعیت امنیت وابستگی‌ها و وصلهٔ نمونهٔ Nuxt](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/DEPENDENCY-SECURITY.fa.md)
