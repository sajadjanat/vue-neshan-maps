import {build} from 'vite'
import {createRequire} from 'node:module'
import {writeFileSync,readFileSync} from 'node:fs'
const require=createRequire(import.meta.url)
const pkg=JSON.parse(readFileSync(require.resolve('maplibre-gl/package.json'),'utf8'))
const result=await build({configFile:false,logLevel:'warn',build:{write:false,minify:true,lib:{entry:require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs'),name:'NeshanMapWorker',formats:['iife']}}})
const outputs=(Array.isArray(result)?result:[result]).flatMap(item=>item.output)
const chunks=outputs.filter(item=>item.type==='chunk')
if(chunks.length!==1)throw Error('Expected a self-contained MapLibre worker')
writeFileSync('src/vendor/maplibre-worker.txt',`/*! MapLibre GL JS ${pkg.version}; BSD-3-Clause; see licenses/MAPLIBRE.txt */\n`+chunks[0].code)
