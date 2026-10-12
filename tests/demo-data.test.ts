import {describe,it,expect} from 'vitest'
import {samplePoints,parseGeoJSON,customArea,distanceMeters} from '../src/demo/data'
import {translate} from '../src/demo/messages'
describe('public demo data boundaries',()=>{
  it('caps generated data, uses stable unique IDs and replaces positions',()=>{
    const data=samplePoints(10001), replacement=samplePoints(10000,1)
    expect(data.features).toHaveLength(10000)
    expect(new Set(data.features.map(f=>f.id)).size).toBe(10000)
    expect(replacement.features[0].id).toBe(data.features[0].id)
    expect(replacement.features[0].geometry.coordinates).not.toEqual(data.features[0].geometry.coordinates)
  })
  it('accepts inline GeoJSON and rejects URLs, malformed coordinates and excessive input',()=>{
    expect(parseGeoJSON(JSON.stringify(customArea))).toEqual(customArea)
    expect(()=>parseGeoJSON('"https://example.com/data.json"')).toThrow()
    expect(()=>parseGeoJSON(JSON.stringify({type:'Feature',properties:{},geometry:{type:'Point',coordinates:[181,35]}}))).toThrow()
    expect(()=>parseGeoJSON(' '.repeat(1000001))).toThrow()
    expect(()=>parseGeoJSON(JSON.stringify({...customArea,properties:{label:'م'.repeat(500001)}}))).toThrow()
    expect(()=>parseGeoJSON(JSON.stringify({type:'FeatureCollection',features:Array(10001).fill(customArea)}))).toThrow()
  })
  it('measures latitude-first geographic segments in meters',()=>{
    expect(distanceMeters([[0,0],[0,1]])).toBeCloseTo(111195.08,1)
    expect(distanceMeters([])).toBe(0)
  })
  it('provides both UI languages for key and quota failures',()=>{
    expect(translate('fa','quota')).toContain('سهمیه')
    expect(translate('en','quota')).toContain('quota')
    expect(translate('fa','keyType')).toContain('کلید وب')
  })
})
