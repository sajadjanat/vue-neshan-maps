import type { Map, MarkerOptions, MapMouseEvent, StyleSpecification, GeoJSONSourceSpecification, LayerSpecification, SourceSpecification } from 'maplibre-gl'
import type { NeshanMapLibreOptions as VendorOptions } from './maplibre'
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
export interface MapLibreClusterOptions {radius?:number;maxZoom?:number;minPoints?:number;expandOnClick?:boolean;color?:string;pointColor?:string;textColor?:string}
export interface MapLibreHeatmapOptions {weightProperty?:string;intensity?:number;radius?:number;opacity?:number;maxZoom?:number}
export type MapLibreAdvancedLayer = LayerSpecification & {beforeId?:string}
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
  /** Cluster points in geojson. Existing geojsonOptions.cluster remains supported. */
  cluster?:boolean|MapLibreClusterOptions
  /** Render geojson points as a weighted heatmap. */
  heatmap?:boolean|MapLibreHeatmapOptions
  /** Application-owned GeoJSON, vector, raster and other native sources. */
  sources?:Record<string,SourceSpecification>
  /** IDs are scoped to this component; source references resolve to sources above or native style sources. */
  layers?:MapLibreAdvancedLayer[]
  fitMarkers?:boolean
  pickOnClick?:boolean
  centerMarker?:boolean
  styles?:Record<string,string|number>
  ariaLabel?:string
}
