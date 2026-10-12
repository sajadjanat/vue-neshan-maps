export type MapResourceErrorKind = 'invalid-key' | 'key-type' | 'domain' | 'service' | 'quota' | 'rate-limit' | 'forbidden' | 'network' | 'server' | 'request' | 'decode' | 'unknown'
export interface MapResourceFailure {
  kind: MapResourceErrorKind
  message: string
  status?: number
  code?: number
  retryAfter?: number
  retryable: boolean
}
export class NeshanResourceError extends Error implements MapResourceFailure {
  readonly kind: MapResourceErrorKind
  readonly status?: number
  readonly code?: number
  readonly retryAfter?: number
  readonly retryable: boolean
  constructor(failure: MapResourceFailure) {
    super(failure.message); this.name = 'NeshanResourceError'
    this.kind = failure.kind; this.status = failure.status; this.code = failure.code
    this.retryAfter = failure.retryAfter; this.retryable = failure.retryable
  }
}
const codes: Record<number, [MapResourceErrorKind, string, boolean]> = {
  400: ['request', 'Invalid map request parameters', false],
  401: ['invalid-key', 'Map authentication failed; check the web key', false],
  403: ['forbidden', 'Map access denied; check the key permissions and domain', false],
  429: ['rate-limit', 'Map request rate exceeded; wait before retrying', true],
  470: ['request', 'Invalid map tile coordinates', false],
  480: ['invalid-key', 'Neshan API key was not found', false],
  481: ['quota', 'Neshan request quota exceeded', false],
  482: ['rate-limit', 'Neshan request rate exceeded', true],
  483: ['key-type', 'This service requires a matching Neshan web key', false],
  484: ['domain', 'This origin or domain is not allowed by the Neshan key', false],
  485: ['service', 'This service is not enabled for the Neshan key', false],
}
export function resourceFailure(status?: number, code?: number, retryAfter?: number): MapResourceFailure {
  const known = codes[code ?? status ?? 0] ?? codes[status ?? 0]
  const [kind, message, retryable] = known ?? ((status ?? 0) >= 500
    ? ['server', 'Map server is temporarily unavailable', true] as const
    : ['unknown', 'A map resource could not be loaded', true] as const)
  return {kind, message, retryable, ...(status ? {status} : {}), ...(code ? {code} : {}), ...(retryAfter !== undefined ? {retryAfter} : {})}
}
export function normalizeResourceError(error: unknown): MapResourceFailure {
  if (error instanceof NeshanResourceError) return {kind:error.kind,message:error.message,status:error.status,code:error.code,retryAfter:error.retryAfter,retryable:error.retryable}
  const value = error as {status?:unknown;code?:unknown;message?:unknown} | undefined
  if(typeof value?.message==='string' && value.message.startsWith('NESHAN_RESOURCE_ERROR:')){
    try{
      const failure=JSON.parse(value.message.slice('NESHAN_RESOURCE_ERROR:'.length))
      if(failure.kind==='network')return {kind:'network',message:'Unable to reach the map server',retryable:true}
      if(failure.kind==='decode')return {kind:'decode',message:'Unable to decode a Neshan vector tile',retryable:false}
      return resourceFailure(Number.isFinite(failure.status)?failure.status:undefined,Number.isFinite(failure.code)?failure.code:undefined,Number.isFinite(failure.retryAfter)?failure.retryAfter:undefined)
    }catch{return resourceFailure()}
  }
  const status = typeof value?.status === 'number' ? value.status : undefined
  const code = typeof value?.code === 'number' ? value.code : undefined
  if (status || code) return resourceFailure(status,code)
  // A renderer may serialize custom protocol errors. Match only our fixed public messages.
  const known = Object.entries(codes).find(([,entry])=>entry[1]===value?.message)
  if (known) return resourceFailure(undefined,Number(known[0]))
  if (value?.message === 'Unable to decode a Neshan vector tile') return {kind:'decode',message:value.message,retryable:false}
  if (value?.message === 'Unable to reach the map server') return {kind:'network',message:value.message,retryable:true}
  return resourceFailure()
}
/** Worker transports preserve Error.message, but may discard custom Error fields. */
export function serializeResourceError(error:NeshanResourceError):string {
  return 'NESHAN_RESOURCE_ERROR:'+JSON.stringify({kind:error.kind,status:error.status,code:error.code,retryAfter:error.retryAfter})
}
export async function fetchNeshanTile(url: string, signal?: AbortSignal): Promise<Response | null> {
  let response: Response
  try { response = await fetch(url,{signal}) }
  catch (error) {
    if (signal?.aborted) throw error
    throw new NeshanResourceError({kind:'network',message:'Unable to reach the map server',retryable:true})
  }
  if (response.status === 204 || response.status === 404) return null
  if (!response.ok) {
    let code: number | undefined
    try {
      const body = await response.json()
      const candidate = body?.code ?? body?.statusCode ?? body?.error?.code
      if (Number.isFinite(Number(candidate)) && candidate != null) code = Number(candidate)
    } catch { /* Error pages need not be JSON. Never forward their content. */ }
    const retry = response.headers.get('retry-after')
    const seconds = retry == null ? undefined : /^\d+$/.test(retry) ? Number(retry) : Math.max(0,Math.ceil((Date.parse(retry)-Date.now())/1000))
    throw new NeshanResourceError(resourceFailure(response.status,code,Number.isFinite(seconds) ? seconds : undefined))
  }
  return response
}
