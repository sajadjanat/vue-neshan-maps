import { shallowRef, onScopeDispose } from 'vue'
import type { MapReady } from './types'
/** Pass onReady to @ready; refs are shallow to keep Leaflet instances out of Vue proxies. */
export function useNeshanMap() {
  const map = shallowRef<MapReady['map']>()
  const leaflet = shallowRef<MapReady['L']>()
  const onReady = (context: MapReady) => { map.value = context.map; leaflet.value = context.L }
  const onDestroy = () => { map.value = undefined; leaflet.value = undefined }
  onScopeDispose(onDestroy)
  return { map, leaflet, onReady, onDestroy }
}
