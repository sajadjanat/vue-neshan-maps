import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { createRequire } from 'node:module'

// Validate the published artifact, including declarations without skipLibCheck.
const require = createRequire(import.meta.url)
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run test:package')
const root = process.cwd()
const tempRoot = resolve(tmpdir())
const dir = mkdtempSync(join(tempRoot, 'neshan-package-'))
const npm = (args, cwd = root) => execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: 'utf8' })
try {
  const [{ filename }] = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', dir]))
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'neshan-consumer-smoke', private: true, type: 'module' }))
  npm(['install', join(dir, filename), '--ignore-scripts', '--registry=https://registry.npmjs.org'], dir)
  writeFileSync(join(dir, 'smoke.mjs'), `
    import assert from 'node:assert/strict'
    import { readFileSync } from 'node:fs'
    import { dirname, join } from 'node:path'
    import { createRequire } from 'node:module'
    import plugin, { NeshanMapLeaflet, NeshanMapLibre, loadNeshanMapLibre, useNeshanMapLibre, loadNeshanSdk } from 'vuejs-neshan-map-leaflet'
    const require = createRequire(import.meta.url)
    assert.equal(typeof plugin.install, 'function')
    assert.equal(typeof NeshanMapLeaflet.install, 'function')
    assert.equal(typeof NeshanMapLibre.install, 'function')
    assert.equal(typeof loadNeshanMapLibre, 'function')
    assert.equal(typeof useNeshanMapLibre, 'function')
    assert.equal(typeof loadNeshanSdk, 'function')
    assert.equal(typeof require('vuejs-neshan-map-leaflet').NeshanMapLeaflet.install, 'function')
    assert.ok(require.resolve('vuejs-neshan-map-leaflet/style.css'))
    assert.ok(require.resolve('vuejs-neshan-map-leaflet/fonts/vazir.css'))
    const fonts = dirname(require.resolve('vuejs-neshan-map-leaflet/fonts/vazir.css'))
    for (const name of ['Vazir-Regular.woff2', 'Vazir-Bold.woff2']) {
      assert.equal(readFileSync(join(fonts, name)).subarray(0, 4).toString(), 'wOF2')
    }
    assert.match(readFileSync(join(fonts, 'OFL.txt'), 'utf8'), /SIL Open Font License/)
  `)
  writeFileSync(join(dir, 'check.ts'), `
    import { NeshanMapLeaflet, type Coordinates, type NeshanMapOptions, type MapMarker, type MapLibreProps } from 'vuejs-neshan-map-leaflet'
    const center: Coordinates = [35, 51]
    const options: NeshanMapOptions = { center, zoom: 13, traffic: true }
    const marker: MapMarker = { id: 1, position: center, options: { draggable: true } }
    const libre: MapLibreProps = { apiKey: 'web.consumer-fixture', modelValue: center, traffic: true, poi: true, cluster: {radius:60}, heatmap: {weightProperty:'weight'}, sources: {places:{type:'geojson',data:{type:'FeatureCollection',features:[]}}}, layers:[{id:'points',type:'circle',source:'places',beforeId:'native-style-layer'}], geojsonLayers: [{id:'points',type:'circle',paint:{'circle-radius':6}}] }
    void [NeshanMapLeaflet, options, marker, libre]
  `)
  execFileSync(process.execPath, ['smoke.mjs'], { cwd: dir, stdio: 'inherit' })
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler', 'check.ts'], { cwd: dir, stdio: 'inherit' })
  console.log('Installed package: ESM, CommonJS, CSS exports and strict TypeScript passed')
} finally {
  if (dirname(resolve(dir)) !== tempRoot || !dir.startsWith(join(tempRoot, 'neshan-package-'))) throw new Error('Unsafe temporary cleanup path')
  rmSync(dir, { recursive: true, force: true })
}
