import type * as Leaflet from 'leaflet'

export type LeafletNamespace = typeof Leaflet
export interface SdkOptions { scriptUrl?: string; styleUrl?: string; timeout?: number; nonce?: string }
declare global { interface Window { L?: LeafletNamespace } }
const scriptUrl = 'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.js'
const styleUrl = 'https://static.neshan.org/sdk/leaflet/v1.9.4/neshan-sdk/v1.0.8/index.css'
let pending: Promise<LeafletNamespace> | undefined
function compatible(sdk: LeafletNamespace) {
  return sdk.version === '1.9.4' && typeof (sdk.Map?.prototype as {setMapType?: unknown} | undefined)?.setMapType === 'function'
}

/** Loads the Neshan Leaflet SDK once. Failed attempts can be retried. */
export function loadNeshanSdk(options: SdkOptions = {}): Promise<LeafletNamespace> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Neshan SDK requires a browser'))
  if (window.L && !compatible(window.L)) {
    return Promise.reject(new Error('An incompatible Leaflet global is already loaded. Remove the old SDK and reload the page.'))
  }
  if (pending) return pending
  pending = new Promise<LeafletNamespace>((resolve, reject) => {
    const script = document.createElement('script')
    const style = document.createElement('link')
    // An existing global still needs CSS (including after a prior CSS failure).
    let scriptReady = Boolean(window.L)
    let styleReady = false
    const cleanup = () => { clearTimeout(timer); script.onload = script.onerror = null; style.onload = style.onerror = null }
    const fail = () => { cleanup(); script.remove(); style.remove(); reject(new Error('Unable to load Neshan SDK or stylesheet')) }
    const complete = () => {
      if (!scriptReady || !styleReady) return
      if (!window.L || !compatible(window.L)) return fail()
      cleanup(); resolve(window.L)
    }
    const timer = setTimeout(fail, options.timeout ?? 15000)
    script.src = options.scriptUrl ?? scriptUrl
    script.async = true
    style.rel = 'stylesheet'
    style.href = options.styleUrl ?? styleUrl
    if (options.nonce) { script.nonce = options.nonce; style.nonce = options.nonce }
    script.onload = () => { scriptReady = true; complete() }
    style.onload = () => { styleReady = true; complete() }
    script.onerror = style.onerror = fail
    document.head.append(style)
    if (!scriptReady) document.head.append(script)
  }).catch(error => { pending = undefined; throw error })
  return pending
}
