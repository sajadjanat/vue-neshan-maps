import { describe,it,expect,vi,afterEach } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { lngLat,circleRing,closeRing,setLiveLayers,loadMapLibreStyle,safeMapLibreOptions,claimMapLibreKey,releaseMapLibreKey } from '../src/maplibre'
import Component from '../src/components/NeshanMapLibre.vue'
afterEach(()=>vi.unstubAllGlobals())
describe('MapLibre adapter',()=>{
  it('converts the public latitude-first API and rejects invalid coordinates',()=>{
    expect(lngLat([35.7,51.3])).toEqual([51.3,35.7])
    expect(()=>lngLat([91,51])).toThrow('Coordinates')
    expect(()=>lngLat([35,NaN])).toThrow('Coordinates')
  })
  it('creates a closed geodesic radius in meters and validates polygons',()=>{
    const ring=circleRing([0,0],1000)
    expect(ring).toHaveLength(65)
    expect(ring[0][0]).toBeCloseTo(ring[64][0],8)
    expect(ring[0][1]).toBeCloseTo(1000/6371008.8*180/Math.PI,8)
    expect(()=>circleRing([35,51],-1)).toThrow('radius')
    expect(closeRing([[35,51],[36,51],[36,52]])).toEqual([[51,35],[51,36],[52,36],[51,35]])
    expect(()=>closeRing([[35,51]])).toThrow('three')
  })
  it('toggles actual style sources while preserving unrelated layers',()=>{
    const setLayoutProperty=vi.fn()
    const map={getStyle:()=>({layers:[{id:'traffic-minor',source:'traffic'},{id:'points',source:'points_source'},{id:'custom',source:'app'},{id:'point-label',source:'composite'}]}),setLayoutProperty}
    expect(setLiveLayers(map as never,true,false)).toEqual({traffic:['traffic-minor'],poi:['points']})
    expect(setLayoutProperty.mock.calls).toEqual([['traffic-minor','visibility','visible'],['points','visibility','none']])
    setLayoutProperty.mockClear();setLiveLayers(map as never,false,true)
    expect(setLayoutProperty.mock.calls).toEqual([['traffic-minor','visibility','none'],['points','visibility','visible']])
  })
  it('sanitizes source attributions, including adjacent dangerous attributes, without mutating caller data',async()=>{
    const style={version:8,sources:{test:{type:'vector',tiles:[],attribution:'<details open onload="bad()" ontoggle="bad()">bad</details><a href="javascript:bad()" onclick="bad()">credit</a>'}},layers:[]}
    const result=await loadMapLibreStyle(style as never)
    const attribution=(result.sources.test as any).attribution
    expect(attribution).not.toMatch(/onload|ontoggle|onclick|javascript:|details/)
    expect(attribution).toContain('credit')
    expect(style.sources.test.attribution).toContain('ontoggle')
  })
  it('reports failed remote styles and validates style version',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403}))
    await expect(loadMapLibreStyle('https://example.test/style')).rejects.toThrow('403')
    await expect(loadMapLibreStyle({version:7,sources:{},layers:[]}as never)).rejects.toThrow('version 8')
  })
  it('sanitizes custom attribution control input before constructing the vendor map',()=>{
    const options={attributionControl:{customAttribution:['<a onclick="bad()" href="javascript:bad()">credit</a>']}}
    const result=safeMapLibreOptions(options)
    expect((result.attributionControl as any).customAttribution[0]).toBe('<a>credit</a>')
    expect(options.attributionControl.customAttribution[0]).toContain('onclick')
  })
  it('prevents simultaneous maps from overwriting the vendor global key',()=>{
    const a={},b={}
    try{
      claimMapLibreKey(a,'web.fixture-one');claimMapLibreKey(b,'web.fixture-one')
      expect(()=>claimMapLibreKey(b,'web.fixture-two')).toThrow('same API key')
      releaseMapLibreKey(a);claimMapLibreKey(b,'web.fixture-two')
    }finally{releaseMapLibreKey(a);releaseMapLibreKey(b)}
  })
  it('renders safely on the server without importing the SDK or calling fetch',async()=>{
    const fetch=vi.fn();vi.stubGlobal('fetch',fetch)
    const html=await renderToString(createSSRApp(Component,{apiKey:'web.fixture-key'}))
    expect(html).toContain('Loading map');expect(fetch).not.toHaveBeenCalled()
  })
})
