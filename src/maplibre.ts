import type * as maplibregl from 'maplibre-gl'
import type { StyleSpecification, Map as NativeMap, LayerSpecification } from 'maplibre-gl'
import DOMPurify from 'dompurify'
import type { Coordinates } from './types'
import type { MapOptions, ControlPosition } from 'maplibre-gl'

export interface NeshanMapLibreOptions extends MapOptions {
  apiKey: string
  rtl?: boolean | {lazy?:boolean;url?:string}
  logoPosition?: ControlPosition
  copyRightPosition?: ControlPosition
}
type VendorOptions = NeshanMapLibreOptions
export type MapLibreNamespace = Omit<typeof maplibregl,'Map'> & {Map:new(options:NeshanMapLibreOptions)=>NativeMap}
export const MAPLIBRE_STYLES = Object.freeze(Object.fromEntries(
  ['light','dark','monochrome_light','monochrome_dark','pastel'].map(name=>[name,`https://static.neshan.org/sdk/maplibre/styles/${name}.json`]),
) as Record<'light'|'dark'|'monochrome_light'|'monochrome_dark'|'pastel',string>)
let pending: Promise<MapLibreNamespace> | undefined
export function loadNeshanMapLibre() {
  if(typeof window==='undefined') return Promise.reject(new Error('MapLibre requires a browser'))
  // Adapter-only ISC fork: the vulnerable bundled renderer is not shipped.
  // @ts-expect-error Audited JS adapter is typed through the public namespace above.
  return pending ??= import('./vendor/neshan-adapter.js').then(module=>module.default as MapLibreNamespace).catch((error:unknown)=>{pending=undefined;throw error})
}
// The vendor's protocol holds one key per page. Reject conflicting concurrent keys.
const keys=new Map<object,string>()
export function claimMapLibreKey(owner:object,key:string) {
  if([...keys.entries()].some(([other,value])=>other!==owner && value!==key)) throw new Error('Neshan MapLibre requires the same API key for all maps on one page')
  keys.set(owner,key)
}
export function releaseMapLibreKey(owner:object) {keys.delete(owner)}
export function lngLat(point:Coordinates):[number,number] {
  if(!point || !Number.isFinite(point[0]) || !Number.isFinite(point[1]) || Math.abs(point[0])>90 || Math.abs(point[1])>180) throw new Error('Coordinates must be finite latitude/longitude values in range')
  return [point[1],point[0]]
}
/** Fetch and sanitize source attributions before passing them to the vendor renderer. */
export async function loadMapLibreStyle(style:string|StyleSpecification,signal?:AbortSignal):Promise<StyleSpecification> {
  let result:StyleSpecification
  if(typeof style==='string') {
    const response=await fetch(style,{signal})
    if(!response.ok) throw new Error(`Map style request failed (${response.status})`)
    result=await response.json()
  } else result=JSON.parse(JSON.stringify(style))
  if(result.version!==8 || !result.sources || !Array.isArray(result.layers)) throw new Error('A valid MapLibre style version 8 is required')
  for(const source of Object.values(result.sources)) if('attribution' in source && source.attribution) {
    source.attribution=sanitizeAttribution(source.attribution)
  }
  return result
}
function sanitizeAttribution(value:string) {return DOMPurify.sanitize(value,{ALLOWED_TAGS:['a','span','b','br'],ALLOWED_ATTR:['href','title','target','rel']})}
export function safeMapLibreOptions(options:Partial<VendorOptions>={}) {
  const result={...options}
  if(result.attributionControl && typeof result.attributionControl==='object') {
    const control={...result.attributionControl},custom=control.customAttribution
    if(custom)control.customAttribution=Array.isArray(custom)?custom.map(sanitizeAttribution):sanitizeAttribution(custom)
    result.attributionControl=control
  }
  return result
}
export function liveLayerGroups(map:NativeMap) {
  const layers=map.getStyle()?.layers ?? []
  const groups={traffic:[] as string[],poi:[] as string[]}
  for(const layer of layers) {
    if('source' in layer && layer.source==='traffic') groups.traffic.push(layer.id)
    if('source' in layer && layer.source==='points_source') groups.poi.push(layer.id)
  }
  return groups
}
export function setLiveLayers(map:NativeMap,traffic:boolean,poi:boolean) {
  const groups=liveLayerGroups(map)
  for(const id of groups.traffic) map.setLayoutProperty(id,'visibility',traffic?'visible':'none')
  for(const id of groups.poi) map.setLayoutProperty(id,'visibility',poi?'visible':'none')
  return groups
}
export function circleRing(center:Coordinates,radius:number,steps=64):number[][] {
  lngLat(center)
  if(!Number.isFinite(radius)||radius<0) throw new Error('Circle radius must be a non-negative number in meters')
  const lat=center[0]*Math.PI/180,lon=center[1]*Math.PI/180,angular=radius/6371008.8
  return Array.from({length:steps+1},(_,i)=>{
    const bearing=i/steps*2*Math.PI
    const nextLat=Math.asin(Math.sin(lat)*Math.cos(angular)+Math.cos(lat)*Math.sin(angular)*Math.cos(bearing))
    const nextLon=lon+Math.atan2(Math.sin(bearing)*Math.sin(angular)*Math.cos(lat),Math.cos(angular)-Math.sin(lat)*Math.sin(nextLat))
    return [((nextLon*180/Math.PI+540)%360)-180,nextLat*180/Math.PI]
  })
}
export function closeRing(points:Coordinates[]) {
  if(points.length<3) throw new Error('A polygon ring needs at least three points')
  const ring=points.map(lngLat)
  if(ring[0][0]!==ring.at(-1)![0]||ring[0][1]!==ring.at(-1)![1])ring.push([...ring[0]])
  return ring
}
export type OverlayLayer = LayerSpecification
