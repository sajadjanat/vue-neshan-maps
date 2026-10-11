import type * as L from 'leaflet'
import type { LeafletNamespace, SdkOptions } from './loader'

export type Coordinates = [latitude: number, longitude: number]
export interface NeshanMapOptions extends L.MapOptions {
  key?: string
  maptype?: string
  poi?: boolean
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
export interface MapCircle { id: string | number; center: Coordinates; radius: number; options?: L.CircleMarkerOptions }
export interface MapReady { map: L.Map; L: LeafletNamespace }
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
  circles?: MapCircle[]
  geojson?: GeoJSON.GeoJsonObject
  geojsonOptions?: L.GeoJSONOptions
  fitMarkers?: boolean
  sdk?: SdkOptions
  ariaLabel?: string
}
