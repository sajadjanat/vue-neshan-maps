import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { beforeAll, afterEach, describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Component from '../src/components/NeshanMapLeaflet.vue'
import { loadNeshanSdk } from '../src/loader'
vi.mock('../src/loader', () => ({loadNeshanSdk: vi.fn()}))
const url='https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js'
let sdk: any
const wrappers: ReturnType<typeof mount>[]=[]
const create=(props: any={}) => {const w=mount(Component,{attachTo:document.body,props:{apiKey:'web.integration-test-not-a-secret',options:{zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false},...props}});wrappers.push(w);return w}
beforeAll(async()=>{
  let source: string
  try {source=await readFile('work/neshan-sdk-1.9.4.js','utf8')} catch {
    const response=await fetch(url,{signal:AbortSignal.timeout(25000)})
    if(!response.ok) throw new Error(`Official SDK download failed: ${response.status}`)
    source=await response.text();await mkdir('work',{recursive:true});await writeFile('work/neshan-sdk-1.9.4.js',source)
  }
  // jsdom has no layout, SVG capability detection, image fetching or geolocation.
  for(const key of ['clientWidth','clientHeight','offsetWidth','offsetHeight']) Object.defineProperty(HTMLElement.prototype,key,{configurable:true,get:()=>600})
  ;(SVGSVGElement.prototype as any).createSVGRect=()=>({})
  class QuotaRequest {open(){} setRequestHeader(){} send(){} abort(){}}
  vi.stubGlobal('XMLHttpRequest',QuotaRequest)
  window.eval(source)
  sdk=window.L
  vi.mocked(loadNeshanSdk).mockResolvedValue(sdk)
})
afterEach(()=>{wrappers.splice(0).forEach(w=>w.unmount())})
describe('official Neshan Leaflet 1.9.4 SDK contract (no tile network)',()=>{
  it('settles fractional and clamped zoom without repeating setView on model feedback',async()=>{
    const w=create({modelValue:[35.72,51.36],zoom:12.2});await flushPromises()
    const map=(w.vm as any).map
    expect(map.getZoom()).toBe(12)
    expect(w.emitted('update:zoom')!.at(-1)).toEqual([12])
    const setView=vi.spyOn(map,'setView')
    await w.setProps({modelValue:[map.getCenter().lat,map.getCenter().lng]})
    expect(setView).not.toHaveBeenCalled()
    await w.setProps({zoom:30});await flushPromises()
    expect(map.getZoom()).toBe(map.getMaxZoom())
    setView.mockClear()
    await w.setProps({modelValue:[map.getCenter().lat,map.getCenter().lng]})
    expect(setView).not.toHaveBeenCalled()
  })
  it('uses the current SDK and has the documented style API',async()=>{
    const w=create();await flushPromises()
    const map=(w.vm as any).map
    expect(sdk.version).toBe('1.9.4')
    expect(typeof map.setMapType).toBe('function')
  })
  it('changes style in place without disposing the map or consumer layers',async()=>{
    const w=create();await flushPromises()
    const map=(w.vm as any).map
    const custom=sdk.marker([35.7,51.34]).addTo(map)
    await w.setProps({options:{maptype:'standard-night'}});await flushPromises()
    expect((w.vm as any).map === map).toBe(true)
    expect(map.hasLayer(custom)).toBe(true)
  })
  it('keeps the same marker and open popup through unrelated overlay/model updates',async()=>{
    const markers=[{id:'one',position:[35.7,51.34],popup:'Kept open',options:{draggable:true}}]
    const w=create({markers,polylines:[{id:'line',positions:[[35.7,51.34],[35.71,51.35]]}]});await flushPromises()
    const map=(w.vm as any).map
    let marker: any;map.eachLayer((l:any)=>{if(l instanceof sdk.Marker)marker=l})
    marker.openPopup();expect(marker.isPopupOpen()).toBe(true)
    await w.setProps({modelValue:[35.71,51.35],polylines:[{id:'line',positions:[[35.7,51.34],[35.72,51.36]]}]});await flushPromises()
    expect(map.hasLayer(marker)).toBe(true)
    expect(marker.isPopupOpen()).toBe(true)
  })
  it('renders markers, lines, circles and GeoJSON with the real renderer',async()=>{
    const w=create({markers:[{id:1,position:[35.7,51.34]}],polygons:[{id:'area',positions:[[35.7,51.34],[35.71,51.34],[35.71,51.35]]}],polylines:[{id:2,positions:[[35.7,51.34],[35.71,51.35]]}],circles:[{id:3,center:[35.7,51.34],radius:200}],geojson:{type:'Feature',geometry:{type:'Point',coordinates:[51.35,35.71]},properties:{}}})
    await flushPromises()
    expect(w.emitted('error')).toBeUndefined()
    expect(w.element.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2)
    expect(w.element.querySelectorAll('.leaflet-overlay-pane path')).toHaveLength(3)
  })
  it('emits dragged coordinates, persists controlled positions and removes deleted markers',async()=>{
    const w=create({markers:[{id:'drag',position:[35.7,51.34],options:{draggable:true}}]});await flushPromises()
    const map=(w.vm as any).map
    let marker:any;map.eachLayer((l:any)=>{if(l instanceof sdk.Marker)marker=l})
    expect(marker.dragging.enabled()).toBe(true)
    marker.setLatLng([35.72,51.36]);marker.fire('dragend')
    expect(w.emitted('marker-dragend')![0][1]).toEqual([35.72,51.36])
    await w.setProps({markers:[{id:'drag',position:[35.72,51.36],options:{draggable:true}}]})
    expect(map.hasLayer(marker)).toBe(true)
    expect(marker.getLatLng()).toEqual(sdk.latLng(35.72,51.36))
    await w.setProps({markers:[]});expect(map.hasLayer(marker)).toBe(false)
  })
  it('picks a point, synchronizes zoom, fits markers and forwards location errors',async()=>{
    const w=create({pickOnClick:true,markers:[{id:1,position:[35.7,51.34]},{id:2,position:[35.72,51.36]}]});await flushPromises()
    const map=(w.vm as any).map
    map.fire('click',{latlng:sdk.latLng(35.71,51.35)})
    await vi.waitFor(()=>expect(map.getCenter().distanceTo(sdk.latLng(35.71,51.35))).toBeLessThan(15))
    await w.setProps({zoom:15});expect(map.getZoom()).toBe(15)
    expect(w.emitted('update:zoom')!.at(-1)).toEqual([15])
    ;(w.vm as any).fitToMarkers()
    expect(map.getBounds().contains([35.7,51.34])).toBe(true)
    expect(map.getBounds().contains([35.72,51.36])).toBe(true)
    map.fire('locationerror',{code:1,message:'Permission denied'})
    expect((w.emitted('location-error')![0][0] as any).code).toBe(1)
    map.fire('locationfound',{latlng:sdk.latLng(35.71,51.35),accuracy:20})
    expect(w.emitted('location-found')).toHaveLength(1)
  })
  it('separates engine readiness from tile failures and recovers on a new tile batch',async()=>{
    const w=create();await flushPromises();const map=(w.vm as any).map
    const layers:any[]=[];map.eachLayer((l:any)=>{if(l instanceof sdk.TileLayer)layers.push(l)});const tiles=layers[0]
    expect(w.emitted('ready')).toHaveLength(1)
    tiles.fire('loading');tiles.fire('tileerror');tiles.fire('load');await flushPromises()
    expect((w.vm as any).tileState.status).toBe('error')
    expect(w.emitted('tile-error')).toHaveLength(1)
    expect(w.element.querySelector('.neshan-map__tile-warning')).not.toBeNull()
    layers.forEach(layer=>{layer.fire('loading');layer.fire('tileload');layer.fire('load')})
    expect((w.vm as any).tileState).toEqual({status:'loaded',loaded:layers.length,failed:0})
    expect(w.element.querySelector('.leaflet-container')).not.toBeNull()
  })
  it('reports invalid overlays without disposing a healthy map',async()=>{
    const w=create();await flushPromises();const map=(w.vm as any).map
    await w.setProps({circles:[{id:1,center:[35.7,51.34],radius:-5}]})
    expect(w.emitted('error')).toHaveLength(1)
    expect((w.vm as any).map===map).toBe(true)
    await w.setProps({markers:[{id:1,position:[35.7,51.34]},{id:1,position:[35.71,51.35]}]})
    expect(w.emitted('error')).toHaveLength(2)
  })
  it('does not report the vendor rejection placeholder as a successful map tile',async()=>{
    const w=create();await flushPromises();const map=(w.vm as any).map
    let tiles:any;map.eachLayer((l:any)=>{if(l instanceof sdk.TileLayer)tiles=l})
    const tile=document.createElement('img');tile.src='https://static.neshan.org/sdk/images/tile-empty.png'
    tiles.fire('loading');tiles.fire('tileload',{tile});tiles.fire('load')
    expect((w.vm as any).tileState.failed).toBe(1)
    expect((w.vm as any).tileState.loaded).toBe(0)
    expect((w.vm as any).tileState.status).toBe('error')
    expect(w.emitted('tiles-loaded')).toBeUndefined()
  })
})
