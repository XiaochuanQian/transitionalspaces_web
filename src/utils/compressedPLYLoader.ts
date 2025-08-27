import pako from 'pako'

export interface CompressedPLYData {
  positions: Float32Array
  colors: Float32Array | null
  normals: Float32Array | null
  vertexCount: number
}

export const loadCompressedPLY = async (url: string): Promise<CompressedPLYData> => {
  const response = await fetch(url)
  const compressedData = await response.arrayBuffer()
  
  // Decompress the data using pako
  const decompressedData = pako.inflate(new Uint8Array(compressedData))
  
  // Convert to string for PLY parsing
  const plyText = new TextDecoder().decode(decompressedData)
  
  // Parse PLY data
  const lines = plyText.split('\n')
  let headerEnd = 0
  let vertexCount = 0
  let hasColor = false
  let hasNormal = false
  
  // Parse header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.startsWith('element vertex')) {
      vertexCount = parseInt(line.split(' ')[2])
    } else if (line.includes('property') && line.includes('red')) {
      hasColor = true
    } else if (line.includes('property') && line.includes('nx')) {
      hasNormal = true
    } else if (line === 'end_header') {
      headerEnd = i + 1
      break
    }
  }
  
  // Parse vertex data
  const positions: number[] = []
  const colors: number[] = []
  const normals: number[] = []
  
  for (let i = headerEnd; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(' ').map(Number)
    let index = 0
    
    // Position (x, y, z)
    positions.push(values[index++], values[index++], values[index++])
    
    // Color (r, g, b) if present
    if (hasColor) {
      colors.push(values[index++], values[index++], values[index++])
    }
    
    // Normal (nx, ny, nz) if present
    if (hasNormal) {
      normals.push(values[index++], values[index++], values[index++])
    }
  }
  
  return {
    positions: new Float32Array(positions),
    colors: hasColor ? new Float32Array(colors) : null,
    normals: hasNormal ? new Float32Array(normals) : null,
    vertexCount
  }
} 