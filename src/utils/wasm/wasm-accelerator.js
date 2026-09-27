/**
 * NodeFlow WebAssembly Acceleration Suite
 * Provides native hardware-speed operations:
 * 1. Inline Compiled WebAssembly Engine (FNV-1a 32-bit fast hashing & pixel buffer processing)
 * 2. Native Graphviz WebAssembly Engine (@viz-js/viz) for compiling DOT graphs to SVG
 * 3. Hardware Capability Detection (WebAssembly, SIMD, Threads, WebGPU)
 */

// Self-contained, zero-dependency compiled WebAssembly binary (238 bytes)
// Exports: "mem" (2 pages = 128KB), "fnv1a" (ptr, len) -> i32, "applyAlphaBackground" (ptr, pixelCount, r, g, b)
const WASM_TURBO_BYTECODE_B64 =
  'AGFzbQEAAAABDwJgAn9/AX9gBX9/f39/AAMDAgABBQMBAAIHJgMDbWVtAgAFZm52MWEAABRhcHBseUFscGhhQmFja2dyb3VuZAABCqABAj8BAn9BxbvyiHghAiAAIAFqIQMCQANAIAAgA08NASACIAAtAABzIQIgAkGTg4AIbCECIABBAWohAAwACwsgAgteAQN/QQAhBQJAA0AgBSABTw0BIAAgBUEEbGohBiAGQQNqLQAAIQcgB0UEQCAGIAI6AAAgBkEBaiADOgAAIAZBAmogBDoAACAGQQNqQf8BOgAACyAFQQFqIQUMAAsLCw==';

let wasmInstance = null;
let wasmMemory = null;
let vizInstancePromise = null;

/**
 * Initialize WebAssembly Turbo Kernel
 */
export async function initWasmEngine() {
  if (wasmInstance) return wasmInstance;

  try {
    let wasmBytes;
    if (typeof Buffer !== 'undefined') {
      wasmBytes = Buffer.from(WASM_TURBO_BYTECODE_B64, 'base64');
    } else {
      const binStr = atob(WASM_TURBO_BYTECODE_B64);
      wasmBytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        wasmBytes[i] = binStr.charCodeAt(i);
      }
    }

    const wasmModule = await WebAssembly.compile(wasmBytes);
    wasmInstance = await WebAssembly.instantiate(wasmModule);
    wasmMemory = new Uint8Array(wasmInstance.exports.mem.buffer);
    return wasmInstance;
  } catch (err) {
    console.warn('[Wasm Engine] WebAssembly initialization fallback:', err);
    return null;
  }
}

/**
 * Compute high-speed 32-bit FNV-1a hash using WebAssembly
 * @param {string|Uint8Array} input
 * @returns {string} Hexadecimal hash string
 */
export function wasmFastHash(input) {
  if (!wasmInstance) {
    // Synchronous initialization attempt
    try {
      let wasmBytes;
      if (typeof Buffer !== 'undefined') {
        wasmBytes = Buffer.from(WASM_TURBO_BYTECODE_B64, 'base64');
      } else {
        const binStr = atob(WASM_TURBO_BYTECODE_B64);
        wasmBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          wasmBytes[i] = binStr.charCodeAt(i);
        }
      }
      const mod = new WebAssembly.Module(wasmBytes);
      wasmInstance = new WebAssembly.Instance(mod);
      wasmMemory = new Uint8Array(wasmInstance.exports.mem.buffer);
    } catch {
      // JS fallback if WebAssembly is unavailable
      return jsFastHash(input);
    }
  }

  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const len = Math.min(bytes.length, 65536); // Up to 64KB per chunk
  wasmMemory.set(bytes.subarray(0, len), 0);
  const hash = wasmInstance.exports.fnv1a(0, len);
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * WebAssembly-accelerated pixel background compositing for Retina/4K/8K exports
 * Replaces transparent alpha pixels directly inside linear Wasm memory
 */
export function wasmApplyAlphaBackground(imageData, r = 255, g = 255, b = 255) {
  if (!wasmInstance) {
    initWasmEngine();
  }

  if (wasmInstance && imageData && imageData.data) {
    const data = imageData.data;
    const pixelCount = data.length / 4;
    // Process in chunks that fit within Wasm memory (128KB = 32,768 pixels per chunk)
    const chunkSize = 30000;
    for (let offset = 0; offset < pixelCount; offset += chunkSize) {
      const count = Math.min(chunkSize, pixelCount - offset);
      const byteStart = offset * 4;
      const byteLen = count * 4;
      wasmMemory.set(data.subarray(byteStart, byteStart + byteLen), 0);
      wasmInstance.exports.applyAlphaBackground(0, count, r, g, b);
      data.set(wasmMemory.subarray(0, byteLen), byteStart);
    }
    return imageData;
  }

  // Pure JS Fallback
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return imageData;
}

/**
 * Render Graphviz DOT code to SVG using the native WebAssembly Graphviz C engine
 * @param {string} dotSource
 * @param {object} options
 * @returns {Promise<string>} Clean SVG string
 */
export async function renderGraphvizWasm(dotSource, options = {}) {
  if (!vizInstancePromise) {
    try {
      const { instance } = await import('@viz-js/viz');
      vizInstancePromise = instance();
    } catch (err) {
      throw new Error(`Failed to load WebAssembly Graphviz engine: ${err.message}`);
    }
  }

  const viz = await vizInstancePromise;
  const engine = options.engine || 'dot'; // dot, circo, fdp, neato, osage, twopi
  const svg = viz.renderString(dotSource, { format: 'svg', engine });
  return svg;
}

/**
 * Detect hardware acceleration capabilities in the current environment
 */
export async function getWasmCapabilities() {
  const caps = {
    wasm: typeof WebAssembly !== 'undefined',
    simd: false,
    threads: typeof SharedArrayBuffer !== 'undefined',
    webgpu: typeof navigator !== 'undefined' && !!navigator.gpu,
    engine: 'NodeFlow Wasm Turbo v1.0',
  };

  if (caps.wasm) {
    try {
      // Validate WebAssembly SIMD support
      caps.simd = WebAssembly.validate(
        new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
          0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
          0x03, 0x02, 0x01, 0x00,
          0x0a, 0x0a, 0x01, 0x08, 0x00, 0xfd, 0x0c,
          0x00, 0x00, 0x00, 0x00, 0x0b,
        ])
      );
    } catch {
      caps.simd = false;
    }
  }

  return caps;
}

function jsFastHash(str) {
  let hash = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
