import {describe,it,expect,vi,afterEach} from 'vitest'
import {fetchNeshanTile,normalizeResourceError,NeshanResourceError,serializeResourceError} from '../src/resource-errors'
afterEach(()=>vi.unstubAllGlobals())
describe('redacted Neshan resource failures',()=>{
  it.each([[480,'invalid-key'],[481,'quota'],[482,'rate-limit'],[483,'key-type'],[484,'domain'],[485,'service'],[429,'rate-limit'],[503,'server'],[403,'forbidden']])('classifies HTTP %s',async(status,kind)=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('private upstream content',{status:Number(status),headers:{'Retry-After':'30'}})))
    const failure=await fetchNeshanTile('https://example.test/tile?key=private-key').catch(normalizeResourceError)
    expect(failure).toMatchObject({kind,status,retryAfter:30})
    expect(JSON.stringify(failure)).not.toMatch(/private|example\.test/)
  })
  it('uses a structured provider code and preserves it across serialized errors',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({code:485}),{status:403})))
    const error=await fetchNeshanTile('https://example.test').catch(e=>e)
    expect(error).toBeInstanceOf(NeshanResourceError)
    expect(normalizeResourceError(error)).toMatchObject({kind:'service',status:403,code:485,retryable:false})
    expect(normalizeResourceError({message:error.message})).toMatchObject({kind:'service',code:485})
    expect(normalizeResourceError(new Error(serializeResourceError(error)))).toMatchObject({kind:'service',status:403,code:485})
  })
  it('reports network failures without forwarding the raw URL and preserves cancellation',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('private request URL')))
    expect(await fetchNeshanTile('https://example.test').catch(normalizeResourceError)).toMatchObject({kind:'network',retryable:true})
    const controller=new AbortController();controller.abort()
    await expect(fetchNeshanTile('https://example.test',controller.signal)).rejects.toThrow('private request URL')
  })
  it.each([204,404])('treats %s as an empty tile',async status=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status})))
    expect(await fetchNeshanTile('https://example.test')).toBeNull()
  })
})
