import type { Map, MarkerOptions, MapMouseEvent, StyleSpecification, GeoJSONSourceSpecification, LayerSpecification } from 'maplibre-gl'
import type { NeshanMapOptions as VendorOptions } from '@neshan-maps-platform/maplibre-sdk'
import type { Coordinates, MapPolyline, MapPolygon, MapCircle } from './types'
import type { MapLibreNamespace } from './maplibre'
export interface MapLibreMarker {
  id:string|number
  position:Coordinates
  popup?:string
  tooltip?:string
  options?:Omit<MarkerOptions,'element'>
  /** Native custom DOM marker. The app owns sanitizing this element. */
  element?:HTMLElement
}
export interface MapLibreReady {map:Map;maplibre:MapLibreNamespace}
export type MapLibreClickEvent=MapMouseEvent & {coordinates:Coordinates}
export interface LiveLayerState {traffic:boolean;poi:boolean;trafficLayers:string[];poiLayers:string[]}
export type MapLibreOverlayLayer = LayerSpecification extends infer T ? T extends LayerSpecification ? Omit<T,'source'> : never : never
export interface MapLibreProps {
  apiKey:string
  modelValue?:Coordinates
  zoom?:number
  mapStyle?:string|StyleSpecification
  options?:Omit<VendorOptions,'container'|'apiKey'|'center'|'zoom'|'style'>
  traffic?:boolean
  poi?:boolean
  markers?:MapLibreMarker[]
  polylines?:MapPolyline[]
  polygons?:MapPolygon[]
  circles?:MapCircle[]
  geojson?:GeoJSON.GeoJSON
  /** Native style for the supplied GeoJSON source. Defaults support points, lines and polygons. */
  geojsonLayers?:MapLibreOverlayLayer[]
  geojsonOptions?:Omit<GeoJSONSourceSpecification,'data'|'type'>
  fitMarkers?:boolean
  pickOnClick?:boolean
  centerMarker?:boolean
  styles?:Record<string,string|number>
  ariaLabel?:string
}
