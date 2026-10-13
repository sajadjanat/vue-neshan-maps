# Bilingual demo and documentation SEO

The project site publishes 40 canonical HTML pages: two playgrounds and 19 documentation chapters in each language. These are site changes; the npm runtime API is unchanged.

- Persian playground: https://sajadjanat.github.io/vue-neshan-maps/fa/
- English playground: https://sajadjanat.github.io/vue-neshan-maps/en/
- Persian docs: https://sajadjanat.github.io/vue-neshan-maps/fa/docs/overview/
- English docs: https://sajadjanat.github.io/vue-neshan-maps/en/docs/overview/
- Sitemap: https://sajadjanat.github.io/vue-neshan-maps/sitemap.xml

## Rendering and URLs

`npm run build:demo` runs Vite, then `scripts/prerender-site.mjs`. It renders the actual Vue pages at build time; guides and navigation are present in the original HTTP HTML. The same content becomes interactive after page code downloads. Live maps still require a visitor-owned web key and an explicit action. Public builds only expose environment variables with the `PUBLIC_DEMO_` prefix; private `VITE_NESHAN_WEB_KEY` values cannot be baked into prerendered forms.

Each canonical path has its own directory/index.html, so GitHub Pages can return HTTP 200 on direct visits. The root is a Persian alias with a canonical to `/fa/`. Historical `?view=docs&lang=…&doc=…` links remain supported by the client and move to clean paths. Unknown physical routes return GitHub Pages HTTP 404 with an explanatory, noindex page; they are not redirected to a successful app shell.

## Head metadata and structured data

Every translated page has its own title/description, language/direction, self-canonical, reciprocal `fa`/`en` alternates and Persian `x-default`, Open Graph and Twitter card metadata. Real localized demo screenshots are served from this site. Chapter/language changes update the head and keep one JSON-LD graph.

The graph describes the actual author (`Person`), project source (`SoftwareSourceCode`), site (`WebSite`) and page (`WebPage`). Documentation also has a `TechArticle` and visible `BreadcrumbList`. No invented review, rating, commercial offer, organization, FAQ or non-working search action is added. Publication/modification dates are omitted rather than invented from build time.

The sitemap lists only the 40 canonical, indexable URLs. It omits aliases, query variants, assets and 404. It intentionally does not invent `lastmod` timestamps for every build.

## Robots and GitHub Pages

Google reads **https://sajadjanat.github.io/robots.txt**, not the project's `/vue-neshan-maps/robots.txt`. The project copy is a deployable template with a sitemap declaration, not an effective origin-wide policy. The origin root returned 404 during implementation, so there was no root robots exclusion. Managing the origin file requires the separate user-site repository or a custom-domain deployment; this task does not modify another repository. The project pages independently use `index, follow`, and the error page uses `noindex, follow`.

## Checks and future maintenance

```sh
npm run typecheck
npm test
npm run build:demo
npm run test:site-seo
node scripts/verify-public-seo.mjs
```

CI checks generated pages before Pages upload. The published-site check verifies actual HTTP responses, original HTML metadata/content, language alternates, JSON-LD, social assets and a real 404.

Google Search Console verification, sitemap submission, URL inspection and ranking/indexation outcomes require the site owner's Search Console property; they are not claimed as completed by a successful build or schema syntax check. Submit the sitemap URL above in the correct URL-prefix property, then inspect representative Persian/English pages. A valid schema does not guarantee rich results or rankings.

References: [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics), [localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions), [structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies), [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

## راهنمای فارسی

‏دمو و ۱۹ فصل مستندات در دو زبان، جمعاً ۴۰ صفحهٔ HTML مستقل دارند. متن راهنما پیش از اجرای JavaScript قابل خواندن است؛ نقشهٔ زنده فقط پس از ورود کلید وب بازدیدکننده و انتخاب اجرای مثال بارگیری می‌شود. مسیرهای قدیمی همچنان کار می‌کنند و به مسیرهای خوانای جدید می‌روند.

‏عنوان، توضیح، زبان، canonical، ارتباط دو نسخهٔ فارسی و انگلیسی، پیش‌نمایش اشتراک و اسکیما برای هر صفحه ساخته می‌شوند. اسکیما اطلاعات واقعی پروژه و مقاله را توصیف می‌کند؛ امتیاز، نظر یا تاریخ ساختگی ندارد. سایت‌مپ فقط مسیرهای اصلی را شامل می‌شود.

‏در میزبانی فعلی، فایل robots مؤثر در ریشهٔ دامنه است و با فایل داخل ریپو تفاوت دارد. فایل ریشه هنگام بررسی ۴۰۴ بود و محدودیت خزش نداشت. ثبت سایت‌مپ و بررسی ایندکس در Search Console باید در حساب مالک سایت انجام شود؛ موفقیت تست فنی، تضمین رتبه در گوگل نیست.
