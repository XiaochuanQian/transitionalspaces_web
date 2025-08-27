import pako from 'pako'
import { PLYLoader } from 'three-stdlib'
import * as THREE from 'three'

export class GzipPLYLoader extends THREE.Loader {
  private plyLoader: PLYLoader

  constructor(manager?: THREE.LoadingManager) {
    super(manager)
    this.plyLoader = new PLYLoader(manager)
  }

  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void {
    const loader = new THREE.FileLoader(this.manager)
    loader.setResponseType('arraybuffer')
    loader.setRequestHeader(this.requestHeader)
    loader.setPath(this.path)
    loader.setWithCredentials(this.withCredentials)

    loader.load(
      url,
      (data) => {
        try {
          const result = this.parse(data as ArrayBuffer)
          onLoad(result)
        } catch (e) {
          if (onError) {
            const errorEvent = new ErrorEvent('error', { error: e })
            onError(errorEvent)
          } else {
            console.error(e)
          }
        }
      },
      onProgress,
      (err) => {
        if (onError) {
          const errorEvent = err instanceof ErrorEvent ? err : new ErrorEvent('error', { error: err })
          onError(errorEvent)
        }
      }
    )
  }

  parse(data: ArrayBuffer): THREE.BufferGeometry {
    // Check if the file is gzipped by looking at the magic number
    const view = new Uint8Array(data)
    const isGzipped = view[0] === 0x1f && view[1] === 0x8b

    let plyData: ArrayBuffer

    if (isGzipped) {
      // Decompress gzipped data
      const decompressed = pako.inflate(view)
      plyData = decompressed.buffer instanceof ArrayBuffer 
        ? decompressed.buffer.slice(
            decompressed.byteOffset,
            decompressed.byteOffset + decompressed.byteLength
          )
        : new ArrayBuffer(0)
    } else {
      // Use data as-is if not gzipped
      plyData = data
    }

    // Parse the PLY data using the standard PLY loader
    return this.plyLoader.parse(plyData)
  }
}