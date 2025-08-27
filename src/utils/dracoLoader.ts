import * as THREE from 'three'
import { DRACOLoader } from 'three-stdlib'

// Singleton DRACOLoader instance to avoid loading decoder multiple times
class DracoLoaderSingleton {
  private static instance: DRACOLoader | null = null
  private static isInitialized = false

  static getInstance(): DRACOLoader {
    if (!this.instance) {
      this.instance = new DRACOLoader()
      // Set the path to the Draco decoder files
      this.instance.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
      this.instance.setDecoderConfig({ type: 'js' })
      this.isInitialized = true
      console.log('DRACOLoader singleton initialized - decoder will only be loaded once')
    }
    return this.instance
  }

  static dispose() {
    if (this.instance) {
      this.instance.dispose()
      this.instance = null
      this.isInitialized = false
    }
  }
}

export class DracoPointCloudLoader {
  private dracoLoader: DRACOLoader

  constructor() {
    this.dracoLoader = DracoLoaderSingleton.getInstance()
  }

  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: any) => void
  ) {
    this.dracoLoader.load(
      url,
      (geometry) => {
        // Ensure the geometry has the same structure as PLY files
        this.processGeometry(geometry)
        onLoad(geometry)
      },
      onProgress,
      (error) => {
        onError?.(error)
      }
    )
  }

  private processGeometry(geometry: THREE.BufferGeometry) {
    // Ensure position attribute exists
    if (!geometry.attributes.position) {
      console.warn('Draco geometry missing position attribute')
      return
    }

    // Handle color attributes - Draco might store colors differently
    if (geometry.attributes.color) {
      const colorAttribute = geometry.attributes.color
      
      // If colors are in 0-255 range, normalize to 0-1
      if (colorAttribute.array instanceof Uint8Array) {
        const normalizedColors = new Float32Array(colorAttribute.array.length)
        for (let i = 0; i < colorAttribute.array.length; i++) {
          normalizedColors[i] = colorAttribute.array[i] / 255
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(normalizedColors, colorAttribute.itemSize))
      }
    }

    // Compute bounding box and sphere for proper rendering
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
  }

  dispose() {
    // Don't dispose the singleton instance as other models might still be using it
    // The singleton will be disposed when the application shuts down
  }
}