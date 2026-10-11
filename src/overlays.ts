import { toRaw } from 'vue'
import type * as L from 'leaflet'
import type { LeafletNamespace } from './loader'
import type { MapMarker, Coordinates } from './types'

function text(value: string) { const el = document.createElement('span'); el.textContent = value; return el }
function sameOptions(a: L.MarkerOptions, b: L.MarkerOptions) {
  return new Set([...Object.keys(a), ...Object.keys(b)]).size === Object.keys(a).length &&
    Object.keys(a).every(key => Object.is(a[key as keyof L.MarkerOptions], b[key as keyof L.MarkerOptions]))
}
/** Retain marker identity so Vue renders cannot interrupt popup/drag interactions. */
export function createMarkers(sdk: LeafletNamespace, map: L.Map, callbacks: {
  click(data: MapMarker, event: L.LeafletMouseEvent): void
  dragend(data: MapMarker, point: Coordinates): void
}) {
  const entries = new Map<MapMarker['id'], { item: L.Marker; data: MapMarker; position: Coordinates; options: L.MarkerOptions; popup?: string; tooltip?: string }>()
  function sync(data: MapMarker[]) {
    const ids = new Set(data.map(marker => marker.id))
    if (ids.size !== data.length) throw new Error('Marker IDs must be unique')
    for (const [id, entry] of entries) if (!ids.has(id)) { entry.item.remove(); entries.delete(id) }
    for (const marker of data) {
      const options = { ...marker.options }
      if (options.icon) options.icon = toRaw(options.icon)
      let entry = entries.get(marker.id)
      if (entry && !sameOptions(entry.options, options)) { entry.item.remove(); entries.delete(marker.id); entry = undefined }
      if (!entry) {
        const item = sdk.marker(marker.position, options).addTo(map)
        entry = { item, data: marker, position: [...marker.position], options }
        entries.set(marker.id, entry)
        const current = entry
        item.on('click', event => callbacks.click(current.data, event as L.LeafletMouseEvent))
        item.on('dragend', () => { const point = item.getLatLng(); callbacks.dragend(current.data, [point.lat, point.lng]) })
        const element = item.getElement()
        if (element) element.dataset.markerId = String(marker.id)
      }
      entry.data = marker
      if (entry.position.some((value, index) => value !== marker.position[index])) {
        entry.item.setLatLng(marker.position); entry.position = [...marker.position]
      }
      if (entry.popup !== marker.popup) {
        if (marker.popup === undefined) entry.item.unbindPopup()
        else if (entry.item.getPopup()) entry.item.getPopup()!.setContent(text(marker.popup))
        else entry.item.bindPopup(text(marker.popup))
        entry.popup = marker.popup
      }
      if (entry.tooltip !== marker.tooltip) {
        if (marker.tooltip === undefined) entry.item.unbindTooltip()
        else if (entry.item.getTooltip()) entry.item.getTooltip()!.setContent(text(marker.tooltip))
        else entry.item.bindTooltip(text(marker.tooltip))
        entry.tooltip = marker.tooltip
      }
    }
  }
  return { sync, clear: () => { entries.forEach(entry => entry.item.remove()); entries.clear() } }
}
