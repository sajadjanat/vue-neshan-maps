# نقشه نشان برای Vue 3

‏**کامپوننت‌های واکنشی و تایپ‌شدهٔ نشان با دو موتور `MapLibre` و `Leaflet`.**

‏**فارسی** · [English](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/README.md)

‏برای انتخاب موقعیت، نمایش مکان‌ها، جابه‌جایی مارکر، نمایش محدودهٔ خدمات و نقشه‌های تعاملی. موتور `MapLibre` ترافیک و مکان‌های نشان را نمایش می‌دهد؛ موتور `Leaflet` برای پروژه‌های موجود و افزونه‌های آن حفظ شده است. این پکیج یک پروژهٔ جامعهٔ توسعه‌دهندگان است و محصول رسمی نشان نیست.

![نقشه واقعی نشان همراه ترافیک، مکان‌ها و لایه‌های سفارشی](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/maplibre.png)

‏این تصویر از نمونهٔ واقعی پروژه گرفته شده است. خطوط رنگی جاده‌ها ترافیک و برچسب مکان‌ها `POI` هستند. کلید وب در تصویر پوشانده شده و داخل ریپو قرار ندارد.

## فهرست راهنما

- ‏[نصب و شروع سریع](#installation)
- ‏[انتخاب موتور](#engines)
- ‏[مارکر و لایه‌های نقشه](#overlays)
- ‏[مرجع ورودی‌ها](#props)
- ‏[رویدادها، متدها و اسلات‌ها](#events)
- ‏[مهاجرت و اجرای سمت سرور](#migration)
- ‏[عیب‌یابی و محدودیت‌ها](#troubleshooting)
- ‏[مرجع تفصیلی انگلیسی](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/API.md) · [مثال‌های کامل](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/EXAMPLES.md)
- ‏[تاریخچه تغییرات](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/CHANGELOG.md) · [نسخه‌ها](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/releases) · [گزارش اشکال](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/issues)

<a id="engines"></a>

## انتخاب موتور

| قابلیت | `NeshanMapLibre` | `NeshanMapLeaflet` |
| --- | --- | --- |
| موتور نمایش | برداری با WebGL | کاشی تصویری با DOM |
| نسخهٔ رسمی | SDK نشان 5.24.4 | Leaflet 1.9.4 / SDK نشان 1.0.8 |
| ترافیک و مکان‌ها | فعال با سبک‌های سازگار نشان | طبق مستندات نشان به‌روز نمی‌شوند؛ گزینه‌ها با هشدار نادیده گرفته می‌شوند |
| سبک | روشن، تیره، تک‌رنگ روشن/تیره، پاستلی و سبک سفارشی نسخهٔ ۸ | `dreamy` و `standard-night` و نشانی کاشی سازگار |
| ترتیب مختصات کامپوننت | عرض، طول جغرافیایی | عرض، طول جغرافیایی |
| کاربرد | نقشه‌های جدید و لایه‌های زنده | پروژه‌ها و افزونه‌های موجود Leaflet |

<a id="installation"></a>

## نصب و شروع سریع

‏به `Vue 3.5.43+` نیاز دارید. ابزارهای توسعه با `Node 22.12+` در شاخهٔ ۲۲، یا نسخهٔ ۲۴ و بالاتر اجرا می‌شوند. برای موتور برداری، مرورگر باید از `WebGL` و `DecompressionStream` پشتیبانی کند.

‏تا زمان انتشار در رجیستری، بستهٔ تست‌شدهٔ گیت‌هاب را نصب کنید:

```sh
npm install https://github.com/sajadjanat/vuejs-neshan-map-leaflet/releases/download/v2.0.1/vuejs-neshan-map-leaflet-2.0.1.tgz
```

‏پس از انتشار در رجیستری، دستور نصب معادل چنین است:

```sh
npm install vuejs-neshan-map-leaflet@^2.0.1
```

‏از پنل نشان یک **کلید وب** با دامنه‌های مجاز بسازید. برای پروژهٔ `Vite` آن را در فایل نادیده‌گرفته‌شدهٔ `.env.local` قرار دهید:

```dotenv
VITE_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
```

‏کلید وب در مرورگر قابل مشاهده است؛ محدودیت دامنه را تنظیم کنید. کلید سرویس فقط باید روی سرور بماند و نباید در متغیر عمومی Vue قرار بگیرد. این پکیج سرویس جست‌وجو، تبدیل آدرس یا محاسبهٔ مسیر را فراخوانی نمی‌کند.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NeshanMapLibre, MAPLIBRE_STYLES, type Coordinates } from 'vuejs-neshan-map-leaflet'
import 'vuejs-neshan-map-leaflet/style.css'

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

![نقشه واقعی Leaflet همراه مارکرها و ابزار اندازه‌گیری نمونه](https://raw.githubusercontent.com/sajadjanat/vuejs-neshan-map-leaflet/master/docs/images/leaflet.png)

### ترتیب مختصات

| بخش | ترتیب | مثال |
| --- | --- | --- |
| مدل، موقعیت مارکر و شکل‌ها، متد `flyTo` کامپوننت | عرض، طول | `[35.6997, 51.338]` |
| GeoJSON، API بومی MapLibre و `fitBounds` آن | طول، عرض | `[51.338, 35.6997]` |
| متد `fitBounds` در Leaflet | عرض، طول | `[[35.69, 51.32], [35.73, 51.39]]` |

<a id="overlays"></a>

## مارکر و لایه‌های نقشه

‏برای هر مارکر شناسهٔ یکتا و پایدار تعیین کنید. پس از کشیدن مارکر، مختصات جدید را در آرایهٔ خودتان ذخیره کنید؛ در غیر این صورت وضعیت برنامه همچنان مختصات قبلی را نگه می‌دارد.

```ts
import { ref } from 'vue'
import type { Coordinates, MapLibreMarker, MapCircle, MapPolygon, MapPolyline } from 'vuejs-neshan-map-leaflet'

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
import NeshanMapPlugin from 'vuejs-neshan-map-leaflet'
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

‏**محدودیت امنیتی وابستگی:** نسخهٔ رسمی SDK نشان شامل MapLibre مشمول [هشدار GHSA-jrc7-96c5-q579](https://github.com/advisories/GHSA-jrc7-96c5-q579) است. متن انتساب استایل/کنترل با DOMPurify پاک‌سازی و پاپ‌آپ به شکل متن نمایش داده می‌شود. انتساب TileJSON دوردست، API بومی و DOM سفارشی مسئولیت برنامهٔ مصرف‌کننده است؛ فقط منابع مطمئن و HTML پاک‌سازی‌شده استفاده کنید. این اقدامات به معنی اصلاح موتور رسمی نیست؛ audit دو مورد بحرانی در زنجیرهٔ وابستگی رسمی گزارش می‌کند.

## توسعه و تست

```sh
git clone https://github.com/sajadjanat/vuejs-neshan-map-leaflet.git
cd vuejs-neshan-map-leaflet
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

‏۲۹ تست واحد/قرارداد و ۹ تست با SDK واقعی Leaflet، ساخت و نصب مستقل بسته با TypeScript سخت‌گیرانه بررسی شده‌اند. شبکهٔ تصویر و سهمیه در تست خودکار شبیه‌سازی می‌شود. ترافیک، مکان‌ها و ابزارها با نقشهٔ واقعی مرورگر بررسی شدند؛ GPS واقعی دستگاه درخواست نشده و callbackهای آن شبیه‌سازی شده‌اند. CI روی Node ۲۲ و ۲۴ اجرا می‌شود.

‏برای گزارش اشکال، نسخهٔ پکیج، موتور و مرورگر، مثال کوچک بازتولید و خطای بدون اطلاعات حساس ارسال کنید. کلید سرویس و توکن حساب را در issue قرار ندهید.

## منابع رسمی و مجوز

‏[مستندات MapLibre نشان](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/) · [مستندات Leaflet نشان](https://platform.neshan.org/docs/sdk/web/leaflet/neshan-leaflet-sdk/) · [Vue](https://vuejs.org/guide/introduction.html)

‏مجوز MIT؛ توسعه توسط Sajad Abasi. [متن مجوز](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/LICENSE).
