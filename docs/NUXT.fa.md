# ‏استفاده در Nuxt 4

‏[معرفی](../README.fa.md) · [English](NUXT.md) · [آموزش امکانات](GUIDE.fa.md) · [پروژهٔ قابل اجرا](../examples/nuxt4)

‏ورودی اختصاصی ماژول و پلاگین Nuxt از نسخهٔ **۲٫۱٫۰** در دسترس است. همان کامپوننت‌ها با ورودی، رویداد، slot و متدهای قبلی استفاده می‌شوند. Nuxt یک وابستگی peer اختیاری است و با نصب در برنامهٔ معمولی Vue به آن اضافه نمی‌شود.

‏نمونه از Nuxt 4.6.1 استفاده می‌کند و به Node با بازهٔ `^22.22.3`، `^24.15.0` یا `>=26.0.0` نیاز دارد. این شرط از ابزارهای بستهٔ مستقل Vue سخت‌گیرانه‌تر است. آزمون با Node 24.21.0 انجام می‌شود.

## ‏روش پیشنهادی: ماژول Nuxt

```sh
npm install vuejs-neshan-map-leaflet@^2.2.0
```

‏ماژول را در فایل `nuxt.config.ts` ریشهٔ پروژه ثبت کنید:

```ts
export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  runtimeConfig: { public: { neshanWebKey: '' } },
})
```

‏برای توسعه، **کلید وب** مجاز برای دامنه را در فایل نادیده‌گرفته‌شدهٔ `.env` بگذارید:

```dotenv
NUXT_PUBLIC_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
```

‏در محصول، این متغیر را در محیط میزبان تنظیم کنید؛ سرور ساخته‌شدهٔ Nuxt فایل `.env` توسعه را خودکار نمی‌خواند. کلید وب عمداً عمومی است و باید به دامنه‌های شما محدود شود. کلید سرویس را در تنظیمات خصوصی سرور نگه دارید.

‏ماژول، `NeshanMapLibre` و `NeshanMapLeaflet` را ثبت، CSS بسته را یک بار اضافه و `useNeshanMapLibre`، `useNeshanMap` و `MAPLIBRE_STYLES` را خودکار وارد می‌کند. در صورت نبودن کلید تنظیمات عمومی، `runtimeConfig.public.neshanWebKey` را هم تعریف می‌کند. برای نقشهٔ معمولی، پلاگین دوم، import جداگانهٔ CSS یا `<ClientOnly>` لازم نیست.

‏کد زیر را مستقیم در `app/app.vue` بگذارید؛ یا آن را در `app/pages/index.vue` قرار دهید و از `app/app.vue`، کامپوننت `<NuxtPage />` را نمایش دهید:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { Coordinates, MapLibreMarker } from 'vuejs-neshan-map-leaflet'

const config = useRuntimeConfig()
const center = ref<Coordinates>([35.6997, 51.338])
const zoom = ref(13)
const traffic = ref(true)
const poi = ref(true)
const dark = ref(false)
const markers: MapLibreMarker[] = [
  { id: 'azadi', position: [35.6997, 51.338], popup: 'میدان آزادی' },
]
const { map, onReady, onDestroy } = useNeshanMapLibre()
</script>

<template>
  <section dir="rtl">
    <label><input v-model="traffic" type="checkbox">ترافیک</label>
    <label><input v-model="poi" type="checkbox">مکان‌ها</label>
    <label><input v-model="dark" type="checkbox">نقشهٔ تاریک</label>
    <NeshanMapLibre
      v-model="center" v-model:zoom="zoom" :api-key="config.public.neshanWebKey"
      :map-style="dark ? MAPLIBRE_STYLES.dark : MAPLIBRE_STYLES.light"
      :traffic="traffic" :poi="poi" :markers="markers" :pick-on-click="true"
      :styles="{ height: '520px' }" @ready="onReady" @destroy="onDestroy"
    />
    <p>مرکز: {{ center }} · زوم: {{ zoom }} · آماده: {{ Boolean(map) }}</p>
  </section>
</template>
```

‏نوع‌ها را صریح import کنید؛ کامپوننت و composableها با ثبت خودکار Nuxt در دسترس‌اند. برای Leaflet، کامپوننت را با `NeshanMapLeaflet` جایگزین کنید، به جای `mapStyle` از `:options="{ maptype: 'dreamy' }"` استفاده و ترافیک و مکان‌ها را حذف کنید. دسترسی بومی Leaflet با `useNeshanMap` است. مثال‌های [راهنمای امکانات](GUIDE.fa.md) را با جایگزینی متغیر Vite با `useRuntimeConfig()` در Nuxt به کار ببرید.

## ‏تنظیمات ماژول

```ts
export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  neshanMap: { css: true, components: true, imports: true },
})
```

‏پیش‌فرض هر سه گزینه روشن است. اگر CSS را جای دیگری وارد می‌کنید، `css` را خاموش کنید. با خاموش‌کردن `components` یا `imports` ثبت آن‌ها را خودتان انجام دهید. تنظیمات tuple هم پشتیبانی می‌شود:

```ts
modules: [['vuejs-neshan-map-leaflet/nuxt', { imports: false }]]
```

## ‏روش جایگزین: پلاگین Nuxt

‏برای ثبت سراسری دستی، به جای ماژول از ورودی پلاگین استفاده کنید:

```ts
export default defineNuxtConfig({
  plugins: ['vuejs-neshan-map-leaflet/nuxt/plugin'],
  css: ['vuejs-neshan-map-leaflet/style.css'],
  runtimeConfig: { public: { neshanWebKey: '' } },
})
```

‏این پلاگین هر دو کامپوننت را روی `nuxtApp.vueApp` ثبت می‌کند. افزودن CSS، تنظیمات عمومی و import کردن composableها بر عهدهٔ شماست. در صفحه، `useNeshanMapLibre` و `MAPLIBRE_STYLES` را صریح از بسته وارد کنید؛ این روش auto-import را فعال نمی‌کند.

‏همچنین می‌توانید خودتان فایل `app/plugins/neshan.ts` را بسازید. این روش با نسخهٔ ۲٫۰٫۱ هم کار می‌کند:

```ts
import { NeshanMapPlugin } from 'vuejs-neshan-map-leaflet'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(NeshanMapPlugin)
})
```

‏CSS را در تنظیمات Nuxt سراسری وارد کنید. یکی از روش‌های ثبت را انتخاب کنید تا ثبت تکراری انجام نشود.

## ‏رندر سرور و هیدریشن

‏کامپوننت در سرور ظرف نقشه و حالت بارگیری را می‌سازد؛ SDK پس از mount در مرورگر راه‌اندازی می‌شود. ماژول و پلاگین در SSR به `window` دست نمی‌زنند و موقعیت یا کاشی نقشه درخواست نمی‌کنند. متد بومی را پس از `ready` فراخوانی و برای پاک‌شدن ref در جابه‌جایی صفحه، `destroy` را متصل کنید.

‏اگر افزونه یا کد اطراف نقشه از امکانات مرورگر استفاده می‌کند، `<ClientOnly>` یا فایل `.client.vue` به کار ببرید. برای fallback ارتفاع ثابت تعیین کنید تا چیدمان نپرد. نقشهٔ بومی را در setup سرور راه‌اندازی نکنید.

## ‏اجرای نمونهٔ ریپو

```sh
npm ci
npm run build
cd examples/nuxt4
npm install
cp .env.example .env
npm run dev
```

‏دو دستور اول را از ریشهٔ ریپو اجرا کنید و سپس کلید نمونه را در `.env` پروژهٔ Nuxt جایگزین کنید. فرم صفحه نیز کلید می‌پذیرد و آن را ذخیره نمی‌کند. نمونه از نسخهٔ ساخته‌شدهٔ محلی بسته استفاده می‌کند و SSR، ثبت خودکار، لایه‌های زنده، تغییر سبک، ویرایش مارکر و ref بومی را نشان می‌دهد.

```sh
npm run typecheck
npm run build
```

‏این دو دستور را داخل `examples/nuxt4` اجرا کنید. ساخت محصول بدون کلید هم باید موفق باشد؛ برای دریافت دادهٔ واقعی در مرورگر کلید معتبر لازم است.

## ‏عیب‌یابی

| مشکل | راه‌حل |
| --- | --- |
| ‏ورودی `/nuxt` پیدا نمی‌شود | ‏نسخهٔ ۲٫۱٫۰ به بعد نصب کنید؛ در ۲٫۰٫۱ از فایل دستی `app/plugins/neshan.ts` استفاده کنید. |
| ‏کامپوننت یا composable ناشناخته است | ‏ثبت ماژول را بررسی، `npx nuxt prepare` را اجرا و ویرایشگر و سرور توسعه را دوباره باز کنید. |
| ‏ظاهر نقشه ناقص است | ‏در روش پلاگین دستی، CSS بسته را در تنظیمات Nuxt اضافه کنید. |
| ‏کلید محیط محصول خالی است | ‏متغیر `NUXT_PUBLIC_NESHAN_WEB_KEY` را روی میزبان در حال اجرا تنظیم کنید. |
| ‏نقشه بعد از هیدریشن خالی است | ‏ارتفاع، کلید، دامنه، سهمیه، شبکه و پشتیبانی WebGL و `DecompressionStream` را بررسی کنید. |
| ‏ارجاع بومی پس از جابه‌جایی صفحه قدیمی است | ‏هر دو handler رویدادهای `ready` و `destroy` را متصل کنید. |

‏منابع رسمی Nuxt: [ماژول‌ها](https://nuxt.com/docs/4.x/guide/modules/recipes-basics)، [پلاگین‌ها](https://nuxt.com/docs/4.x/directory-structure/app/plugins) و [تنظیمات زمان اجرا](https://nuxt.com/docs/4.x/guide/going-further/runtime-config).

## ‏فونت وزیر

‏فونت وزیر نسخهٔ ۳۰٫۱٫۰ با وزن‌های معمولی و ضخیم همراه بسته است؛ فایل‌ها از پروژهٔ شما سرو می‌شوند و به CDN نیاز ندارند. مجوز و نام پدیدآورندگان در پوشهٔ `fonts` حفظ شده است.

```ts
export default defineNuxtConfig({
  modules: ['vuejs-neshan-map-leaflet/nuxt'],
  css: ['vuejs-neshan-map-leaflet/fonts/vazir.css'],
})
```

```html
<main class="neshan-font-vazir" lang="fa" dir="rtl">
  <!-- Your map and Persian controls -->
</main>
```

‏این کلاس فونت رابط و پاپ‌آپ‌های HTML را تنظیم می‌کند. نوشته‌های نقشهٔ برداری از گلیف‌های سبک نشان می‌آیند و نوشته‌های نقشهٔ تصویری داخل کاشی‌ها هستند؛ این فونت آن‌ها را تغییر نمی‌دهد. خود متن Markdown گیت‌هاب هم از فونت سایت گیت‌هاب استفاده می‌کند؛ تصاویر فارسی با وزیر ثبت شده‌اند.
