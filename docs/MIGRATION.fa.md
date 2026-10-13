# ‏مهاجرت به نام جدید پکیج نشان

‏نسخهٔ `2.3.0` نام خواناتر `vue-neshan-maps` را معرفی می‌کند. آدرس ریپوی گیت‌هاب و دموی آنلاین ثابت می‌ماند. کامپوننت‌ها، تنظیمات، رویدادها، تایپ‌ها و رفتار رندر سمت سرور تغییر نمی‌کنند.

## ‏پروژه‌های فعلی

‏می‌توانی همچنان از `vuejs-neshan-map-leaflet` استفاده کنی. نسخهٔ سازگار `2.3.0` همین پیاده‌سازی را با تمام مسیرهای قبلی ارائه می‌کند. نسخه‌های قبلی حذف نمی‌شوند و مهاجرت خودکار نیست.

## ‏تغییر نام در پروژه

```bash
npm uninstall vuejs-neshan-map-leaflet
npm install vue-neshan-maps@^2.3.0
```

‏پیشوند پکیج را در ایمپورت‌ها و تنظیمات جایگزین کن:

| ‏مسیر قبلی | ‏مسیر جدید |
| --- | --- |
| `vuejs-neshan-map-leaflet` | `vue-neshan-maps` |
| `vuejs-neshan-map-leaflet/style.css` | `vue-neshan-maps/style.css` |
| `vuejs-neshan-map-leaflet/dist/style.css` | `vue-neshan-maps/dist/style.css` |
| `vuejs-neshan-map-leaflet/fonts/vazir.css` | `vue-neshan-maps/fonts/vazir.css` |
| `vuejs-neshan-map-leaflet/nuxt` | `vue-neshan-maps/nuxt` |
| `vuejs-neshan-map-leaflet/nuxt/plugin` | `vue-neshan-maps/nuxt/plugin` |

‏نام‌های `NeshanMapLibre` و `NeshanMapLeaflet`، کامپوزبل‌ها، پراپ‌ها و رویدادها همان است. در Nuxt، گزینهٔ `neshanMap` و کلید `runtimeConfig.public.neshanWebKey` را حفظ کن. پس از مهاجرت پوشهٔ `.nuxt` را پاک کن، سرور توسعه را دوباره اجرا کن و بیلد و تست‌های پروژه را انجام بده.

‏در هر برنامه فقط یکی از دو نام را نصب و ثبت کن تا موتور نقشه و کامپوننت‌ها دوباره بارگیری نشوند. بستهٔ قدیمی بیلد یکسان خودش را دارد و به نام جدید وابسته نیست. نام داخلی فایل‌های بیلد قدیمی حفظ شده؛ برای ایمپورت از مسیرهای عمومی جدول استفاده کن.

‏تاریخچه و آمار دانلودهای قبلی روی نام قدیمی باقی می‌ماند؛ نام جدید آمار مستقل دارد. برای این مهاجرت نیازی به حذف یا دپریکیت فوری نسخه‌های قدیمی نیست.

‏[راه‌اندازی Nuxt 4](NUXT.fa.md) · [English](MIGRATION.md)
