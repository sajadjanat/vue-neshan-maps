import type { Coordinates, MapMarker, MapCircle, MapPolyline, MapPolygon, MapLibreAdvancedLayer } from '../index'
import type { ExampleId, Language } from './catalog'
export const initialCenter:Coordinates=[35.72,51.36]
export const examplePoints:GeoJSON.FeatureCollection={type:'FeatureCollection',features:Array.from({length:120},(_,i)=>({type:'Feature',properties:{weight:1+i%7},geometry:{type:'Point',coordinates:[51.36+Math.sin(i*2.4)*(.008+(i%12)*.002),35.72+Math.cos(i*1.7)*(.006+(i%9)*.002)]}}))}
export const exampleArea:GeoJSON.FeatureCollection={type:'FeatureCollection',features:[{type:'Feature',properties:{height:500},geometry:{type:'Polygon',coordinates:[[[51.35,35.71],[51.37,35.71],[51.37,35.73],[51.35,35.73],[51.35,35.71]]]}}]}
export const makeMarkers=(language:Language)=>[{id:'azadi',position:[35.6997,51.338] as Coordinates,popup:language==='fa'?'میدان آزادی':'Azadi Square',tooltip:language==='fa'?'مارکر را جابه‌جا کنید':'Drag this marker',options:{draggable:true}},{id:'milad',position:[35.7448,51.3753] as Coordinates,popup:language==='fa'?'برج میلاد':'Milad Tower',options:{draggable:true}}]
export const exampleCircles:MapCircle[]=[{id:'area',center:[35.6997,51.338],radius:900,options:{color:'#238d86',fillOpacity:.15}}]
export const exampleLines:MapPolyline[]=[{id:'connection',positions:[[35.6997,51.338],[35.7448,51.3753]],options:{color:'#315cf4',weight:4}}]
export const examplePolygons:MapPolygon[]=[{id:'zone',positions:[[35.71,51.35],[35.73,51.35],[35.73,51.37],[35.71,51.37]],options:{color:'#7860d4',fillOpacity:.15}}]
export const exampleLayers:MapLibreAdvancedLayer[]=[{id:'district-3d',type:'fill-extrusion',source:'district',paint:{'fill-extrusion-color':'#7860d4','fill-extrusion-height':['get','height'],'fill-extrusion-opacity':.72}}]
export const hasPoints=(id:ExampleId)=>['geojson','clusters','heatmap'].includes(id)
export interface ExampleSettings {id:ExampleId;language:Language;dark:boolean;traffic:boolean;poi:boolean;cluster:boolean;heatmap:boolean;radius:number;intensity:number;shapes:boolean}
export function exampleCode(s:ExampleSettings) {
  const leaflet=s.id==='leaflet',component=leaflet?'NeshanMapLeaflet':'NeshanMapLibre'
  const markerExample=['markers','methods','leaflet'].includes(s.id)
  const shapeExample=s.id==='shapes'&&s.shapes
  const points=hasPoints(s.id)
  const markerType=leaflet?'MapMarker':'MapLibreMarker'
  let setup=`import { ref${markerExample?', shallowRef':''} } from 'vue'\nimport { ${component}${leaflet?'':', MAPLIBRE_STYLES'}, type Coordinates${markerExample?`, type ${markerType}`:''}${shapeExample?', type MapCircle, type MapPolyline, type MapPolygon':''}${s.id==='advanced'?', type MapLibreAdvancedLayer':''} } from 'vue-neshan-maps'\nimport 'vue-neshan-maps/style.css'\n\nconst webKey = import.meta.env.VITE_NESHAN_WEB_KEY\nconst center = ref<Coordinates>([35.72, 51.36])\nconst zoom = ref(12.2)`
  let attributes=`    v-model="center" v-model:zoom="zoom"\n    :api-key="webKey"\n    :styles="{ height: '420px' }"\n    :center-marker="${s.id==='model'}"`
  if(leaflet)attributes+=`\n    :options="{ maptype: '${s.dark?'standard-night':'dreamy'}' }"`
  else attributes+=`\n    :map-style="MAPLIBRE_STYLES.${s.dark?'dark':'light'}"\n    :traffic="${s.traffic}" :poi="${s.poi}"`
  if(s.id==='model')attributes+='\n    :pick-on-click="true"'
  if(markerExample){setup+=`\nconst markers = shallowRef<${markerType}[]>(${JSON.stringify(makeMarkers(s.language),null,2)})\nfunction saveMarker(marker: ${markerType}, position: Coordinates) {\n  markers.value = markers.value.map(item => item.id === marker.id ? { ...item, position } : item)\n}`;attributes+='\n    :markers="markers" @marker-dragend="saveMarker"'}
  if(points){setup+=`\nconst geojson: GeoJSON.FeatureCollection = {\n  type: 'FeatureCollection',\n  features: Array.from({ length: 120 }, (_, i) => ({\n    type: 'Feature',\n    properties: { weight: 1 + i % 7 },\n    geometry: { type: 'Point', coordinates: [\n      51.36 + Math.sin(i * 2.4) * (.008 + (i % 12) * .002),\n      35.72 + Math.cos(i * 1.7) * (.006 + (i % 9) * .002),\n    ] },\n  })),\n}`;attributes+=`\n    :geojson="geojson"\n    :cluster='${JSON.stringify(s.cluster?{radius:s.radius,maxZoom:14,expandOnClick:false}:false)}'\n    :heatmap='${JSON.stringify(s.heatmap?{weightProperty:'weight',intensity:s.intensity,radius:24,opacity:.6}:false)}'`}
  if(shapeExample){setup+=`\nconst circles: MapCircle[] = ${JSON.stringify(exampleCircles,null,2)}\nconst polylines: MapPolyline[] = ${JSON.stringify(exampleLines,null,2)}\nconst polygons: MapPolygon[] = ${JSON.stringify(examplePolygons,null,2)}`;attributes+='\n    :circles="circles" :polylines="polylines" :polygons="polygons"'}
  if(s.id==='advanced'){setup+=`\nconst district: GeoJSON.FeatureCollection = ${JSON.stringify(exampleArea)}\nconst sources = { district: { type: 'geojson' as const, data: district } }\nconst layers: MapLibreAdvancedLayer[] = ${JSON.stringify(exampleLayers,null,2)}\nfunction ready({ map }: import('vue-neshan-maps').MapLibreReady) { map.setPitch(48) }`;attributes+='\n    :sources="sources" :layers="layers" @ready="ready"'}
  if(s.id==='methods'){setup+="\nconst mapRef = ref<InstanceType<typeof NeshanMapLibre>>()\nfunction fly() { mapRef.value?.flyTo([35.7448, 51.3753], 15) }";attributes+='\n    ref="mapRef"'}
  if(s.id==='errors'){setup+="\nfunction onResourceError(failure: import('vue-neshan-maps').MapResourceFailure) {\n  console.info(failure.kind, failure.retryable)\n}";attributes+='\n    @resource-error="onResourceError"'}
  const tail=s.id==='methods'?'\n  <button @click="fly">Milad Tower</button>':s.id==='model'?'\n  <p>{{ center[0] }}, {{ center[1] }} · {{ zoom }}</p>':''
  return `<script setup lang="ts">\n${setup}\n<\/script>\n\n<template>\n  <${component}\n${attributes}\n  />${tail}\n</template>`
}
