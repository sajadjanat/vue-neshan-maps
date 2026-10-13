import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const env = { ...process.env, NESHAN_PACKAGE_NAME: 'vuejs-neshan-map-leaflet', NESHAN_PACKAGE_DIR: resolve('work/legacy-package') }
for (const script of ['package-smoke.mjs', 'nuxt-smoke.mjs']) {
  execFileSync(process.execPath, [`scripts/${script}`], { env, stdio: 'inherit' })
}
