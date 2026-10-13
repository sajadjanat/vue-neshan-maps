import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { resolve, join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'

// Ship the identical tested implementation under the historical identity too.
// No forwarder dependency: old installations do not depend on a new npm name.
const root = process.cwd()
const stage = resolve(root, 'work/legacy-package')
if (dirname(stage) !== resolve(root, 'work')) throw Error('Unsafe staging path')
rmSync(stage, { recursive: true, force: true })
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
manifest.name = 'vuejs-neshan-map-leaflet'
manifest.description = 'Legacy compatibility package — future versions and new features are published in vue-neshan-maps. Vue 3 and Nuxt 4 Neshan maps.'
delete manifest.scripts
delete manifest.devDependencies
mkdirSync(stage, { recursive: true })
for (const file of manifest.files) cpSync(join(root, file), join(stage, file), { recursive: true })
writeFileSync(join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
const notice = '# This package has moved to vue-neshan-maps\n\n**Future versions and new features will be released in [vue-neshan-maps](https://www.npmjs.com/package/vue-neshan-maps). Use the new package for updates and new projects.**\n\n‏**نسخه‌های جدید و امکانات آینده از این پس در [vue-neshan-maps](https://www.npmjs.com/package/vue-neshan-maps) منتشر می‌شوند. برای دریافت به‌روزرسانی‌ها و شروع پروژهٔ جدید، از پکیج جدید استفاده کنید.**\n\nThis historical package remains compatible: all components, exports, types, Nuxt integration, CSS and Vazir fonts are preserved. Existing imports continue working; do not install both identities in one app.\n\n‏پکیج قدیمی برای سازگاری باقی می‌ماند؛ پروژه‌های فعلی با ایمپورت‌های قبلی کار می‌کنند. در هر برنامه فقط یکی از دو پکیج را نصب کنید.\n\n[Migration guide](https://github.com/sajadjanat/vue-neshan-maps/blob/master/docs/MIGRATION.md) · [راهنمای مهاجرت فارسی](https://github.com/sajadjanat/vue-neshan-maps/blob/master/docs/MIGRATION.fa.md)\n\n---\n\n'
writeFileSync(join(stage, 'README.md'), notice + readFileSync(join(root, 'README.md'), 'utf8'))
writeFileSync(join(stage, 'README.fa.md'), notice + readFileSync(join(root, 'README.fa.md'), 'utf8'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw Error('Run npm run pack:legacy')
execFileSync(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--pack-destination', join(root, 'work')], { cwd: stage, stdio: 'inherit' })
