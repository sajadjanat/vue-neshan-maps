import guideEn from '../../docs/GUIDE.md?raw'
import guideFa from '../../docs/GUIDE.fa.md?raw'
import advancedEn from '../../docs/ADVANCED.md?raw'
import advancedFa from '../../docs/ADVANCED.fa.md?raw'
import apiEn from '../../docs/API.md?raw'
import apiFa from '../../docs/API.fa.md?raw'
import nuxtEn from '../../docs/NUXT.md?raw'
import nuxtFa from '../../docs/NUXT.fa.md?raw'
import migrationEn from '../../docs/MIGRATION.md?raw'
import migrationFa from '../../docs/MIGRATION.fa.md?raw'
import securityEn from '../../docs/DEPENDENCY-SECURITY.md?raw'
import securityFa from '../../docs/DEPENDENCY-SECURITY.fa.md?raw'
import { section } from './markdown'
export type Language='fa'|'en'
export type ExampleId='basic'|'model'|'styles'|'live'|'markers'|'shapes'|'geojson'|'clusters'|'heatmap'|'advanced'|'methods'|'leaflet'|'errors'
export interface DocPage {id:string;group:number;title:Record<Language,string>;summary:Record<Language,string>;body:Record<Language,string>;example?:ExampleId;source:string}
const pair=(en:string,fa:string)=>({en,fa})
const g=(en:string,fa:string)=>pair(section(guideEn,en),section(guideFa,fa))
const a=(en:string,fa:string)=>pair(section(advancedEn,en),section(advancedFa,fa))
const withoutTitle=(source:string)=>source.replace(/^# [^\n]+\n/,'')
export const groups=pair(['Start here','Build your map','Work with data','Integrate & ship','Reference'].join('|'),['شروع کار','ساخت نقشه','کار با داده‌ها','یکپارچه‌سازی و انتشار','مرجع'].join('|'))
const page=(id:string,group:number,en:string,fa:string,descEn:string,descFa:string,body:Record<Language,string>,example?:ExampleId,source='GUIDE')=>({id,group,title:pair(en,fa),summary:pair(descEn,descFa),body,example,source})
export const pages:DocPage[]=[
page('overview',0,'Introduction','معرفی پکیج','Understand the library, choose an engine, and find your next step.','با نقش پکیج، تفاوت موتورهای نقشه و مسیر یادگیری آشنا شوید.',pair(
`## What you build
Vue Neshan Maps connects Neshan basemaps to Vue 3 reactive state. Use it for location pickers, branch maps, delivery areas and spatial data. It is an independent community library, not an official Neshan SDK.

## Choose an engine
| | MapLibre | Leaflet |
| --- | --- | --- |
| Component | \`NeshanMapLibre\` | \`NeshanMapLeaflet\` |
| Rendering | Vector / WebGL | Raster / DOM |
| Live traffic and POI | Supported with compatible Neshan styles | No longer updated by Neshan |
| Cluster / heatmap / native 3D layers | Built in | Use the MapLibre component |
| Best fit | New interactive vector applications | Existing Leaflet integrations |

## Learn in order
1. Install the package and CSS in **Quick start**.
2. Configure a domain-allowed **web key**.
3. Connect center and zoom with **Models & coordinates**.
4. Add markers, shapes or GeoJSON, then explore clustering and heatmaps.
5. Review error handling and production guidance before shipping.

## Scope and conventions
The component owns map creation, updates and disposal. Your application owns data, saved positions and business rules. Search, geocoding and road routing APIs are separate Neshan services and are not included. A polyline connects supplied points; it does not compute a route. Public component coordinates are latitude first; GeoJSON and native MapLibre APIs are longitude first.

## Live examples
Examples use real Neshan basemaps and clearly labelled sample geometry. Enter your own web key; it stays in page memory. Nothing executes until you press **Run example**. You can change the controls, inspect recent events and copy a complete Vue example without exposing your key.

## Official references
[Neshan SDK documentation](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/) explains the service and SDK. This site documents this Vue package and its own contract.`,
`## چه چیزی می‌سازید؟
این پکیج نقشهٔ نشان را به وضعیت واکنش‌پذیر Vue 3 متصل می‌کند. انتخاب آدرس، نمایش شعب، محدودهٔ ارسال و تحلیل داده‌های مکانی از کاربردهای آن است. این کتابخانه مستقل از نشان است و محصول رسمی نشان نیست.

## انتخاب موتور
| | MapLibre | Leaflet |
| --- | --- | --- |
| کامپوننت | \`NeshanMapLibre\` | \`NeshanMapLeaflet\` |
| شیوهٔ نمایش | وکتور با WebGL | تصویر با DOM |
| ترافیک و POI زنده | با سبک سازگار نشان | نشان دیگر به‌روز نمی‌کند |
| خوشه‌بندی، هیت‌مپ و لایهٔ سه‌بعدی | در پکیج موجود است | از کامپوننت MapLibre استفاده کنید |
| کاربرد مناسب | برنامه‌های جدید وکتور | یکپارچه‌سازی‌های موجود Leaflet |

## مسیر یادگیری
1. پکیج و CSS را در بخش **شروع سریع** نصب کنید.
2. یک **کلید وب** با مجوز دامنه تنظیم کنید.
3. مرکز و بزرگ‌نمایی را با **مدل‌ها و مختصات** متصل کنید.
4. مارکر، هندسه یا GeoJSON اضافه کنید؛ سپس خوشه‌بندی و هیت‌مپ را امتحان کنید.
5. پیش از انتشار، مدیریت خطا و راهنمای استفاده در محصول را بخوانید.

## محدودهٔ مسئولیت
کامپوننت ساخت، به‌روزرسانی و پاک‌سازی نقشه را انجام می‌دهد. داده‌ها، ذخیرهٔ موقعیت و منطق کسب‌وکار متعلق به برنامه‌اند. جستجو، تبدیل آدرس و مسیریابی جاده‌ای سرویس‌های جداگانهٔ نشان هستند و داخل این پکیج نیستند. خط فقط نقاط داده‌شده را به هم وصل می‌کند. مختصات ورودی کامپوننت با عرض آغاز می‌شود؛ GeoJSON و API بومی MapLibre با طول.

## مثال‌های زنده
مثال‌ها از نقشهٔ واقعی نشان و هندسهٔ نمونه استفاده می‌کنند. کلید وب خودتان را وارد کنید؛ کلید فقط در حافظهٔ صفحه می‌ماند. تا زدن **اجرای مثال**، نقشه بارگیری نمی‌شود. کنترل‌ها را تغییر دهید، رویدادها را ببینید و کد کامل Vue را بدون افشای کلید کپی کنید.

## منابع رسمی
[مستندات SDK نشان](https://platform.neshan.org/docs/sdk/web/maplibre/neshan-maplibre-gl-js/) سرویس و SDK را توضیح می‌دهد. این سایت راهنمای قرارداد و امکانات همین پکیج Vue است.`)),
page('quickstart',0,'Quick start','شروع سریع','Install, import CSS, and render a complete Vue component.','نصب، واردکردن CSS و نمایش اولین نقشه با یک کامپوننت کامل.',pair(
`## Requirements
Use Vue 3.5.43 or newer. Supported tooling is Node 22.12+ within 22.x, or Node 24+. MapLibre requires WebGL and DecompressionStream. Nuxt 4 has stricter Node patch requirements; see its dedicated guide.

## Install
\`\`\`bash
npm install vue-neshan-maps
\`\`\`

## Configure the key
Create a **web** key in the Neshan dashboard and allow your development and production domains. In Vite, keep the value in an ignored environment file:
\`\`\`dotenv
VITE_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
\`\`\`

## Complete Vue example
${section(guideEn,'Complete map').replace(/^## [^\n]+\n/,'')}

## Verify the result
You should see the basemap, attribution and a center pin. An empty map usually means missing CSS, zero container height, a key/domain error or unavailable WebGL. Check the browser resource errors, not only the ready event.`,
`## پیش‌نیازها
از Vue نسخهٔ 3.5.43 یا جدیدتر استفاده کنید. ابزارهای بیلد به Node نسخهٔ 22.12 به بالا در شاخهٔ ۲۲ یا نسخهٔ ۲۴ به بالا نیاز دارند. MapLibre به WebGL و DecompressionStream نیاز دارد. پیش‌نیاز نسخهٔ Node در Nuxt 4 سخت‌گیرانه‌تر است؛ راهنمای اختصاصی Nuxt را بخوانید.

## نصب
\`\`\`bash
npm install vue-neshan-maps
\`\`\`

## تنظیم کلید
در پنل نشان یک کلید **وب** بسازید و دامنه‌های توسعه و محصول را مجاز کنید. در Vite مقدار را در فایل محیطی وارد کنید که در Git ثبت نمی‌شود:
\`\`\`dotenv
VITE_NESHAN_WEB_KEY=web.YOUR_DOMAIN_ALLOWED_KEY
\`\`\`

## نمونهٔ کامل Vue
${section(guideFa,'نمونهٔ کامل').replace(/^## [^\n]+\n/,'')}

## بررسی نتیجه
باید نقشه، انتساب و نشانهٔ مرکز را ببینید. نبود CSS، ارتفاع صفر، خطای کلید یا دامنه و نبود WebGL از علت‌های صفحهٔ خالی‌اند. دریافت رویداد ready به‌تنهایی مجوز دریافت کاشی را اثبات نمی‌کند.`),'basic'),
page('keys',0,'Web key & permissions','کلید وب و مجوزها','Set allowed domains and understand key types, permissions and privacy.','دامنهٔ مجاز، نوع کلید، مجوز سرویس و حریم خصوصی را تنظیم کنید.',pair(
`## Create the right key
Open the [Neshan dashboard](https://platform.neshan.org/panel) and create a web map key. Web keys start with \`web.\`. Service keys are for server-side APIs and must not be placed in Vue source, public environment variables or this demo.

## Allow the domain
Allow the exact host used by your application. This site runs on \`sajadjanat.github.io\`. A repository path is not a separate domain. Development hosts must also be allowed according to your key settings.

## Enable the services
Enable the MapLibre map, POI and traffic services your application uses. A valid key can still lack a service permission or have exhausted quota. Live visibility also depends on the selected style and zoom.

## Use the key safely
Browser web keys are visible by design: restrict domains and monitor usage. Do not put secrets in example URLs, shared links, logs or Git. Live examples on this site keep your key in memory only; changing the page view or refreshing clears it.

## Troubleshooting
\`480\` means invalid key, \`483\` wrong key type, \`484\` disallowed domain and \`485\` missing service permission. Quota and rate limits are different: \`481\` requires a quota change; \`482\` requires waiting. The Errors chapter explains handling without leaking credentials.`,
`## دریافت کلید مناسب
در [پنل نشان](https://platform.neshan.org/panel) کلید نقشهٔ وب بسازید. کلید وب با \`web.\` آغاز می‌شود. کلید سرویس برای API سمت سرور است؛ آن را در کد Vue، متغیر محیطی عمومی یا این دمو قرار ندهید.

## مجازکردن دامنه
نام میزبان واقعی برنامه را مجاز کنید. میزبان این سایت \`sajadjanat.github.io\` است؛ مسیر ریپو یک دامنهٔ جدا نیست. میزبان توسعه نیز باید مطابق تنظیمات کلید مجاز باشد.

## فعال‌کردن سرویس‌ها
مجوز نقشهٔ MapLibre، مکان‌ها و ترافیک مورد نیاز را فعال کنید. معتبر بودن کلید به معنی داشتن همهٔ مجوزها یا باقی‌بودن سهمیه نیست. نمایش لایه‌ها به سبک و بزرگ‌نمایی هم وابسته است.

## استفادهٔ امن
کلید وب در مرورگر قابل مشاهده است؛ دامنه‌های مجاز را محدود و مصرف را بررسی کنید. اطلاعات محرمانه را در آدرس مثال، لینک اشتراک، لاگ یا Git قرار ندهید. مثال‌های این سایت کلید را فقط در حافظه نگه می‌دارند؛ تغییر نمای سایت یا بارگذاری دوباره آن را پاک می‌کند.

## عیب‌یابی
کد \`480\` یعنی کلید نامعتبر، \`483\` نوع اشتباه کلید، \`484\` دامنهٔ غیرمجاز و \`485\` نبود مجوز سرویس. تمام‌شدن سهمیه با محدودیت نرخ متفاوت است: \`481\` به اصلاح سهمیه و \`482\` به صبرکردن نیاز دارد. بخش خطاها روش مدیریت بدون افشای کلید را توضیح می‌دهد.`)),
page('model',1,'Models & coordinates','مدل‌ها و مختصات','Synchronize center and zoom, and build a location picker.','مرکز و بزرگ‌نمایی را همگام کنید و انتخابگر مکان بسازید.',g('Picking','انتخاب نقطه'),'model'),
page('styles',1,'Map styles & live layers','سبک، ترافیک و مکان‌ها','Switch styles and control real traffic and POI visibility.','سبک نقشه را تغییر دهید و ترافیک و POI واقعی را کنترل کنید.',g('Live layers','ترافیک، مکان‌ها و سبک'),'styles'),
page('markers',1,'Markers & popups','مارکرها و پاپ‌آپ','Add stable marker IDs, text popups and persistent dragging.','مارکر با شناسهٔ پایدار، پاپ‌آپ متنی و ذخیرهٔ جابه‌جایی بسازید.',g('Markers','مارکرها'),'markers'),
page('shapes',1,'Lines, polygons & circles','خط، چندضلعی و دایره','Render delivery areas, connections and meter-radius circles.','محدودهٔ ارسال، ارتباط نقاط و دایره با شعاع متری را رسم کنید.',g('Shapes','خط، چندضلعی و دایره'),'shapes'),
page('controls',1,'Methods & native access','متدها و دسترسی بومی','Move the camera, fit markers, locate and access native controls.','دوربین را کنترل کنید، کادر را تنظیم کنید و به موتور بومی دسترسی بگیرید.',pair(g('Controls','کنترل نقشه از برنامه').en+'\n'+section(guideEn,'Integration'),g('Controls','کنترل نقشه از برنامه').fa+'\n'+section(guideFa,'یکپارچه‌سازی')),'methods'),
page('geojson',2,'GeoJSON','دادهٔ GeoJSON','Style point, line and polygon features with native source options.','نقطه، خط و چندضلعی را با تنظیمات منبع بومی نمایش دهید.',g('GeoJSON','دادهٔ GeoJSON'),'geojson'),
page('clusters',2,'Point clustering','خوشه‌بندی نقاط','Cluster large point collections and read or expand a cluster.','مجموعهٔ نقاط را خوشه‌بندی کنید و اعضای خوشه را بخوانید یا باز کنید.',a('Complete example: clusters and heatmap','نمونهٔ کامل خوشه‌بندی و هیت‌مپ'),'clusters','ADVANCED'),
page('heatmap',2,'Weighted heatmaps','هیت‌مپ وزنی','Visualize density with an independent, unclustered weighted source.','تراکم را با منبع وزنی مستقل از خوشه‌ها نمایش دهید.',a('Complete example: clusters and heatmap','نمونهٔ کامل خوشه‌بندی و هیت‌مپ'),'heatmap','ADVANCED'),
page('advanced',2,'Sources, layers & 3D','منابع، لایه‌ها و سه‌بعدی','Compose native layers with scoped IDs, expressions and extrusion.','لایه‌های بومی، عبارت‌ها و ارتفاع سه‌بعدی را با شناسهٔ مستقل ترکیب کنید.',a('Advanced sources and layers','منابع و لایه‌های پیشرفته'),'advanced','ADVANCED'),
page('nuxt',3,'Nuxt 4','راه‌اندازی Nuxt 4','Choose the module or manual plugin, and configure SSR and public keys.','ماژول یا پلاگین دستی را انتخاب و SSR و کلید عمومی را تنظیم کنید.',pair(withoutTitle(nuxtEn),withoutTitle(nuxtFa)),undefined,'NUXT'),
page('leaflet',3,'Leaflet compatibility','سازگاری Leaflet','Integrate raster maps and understand the legacy live-layer limits.','نقشهٔ تصویری را متصل کنید و محدودیت لایه‌های زندهٔ قدیمی را بشناسید.',g('Leaflet','استفاده از Leaflet'),'leaflet'),
page('errors',3,'Loading & errors','بارگیری و مدیریت خطا','Handle initialization, tile failures, key permissions and quota errors.','خطای راه‌اندازی، کاشی، کلید، مجوز و سهمیه را مدیریت کنید.',pair(g('Status','بارگیری و مدیریت خطا').en+'\n'+a('Key, permission and quota errors','خطای کلید، دامنه و سهمیه').en,g('Status','بارگیری و مدیریت خطا').fa+'\n'+a('Key, permission and quota errors','خطای کلید، دامنه و سهمیه').fa),'errors','ADVANCED'),
page('production',3,'Performance & production','سرعت و استفاده در محصول','Plan data ownership, updates, cleanup, security and accessibility.','مالکیت داده، به‌روزرسانی، پاک‌سازی، امنیت و دسترس‌پذیری را در نظر بگیرید.',pair(a('Updates, lifecycle and performance','سرعت و چرخهٔ عمر').en+'\n'+g('Production','استفاده در محصول').en+'\n'+g('Vazir font','فونت وزیر').en,a('Updates, lifecycle and performance','سرعت و چرخهٔ عمر').fa+'\n'+g('Production','استفاده در محصول').fa+'\n'+g('Vazir font','فونت وزیر').fa),undefined,'ADVANCED'),
page('security',3,'Dependency security','امنیت وابستگی‌ها','Understand the patched renderer and the documented Nuxt advisories.','موتور وصله‌شده و محدودیت‌های اعلام‌شدهٔ وابستگی‌های Nuxt را بررسی کنید.',pair(withoutTitle(securityEn),withoutTitle(securityFa)),undefined,'DEPENDENCY-SECURITY'),
page('migration',3,'Migration','مهاجرت از نام قبلی','Switch package paths while preserving existing Vue and Nuxt code.','مسیر پکیج را با حفظ کد Vue و Nuxt قبلی تغییر دهید.',pair(withoutTitle(migrationEn),withoutTitle(migrationFa)),undefined,'MIGRATION'),
page('api',4,'Complete API reference','مرجع کامل API','All props, defaults, events, methods, slots, helpers and types.','تمام ورودی‌ها، پیش‌فرض‌ها، رویدادها، متدها، اسلات‌ها، توابع و تایپ‌ها.',pair(withoutTitle(apiEn),withoutTitle(apiFa)),undefined,'API'),
]
export const pageById=(id:string)=>pages.find(page=>page.id===id)??pages[0]
