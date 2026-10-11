import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import NeshanMap from '../src/components/NeshanMapLeaflet.vue'
import { NeshanMapPlugin } from '../src/index'
import { loadNeshanSdk } from '../src/loader'
vi.mock('../src/loader', () => ({ loadNeshanSdk: vi.fn() }))

function mockSdk() {
  const maps: any[] = []
  const markers: any[] = []
  const group = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() }
  const shape = () => ({ addTo: vi.fn().mockReturnThis() })
  class Map {
    center: number[]; zoom: number; events: Record<string, Function> = {}
    eachLayer = vi.fn(); stopLocate = vi.fn(); setMapType = vi.fn(); remove = vi.fn(); off = vi.fn(); fitBounds = vi.fn(); invalidateSize = vi.fn()
    constructor(public element: string, public options: any) { this.center = Array.isArray(options.center) ? options.center : [options.center.lat, options.center.lng]; this.zoom = options.zoom; maps.push(this) }
    on(event: string, callback: Function) { this.events[event] = callback; return this }
    getCenter() { return { lat: this.center[0], lng: this.center[1], equals: (point: any) => point.lat === this.center[0] && point.lng === this.center[1] } }
    getZoom() { return this.zoom }
    setView = vi.fn((center: number[], zoom: number) => { this.center = center; this.zoom = zoom })
    setZoom = vi.fn((zoom: number) => { this.zoom = zoom })
    panTo = vi.fn()
  }
  const sdk = { Map, latLng: (point: number[]) => ({lat:point[0],lng:point[1]}), layerGroup: () => group,
    marker: vi.fn((position: number[]) => { const marker = { ...shape(), bindPopup: vi.fn(), bindTooltip: vi.fn(), getPopup: vi.fn(), getTooltip: vi.fn(), getElement: vi.fn(), remove: vi.fn(), on: vi.fn(), getLatLng: () => ({lat: position[0], lng: position[1]}) }; markers.push(marker); return marker }),
    polygon: vi.fn(shape), polyline: vi.fn(shape), circle: vi.fn(shape), geoJSON: vi.fn(shape), latLngBounds: (points: any) => points,
  }
  vi.mocked(loadNeshanSdk).mockResolvedValue(sdk as never)
  return { sdk, maps, markers, group }
}

describe('Vue map', () => {
  beforeEach(() => vi.clearAllMocks())
  it('initializes, emits model changes, reacts to props and removes its instance', async () => {
    const { maps } = mockSdk()
    const wrapper = mount(NeshanMap, { props: { apiKey: 'web.test-fixture', modelValue: [35, 51], zoom: 12 } })
    await flushPromises()
    expect(wrapper.emitted('ready')).toHaveLength(1)
    expect(maps[0].options.center).toEqual([35, 51])
    maps[0].center = [36, 52]
    maps[0].events.moveend({})
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([[36, 52]])
    expect(wrapper.emitted('latitude')![0]).toEqual([36])
    await wrapper.setProps({ modelValue: [37, 53], zoom: 14 })
    expect(maps[0].setView).toHaveBeenCalledWith([37, 53], 14)
    wrapper.unmount()
    expect(maps[0].remove).toHaveBeenCalledOnce()
    expect(maps[0].off).toHaveBeenCalledOnce()
  })
  it('never initializes after unmount while the SDK is loading', async () => {
    const { sdk, maps } = mockSdk()
    let resolve!: Function
    vi.mocked(loadNeshanSdk).mockReturnValue(new Promise(r => { resolve = r }))
    const wrapper = mount(NeshanMap, { props: { apiKey: 'web.test-fixture' } })
    wrapper.unmount(); resolve(sdk); await flushPromises()
    expect(maps).toHaveLength(0)
  })
  it('ignores unsupported traffic without rebuilding the map', async () => {
    const { maps } = mockSdk()
    const wrapper = mount(NeshanMap, { props: { options: { key: 'web.test-fixture' }, modelValue: [35, 51] } })
    await flushPromises()
    await wrapper.setProps({ options: { key: 'web.test-fixture', traffic: true } })
    await flushPromises()
    expect(maps).toHaveLength(1)
    expect(maps[0].remove).not.toHaveBeenCalled()
    expect(maps[0].options.traffic).toBe(false)
    expect(wrapper.emitted('warning')).toHaveLength(1)
    wrapper.unmount()
  })
  it('renders all layers, treats popup text safely and updates layers', async () => {
    const { sdk, markers, group } = mockSdk()
    const wrapper = mount(NeshanMap, { props: {
      apiKey: 'web.test-fixture', markers: [{id: 1, position: [35,51], popup: '<img src=x onerror=alert(1)>'}],
      polylines: [{id: 2, positions: [[35,51],[36,52]]}], circles: [{id: 3, center: [35,51], radius: 100}],
      geojson: {type: 'FeatureCollection', features: []}, fitMarkers: true,
    } })
    await flushPromises()
    const popup = markers[0].bindPopup.mock.calls[0][0]
    expect(popup.textContent).toContain('<img')
    expect(popup.querySelector('img')).toBeNull()
    expect(sdk.polyline).toHaveBeenCalledOnce(); expect(sdk.circle).toHaveBeenCalledOnce(); expect(sdk.geoJSON).toHaveBeenCalledOnce()
    await wrapper.setProps({ markers: [] })
    expect(markers[0].remove).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
  it('supports click picking and reports failures with retry', async () => {
    const { maps, sdk } = mockSdk()
    vi.mocked(loadNeshanSdk).mockRejectedValueOnce(new Error('Network unavailable'))
    const wrapper = mount(NeshanMap, { props: { apiKey: 'web.test-fixture', pickOnClick: true } })
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('Network unavailable')
    vi.mocked(loadNeshanSdk).mockResolvedValue(sdk as never)
    await wrapper.get('button').trigger('click'); await flushPromises()
    maps[0].events.click({latlng: {lat: 35, lng: 51}})
    expect(maps[0].panTo).toHaveBeenCalledWith({lat: 35, lng: 51})
    wrapper.unmount()
  })
  it('rejects service keys before network activity', async () => {
    mockSdk()
    const wrapper = mount(NeshanMap, { props: {apiKey: 'service.test'} })
    await flushPromises()
    expect(loadNeshanSdk).not.toHaveBeenCalled()
    expect(wrapper.emitted('error')).toHaveLength(1)
    wrapper.unmount()
  })
  it('renders on the server without loading a browser SDK', async () => {
    const html = await renderToString(createSSRApp(NeshanMap, {apiKey: 'web.test-fixture'}))
    expect(html).toContain('Loading map')
    expect(loadNeshanSdk).not.toHaveBeenCalled()
  })
  it('registers the component through app.use', () => {
    const app = createSSRApp({render: () => null})
    app.use(NeshanMapPlugin)
    expect(app.component('NeshanMapLeaflet')).toBeDefined()
  })
  it('gives concurrent maps distinct string IDs required by the Neshan SDK', async () => {
    const { maps } = mockSdk()
    const a = mount(NeshanMap, { props: {apiKey: 'web.test-fixture'} })
    const b = mount(NeshanMap, { props: {apiKey: 'web.test-fixture'} })
    await flushPromises()
    expect(typeof maps[0].element).toBe('string')
    expect(maps[0].element).not.toBe(maps[1].element)
    expect(a.get('.neshan-map__canvas').attributes('id')).toBe(maps[0].element)
    a.unmount(); b.unmount()
  })
  it('preserves an uncontrolled view when unsupported options change', async () => {
    const { maps } = mockSdk()
    const wrapper = mount(NeshanMap, { props: {apiKey: 'web.test-fixture'} })
    await flushPromises()
    maps[0].center = [36, 52]; maps[0].zoom = 15
    await wrapper.setProps({ options: {traffic: true} })
    await flushPromises()
    expect(maps[0].center).toEqual([36, 52])
    expect(maps[0].zoom).toBe(15)
    wrapper.unmount()
  })
})
