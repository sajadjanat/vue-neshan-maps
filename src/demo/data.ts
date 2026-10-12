import type { Coordinates } from '../types'

export function samplePoints(count: number, revision = 0): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return { type: 'FeatureCollection', features: Array.from({length: Math.max(0, Math.min(10000, Math.floor(count)))}, (_, i) => ({
    type: 'Feature', id: i, properties: {weight: 1 + i % 5},
    geometry: {type: 'Point', coordinates: [51.36 + Math.sin(i * 2.4) * (.01 + (i % 37) / 500) + revision * .0003, 35.72 + Math.cos(i * 1.7) * (.01 + (i % 29) / 600)]},
  })) }
}
export const district: GeoJSON.Feature<GeoJSON.Polygon> = {type:'Feature', properties:{name:'Demo area',height:450}, geometry:{type:'Polygon',coordinates:[[[51.365,35.725],[51.38,35.725],[51.38,35.737],[51.365,35.737],[51.365,35.725]]]}}
export const customArea: GeoJSON.Feature<GeoJSON.Polygon> = {type:'Feature', properties:{name:'Custom GeoJSON'}, geometry:{type:'Polygon',coordinates:[[[51.325,35.725],[51.345,35.725],[51.345,35.74],[51.325,35.74],[51.325,35.725]]]}}
export function distanceMeters(points: Coordinates[]): number {
  const rad = Math.PI / 180
  return points.slice(1).reduce((total,b,i)=>{
    const a=points[i], h=Math.sin((b[0]-a[0])*rad/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin((b[1]-a[1])*rad/2)**2
    return total + 12742017.6 * Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)))
  },0)
}
/** Bounded, inline-only input: editor data never becomes a URL or executable HTML. */
export function parseGeoJSON(text: string): GeoJSON.Feature | GeoJSON.FeatureCollection {
  if(text.length>1_000_000 || new TextEncoder().encode(text).length>1_000_000) throw Error('GeoJSON input exceeds 1 MB')
  const value = JSON.parse(text)
  const geometries: Record<string,number> = {Point:0,MultiPoint:1,LineString:1,MultiLineString:2,Polygon:2,MultiPolygon:3}
  const coordinates=(data:unknown,depth:number):boolean=>Array.isArray(data) && (depth===0 ? data.length>=2 && data.every(Number.isFinite) && Math.abs(data[0])<=180 && Math.abs(data[1])<=90 : data.length>0 && data.every(item=>coordinates(item,depth-1)))
  const geometry=(g:any):boolean=>g && (g.type==='GeometryCollection' ? Array.isArray(g.geometries)&&g.geometries.every(geometry) : Object.hasOwn(geometries,g.type)&&coordinates(g.coordinates,geometries[g.type]))
  const feature=(f:any)=>f?.type==='Feature' && geometry(f.geometry) && (f.properties===null || typeof f.properties==='object')
  if(value?.type==='Feature' ? feature(value) : value?.type==='FeatureCollection' && Array.isArray(value.features) && value.features.length<=10000 && value.features.every(feature)) return value
  throw Error('Invalid GeoJSON')
}
