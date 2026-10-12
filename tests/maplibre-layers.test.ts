import {describe,it,expect,vi} from 'vitest'
import {AdvancedLayers,updateGeoJSON} from '../src/maplibre-layers'
const data:GeoJSON.FeatureCollection={type:'FeatureCollection',features:[]}
function fixture(){
  const sources=new Map<string,any>(),layers=new Map<string,any>(),order:string[]=[]
  const map={
    getSource:(id:string)=>sources.get(id),getLayer:(id:string)=>layers.get(id),
    getStyle:()=>({layers:order.map(id=>layers.get(id))}),
    addSource:vi.fn((id:string,s:any)=>sources.set(id,{...s,setData:vi.fn()})),
    removeSource:vi.fn((id:string)=>{if([...layers.values()].some(l=>l.source===id))throw Error('Source still in use');sources.delete(id)}),
    addLayer:vi.fn((l:any)=>{layers.set(l.id,l);order.push(l.id)}),
    removeLayer:vi.fn((id:string)=>{layers.delete(id);order.splice(order.indexOf(id),1)}),
    moveLayer:vi.fn((id:string,before?:string)=>{order.splice(order.indexOf(id),1);order.splice(before?order.indexOf(before):order.length,0,id)}),
  }
  return {map:map as any,sources,layers,order}
}
describe('incremental map overlays',()=>{
  it('updates large geometry without rebuilding sources or layers',()=>{
    const {map}=fixture(),layers:any[]=[{id:'points',type:'circle',source:'data'}]
    const entry=updateGeoJSON(map,undefined,'data',data,layers)
    for(let i=0;i<50;i++)updateGeoJSON(map,entry,'data',{type:'FeatureCollection',features:Array.from({length:1000},(_,id)=>({type:'Feature',properties:{id},geometry:{type:'Point',coordinates:[51+id/10000,35+i/100000]}}))},layers)
    expect(map.addSource).toHaveBeenCalledOnce();expect(map.addLayer).toHaveBeenCalledOnce()
    expect(map.getSource('data').setData).toHaveBeenCalledTimes(50)
  })
  it('rebuilds a source when clustering configuration changes',()=>{
    const {map}=fixture(),layers:any[]=[{id:'points',type:'circle',source:'data'}]
    const entry=updateGeoJSON(map,undefined,'data',data,layers,{cluster:true})
    updateGeoJSON(map,entry,'data',data,layers,{cluster:false})
    expect(map.removeLayer).toHaveBeenCalledWith('points');expect(map.removeSource).toHaveBeenCalledOnce()
  })
  it('scopes IDs, resolves forward beforeId and replaces dependent sources safely',()=>{
    const {map,order}=fixture(),manager=new AdvancedLayers(map,'own')
    const layers:any[]=[{id:'top',type:'circle',source:'places'},{id:'under',type:'circle',source:'places',beforeId:'top'}]
    manager.sync({places:{type:'geojson',data}},layers)
    expect(order).toEqual(['own-layer-under','own-layer-top'])
    const source=map.getSource('own-source-places')
    manager.sync({places:{type:'geojson',data:{...data}}},layers)
    expect(map.moveLayer).toHaveBeenCalledTimes(1)
    expect(map.getSource('own-source-places')).toBe(source);expect(source.setData).not.toHaveBeenCalled()
    manager.sync({places:{type:'geojson',data:{type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'Point',coordinates:[51,35]}}]}}},layers)
    expect(source.setData).toHaveBeenCalledOnce()
    manager.sync({places:{type:'geojson',data,cluster:true}},layers)
    expect(map.removeSource).toHaveBeenCalledWith('own-source-places')
    manager.sync({},[]);expect(order).toHaveLength(0)
  })
  it('rejects duplicate layers before mutating the style',()=>{
    const {map}=fixture(),manager=new AdvancedLayers(map,'own')
    expect(()=>manager.sync({},[{id:'a',type:'background'},{id:'a',type:'background'}])).toThrow('unique')
    expect(map.addLayer).not.toHaveBeenCalled()
  })
  it('does not restart worker indexing when a parent recreates equal data or layer props',()=>{
    const {map}=fixture(),layers:any[]=[{id:'points',type:'circle',source:'data'}]
    let entry=updateGeoJSON(map,undefined,'data',data,layers)
    for(let i=0;i<50;i++)entry=updateGeoJSON(map,entry,'data',{...data},[...layers])
    expect(map.getSource('data').setData).not.toHaveBeenCalled()
    expect(map.addSource).toHaveBeenCalledOnce();expect(map.addLayer).toHaveBeenCalledOnce()
  })
  it('reorders mixed native anchors and own layers without repeated style mutations',()=>{
    const {map,order}=fixture();map.addLayer({id:'base',type:'background'})
    const manager=new AdvancedLayers(map,'own')
    const layers:any[]=[{id:'a',type:'background',beforeId:'base'},{id:'b',type:'background'},{id:'c',type:'background'}]
    manager.sync({},layers);expect(order).toEqual(['own-layer-a','base','own-layer-b','own-layer-c'])
    manager.sync({},[layers[2],layers[0],layers[1]]);expect(order).toEqual(['own-layer-a','base','own-layer-c','own-layer-b'])
    const moves=map.moveLayer.mock.calls.length
    manager.sync({},[...([layers[2],layers[0],layers[1]])]);expect(map.moveLayer).toHaveBeenCalledTimes(moves)
  })
})
