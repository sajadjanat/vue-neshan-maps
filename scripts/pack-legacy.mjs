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
delete manifest.scripts
delete manifest.devDependencies
mkdirSync(stage, { recursive: true })
for (const file of manifest.files) cpSync(join(root, file), join(stage, file), { recursive: true })
writeFileSync(join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
const notice = '# Legacy compatibility package\n\nThis is the compatible historical name of **vue-neshan-maps**. All exports, components, types, Nuxt integration, CSS and Vazir fonts are preserved. Existing imports keep working. Do not install both identities in one app.\n\n[Migration guide](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/MIGRATION.md) · [راهنمای فارسی](https://github.com/sajadjanat/vuejs-neshan-map-leaflet/blob/master/docs/MIGRATION.fa.md)\n\n'
writeFileSync(join(stage, 'README.md'), notice + readFileSync(join(root, 'README.md'), 'utf8'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw Error('Run npm run pack:legacy')
execFileSync(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--pack-destination', join(root, 'work')], { cwd: stage, stdio: 'inherit' })
