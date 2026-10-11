import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

describe('SDK loader', () => {
  beforeEach(() => { vi.resetModules(); delete window.L; document.head.innerHTML = '' })
  afterEach(() => { vi.useRealTimers(); delete window.L })
  it('deduplicates concurrent loads and waits for CSS', async () => {
    const { loadNeshanSdk } = await import('../src/loader')
    const first = loadNeshanSdk()
    expect(loadNeshanSdk()).toBe(first)
    expect(document.querySelectorAll('script')).toHaveLength(1)
    window.L = {version:'1.9.4',Map:class {setMapType(){}}} as never
    document.querySelector('script')!.dispatchEvent(new Event('load'))
    let resolved = false
    first.then(() => { resolved = true })
    await Promise.resolve()
    expect(resolved).toBe(false)
    document.querySelector('link')!.dispatchEvent(new Event('load'))
    expect(await first).toBe(window.L)
  })
  it('removes failed resources and allows retry', async () => {
    const { loadNeshanSdk } = await import('../src/loader')
    const first = loadNeshanSdk()
    const assertion = expect(first).rejects.toThrow('Unable to load')
    document.querySelector('script')!.dispatchEvent(new Event('error'))
    await assertion
    expect(document.querySelectorAll('script,link')).toHaveLength(0)
    const retry = loadNeshanSdk()
    window.L = {version:'1.9.4',Map:class {setMapType(){}}} as never
    document.querySelector('script')!.dispatchEvent(new Event('load'))
    document.querySelector('link')!.dispatchEvent(new Event('load'))
    await expect(retry).resolves.toBe(window.L)
  })
  it('times out and supports CSP nonce', async () => {
    vi.useFakeTimers()
    const { loadNeshanSdk } = await import('../src/loader')
    const promise = loadNeshanSdk({ timeout: 100, nonce: 'test-nonce' })
    expect(document.querySelector('script')!.nonce).toBe('test-nonce')
    const assertion = expect(promise).rejects.toThrow('Unable to load')
    await vi.advanceTimersByTimeAsync(100)
    await assertion
    expect(document.querySelector('script')).toBeNull()
  })
  it('loads missing CSS for a preloaded global and retries CSS failures', async () => {
    window.L = {version:'1.9.4',Map:class {setMapType(){}}} as never
    const { loadNeshanSdk } = await import('../src/loader')
    const first = loadNeshanSdk()
    expect(document.querySelector('script')).toBeNull()
    const assertion = expect(first).rejects.toThrow('Unable to load')
    document.querySelector('link')!.dispatchEvent(new Event('error'))
    await assertion
    const second = loadNeshanSdk()
    document.querySelector('link')!.dispatchEvent(new Event('load'))
    await expect(second).resolves.toBe(window.L)
  })
  it('rejects old or vanilla Leaflet globals before loading resources',async()=>{
    window.L={version:'1.4.0',Map:class {}} as never
    const {loadNeshanSdk}=await import('../src/loader')
    await expect(loadNeshanSdk()).rejects.toThrow('incompatible Leaflet')
    expect(document.querySelector('script,link')).toBeNull()
    window.L={version:'1.9.4',Map:class {}} as never
    await expect(loadNeshanSdk()).rejects.toThrow('incompatible Leaflet')
  })
})
