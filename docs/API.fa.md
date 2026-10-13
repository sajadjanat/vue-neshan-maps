# ‏مرجع API

‏این مرجع مربوط به پکیج `vue-neshan-maps` است. هر دو کامپوننت در Vue 3 و ماژول Nuxt 4 در دسترس‌اند. نشان سرویس نقشه را ارائه می‌کند؛ این پکیج اتصال واکنش‌پذیر Vue، رویدادها و لایه‌های برنامه را مدیریت می‌کند.

## ‏ورودی‌های MapLibre

‏نام‌ها در TypeScript به صورت camelCase و در قالب Vue به صورت kebab-case استفاده می‌شوند؛ برای مثال `pickOnClick` همان `:pick-on-click` است. تنها `apiKey` الزامی است.

| ‏ورودی | ‏نوع و پیش‌فرض | ‏رفتار |
| --- | --- | --- |
| `apiKey` | `string`؛ الزامی | ‏کلید وب با مجوز دامنه؛ تغییر آن نقشه را دوباره می‌سازد. |
| `modelValue` | `Coordinates`؛ نمای اولیه `[35.6997, 51.338]` | ‏مرکز با ترتیب عرض و طول؛ با `v-model` متصل می‌شود. |
| `zoom` | `number`؛ `13` | ‏بزرگ‌نمایی؛ مدل دوم `v-model:zoom`. |
| `mapStyle` | `string / StyleSpecification`؛ `MAPLIBRE_STYLES.light` | ‏آدرس سبک یا شیء معتبر نسخهٔ ۸. |
| `options` | ‏گزینه‌های سازندهٔ MapLibre | ‏تنظیمات اولیه؛ برای تغییرشان کامپوننت را با `:key` بازسازی کنید. `container`، `apiKey`، `center`، `zoom` و `style` از پراپ‌های اختصاصی مدیریت می‌شوند. |
| `traffic` | `boolean`؛ `false` | ‏نمایش ترافیک در سبک دارای لایهٔ ترافیک نشان. |
| `poi` | `boolean`؛ `false` | ‏نمایش مکان‌ها در سبک دارای منبع و لایه‌های مکان‌های نشان. |
| `markers` | `MapLibreMarker[]`؛ `[]` | ‏مارکرهای DOM با شناسهٔ یکتا؛ با خوشه‌بندی GeoJSON متفاوت‌اند. |
| `polylines` | `MapPolyline[]`؛ `[]` | ‏خط بین مختصات؛ مسیریابی جاده‌ای محاسبه نمی‌کند. |
| `polygons` | `MapPolygon[]`؛ `[]` | ‏چندضلعی؛ آرایهٔ حلقه‌ها برای ایجاد حفره پشتیبانی می‌شود. |
| `circles` | `MapCircle[]`؛ `[]` | ‏شعاع برحسب متر؛ با چندضلعی ژئودزیک تقریب زده می‌شود. |
| `geojson` | `GeoJSON.GeoJSON` | ‏نقطه، خط و چندضلعی؛ مختصات با ترتیب طول و عرض. |
| `geojsonLayers` | `MapLibreOverlayLayer[]` | ‏تعریف سبک لایه‌ها بدون فیلد `source`؛ منبع را کامپوننت تعیین می‌کند. |
| `geojsonOptions` | ‏گزینه‌های منبع GeoJSON | ‏گزینه‌های بومی منبع بدون `data` و `type`؛ callbackهای Leaflet در آن معتبر نیستند. |
| `cluster` | `boolean / MapLibreClusterOptions` | ‏خوشه‌بندی نقاط GeoJSON؛ مقدار صریح بر `geojsonOptions.cluster` اولویت دارد. |
| `heatmap` | `boolean / MapLibreHeatmapOptions` | ‏هیت‌مپ مستقل از خوشه‌ها؛ می‌توان هر دو را هم‌زمان نمایش داد. |
| `sources` | `Record<string, SourceSpecification>` | ‏منابع برنامه شامل GeoJSON، vector و raster. |
| `layers` | `MapLibreAdvancedLayer[]` | ‏لایه‌های بومی و `beforeId`؛ شناسه‌ها در محدودهٔ همین کامپوننت نگه‌داری می‌شوند. |
| `fitMarkers` | `boolean`؛ `false` | ‏تنظیم کادر برای مارکرها. |
| `pickOnClick` | `boolean`؛ `false` | ‏به‌روزرسانی مدل مرکز با کلیک. |
| `centerMarker` | `boolean`؛ `true` | ‏نشانهٔ بصری ثابت وسط نقشه؛ یک مارکر داده‌ای نیست. |
| `styles` | `Record<string,string / number>`؛ `{}` | ‏سبک ظرف؛ عرض پیش‌فرض ۱۰۰٪ و ارتفاع ۴۵۰ پیکسل است. |
| `ariaLabel` | `string`؛ `Neshan MapLibre map` | ‏نام قابل‌خواندن نقشه برای ابزارهای کمکی. |

## ‏مدل‌های داده و تنظیمات پیشرفته

```ts
type Coordinates = [latitude: number, longitude: number]
interface MapLibreMarker {
  id: string | number
  position: Coordinates
  popup?: string
  tooltip?: string
  options?: Omit<MarkerOptions, 'element'>
  element?: HTMLElement
}
interface MapPolyline { id: string | number; positions: Coordinates[]; options?: L.PolylineOptions }
interface MapPolygon { id: string | number; positions: Coordinates[] | Coordinates[][]; options?: L.PolylineOptions }
interface MapCircle { id: string | number; center: Coordinates; radius: number; options?: L.CircleMarkerOptions }
```

‏متن `popup` و `tooltip` به عنوان متن ساده نمایش داده می‌شود. برای `element` سفارشی، پاک‌سازی DOM برعهدهٔ برنامه است. در MapLibre گزینه‌های خط شامل `color`، `weight`، `opacity` و `dashArray` است؛ چندضلعی و دایره `color`، `weight`، `fill`، `fillColor` و `fillOpacity` را می‌پذیرند. تمام گزینه‌های افزونه‌های Leaflet قابل انتقال به MapLibre نیستند.

| ‏مدل | ‏فیلدها |
| --- | --- |
| `MapLibreClusterOptions` | `radius` (۵۰ پیکسل)، `maxZoom` (۱۴)، `minPoints` (۲)، `expandOnClick`، `color`، `pointColor`، `textColor` |
| `MapLibreHeatmapOptions` | `weightProperty`، `intensity`، `radius`، `opacity`، `maxZoom` |
| `MapLibreAdvancedLayer` | ‏تعریف بومی `LayerSpecification` به همراه `beforeId` اختیاری |
| `MapLibreOverlayLayer` | ‏تعریف بومی لایه، بدون `source` |
| `LiveLayerState` | `traffic`، `poi`، `trafficLayers`، `poiLayers` |

‏با تعیین `weightProperty`، مقدار نامعتبر یا منفی به وزن صفر تبدیل می‌شود؛ بدون این گزینه، وزن همهٔ نقاط ۱ است. پیش‌فرض‌های هیت‌مپ شامل `intensity: 1`، `radius: 24`، `opacity: 0.8` و `maxZoom: 22` است. شعاع هیت‌مپ پیکسلی است؛ شعاع `circles` متری است. بعد از تغییر داده یا سبک، شناسهٔ خوشه ممکن است تغییر کند؛ شناسهٔ قدیمی را ذخیرهٔ دائمی نکنید.

## ‏رویدادها

| ‏رویداد | ‏دادهٔ ارسالی |
| --- | --- |
| `ready` | ‏در MapLibre: `{ map, maplibre }`؛ در Leaflet: `{ map, L }` |
| `destroy` | ‏بدون آرگومان؛ مرجع بومی ذخیره‌شده را پاک کنید. |
| `error` / `warning` | `Error` / ‏رشتهٔ هشدار |
| `update:modelValue` | ‏زوج مختصات با ترتیب عرض و طول |
| `update:zoom` | ‏عدد بزرگ‌نمایی |
| `latitude` / `longitude` | ‏اعداد مجزای عرض و طول برای سازگاری |
| `click` | ‏رویداد بومی؛ در MapLibre فیلد `coordinates` با ترتیب عرض و طول اضافه می‌شود. |
| `moveend` / `zoomend` | ‏رویداد بومی موتور |
| `marker-click` | ‏دو آرگومان: مارکر و رویداد کلیک |
| `marker-dragend` | ‏دو آرگومان: مارکر و مختصات جدید؛ تغییر را در آرایهٔ برنامه ذخیره کنید. |
| `location-found` | ‏در MapLibre: `{ latlng: { lat, lng }, accuracy }`؛ در Leaflet رویداد بومی موقعیت |
| `location-error` | ‏در MapLibre: `{ code, message }`؛ در Leaflet رویداد خطای بومی |
| `tiles-loading` / `tiles-loaded` / `tile-error` | `TileState`: `{ status, loaded, failed }` |
| `live-layers` | `LiveLayerState`؛ فقط MapLibre |
| `resource-error` | `MapResourceFailure`؛ فقط MapLibre |
| `cluster-click` | `{ clusterId, pointCount, coordinates }`؛ فقط MapLibre |
| `layer-click` | `{ layerId, features, coordinates }`؛ فقط MapLibre |

‏رویداد `ready` آماده‌شدن شیء نقشه را اعلام می‌کند و اثبات معتبر بودن کلید کاشی نیست. شمارنده‌های MapLibre رویدادهای منبع را می‌شمارند؛ شمارنده‌های Leaflet مربوط به کاشی‌های تصویری‌اند و با هم قابل مقایسه نیستند.

## ‏متدها و دسترسی بومی

| ‏متد | ‏کاربرد |
| --- | --- |
| `retry()` | ‏بازسازی و تلاش دوباره برای بارگیری |
| `fitToMarkers()` | ‏نمایش مارکرها در یک کادر |
| `invalidateSize()` | ‏محاسبهٔ مجدد ابعاد؛ در MapLibre معادل resize |
| `flyTo(center, zoom?, options?)` | ‏مرکز با ترتیب عرض و طول؛ گزینه‌ها مطابق موتور |
| `fitBounds(bounds, options?)` | ‏ترتیب بومی موتور: در MapLibre طول و عرض، در Leaflet عرض و طول |
| `locate(options?)` | ‏موقعیت یک‌باره با اجازهٔ مرورگر؛ پیش‌فرض MapLibre شامل `setView: true`، `maxZoom: 16`، `timeout: 10000` و `enableHighAccuracy: true` است. |
| `openPopup(id)` | ‏بازکردن پاپ‌آپ مارکر موجود؛ فقط MapLibre |
| `getDiagnostics()` | ‏تعداد عارضه‌های نمایان، لایه‌ها، منابع، مارکرها و وضعیت سبک؛ فقط MapLibre |
| `expandCluster(id, center?)` | ‏Promise زوم گسترش خوشه؛ مرکز اختیاری با ترتیب عرض و طول |
| `getClusterLeaves(id, limit = 10, offset = 0)` | ‏Promise نقاط خوشه به شکل GeoJSON |

‏رف کامپوننت MapLibre همچنین `map`، `maplibre` و `tileState` را در اختیار می‌گذارد. در Leaflet، `map`، `leaflet` و `tileState` در دسترس‌اند. مالک پاک‌سازی نقشه کامپوننت است؛ با رویداد `destroy` مرجع برنامه را پاک کنید. مقدار `getDiagnostics()` پیش از آماده‌شدن نقشه `undefined` است؛ شمارنده‌ها مربوط به نمای فعلی‌اند، نه کل داده‌ها.

## ‏اسلات‌ها

| ‏اسلات | ‏پارامترها |
| --- | --- |
| `loading` | ‏بدون پارامتر؛ حالت بارگیری اولیه |
| `error` | `{ error, retry }`؛ خطای راه‌اندازی |
| `tile-error` | `{ state }`؛ بارگیری ناقص منابع بدون حذف نقشه |
| `center-marker` | ‏بدون پارامتر؛ جایگزین نشانهٔ ثابت مرکز |
| `default` | ‏در MapLibre: `{ map, maplibre, tileState }`؛ در Leaflet: `{ map, leaflet, tileState }` |

## ‏ورودی‌های Leaflet

‏ورودی‌های مشترک شامل `apiKey`، `modelValue`، `zoom`، `styles`، `centerMarker`، `pickOnClick`، `markers`، `polylines`، `polygons`، `circles`، `geojson`، `geojsonOptions`، `fitMarkers` و `ariaLabel` است. گزینه‌های هندسه و GeoJSON در این موتور همان گزینه‌های بومی Leaflet هستند. `apiKey` اختیاری است و برای سازگاری، `options.key` نیز پذیرفته می‌شود؛ در عمل برای نقشهٔ نشان کلید لازم است.

| ‏ورودی اختصاصی | ‏رفتار |
| --- | --- |
| `options` | `NeshanMapOptions` شامل گزینه‌های `L.MapOptions`، `key` و `maptype`؛ سبک‌های `dreamy` و `standard-night` پشتیبانی می‌شوند. |
| `sdk` | `SdkOptions`: `scriptUrl`، `styleUrl`، `timeout` و `nonce`؛ پیش‌فرض timeout برابر ۱۵۰۰۰ میلی‌ثانیه است. |

‏گزینه‌های تاریخی `options.traffic` و `options.poi` با هشدار نادیده گرفته می‌شوند؛ نشان کاشی‌های زندهٔ این دو قابلیت را برای SDK Leaflet به‌روز نمی‌کند. برای ترافیک و POI از MapLibre استفاده کنید. نام پیش‌فرض دسترس‌پذیری Leaflet برابر `Neshan map` است. نشانگرهای `MapMarker` به جای `element`، گزینه‌های بومی `L.MarkerOptions` را در `options` می‌پذیرند.

## ‏کامپوزبل‌ها، بارگذارها و ثبت سراسری

‏`useNeshanMapLibre()` مرجع‌های `map` و `maplibre` و توابع `onReady` و `onDestroy` را می‌دهد. `useNeshanMap()` همین الگو را برای Leaflet با مرجع‌های `map` و `leaflet` فراهم می‌کند. هر دو رویداد `ready` و `destroy` را متصل کنید. خود کامپوزبل نقشه نمی‌سازد.

```ts
import NeshanMapPlugin, {
  NeshanMapLeaflet, NeshanMapLibre,
  useNeshanMap, useNeshanMapLibre,
  loadNeshanSdk, loadNeshanMapLibre, MAPLIBRE_STYLES,
  normalizeResourceError, NeshanResourceError,
} from 'vue-neshan-maps'
app.use(NeshanMapPlugin)
```

‏کامپوننت‌ها جداگانه نیز قابل ثبت‌اند. `loadNeshanSdk(options?)` و `loadNeshanMapLibre()` برای دسترسی مستقیم در مرورگرند؛ معمولاً کامپوننت بارگیری را انجام می‌دهد. سبک‌های `MAPLIBRE_STYLES` شامل `light`، `dark`، `pastel`، `monochrome_light` و `monochrome_dark` است. نام پکیج قدیمی همچنان سازگار است، ولی نسخه‌های امکانات جدید در نام جدید منتشر می‌شوند.

## ‏ساختار خطا و تنظیم Nuxt

‏`MapResourceFailure` شامل `kind`، `message`، `retryable` و فیلدهای اختیاری `status`، `code` و `retryAfter` است. `normalizeResourceError(error)` دادهٔ عمومی خطا را می‌سازد و `NeshanResourceError` کلاس Error همین ساختار است. انواع `kind` عبارت‌اند از `invalid-key`، `key-type`، `domain`، `service`، `quota`، `rate-limit`، `forbidden`، `network`، `server`، `request`، `decode` و `unknown`.

‏مسیر `vue-neshan-maps/nuxt` ماژول Nuxt 4 است. گزینهٔ `neshanMap` شامل `css`، `components` و `imports` است که هر سه پیش‌فرض `true` دارند. کلید از `runtimeConfig.public.neshanWebKey` و متغیر محیطی `NUXT_PUBLIC_NESHAN_WEB_KEY` خوانده می‌شود. مسیر `vue-neshan-maps/nuxt/plugin` روش پلاگین دستی است؛ ماژول و پلاگین دستی را هم‌زمان ثبت نکنید. [راهنمای کامل Nuxt](NUXT.fa.md) را برای SSR، CSS و تنظیمات محصول بخوانید.
