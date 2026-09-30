// useCobsEncoding.ts
const MAX_CODE = 0xff

const encodeBuffer = (input: Uint8Array): Uint8Array => {
  const output = new Uint8Array(input.length + Math.floor(input.length / 254) + 1)
  let writeIndex = 1
  let codeIndex = 0
  let code = 1

  for (let i = 0; i < input.length; i++) {
    const byte = input[i]!
    if (byte === 0) {
      output[codeIndex] = code
      codeIndex = writeIndex++
      code = 1
    } else {
      output[writeIndex++] = byte
      code++
      if (code === MAX_CODE) {
        output[codeIndex] = code
        codeIndex = writeIndex++
        code = 1
      }
    }
  }

  output[codeIndex] = code
  return output.slice(0, writeIndex)
}

const encodeFrame = (input: Uint8Array): Uint8Array => {
  const encoded = encodeBuffer(input)
  const out = new Uint8Array(encoded.length + 1)
  out.set(encoded, 0)
  out[encoded.length] = 0
  return out
}

const decodeFrame = (frame: Uint8Array): Uint8Array | null => {
  const out: number[] = []
  let i = 0

  while (i < frame.length) {
    const code = frame[i]!
    i++
    const end = i + code - 1
    if (end > frame.length) return null
    for (; i < end; i++) out.push(frame[i]!)
    if (code !== MAX_CODE && end < frame.length) out.push(0)
  }

  return Uint8Array.from(out)
}

const createDecoder = () => {
  let pending = new Uint8Array(0)

  const pushFrames = (chunk: Uint8Array): Uint8Array[] => {
    if (chunk.length === 0) return []

    const combined = new Uint8Array(pending.length + chunk.length)
    combined.set(pending, 0)
    combined.set(chunk, pending.length)
    pending = combined

    const frames: Uint8Array[] = []
    let start = 0
    while (start < pending.length) {
      const delimiter = pending.indexOf(0, start)
      if (delimiter === -1) break
      const frame = pending.subarray(start, delimiter)
      start = delimiter + 1
      if (frame.length === 0) continue
      const decoded = decodeFrame(frame)
      if (decoded) frames.push(decoded)
    }

    pending = pending.subarray(start)
    return frames
  }

  const push = (chunk: Uint8Array): Uint8Array => {
    const frames = pushFrames(chunk)
    const length = frames.reduce((total, frame) => total + frame.length, 0)
    const out = new Uint8Array(length)
    let offset = 0
    for (const frame of frames) {
      out.set(frame, offset)
      offset += frame.length
    }
    return out
  }

  const reset = () => {
    pending = new Uint8Array(0)
  }

  return { push, pushFrames, reset } as const
}

export const useCobsEncoding = () => ({
  encodeBuffer,
  encodeFrame,
  decodeFrame,
  createDecoder,
} as const)
