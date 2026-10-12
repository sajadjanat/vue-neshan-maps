import { mount,flushPromises } from '@vue/test-utils'
import { describe,it,expect,vi,beforeEach,afterEach } from 'vitest'
import Component from '../src/components/NeshanMapLibre.vue'
import { loadNeshanMapLibre } from '../src/maplibre'
vi.mock('../src/maplibre',async()=>({...await vi.importActual('../src/maplibre'),loadNeshanMapLibre:vi.fn()}))
const style={version:8,sources:{},layers:[{id:'traffic',type:'line',source:'traffic'},{id:'points',type:'symbol',source:'points_source'}]}
const wrappers:ReturnType<typeof mount>[]=[]
let maps:any[]=[],markers:any[]=[]
function sdk(){
  class Map {
    events:Record<string,Function>={};sources:Record<string,any>={};layers:any[]=[...style.layers];center={lat:35,lng:51};zoom=12
    remove=vi.fn();addControl=vi.fn();resize=vi.fn();fitBounds=vi.fn();setLayoutProperty=vi.fn();queryRenderedFeatures=()=>[]
    constructor(public options:any){maps.push(this);this.center={lat:options.center[1],lng:options.center[0]};this.zoom=options.zoom}
    on(name:string,callback:Function){this.events[name]=callback;return this}
    fire(name:string,event:any={}){this.events[name]?.(event)}
    getCenter(){return this.center} getZoom(){return this.zoom} isStyleLoaded(){return true}
    getStyle(){return {layers:this.layers}}getLayer(id:string){return this.layers.find(l=>l.id===id)}
    addSource(id:string,source:any){this.sources[id]={...source,setData:vi.fn()}}
    getSource(id:string){return this.sources[id]}removeSource(id:string){delete this.sources[id]}
    addLayer(layer:any){this.layers.push(layer)}removeLayer(id:string){this.layers=this.layers.filter(l=>l.id!==id)}
    setStyle=vi.fn(()=>{this.layers=[...style.layers];this.sources={};this.fire('style.load')})
    jumpTo=vi.fn();easeTo=vi.fn();flyTo=vi.fn()
  }
  class Marker {
    el=document.createElement('div');events:Record<string,Function>={};popup:any;point:any
    remove=vi.fn();constructor(){markers.push(this)}
    setLngLat(point:number[]){this.point={lng:point[0],lat:point[1]};return this}addTo(){return this}getElement(){return this.el}getLngLat(){return this.point}
    on(name:string,callback:Function){this.events[name]=callback;return this}setPopup(popup:any){this.popup=popup;return this}togglePopup(){this.popup.open=!this.popup.open}
  }
  class Popup {open=false;text='';setText(text:string){this.text=text;return this}isOpen(){return this.open}}
  return {Map,Marker,Popup,NavigationControl:class{},LngLatBounds:class{extend(){return this}}}
}
const create=(props:any={})=>{const w=mount(Component,{props:{apiKey:'web.component-fixture',...props}});wrappers.push(w);return w}
async function ready(){await flushPromises();maps.at(-1).fire('style.load');maps.at(-1).fire('load');await flushPromises()}
beforeEach(()=>{maps=[];markers=[];vi.mocked(loadNeshanMapLibre).mockResolvedValue(sdk()as never);vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>style}))})
afterEach(()=>{wrappers.splice(0).forEach(w=>w.unmount());vi.unstubAllGlobals();vi.clearAllMocks()})
describe('MapLibre component lifecycle and integration contract',()=>{
  it('keeps heatmap data unclustered and expands clicked clusters with native async APIs',async()=>{
    const data={type:'FeatureCollection',features:[{type:'Feature',properties:{weight:2},geometry:{type:'Point',coordinates:[51,35]}}]}
    const w=create({geojson:data,cluster:{radius:65},heatmap:{weightProperty:'weight'}});await ready()
    const map=maps[0],sourceId=Object.keys(map.sources).find(id=>id.endsWith('-geojson'))!
    const heatId=Object.keys(map.sources).find(id=>id.endsWith('-heatmap'))!
    expect(map.sources[sourceId]).toMatchObject({cluster:true,clusterRadius:65})
    expect(map.sources[heatId]).toMatchObject({cluster:false,data})
    expect(map.layers.some((l:any)=>l.type==='heatmap')).toBe(true)
    map.sources[sourceId].getClusterExpansionZoom=vi.fn().mockResolvedValue(15)
    map.sources[sourceId].getClusterLeaves=vi.fn().mockResolvedValue(data.features)
    map.queryRenderedFeatures=()=>[{geometry:{type:'Point',coordinates:[51,35]},properties:{cluster_id:7,point_count:2}}]
    map.fire('click',{lngLat:{lat:35,lng:51},point:{x:10,y:10}});await flushPromises()
    expect(w.emitted('cluster-click')![0][0]).toEqual({clusterId:7,pointCount:2,coordinates:[35,51]})
    expect(map.easeTo).toHaveBeenCalledWith({center:[51,35],zoom:15})
    expect(await (w.vm as any).getClusterLeaves(7)).toEqual(data.features)
    await w.setProps({heatmap:false});await flushPromises()
    expect(map.layers.some((l:any)=>l.type==='heatmap')).toBe(false)
  })
  it('restores advanced layers and cluster/heatmap after switching the base style',async()=>{
    const w=create({cluster:true,heatmap:true,sources:{district:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:[{id:'district',source:'district',type:'fill-extrusion',paint:{'fill-extrusion-height':200}}]});await ready()
    await w.setProps({mapStyle:'https://example.test/dark.json'});await flushPromises()
    expect(maps[0].layers.filter((l:any)=>['fill-extrusion','heatmap'].includes(l.type))).toHaveLength(2)
    expect(maps[0].layers.some((l:any)=>l.id.endsWith('-clusters'))).toBe(true)
  })
  it('groups polylines by dash pattern while retaining per-feature color and width',async()=>{
    const w=create({polylines:Array.from({length:100},(_,id)=>({id,positions:[[35,51],[36,52]],options:{color:id%2?'red':'blue',weight:4}}))});await ready()
    const map=maps[0],sourceId=Object.keys(map.sources).find(id=>id.endsWith('-lines'))!
    const source=map.sources[sourceId],layer=map.layers.find((l:any)=>l.source===sourceId)
    expect(map.layers.filter((l:any)=>l.source===sourceId)).toHaveLength(1)
    await w.setProps({polylines:[{id:1,positions:[[35,51],[37,53]],options:{color:'green',weight:8}}]});await flushPromises()
    expect(map.sources[sourceId]).toBe(source);expect(map.layers.find((l:any)=>l.source===sourceId)).toBe(layer)
    expect(source.setData).toHaveBeenCalled()
  })
  it('restores live and custom layers after a style reload while retaining markers and popups',async()=>{
    const w=create({traffic:true,poi:true,markers:[{id:'one',position:[35,51],popup:'keep'}],polylines:[{id:'line',positions:[[35,51],[36,52]]}]});await ready()
    const map=maps[0],marker=markers[0];marker.togglePopup()
    expect(map.layers.some((l:any)=>l.type==='line'&&l.id.includes('vue-neshan'))).toBe(true)
    await w.setProps({mapStyle:'https://example.test/dark.json'});await flushPromises()
    expect((w.vm as any).map===map).toBe(true);expect(markers).toHaveLength(1);expect(marker.popup.open).toBe(true)
    expect(map.setLayoutProperty).toHaveBeenCalledWith('traffic','visibility','visible')
    expect(map.layers.filter((l:any)=>l.id.includes('vue-neshan')).length).toBeGreaterThan(4)
    expect(w.emitted('ready')).toHaveLength(1)
  })
  it('emits marker dragging, updates position in place and removes deleted markers',async()=>{
    const w=create({markers:[{id:1,position:[35,51],popup:'safe <img>'}]});await ready()
    const marker=markers[0];marker.setLngLat([52,36]);marker.events.dragend()
    expect(w.emitted('marker-dragend')![0][1]).toEqual([36,52])
    await w.setProps({markers:[{id:1,position:[36,52],popup:'updated'}]})
    expect(markers).toHaveLength(1);expect(marker.popup.text).toBe('updated')
    await w.setProps({markers:[]});expect(marker.remove).toHaveBeenCalledOnce()
  })
  it('never constructs a map after unmount while the SDK is loading',async()=>{
    let resolve!:Function;vi.mocked(loadNeshanMapLibre).mockReturnValue(new Promise(r=>{resolve=r}))
    const w=create();w.unmount();resolve(sdk());await flushPromises();expect(maps).toHaveLength(0)
  })
  it('rejects service keys and allows retry with a web key',async()=>{
    const w=create({apiKey:'service.fixture'});await flushPromises();expect(loadNeshanMapLibre).not.toHaveBeenCalled();expect(w.emitted('error')).toHaveLength(1)
    expect(w.emitted('resource-error')![0][0]).toMatchObject({kind:'key-type',retryable:false})
    await w.setProps({apiKey:'web.corrected-fixture'});await ready();expect(w.emitted('ready')).toHaveLength(1)
  })
  it('reports resource failures independently from a ready engine and never leaks request keys',async()=>{
    const w=create();await ready();maps[0].fire('error',{error:new Error('https://example.test?key=secret')})
    expect(w.emitted('ready')).toHaveLength(1);expect((w.vm as any).tileState.status).toBe('error')
    expect(JSON.stringify(w.emitted('warning'))).not.toContain('secret')
    expect(maps[0].remove).not.toHaveBeenCalled()
  })
  it('fits bounds and forwards location success/errors with stale callbacks cancelled on unmount',async()=>{
    let success!:PositionCallback,failure!:PositionErrorCallback
    vi.stubGlobal('navigator',{geolocation:{getCurrentPosition:vi.fn((s:PositionCallback,f:PositionErrorCallback)=>{success=s;failure=f})}})
    const found=vi.fn();const w=create({markers:[{id:1,position:[35,51]}],fitMarkers:true,onLocationFound:found});await ready();expect(maps[0].fitBounds).toHaveBeenCalledOnce()
    ;(w.vm as any).locate();failure({code:1,message:'Permission denied'}as GeolocationPositionError)
    expect(w.emitted('location-error')).toHaveLength(1)
    ;(w.vm as any).locate();success({coords:{latitude:35,longitude:51,accuracy:10}}as GeolocationPosition)
    expect(found).toHaveBeenCalledOnce();w.unmount();success({coords:{latitude:36,longitude:52,accuracy:10}}as GeolocationPosition)
    expect(found).toHaveBeenCalledOnce()
  })
})
