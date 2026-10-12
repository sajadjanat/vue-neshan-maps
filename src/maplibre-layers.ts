import type { Map as NativeMap, GeoJSONSource, SourceSpecification, LayerSpecification } from 'maplibre-gl'
import type { MapLibreAdvancedLayer } from './maplibre-types'

export interface OverlayEntry {source:string;layers:string[];configuration:string;definitions:string;geometry:string}
/** Geometry updates keep the worker source and layers alive. Only source configuration changes rebuild them. */
export function updateGeoJSON(map:NativeMap,entry:OverlayEntry|undefined,source:string,data:GeoJSON.GeoJSON,layers:LayerSpecification[],options:Record<string,unknown>={}):OverlayEntry {
  const configuration=JSON.stringify(options),definitions=JSON.stringify(layers),geometry=JSON.stringify(data)
  if(entry && (entry.configuration!==configuration || !map.getSource(source))){
    for(const id of [...entry.layers].reverse())if(map.getLayer(id))map.removeLayer(id)
    if(map.getSource(source))map.removeSource(source)
    entry=undefined
  }
  if(!entry)map.addSource(source,{...options,type:'geojson',data} as SourceSpecification)
  else if(entry.geometry!==geometry)(map.getSource(source) as GeoJSONSource).setData(data)
  if(!entry || entry.definitions!==definitions){
    if(entry)for(const id of [...entry.layers].reverse())if(map.getLayer(id))map.removeLayer(id)
    for(const layer of layers)map.addLayer(layer)
  }
  return {source,layers:layers.map(layer=>layer.id),configuration,definitions,geometry}
}

export class AdvancedLayers {
  private sources=new Map<string,{configuration:string;geometry?:string}>()
  private layers=new Map<string,{definition:string}>()
  constructor(private map:NativeMap,private prefix:string){}
  sourceId(id:string){return `${this.prefix}-source-${id}`}
  layerId(id:string){return `${this.prefix}-layer-${id}`}
  layerIds(){return [...this.layers.keys()].map(id=>this.layerId(id))}
  publicLayerId(id:string){return [...this.layers.keys()].find(key=>this.layerId(key)===id)}
  reset(){this.sources.clear();this.layers.clear()}
  sync(sources:Record<string,SourceSpecification>,layers:MapLibreAdvancedLayer[]){
    const ids=new Set(layers.map(layer=>layer.id))
    if(ids.size!==layers.length)throw Error('Advanced layer IDs must be unique')
    if(layers.some(layer=>layer.beforeId===layer.id))throw Error('A layer cannot be ordered before itself')
    if([...Object.keys(sources),...ids].some(id=>!id.trim()))throw Error('Source and layer IDs must not be empty')
    const definitions=new Map(layers.map(layer=>[layer.id,JSON.stringify(layer)]))
    const configurations=new Map(Object.entries(sources).map(([id,source])=>{
      const {data:ignored,...options}=source as SourceSpecification & {data?:unknown}
      return [id,JSON.stringify(options)]
    }))
    const changed=new Set([...this.sources].filter(([id,value])=>!sources[id]||value.configuration!==configurations.get(id)).map(([id])=>id))
    // Remove dependent layers before replacing a source. Native style sources are never removed.
    for(const [id,value] of [...this.layers].reverse()){
      const layer=layers.find(item=>item.id===id)
      const old=this.map.getLayer(this.layerId(id))
      const source=old && 'source' in old ? old.source : undefined
      if(!layer||value.definition!==definitions.get(id)||[...changed].some(key=>this.sourceId(key)===source)){
        if(old)this.map.removeLayer(this.layerId(id));this.layers.delete(id)
      }
    }
    for(const id of changed){if(this.map.getSource(this.sourceId(id)))this.map.removeSource(this.sourceId(id));this.sources.delete(id)}
    for(const [id,source] of Object.entries(sources)){
      const scoped=this.sourceId(id)
      const geometry=source.type==='geojson'?JSON.stringify(source.data):undefined
      if(!this.sources.has(id)){
        this.map.addSource(scoped,source);this.sources.set(id,{configuration:configurations.get(id)!,geometry})
      }else if(source.type==='geojson'&&this.sources.get(id)!.geometry!==geometry){
        (this.map.getSource(scoped) as GeoJSONSource).setData(source.data)
        this.sources.get(id)!.geometry=geometry
      }
    }
    for(const layer of layers){
      const {beforeId,...native}=layer
      const source='source' in native&&typeof native.source==='string'&&sources[native.source]?this.sourceId(native.source):'source' in native?native.source:undefined
      const definition={...native,id:this.layerId(layer.id),...('source' in native?{source}:{} )} as LayerSpecification
      const before=beforeId&&(ids.has(beforeId)?this.layerId(beforeId):beforeId)
      if(!this.layers.has(layer.id)){
        this.map.addLayer(definition,before&&this.map.getLayer(before)?before:undefined)
        this.layers.set(layer.id,{definition:definitions.get(layer.id)!})
      }
    }
    const order=this.map.getStyle().layers.map(layer=>layer.id)
    const move=(id:string,before?:string)=>{
      const index=order.indexOf(id)
      if(before?order[index+1]===before:index===order.length-1)return
      this.map.moveLayer?.(id,before)
      order.splice(index,1);order.splice(before?order.indexOf(before):order.length,0,id)
    }
    // Simulate the desired order first. Moving already-ordered layers to the end
    // emits needless style events and can feed parent render loops.
    const owned=new Set(layers.map(layer=>this.layerId(layer.id)))
    const desired=[...order.filter(id=>!owned.has(id)),...owned]
    for(const layer of [...layers].reverse()){
      const before=layer.beforeId&&(ids.has(layer.beforeId)?this.layerId(layer.beforeId):layer.beforeId)
      const id=this.layerId(layer.id)
      if(before===id)throw Error('A layer cannot be ordered before itself')
      if(before && desired.includes(before)){desired.splice(desired.indexOf(id),1);desired.splice(desired.indexOf(before),0,id)}
    }
    if(JSON.stringify(order)!==JSON.stringify(desired)){
      for(let index=desired.length-1;index>=0;index--)if(owned.has(desired[index]))move(desired[index],desired[index+1])
    }
  }
}
