import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join, dirname } from 'node:path'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'

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
  // Exercise the read-only Git APIs used by Nuxt Devtools with its security override.
  const consumerRequire = createRequire(join(dir, 'package.json'))
  const devtoolsRequire = createRequire(consumerRequire.resolve('@nuxt/devtools/package.json'))
  const { simpleGit } = devtoolsRequire('simple-git')
  const git = simpleGit(root)
  assert.match(await git.revparse(['--short', 'HEAD']), /^[a-f0-9]+/)
  assert.equal(typeof (await git.status()).isClean(), 'boolean')
  const gitTree = JSON.parse(execFileSync(process.execPath, [npmCli, 'ls', 'simple-git', '--all', '--json'], { cwd: dir, encoding: 'utf8' }))
  let gitPackages = 0
  const checkGit = tree => {
    for (const [name, dependency] of Object.entries(tree.dependencies ?? {})) {
      if (name === 'simple-git') { assert.equal(dependency.version, '4.0.2'); gitPackages++ }
      checkGit(dependency)
    }
  }
  checkGit(gitTree)
  assert.ok(gitPackages > 0, 'Nuxt Devtools Git dependency was not verified')
  console.log('Nuxt Devtools: patched simple-git 4.0.2, revparse/status compatibility passed')
  // Only the two documented, currently unpatched upstream advisories are accepted.
  // New advisories and any critical finding must stop the compatibility/publish check.
  let auditOutput
  try {
    auditOutput = execFileSync(process.execPath, [npmCli, 'audit', '--json', '--registry=https://registry.npmjs.org'], { cwd: dir, encoding: 'utf8' })
  } catch (error) {
    if (error.status !== 1) throw error
    auditOutput = error.stdout
  }
  const audit = JSON.parse(auditOutput)
  assert.equal(audit.metadata.vulnerabilities.critical, 0, 'Critical Nuxt dependency advisory')
  const knownUnpatched = new Set(['https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', 'https://github.com/advisories/GHSA-86w9-cpqp-85rv'])
  for (const vulnerability of Object.values(audit.vulnerabilities)) {
    for (const advisory of vulnerability.via) {
      if (typeof advisory === 'object') assert.ok(knownUnpatched.has(advisory.url), `New Nuxt advisory: ${advisory.url}`)
    }
  }
  console.log(`Nuxt dependency audit: ${audit.metadata.vulnerabilities.total} affected package nodes, 0 critical; remaining advisories documented`)
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
    css: ['vuejs-neshan-map-leaflet/style.css', 'vuejs-neshan-map-leaflet/fonts/vazir.css'],
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
