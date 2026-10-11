import type * as L from 'leaflet'
import type { LeafletNamespace, SdkOptions } from './loader'

export type Coordinates = [latitude: number, longitude: number]
export type NeshanMapType = 'dreamy' | 'standard-night' | (string & {})
export interface NeshanLeafletMap extends L.Map { setMapType(type: string): this }
export interface TileState { status: 'idle' | 'loading' | 'loaded' | 'error'; loaded: number; failed: number }
export interface NeshanMapOptions extends L.MapOptions {
  key?: string
  maptype?: NeshanMapType
  /** @deprecated Neshan no longer updates POI tiles for Leaflet. Ignored with a warning. */
  poi?: boolean
  /** @deprecated Neshan no longer updates traffic tiles for Leaflet. Ignored with a warning. */
  traffic?: boolean
}
export interface MapMarker {
  id: string | number
  position: Coordinates
  /** Plain text. HTML is intentionally not interpreted. */
  popup?: string
  tooltip?: string
  options?: L.MarkerOptions
}
export interface MapPolyline { id: string | number; positions: Coordinates[]; options?: L.PolylineOptions }
export interface MapPolygon { id: string | number; positions: Coordinates[] | Coordinates[][]; options?: L.PolylineOptions }
export interface MapCircle { id: string | number; center: Coordinates; radius: number; options?: L.CircleMarkerOptions }
export interface MapReady { map: NeshanLeafletMap; L: LeafletNamespace }
export interface NeshanMapProps {
  apiKey?: string
  options?: NeshanMapOptions
  modelValue?: Coordinates
  zoom?: number
  styles?: Record<string, string | number>
  centerMarker?: boolean
  pickOnClick?: boolean
  markers?: MapMarker[]
  polylines?: MapPolyline[]
  polygons?: MapPolygon[]
  circles?: MapCircle[]
  geojson?: GeoJSON.GeoJsonObject
  geojsonOptions?: L.GeoJSONOptions
  fitMarkers?: boolean
  sdk?: SdkOptions
  ariaLabel?: string
}
