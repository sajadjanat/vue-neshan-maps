import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { createServer } from 'node:net'

// Exercise the installed tarball rather than a symlink to source files.
const npmCli = process.env.npm_execpath
if (!npmCli) throw Error('Run with npm run test:nuxt')
const root = process.cwd()
const tempRoot = resolve(tmpdir())
const dir = mkdtempSync(join(tempRoot, 'neshan-nuxt4-'))
const npm = args => execFileSync(process.execPath, [npmCli, ...args], { cwd: dir, stdio: 'inherit' })
let server
async function stop() {
  if (server && server.exitCode === null) {
    const child = server
    await new Promise(resolve => { child.once('exit', resolve); child.kill() })
  }
  server = undefined
}
async function checkSSR(mode) {
  const reservation = createServer()
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve))
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))
  server = spawn(process.execPath, ['.output/server/index.mjs'], {
    cwd: dir,
    env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), NUXT_PUBLIC_NESHAN_WEB_KEY: 'web.ssr-fixture' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  server.stdout.on('data', chunk => { output += chunk })
  server.stderr.on('data', chunk => { output += chunk })
  try {
    let response
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw Error(`SSR process failed: ${output}`)
      try { response = await fetch(`http://127.0.0.1:${port}/`); break } catch {}
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(response, `SSR did not start: ${output}`)
    const body = await response.text()
    assert.equal(response.status, 200, body.slice(0, 1500))
    assert.ok(body.includes('Neshan maps'), 'App content missing')
    assert.ok(body.includes('neshan-map'), 'Registered component missing during SSR')
    assert.ok(body.includes('Loading map'), 'SSR map loading state missing')
    assert.ok(!/window is not defined|document is not defined/.test(output), output)
    console.log(`Nuxt 4 ${mode}: installed package, production build and SSR HTTP 200 passed`)
  } finally { await stop() }
}
try {
  const [{ filename }] = JSON.parse(execFileSync(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--json', '--pack-destination', dir], { cwd: root, encoding: 'utf8' }))
  const fixture = JSON.parse(readFileSync(join(root, 'examples/nuxt4/package.json'), 'utf8'))
  fixture.dependencies.nuxt = '4.6.1'
  fixture.dependencies['vuejs-neshan-map-leaflet'] = join(dir, filename)
  delete fixture.scripts.prepare
  writeFileSync(join(dir, 'package.json'), JSON.stringify(fixture))
  mkdirSync(join(dir, 'app'))
  const app = readFileSync(join(root, 'examples/nuxt4/app/app.vue'), 'utf8')
  writeFileSync(join(dir, 'app/app.vue'), app)
  mkdirSync(join(dir, 'app/components'))
  for (const [file, name] of [['docs/NUXT.md', 'DocsEnglish'], ['docs/NUXT.fa.md', 'DocsPersian']]) {
    const source = readFileSync(join(root, file), 'utf8')
    const component = source.match(/```vue\r?\n([\s\S]*?)\r?\n```/)?.[1]
    assert.ok(component?.includes('<script setup'), `Missing full example: ${file}`)
    writeFileSync(join(dir, `app/components/${name}.vue`), component)
  }
  writeFileSync(join(dir, 'nuxt.config.ts'), readFileSync(join(root, 'examples/nuxt4/nuxt.config.ts')))
  writeFileSync(join(dir, 'tsconfig.json'), readFileSync(join(root, 'examples/nuxt4/tsconfig.json')))
  npm(['install', '--registry=https://registry.npmjs.org', '--no-audit', '--no-fund'])
  npm(['run', 'prepare', '--if-present'])
  const cli = join(dir, 'node_modules/nuxt/bin/nuxt.mjs')
  const nuxt = command => execFileSync(process.execPath, [cli, command], { cwd: dir, stdio: 'inherit' })
  nuxt('prepare')
  nuxt('typecheck')
  nuxt('build')
  await checkSSR('module')

  for (const name of ['DocsEnglish', 'DocsPersian']) rmSync(join(dir, `app/components/${name}.vue`))

  writeFileSync(join(dir, 'nuxt.config.ts'), `export default defineNuxtConfig({
    plugins: ['vuejs-neshan-map-leaflet/nuxt/plugin'],
    css: ['vuejs-neshan-map-leaflet/style.css'],
    runtimeConfig: { public: { neshanWebKey: '' } },
    compatibilityDate: '2026-10-12', devtools: { enabled: false },
  })`)
  writeFileSync(join(dir, 'app/app.vue'), app.replace("import { ref } from 'vue'", "import { ref } from 'vue'\nimport { useNeshanMapLibre, MAPLIBRE_STYLES } from 'vuejs-neshan-map-leaflet'"))
  nuxt('prepare')
  nuxt('typecheck')
  nuxt('build')
  await checkSSR('plugin')
} finally {
  await stop()
  if (dirname(resolve(dir)) !== tempRoot || !dir.startsWith(join(tempRoot, 'neshan-nuxt4-'))) throw Error('Unsafe temporary cleanup path')
  rmSync(dir, { recursive: true, force: true })
}
