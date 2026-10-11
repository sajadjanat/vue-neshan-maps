import { shallowRef, onBeforeUnmount } from 'vue'
import type { MapLibreReady } from './maplibre-types'
export function useNeshanMapLibre(){
  const map=shallowRef<MapLibreReady['map']>(),maplibre=shallowRef<MapLibreReady['maplibre']>()
  const onReady=(context:MapLibreReady)=>{map.value=context.map;maplibre.value=context.maplibre}
  const onDestroy=()=>{map.value=undefined;maplibre.value=undefined}
  onBeforeUnmount(onDestroy)
  return {map,maplibre,onReady,onDestroy}
}
